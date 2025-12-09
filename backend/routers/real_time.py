from fastapi import APIRouter
from datetime import datetime
import random

router = APIRouter()

@router.get("/now")
async def get_realtime_snapshot():
    """
    Эндпоинт для поллинга (опрос раз в 3 сек с фронта),
    пока не подняли полноценные вебсокеты.
    """
    return {
        "timestamp": datetime.now().isoformat(),
        "active_users_count": random.randint(140, 160),
        "events_per_minute": random.randint(20, 50),
        "top_active_course": "Криптография"
    }
