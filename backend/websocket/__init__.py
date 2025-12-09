import socketio
from backend.config import settings

# Создаем сервер Socket.IO
# cors_allowed_origins=[] разрешает всем (или список из конфига)
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=settings.BACKEND_CORS_ORIGINS or "*"
)

# Оборачиваем в ASGI приложение, чтобы FastAPI мог его запустить
socket_app = socketio.ASGIApp(sio)
