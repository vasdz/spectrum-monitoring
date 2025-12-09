from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models import Student, Grade, StudentAchievement, SecurityAlert, ActivityLog
from datetime import datetime

# Конфиг ачивок (дублируем или импортируем, если есть общий файл)
ACHIEVEMENTS_RULES = {
    "HIGH_PERFORMER": {"min_gpa": 90},  # 90 из 100
    "SOCIAL_HUB": {"min_social": 80},
    "IRON_WILL": {"min_stamina": 90}
}


async def run_security_scan(session: AsyncSession):
    """
    Сканирует студентов на предмет угроз и выдает достижения.
    Запускается при старте сервера.
    """
    print("🛡 SYSTEM SECURITY & ACHIEVEMENT SCAN INITIATED...")

    # Получаем всех студентов
    result = await session.execute(select(Student))
    students = result.scalars().all()

    for student in students:
        try:
            # 1. Проверка на достижения
            # Получаем уже выданные ачивки
            res_ach = await session.execute(
                select(StudentAchievement).where(StudentAchievement.student_id == student.id))
            existing_achievements = {a.achievement_code for a in res_ach.scalars().all()}

            # Проверяем GPA
            if "HIGH_PERFORMER" not in existing_achievements:
                res_grades = await session.execute(select(Grade).where(Grade.student_id == student.id))
                grades = res_grades.scalars().all()
                if grades:
                    avg = sum(g.score for g in grades) / len(grades)
                    if avg >= ACHIEVEMENTS_RULES["HIGH_PERFORMER"]["min_gpa"]:
                        session.add(StudentAchievement(
                            student_id=student.id,
                            achievement_code="HIGH_PERFORMER",
                            earned_at=datetime.now()
                        ))
                        print(f"🏆 Awarded HIGH_PERFORMER to {student.full_name}")

            # Проверяем Социалку
            if "SOCIAL_HUB" not in existing_achievements:
                if student.stat_soc >= ACHIEVEMENTS_RULES["SOCIAL_HUB"]["min_social"]:
                    session.add(StudentAchievement(
                        student_id=student.id,
                        achievement_code="SOCIAL_HUB",
                        earned_at=datetime.now()
                    ))

            # 2. Проверка на угрозы (Security)
            if student.risk_score > 80:
                # Проверяем, нет ли уже алерта
                # ВАЖНО: В модели SecurityAlert нет student_id, поэтому пишем имя в текст
                alert_msg = f"High risk detected for student {student.full_name} ({student.student_ticket})"

                # Ищем похожий алерт
                res_alert = await session.execute(select(SecurityAlert).where(SecurityAlert.message == alert_msg))
                if not res_alert.scalar_one_or_none():
                    session.add(SecurityAlert(
                        level="CRITICAL",
                        message=alert_msg,
                        source="AI_MONITOR",
                        is_resolved=False
                    ))
                    print(f"🚨 SECURITY ALERT: {student.full_name}")

        except Exception as e:
            print(f"SCAN ERROR for student #{student.id}: {e}")
            continue

    await session.commit()
    print("✅ Security Scan Complete")
