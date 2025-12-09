from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from typing import List, Optional
import datetime

from database import get_db

# Импортируем модели (Добавил EloHistory)
from models import Student, Grade, Title as TitleModel, StudentTitle, EloHistory
from models import Achievement, StudentAchievement
from logic.elo_system import calculate_academic_change
from pydantic import BaseModel

router = APIRouter()


# --- DTO (Схемы данных) ---

class TitleSchema(BaseModel):
    id: int
    name: str
    color: str
    rarity: str

    class Config:
        from_attributes = True


class AchievementSchema(BaseModel):
    id: int
    code: Optional[str] = None
    title: str
    description: Optional[str] = None
    icon_name: Optional[str] = None
    xp_reward: int

    class Config:
        from_attributes = True


class StudentSearchItem(BaseModel):
    id: int
    full_name: str
    group_name: str

    class Config:
        from_attributes = True


class StudentProfileFull(BaseModel):
    id: int
    full_name: str
    group_name: str
    status: str
    risk_score: int
    gpa: float
    elo_rating: int = 1000  # Добавил поле ELO в DTO
    stat_int: int
    stat_sta: int
    stat_soc: int
    titles: List[TitleSchema] = []
    achievements: List[AchievementSchema] = []

    class Config:
        from_attributes = True


class TitleGrant(BaseModel):
    title_name: str


class XPGrant(BaseModel):
    amount: int


class GradeCreate(BaseModel):
    student_id: int
    subject_name: str
    score: int  # 2, 3, 4, 5
    is_exam: bool = False


# --- ЭНДПОИНТЫ ---

@router.get("/search", response_model=List[StudentSearchItem])
async def search_students(q: str, db: AsyncSession = Depends(get_db)):
    if len(q) < 2:
        return []

    query = select(Student).where(Student.full_name.ilike(f"%{q}%")).limit(10)
    result = await db.execute(query)
    students = result.scalars().all()

    return [
        StudentSearchItem(
            id=s.id,
            full_name=s.full_name.replace("тов. ", "").replace("г-н ", ""),
            group_name=f"Group {s.group_id}",
        )
        for s in students
    ]


@router.post("/grade")
async def add_grade(grade_data: GradeCreate, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Student).where(Student.id == grade_data.student_id))
    student = res.scalar_one_or_none()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Сохраняем оценку (100-балльная шкала)
    score_100 = grade_data.score * 20

    new_grade = Grade(
        student_id=student.id,
        subject_name=grade_data.subject_name,
        score=score_100,
        date=datetime.datetime.now(),
        is_exam=grade_data.is_exam
    )
    db.add(new_grade)

    # РАСЧЕТ ELO
    current_elo = student.elo_rating if student.elo_rating else 1000
    task_type = "EXAM" if grade_data.is_exam else "HOMEWORK"
    delta = calculate_academic_change(current_elo, grade_data.score, task_type=task_type)

    new_elo = current_elo + delta
    student.elo_rating = new_elo

    # Запись истории ELO
    history_entry = EloHistory(
        student_id=student.id,
        prev_rating=current_elo,
        new_rating=new_elo,
        change_amount=delta,
        reason=f"Grade: {grade_data.score} ({task_type})"
    )
    db.add(history_entry)

    await db.commit()

    return {
        "status": "success",
        "new_elo": new_elo,
        "delta": delta,
        "message": f"Оценка добавлена. Рейтинг изменен на {delta:+d}"
    }


@router.get("/{student_id}/elo-history")
async def get_elo_history(student_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(
        select(EloHistory)
        .where(EloHistory.student_id == student_id)
        .order_by(EloHistory.created_at.asc())
    )
    history = res.scalars().all()
    return history


@router.get("/{student_id}", response_model=StudentProfileFull)
async def get_student_profile(student_id: int, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(Student).where(Student.id == student_id))
    student = res.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    res_g = await db.execute(select(Grade).where(Grade.student_id == student_id))
    grades = res_g.scalars().all()
    gpa = 0.0
    if grades:
        gpa = round(sum(g.score for g in grades) / len(grades) / 20, 2)

    clean_name = student.full_name.replace("тов. ", "").replace("г-н ", "")

    stmt_titles = (
        select(TitleModel)
        .join(StudentTitle, TitleModel.id == StudentTitle.title_id)
        .where(StudentTitle.student_id == student_id)
    )
    res_titles = await db.execute(stmt_titles)
    db_titles = res_titles.scalars().all()

    res_codes = await db.execute(
        select(StudentAchievement.achievement_code)
        .where(StudentAchievement.student_id == student_id)
    )

    earned_achievements = []
    for idx, (code,) in enumerate(res_codes.all()):
        if code:
            earned_achievements.append(
                AchievementSchema(
                    id=idx,
                    code=code,
                    title=code,
                    xp_reward=0
                )
            )

    return StudentProfileFull(
        id=student.id,
        full_name=clean_name,
        group_name=f"Group {student.group_id}",
        status=student.status,
        risk_score=student.risk_score,
        gpa=gpa,
        elo_rating=student.elo_rating or 1000,
        stat_int=student.stat_int,
        stat_sta=student.stat_sta,
        stat_soc=student.stat_soc,
        titles=db_titles,
        achievements=earned_achievements
    )


@router.post("/{student_id}/titles")
async def grant_title(
        student_id: int, title_data: TitleGrant, db: AsyncSession = Depends(get_db)
):
    res = await db.execute(
        select(TitleModel).where(TitleModel.name == title_data.title_name)
    )
    title_obj = res.scalar_one_or_none()
    if not title_obj:
        raise HTTPException(
            status_code=404,
            detail=f"Title '{title_data.title_name}' not found in database",
        )

    check_stmt = select(StudentTitle).where(
        (StudentTitle.student_id == student_id)
        & (StudentTitle.title_id == title_obj.id)
    )
    existing = await db.execute(check_stmt)
    if existing.scalar_one_or_none():
        return {"status": "info", "message": "Student already has this title"}

    new_student_title = StudentTitle(
        student_id=student_id,
        title_id=title_obj.id,
        assigned_at=datetime.datetime.now(),
    )
    db.add(new_student_title)
    await db.commit()
    return {"status": "success", "message": f"Title '{title_obj.name}' granted"}


@router.delete("/{student_id}/titles")
async def revoke_titles(student_id: int, db: AsyncSession = Depends(get_db)):
    stmt = delete(StudentTitle).where(StudentTitle.student_id == student_id)
    await db.execute(stmt)
    await db.commit()
    return {"status": "success", "message": "All titles revoked"}


@router.post("/{student_id}/xp")
async def modify_xp(
        student_id: int, xp_data: XPGrant, db: AsyncSession = Depends(get_db)
):
    stmt = select(Student).where(Student.id == student_id)
    res = await db.execute(stmt)
    student = res.scalar_one_or_none()

    if student:
        points_to_add = xp_data.amount // 100
        student.stat_int = min(100, student.stat_int + points_to_add)
        await db.commit()
        return {
            "status": "success",
            "message": f"XP applied. Intelligence increased by {points_to_add}",
        }

    return {"status": "error", "message": "Student not found"}

class EloModifyRequest(BaseModel):
    change: int  # Может быть +10, -5, и т.д.
    reason: str = "Manual adjustment by admin"

@router.post("/{student_id}/modify-elo")
async def modify_elo(
        student_id: int,
        data: EloModifyRequest,
        db: AsyncSession = Depends(get_db)
):
    """
    Ручное изменение ELO рейтинга студента (для админ-панели).
    """
    # 1. Найти студента
    stmt = select(Student).where(Student.id == student_id)
    res = await db.execute(stmt)
    student = res.scalar_one_or_none()

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # 2. Изменить ELO
    old_elo = student.elo_rating
    student.elo_rating += data.change

    # 3. Логировать изменение (опционально, если у тебя есть таблица истории)
    # Если нет — можешь закомментировать или создать модель EloHistory

    await db.commit()

    return {
        "status": "success",
        "message": f"ELO изменен: {old_elo} → {student.elo_rating} ({data.change:+d})",
        "old_elo": old_elo,
        "new_elo": student.elo_rating
    }
