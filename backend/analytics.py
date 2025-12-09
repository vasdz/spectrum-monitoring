import json
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from typing import List, Optional

from database import get_db
from models import Student, Grade, SecurityAlert, Title as TitleModel, Teacher, Group
from pydantic import BaseModel

# ИМПОРТЫ ЛОГИКИ (Убедитесь, что файлы созданы в папке logic!)
from logic.elo_system import calculate_academic_change
from logic.ai_service import get_ai_analysis

# --- НАСТРОЙКА МОСТА С C++ ---
EXCHANGE_PATH = "C:/Users/alexl/PycharmProjects/SPECTRUM/exchange/data_in.json"
os.makedirs(os.path.dirname(EXCHANGE_PATH), exist_ok=True)

router = APIRouter()


# --- SCHEMAS ---
class StudentRiskProfile(BaseModel):
    student_id: int
    full_name: str
    group_name: str
    risk_score: int
    risk_factors: List[str]
    recommendation: str

    class Config:
        from_attributes = True


class TitleSchema(BaseModel):
    id: int
    name: str
    color: str
    rarity: str

    class Config:
        from_attributes = True


# Схема для ИИ чата
class AiChatRequest(BaseModel):
    message: str
    student_id: Optional[int] = None  # Теперь фронтенд может передавать ID


@router.post("/ask-ai")
async def ask_ai_endpoint(request: AiChatRequest, db: AsyncSession = Depends(get_db)):
    """
    Обрабатывает запрос к ИИ. Если есть student_id, обогащает запрос данными из БД.
    """
    context = None
    if request.student_id:
        # Если есть ID, ищем студента
        res = await db.execute(select(Student).where(Student.id == request.student_id))
        student = res.scalar_one_or_none()
        if student:
            # Формируем контекст для ИИ
            context = {
                "id": student.id,
                "name": student.full_name,
                "group": student.group_name,  # Предполагается, что это поле есть
                "elo": student.elo_rating,
                "gpa": student.gpa,  # Это поле должно быть в модели Student
                "risk": student.risk_score
            }

    # Отправляем запрос в AI-сервис
    response_text = await get_ai_analysis(request.message, context)

    return {"response": response_text}


# Схема для выставления оценки (с ELO)
class GradeCreate(BaseModel):
    student_id: int
    subject: str
    grade: int  # 2, 3, 4, 5
    task_type: str = "EXAM"  # EXAM, TEST, HOMEWORK


# --- ENDPOINTS ---

@router.get("/at-risk", response_model=List[StudentRiskProfile])
async def get_at_risk_students(limit: int = 10, db: AsyncSession = Depends(get_db)):
    """
    Возвращает топ студентов риска и сбрасывает данные в C++ для "анализа".
    """
    query = select(Student).order_by(desc(Student.risk_score)).limit(limit)
    result = await db.execute(query)
    students = result.scalars().all()

    risk_profiles = []
    cpp_export_data = {"students": []}

    for student in students:
        res_g = await db.execute(select(Grade).where(Grade.student_id == student.id))
        grades = res_g.scalars().all()
        grades_list = [g.score for g in grades] if grades else []

        factors = []
        avg_score = sum(grades_list) / len(grades_list) if grades_list else 0

        if avg_score < 60: factors.append("Low academic performance")
        if student.stat_int < 50: factors.append("Potential burnout detected")
        if not factors: factors.append("Irregular activity pattern")

        recommendation = "Schedule a meeting"
        if avg_score < 40:
            recommendation = "Immediate academic probation"
        elif student.stat_sta < 40:
            recommendation = "Send to psychological support"

        risk_profiles.append(StudentRiskProfile(
            student_id=student.id,
            full_name=student.full_name,
            group_name=f"Group #{student.group_id}",
            risk_score=student.risk_score,
            risk_factors=factors,
            recommendation=recommendation
        ))

        cpp_export_data["students"].append({
            "id": student.id,
            "grades": grades_list,
            "attendance": float(student.stat_sta)
        })

    try:
        with open(EXCHANGE_PATH, "w") as f:
            json.dump(cpp_export_data, f)
    except Exception as e:
        print(f"⚠ C++ Bridge Error: {e}")

    return risk_profiles


@router.get("/titles-list", response_model=List[TitleSchema])
async def get_all_titles(db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(TitleModel))
    return res.scalars().all()

@router.get("/social-graph")
async def get_social_graph(db: AsyncSession = Depends(get_db)):
    q = (
        select(
            Student.id,
            Student.full_name,
            Group.name.label("group_name")
        )
        .join(Group, Group.id == Student.group_id)
        .limit(300)
    )
    rows = (await db.execute(q)).all()
    return [
        {
            "id": r.id,
            "full_name": r.full_name,
            "group_name": r.group_name,
        }
        for r in rows
    ]


@router.get("/dashboard-stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)):
    # Всего студентов
    res = await db.execute(select(func.count(Student.id)))
    total_students = res.scalar() or 0

    # Активные алерты
    res_alerts = await db.execute(select(func.count(SecurityAlert.id)).where(SecurityAlert.is_resolved == False))
    active_alerts = res_alerts.scalar() or 0

    # Integrity: 100% минус 5% за каждый активный алерт
    integrity = max(0, 100 - (active_alerts * 5))

    # Средний балл
    res_grades = await db.execute(select(func.avg(Grade.score)))
    avg_grade = res_grades.scalar() or 0
    gpa = round(avg_grade / 20, 2)

    # Neural Load (среднее число студентов на группу)
    # Просто для дашборда
    neural_load = 0
    if total_students > 0:
        neural_load = round(total_students / 100, 1) # условный коэффициент

    return {
        "total_students": total_students,
        "active_courses": 8, # заглушка или count(groups)
        "avg_attendance_rate": integrity, # Используем integrity как показатель здоровья
        "system_health_index": integrity,
        "avg_gpa": gpa,
        "users_connected": total_students,
        "neural_load": neural_load,
        "active_nodes": 16 # заглушка или count(teachers)
    }


@router.get("/alerts")
async def get_active_alerts(db: AsyncSession = Depends(get_db)):
    """
    Возвращает нерешённые алерты с информацией о студенте и группе.
    """
    query = (
        select(
            SecurityAlert.id,
            SecurityAlert.student_id,
            SecurityAlert.level,
            SecurityAlert.message,
            SecurityAlert.source,
            SecurityAlert.created_at,
            Student.full_name,
            Group.name.label("group_name"),
        )
        .join(Student, Student.id == SecurityAlert.student_id, isouter=True)
        .join(Group, Group.id == Student.group_id, isouter=True)
        .where(SecurityAlert.is_resolved == False)
        .order_by(SecurityAlert.created_at.desc())
        .limit(50)
    )

    rows = (await db.execute(query)).all()

    return [
        {
            "id": r.id,
            "student_id": r.student_id,
            "level": r.level or "INFO",
            "message": r.message,
            "source": r.source or "SYSTEM",
            "full_name": r.full_name or "Unknown",
            "group_name": r.group_name or "N/A",
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]


@router.get("/teachers-load")
async def get_teachers_load(db: AsyncSession = Depends(get_db)):
    """
    Neural Load Nodes: реальная нагрузка (Student -> Group -> Teacher).
    """
    res_t = await db.execute(select(Teacher))
    teachers = res_t.scalars().all()

    if not teachers:
        return []

    # Считаем группы
    res_g = await db.execute(
        select(Group.curator_id, func.count(Group.id))
        .where(Group.curator_id.isnot(None))
        .group_by(Group.curator_id)
    )
    groups_map = {r[0]: r[1] for r in res_g.all()}

    # Считаем студентов
    res_s = await db.execute(
        select(Group.curator_id, func.count(Student.id))
        .join(Student, Student.group_id == Group.id)
        .where(Group.curator_id.isnot(None))
        .group_by(Group.curator_id)
    )
    students_map = {r[0]: r[1] for r in res_s.all()}

    result = []
    NODE_CAPACITY = 80

    for t in teachers:
        g_cnt = groups_map.get(t.id, 0)
        s_cnt = students_map.get(t.id, 0)

        load_val = round((s_cnt / NODE_CAPACITY) * 100) if NODE_CAPACITY else 0

        if load_val > 110:
            status = "OVERLOAD"
        elif load_val > 85:
            status = "HIGH"
        elif load_val < 30:
            status = "IDLE"
        else:
            status = "OPTIMAL"

        result.append({
            "id": t.id,
            "name": t.full_name,
            "students": s_cnt,
            "groups": g_cnt,
            "load": load_val,
            "status": status
        })

    result.sort(key=lambda x: x['load'], reverse=True)
    return result


@router.get("/top-students")
async def get_top_best_students(limit: int = 10, db: AsyncSession = Depends(get_db)):
    """
    Топ студентов по ELO рейтингу.
    """
    # Сортируем по elo_rating по убыванию
    query = select(Student).order_by(Student.elo_rating.desc()).limit(limit)
    res = await db.execute(query)
    students = res.scalars().all()

    output = []
    for s in students:
        output.append({
            "id": s.id,
            "full_name": s.full_name,
            "group_name": f"Group {s.group_id}",
            # Возвращаем ELO вместо GPA
            "elo": s.elo_rating,
            "risk_score": s.risk_score
        })

    return output

# --- НОВЫЕ ЭНДПОИНТЫ: ELO & AI ---

@router.post("/grades/add")
async def add_grade_with_elo(data: GradeCreate, db: AsyncSession = Depends(get_db)):
    """
    Выставление оценки с пересчетом ELO.
    """
    # 1. Ищем студента
    res = await db.execute(select(Student).where(Student.id == data.student_id))
    student = res.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # 2. Добавляем оценку в БД
    # Конвертируем 5-балльную в 100-балльную для системы (примерно)
    score_100 = data.grade * 20
    new_grade = Grade(student_id=student.id, subject_name=data.subject, score=score_100)
    db.add(new_grade)

    # 3. ELO MAGIC
    current_elo = getattr(student, 'elo_rating', 1000)

    # Вычисляем изменение
    delta = calculate_academic_change(
        current_rating=current_elo,
        grade=data.grade,
        task_type=data.task_type
    )

    # Применяем изменение
    new_elo = current_elo + delta
    student.elo_rating = new_elo

    await db.commit()

    return {
        "status": "success",
        "message": f"Grade added. ELO change: {delta:+d} (New Rating: {new_elo})"
    }


@router.get("/top-by-gpa")
async def get_top_by_gpa(limit: int = 10, db: AsyncSession = Depends(get_db)):
    """Топ студентов по среднему баллу (GPA)"""
    stmt = (
        select(
            Student.id,
            Student.full_name,
            Student.group_id,
            func.avg(Grade.score).label("avg_score")
        )
        .join(Grade, Student.id == Grade.student_id)
        .group_by(Student.id, Student.full_name, Student.group_id)
        .order_by(func.avg(Grade.score).desc())
        .limit(limit)
    )
    result = await db.execute(stmt)
    rows = result.all()

    return [
        {
            "id": r.id,
            "full_name": r.full_name.replace("тов. ", "").replace("г-н ", ""),
            "group_name": f"Group {r.group_id}",
            "gpa": round(r.avg_score / 20, 2)  # Преобразуем 100-балльную в 5-балльную
        }
        for r in rows
    ]

@router.post("/ai/chat")
async def chat_with_spectrum(request: AiChatRequest, db: AsyncSession = Depends(get_db)):
    """
    Чат с ИИ (Saiga) о студенте.
    """
    # Получаем контекст студента
    res = await db.execute(select(Student).where(Student.id == request.student_id))
    student = res.scalar_one_or_none()

    if not student:
        return {"response": "Error: Student identity not found in database."}

    # Получаем последние оценки для контекста
    res_g = await db.execute(select(Grade).where(Grade.student_id == student.id).order_by(desc(Grade.date)).limit(5))
    grades = res_g.scalars().all()
    recent_grades = [g.score for g in grades]

    elo = getattr(student, 'elo_rating', 1000)

    # Запрос к ИИ сервису
    ai_response = await get_ai_analysis(
        student_name=student.full_name,
        elo=elo,
        recent_grades=recent_grades
    )

    return {"response": ai_response}