from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from models import Student, Grade


class AnalyticsService:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_department_kpi(self):
        """Получить главные метрики для дашборда админа"""
        # 1. Всего студентов
        total_students = await self.db.scalar(select(func.count(Student.id)))

        # 2. Средняя успеваемость (за все время)
        avg_gpa = await self.db.scalar(select(func.avg(Student.avg_score))) or 0.0

        # 3. Студенты в зоне риска (> 0.7)
        at_risk_count = await self.db.scalar(
            select(func.count(Student.id)).where(Student.risk_score > 0.7)
        )

        # 4. Индекс здоровья (эвристика)
        # 100 - (риск_студенты * 2) - (10 - avg_gpa)*5
        health_index = 100 - (at_risk_count / (total_students or 1) * 100) - ((10 - avg_gpa) * 2)
        health_index = max(0, min(100, health_index))

        return {
            "total_students": total_students,
            "average_gpa": round(avg_gpa, 2),
            "at_risk_count": at_risk_count,
            "health_index": int(health_index),
            "status": "Good" if health_index > 75 else "Warning"
        }

    async def get_top_difficult_courses(self, limit: int = 5):
        """Топ самых сложных курсов (по низкому среднему баллу)"""
        # В реале тут нужен сложный JOIN, но сделаем через course.grades
        # Для прототипа проще выбрать курсы и посчитать
        courses_res = await self.db.execute(select(Course))
        courses = courses_res.scalars().all()

        stats = []
        for course in courses:
            # Это N+1 запрос, не очень оптимально, но для 20 курсов сойдёт
            grades_avg = await self.db.scalar(
                select(func.avg(Grade.score)).where(Grade.course_id == course.id)
            ) or 0.0

            stats.append({
                "course_name": course.name,
                "avg_score": round(grades_avg, 2),
                "difficulty": "High" if grades_avg < 6.0 else "Medium"
            })

        # Сортируем: чем ниже балл, тем сложнее
        stats.sort(key=lambda x: x['avg_score'])
        return stats[:limit]
