import random
from sqlalchemy.ext.asyncio import AsyncSession
from models import ActivityLog
import datetime

# Примеры событий для генерации (НА РУССКОМ)
EVENTS = [
    ("LOGIN", "INFO", "Пользователь вошел в нейросеть"),
    ("SUBMISSION", "SUCCESS", "Лабораторная работа загружена в Репозиторий"),
    ("GRADE", "INFO", "Обновлена оценка по предмету: Алгоритмы"),
    ("ACCESS", "WARNING", "Заблокирована попытка несанкционированного доступа"),
    ("SYSTEM", "INFO", "Цикл оптимизации системы завершен"),
    ("LIBRARY", "INFO", "Цифровой учебник загружен"),
    ("ACHIEVEMENT", "SUCCESS", "Получено новое достижение"),
    ("CONNECTION", "ERROR", "Сбой соединения с узлом КБ-1"),
]

async def generate_fake_activity(db: AsyncSession):
    """Генерирует одно случайное событие и сохраняет в БД"""
    event_type, severity, details = random.choice(EVENTS)

    # Генерируем случайный ID студента (от 1 до 160)
    student_id = random.randint(1, 160)

    new_log = ActivityLog(
        student_id=student_id,
        event_type=event_type,
        severity=severity,
        details={"message": details},  # JSON поле
        created_at=datetime.datetime.now()
    )

    db.add(new_log)
    await db.commit()
    return new_log
