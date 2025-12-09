import asyncio
import random
import sys

from faker import Faker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta

# Импортируем все модели, чтобы SQLAlchemy знала, что создавать
from models import (
    Base,
    Department,
    Group,
    Student,
    User,
    Grade,
    Title,
    StudentAchievement,
    Teacher,  # ВАЖНО: добавили Teacher
)

from config import settings

DATABASE_URL = settings.DATABASE_URL
fake = Faker("ru_RU")

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Данные для генерации
DEPARTMENTS_DATA = [
    {"code": "KB", "name": "Кибербезопасность"},
    {"code": "IS", "name": "Интеллектуальные системы"},
    {"code": "PI", "name": "Программная инженерия"},
]

TITLES_DATA = [
    {"name": "Круче ChatGPT", "rarity": "legendary", "color": "text-purple"},
    {"name": "Я, Робот", "rarity": "epic", "color": "text-cyan"},
    {"name": "Гордость кафедры", "rarity": "rare", "color": "text-green-400"},
    {"name": "Атлет", "rarity": "rare", "color": "text-gray-400"},
]

ACHIEVEMENTS_LIST = [
    "NEURAL_LINK",
    "HIGH_PERFORMER",
    "CODE_NINJA",
    "IRON_WILL",
    "SOCIAL_HUB",
]


async def generate_data():
    print("🚀 Start generating data for SPECTRUM...")

    # Полное пересоздание схемы
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Tables created.")

    async with AsyncSessionLocal() as session:
        # 1. Титулы
        for t in TITLES_DATA:
            session.add(Title(name=t["name"], rarity=t["rarity"], color=t["color"]))

        # 2. Кафедры
        departments_objs = []
        for d in DEPARTMENTS_DATA:
            dept = Department(code=d["code"], full_name=d["name"])
            session.add(dept)
            departments_objs.append(dept)
        await session.flush()

        # 3. Преподаватели — нужны для Neural Load Nodes
        teachers_objs = []
        for dept in departments_objs:
            for _ in range(3):  # по 3 преподавателя на каждую кафедру
                t = Teacher(
                    full_name=fake.name(),
                    department_id=dept.id,
                    degree=random.choice(["доцент", "профессор", "ассистент"]),
                )
                session.add(t)
                teachers_objs.append(t)
        await session.flush()

        # 4. Группы
        groups_objs = []
        for dept in departments_objs:
            for i in range(1, 3):
                group = Group(
                    name=f"{dept.code}-0{i}-25",
                    department_id=dept.id,
                    admission_year=2025,
                    group_number=i,
                    degree_type="BACHELOR",
                )
                session.add(group)
                groups_objs.append(group)
        await session.flush()

        # 5. Студенты + юзеры + оценки + ачивки
        subjects = ["Мат. Анализ", "Алгоритмы", "Базы Данных", "Философия", "Криптография"]

        for group in groups_objs:
            for _ in range(15):
                gender = random.choice(["M", "F"])
                name = fake.name_male() if gender == "M" else fake.name_female()
                ticket = f"{group.name}-{random.randint(1000, 9999)}"

                iq = random.randint(40, 100)
                elo = 1000 + (iq - 50) * 10 + random.randint(-100, 100)

                risk = 0
                if iq < 50:
                    risk = random.randint(70, 99)
                elif iq < 70:
                    risk = random.randint(30, 60)

                student = Student(
                    student_ticket=ticket,
                    full_name=name,
                    group_id=group.id,
                    risk_score=risk,
                    stat_int=iq,
                    stat_sta=random.randint(20, 100),
                    stat_soc=random.randint(10, 90),
                    elo_rating=elo,
                    status="STUDYING",
                )
                session.add(student)
                await session.flush()

                user = User(
                    login=ticket,
                    password_hash="123",  # заглушка
                    role="STUDENT",
                    student_profile_id=student.id,
                )
                session.add(user)

                for subj in subjects:
                    base = 80 if iq > 70 else 50
                    score = random.randint(base - 20, base + 20)
                    score = max(0, min(100, score))
                    session.add(
                        Grade(
                            student_id=student.id,
                            subject_name=subj,
                            score=score,
                            is_exam=True,
                            date=datetime.now()
                            - timedelta(days=random.randint(1, 30)),
                        )
                    )

                # Базовые ачивки — храним только коды
                if iq > 80:
                    session.add(
                        StudentAchievement(
                            student_id=student.id,
                            achievement_code="HIGH_PERFORMER",
                            earned_at=datetime.now(),
                        )
                    )
                if random.random() > 0.7:
                    session.add(
                        StudentAchievement(
                            student_id=student.id,
                            achievement_code=random.choice(ACHIEVEMENTS_LIST),
                            earned_at=datetime.now(),
                        )
                    )

        await session.commit()

    print("✅ Data generation complete! Database is ready.")


if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(generate_data())
