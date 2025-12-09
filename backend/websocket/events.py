import asyncio
import random
from datetime import datetime
from . import sio


# --- СОБЫТИЯ ПОДКЛЮЧЕНИЯ ---

@sio.event
async def connect(sid, environ):
    print(f"⚡ Client connected: {sid}")
    # Можно добавить клиента в "комнату" для рассылок
    await sio.enter_room(sid, 'dashboard_users')


@sio.event
async def disconnect(sid):
    print(f"🔌 Client disconnected: {sid}")


# --- ФОНОВАЯ ЗАДАЧА (BROADCAST) ---
# Эта функция будет работать вечно и слать данные всем подключенным

async def start_background_task():
    """
    Фоновая задача, которая каждые 5 секунд шлёт всем клиентам
    обновленную статистику 'Live'.
    """
    print("📡 Background WebSocket task started...")
    while True:
        # Имитация меняющихся данных (в реале тут запрос к БД или Redis)
        active_users = random.randint(140, 165)
        events_per_min = random.randint(20, 50)

        # Данные для графика "Live Activity"
        payload = {
            "timestamp": datetime.now().isoformat(),
            "active_users": active_users,
            "events_per_minute": events_per_min,
            "top_course": random.choice(["Криптография", "ML", "Алгоритмы"]),
            "alerts": []
        }

        # Редко (раз в минуту) кидаем алерт
        if random.random() < 0.1:
            payload["alerts"].append({
                "type": "warning",
                "msg": f"High load detected in group БПИ231"
            })

        # Отправляем событие 'stats_update' всем в комнате
        await sio.emit('stats_update', payload, room='dashboard_users')

        await asyncio.sleep(5)  # Ждем 5 секунд
