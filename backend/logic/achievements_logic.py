from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from models import Student, Grade, Achievement, StudentAchievement


async def get_achievement_by_code(code: str, db: AsyncSession) -> Achievement | None:
    """Вспомогательная функция для получения ачивки по ее коду."""
    res = await db.execute(select(Achievement).where(Achievement.code == code))
    return res.scalar_one_or_none()


async def grant_achievement(student_id: int, achievement_code: str, db: AsyncSession):
    """Выдает ачивку, если у студента ее еще нет."""
    # 1. Проверяем, есть ли уже такая ачивка
    exists_stmt = select(StudentAchievement).where(
        and_(
            StudentAchievement.student_id == student_id,
            StudentAchievement.achievement_id == select(Achievement.id).where(
                Achievement.code == achievement_code).scalar_subquery()
        )
    )
    existing_ach = (await db.execute(exists_stmt)).scalar_one_or_none()

    if existing_ach:
        return  # Уже есть, ничего не делаем

    # 2. Ачивки нет - выдаем
    achievement = await get_achievement_by_code(achievement_code, db)
    if achievement:
        new_grant = StudentAchievement(
            student_id=student_id,
            achievement_id=achievement.id
        )
        db.add(new_grant)
        print(f"🏆 ACHIEVEMENT UNLOCKED for student #{student_id}: {achievement.title}")


async def check_all_achievements(student: Student, db: AsyncSession):
    """
    Главная функция-анализатор. Проверяет все условия для студента.
    """
    # --- Проверка 1: High Performer (GPA > 4.5) ---
    res_g = await db.execute(select(Grade).where(Grade.student_id == student.id))
    grades = res_g.scalars().all()
    if grades:
        gpa = (sum(g.score for g in grades) / len(grades)) / 20
        if gpa >= 4.5:
            await grant_achievement(student.id, 'HIGH_PERFORMER', db)

    # --- Проверка 2: Code Ninja (3+ оценок > 95 по тех. предметам) ---
    tech_subjects = ["Криптография", "Базы Данных", "Алгоритмы"]
    tech_grades_count = sum(1 for g in grades if g.subject_name in tech_subjects and g.score >= 95)
    if tech_grades_count >= 2:  # Упростим до 2 для демо
        await grant_achievement(student.id, 'CODE_NINJA', db)

    # --- Проверка 3: Iron Will (Высокая посещаемость/выносливость) ---
    # Используем stat_sta как прокси-метрику
    if student.stat_sta >= 95:
        await grant_achievement(student.id, 'IRON_WILL', db)

    # --- Проверка 4: Cyber Ghost (Закрыл криптографию) ---
    has_crypto = any(g.subject_name == "Криптография" and g.score >= 60 for g in grades)
    if has_crypto:
        await grant_achievement(student.id, 'CYBER_GHOST', db)

    # Здесь можно добавить другие проверки...
