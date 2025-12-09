from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# Базовая схема студента
class StudentBase(BaseModel):
    full_name: str
    student_ticket: str
    status: str


# Для отображения (Output)
class StudentOut(StudentBase):
    id: int
    group_id: int
    # Новые поля аналитики
    debts_count: int
    risk_score: int
    # RPG статы
    stat_int: int
    stat_sta: int
    stat_soc: int

    class Config:
        orm_mode = True


# Схема Группы
class GroupOut(BaseModel):
    id: int
    name: str
    department_id: int

    class Config:
        orm_mode = True


# Схема Алертов (Тревог)
class AlertOut(BaseModel):
    id: int
    student_id: int
    alert_level: str
    message: str
    created_at: datetime

    class Config:
        orm_mode = True
