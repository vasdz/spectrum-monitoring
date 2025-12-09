from typing import List, Dict
from models import Student, Grade, Attendance, AttendanceStatus


class PredictionService:
    """
    Сервис для анализа рисков отчисления студентов.
    Использует эвристический анализ (или ML модель в будущем).
    """

    @staticmethod
    def calculate_risk_factors(student: Student, grades: List[Grade], attendance: List[Attendance]) -> Dict:
        """
        Возвращает структуру:
        {
            "risk_score": 0.85,
            "factors": ["Низкая посещаемость", "Провал по Лаб. 3"],
            "recommendation": "..."
        }
        """
        factors = []
        risk_score = 0.0

        # 1. Анализ оценок
        if not grades:
            factors.append("Нет оценок за последний период")
            risk_score += 0.3
        else:
            avg_grade = sum(g.score for g in grades) / len(grades)
            if avg_grade < 4.0:
                factors.append(f"Критически низкий средний балл ({avg_grade:.1f})")
                risk_score += 0.5
            elif avg_grade < 5.5:
                factors.append("Низкая успеваемость")
                risk_score += 0.2

            # Поиск проваленных работ
            failed_assignments = [g.assignment_name for g in grades if g.score < 4.0]
            if len(failed_assignments) > 2:
                factors.append(f"Задолженности по {len(failed_assignments)} работам")
                risk_score += 0.3

        # 2. Анализ посещаемости
        if attendance:
            absences = [a for a in attendance if a.status == AttendanceStatus.ABSENT]
            absent_rate = len(absences) / len(attendance)

            if absent_rate > 0.5:
                factors.append("Пропущено более 50% занятий")
                risk_score += 0.4
            elif absent_rate > 0.3:
                factors.append("Частые пропуски")
                risk_score += 0.2

        # Нормализация скора
        risk_score = min(0.99, risk_score)

        # Рекомендация
        recommendation = "Продолжать в том же духе"
        if risk_score > 0.7:
            recommendation = "Срочно вызвать на комиссию / встречу с куратором"
        elif risk_score > 0.4:
            recommendation = "Отправить предупреждение на почту"
        elif risk_score > 0.2:
            recommendation = "Предложить дополнительные материалы"

        return {
            "risk_score": round(risk_score, 2),
            "factors": factors,
            "recommendation": recommendation
        }
