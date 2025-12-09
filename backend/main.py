import uvicorn
import asyncio
import sys
import time
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

# --- BEZOPASNOST (SECURITY IMPORTS) ---
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from security_logger import log_security_event

from contextlib import asynccontextmanager
from logic.activity_generator import generate_fake_activity
from logic.security_monitor import run_security_scan

from config import settings
from database import AsyncSessionLocal
from routers import students, real_time, admin
import analytics

# --- 1. SECURITY: RATE LIMITER (Защита от DDOS) ---
limiter = Limiter(key_func=get_remote_address)


# --- 2. SECURITY: HTTP HEADERS (Защита браузера) ---
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Заголовки безопасности
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        # CSP можно временно ослабить для дебага, если фронт шалит
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none'; connect-src *"
        return response


# --- 3. SECURITY: AUDIT LOGGING MIDDLEWARE ---
class AuditMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        client_ip = request.client.host if request.client else "Unknown"
        if client_ip == "666.666.666.666":
            log_security_event("WAF_BLOCK", "SYSTEM", f"Blocked malicious IP: {client_ip}")
            return JSONResponse(status_code=403, content={"detail": "Access Denied by SPECTRUM WAF"})

        response = await call_next(request)

        if request.method in ["POST", "DELETE", "PUT"]:
            log_security_event(
                "API_REQUEST",
                "Unknown (API)",
                f"{request.method} {request.url.path} [Status: {response.status_code}]",
                client_ip
            )

        return response


# --- WEBSOCKET MANAGER ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Если соединение мёртвое, можно его удалить или игнорировать ошибку
                pass


manager = ConnectionManager()


# --- ФОНОВАЯ ЗАДАЧА ---
async def background_task():
    import random
    while True:
        await asyncio.sleep(random.randint(3, 7))
        async with AsyncSessionLocal() as session:
            try:
                new_log = await generate_fake_activity(session)
                if manager.active_connections:
                    await manager.broadcast({
                        "type": "new_activity",
                        "payload": {
                            "id": new_log.id,
                            "type": new_log.event_type,
                            "message": new_log.details.get("message"),
                            "severity": new_log.severity,
                            "time": new_log.created_at.strftime("%H:%M:%S")
                        }
                    })
            except Exception as e:
                print(f"Activity Gen Error: {e}")


# --- LIFESPAN ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Backend Starting...")
    log_security_event("SYSTEM_STARTUP", "SYSTEM", "Backend initialized secure mode")

    # Запускаем фон
    task = asyncio.create_task(background_task())

    # Сканирование безопасности при старте
    async with AsyncSessionLocal() as session:
        try:
            await run_security_scan(session)
        except Exception as e:
            print(f"❌ Security Scan Failed: {e}")

    print("✅ Startup Complete & DB Connected")
    yield
    # Завершение работы
    task.cancel()
    print("🛑 Backend Shutting Down...")
    log_security_event("SYSTEM_SHUTDOWN", "SYSTEM", "Backend shutting down")


# --- ИНИЦИАЛИЗАЦИЯ APP ---
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# --- 1. Сначала ставим обработчики ошибок и лимитер
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- 2. ВАЖНО: CORS должен быть добавлен ПОСЛЕДНИМ вызовом add_middleware,
# чтобы он выполнялся ПЕРВЫМ при входящем запросе.
# Мы убрали if settings... чтобы точно разрешить доступ.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # разрешаем всем источникам
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 3. Потом кастомные мидлвари (выполняются после CORS проверки)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(AuditMiddleware)


# --- ROUTERS ---
app.include_router(students.router, prefix="/api/students", tags=["students"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(real_time.router, prefix="/api/real-time", tags=["real-time"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])


# --- WEBSOCKET ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


if __name__ == "__main__":
    # Фикс для Windows и asyncio
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
