from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import ActivityLog, Student
from pydantic import BaseModel

router = APIRouter()


# Схема для ответа
class AuditLogOut(BaseModel):
    id: int
    event_type: str  # Заменили EventType на str
    created_at: datetime  # В модели у тебя created_at, а не timestamp
    details: Optional[str]  # В модели details (JSON), но сюда вернем как строку или dict

    class Config:
        from_attributes = True


@router.get("/audit-logs", response_model=List[AuditLogOut])
async def get_audit_logs(
        limit: int = 50,
        event_type: Optional[str] = None,  # Заменили EventType на str
        db: AsyncSession = Depends(get_db)
):
    """
    Получить последние логи действий в системе.
    """
    # Сортируем по created_at (как в модели)
    query = select(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit)

    if event_type:
        query = query.where(ActivityLog.event_type == event_type)

    result = await db.execute(query)
    logs = result.scalars().all()

    # Преобразуем вручную, чтобы совпадали поля
    output = []
    for log in logs:
        output.append(AuditLogOut(
            id=log.id,
            event_type=log.event_type or "UNKNOWN",
            created_at=log.created_at or datetime.now(),
            # details в БД это JSON, преобразуем в строку или отдадим как есть (если Pydantic позволяет)
            details=str(log.details) if log.details else None
        ))

    return output


@router.get("/department-stats")
async def get_department_stats(db: AsyncSession = Depends(get_db)):
    """
    Статистика для зав. кафедрой (KPI).
    """
    # Общее кол-во студентов
    total_students_q = await db.execute(select(func.count(Student.id)))
    total_students = total_students_q.scalar()

    # Средний risk_score
    avg_risk_q = await db.execute(select(func.avg(Student.risk_score)))
    avg_risk = avg_risk_q.scalar() or 0.0

    return {
        "total_students": total_students,
        "average_risk_score": round(avg_risk, 2),
        "department_health": "Stable" if avg_risk < 30 else "Warning",  # Риск у нас 0-100
        "last_update": datetime.now().isoformat()
    }
