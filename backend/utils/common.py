from datetime import datetime, timedelta
import random

def get_time_ago(minutes: int) -> datetime:
    """Возвращает время N минут назад"""
    return datetime.now() - timedelta(minutes=minutes)

def format_risk_score(score: float) -> str:
    """Превращает 0.85 в 'High Risk (85%)'"""
    percent = int(score * 100)
    if score > 0.7:
        return f"Critical ({percent}%)"
    elif score > 0.4:
        return f"Warning ({percent}%)"
    return f"Normal ({percent}%)"
