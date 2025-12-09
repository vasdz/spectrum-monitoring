# 🛡️ SPECTRUM Security Monitor

Система мониторинга активности в реальном времени с расширенными возможностями безопасности.

## 🚀 Возможности

- ⚡ Real-time WebSocket мониторинг
- 🔐 Многоуровневая защита (Rate Limiting, WAF, Security Headers)
- 📊 Аналитика и логирование событий
- 🎯 RESTful API для управления студентами
- 🔍 Сканирование безопасности при запуске
- 📝 Audit logging для всех операций

## 📋 Требования

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- npm или yarn

## 🔧 Установка и запуск

### Backend

1. **Клонируй репозиторий:**
git clone https://github.com/vasdz/spectrum-monitoring.git
cd spectrum-monitoring

text

2. **Создай виртуальное окружение:**
python -m venv venv

Windows
venv\Scripts\activate

Linux/Mac
source venv/bin/activate

text

3. **Установи зависимости:**
cd backend
pip install -r requirements.txt

text

4. **Настрой переменные окружения:**
Скопируй .env.example в .env
cp .env.example .env

Отредактируй .env и укажи свои данные
text

5. **Настрой базу данных:**
Создай базу данных PostgreSQL
createdb spectrum_db

Выполни миграции (если есть)
alembic upgrade head

text

6. **Запусти сервер:**
python main.py

text

Backend будет доступен по адресу: `http://localhost:8000`

API документация: `http://localhost:8000/docs`

### Frontend

1. **Перейди в директорию frontend:**
cd frontend

text

2. **Установи зависимости:**
npm install

или
yarn install

text

3. **Запусти dev-сервер:**
npm run dev

или
yarn dev

text

Frontend будет доступен по адресу: `http://localhost:3000` (или другой порт, указанный в консоли)

## 🐳 Запуск через Docker (опционально)

docker-compose up -d

text

## 📁 Структура проекта

spectrum-monitoring/
├── backend/
│ ├── main.py # Точка входа
│ ├── config.py # Конфигурация
│ ├── database.py # Настройка БД
│ ├── routers/ # API endpoints
│ │ ├── students.py
│ │ ├── analytics.py
│ │ ├── real_time.py
│ │ └── admin.py
│ ├── logic/ # Бизнес-логика
│ │ ├── activity_generator.py
│ │ └── security_monitor.py
│ └── security_logger.py # Логирование безопасности
├── frontend/
│ └── ... (React/Vue/Next.js структура)
└── README.md

text

## 🔒 Безопасность

Проект включает следующие меры защиты:

- **Rate Limiting** - защита от DDoS атак (slowapi)
- **Security Headers** - XSS, Clickjacking защита
- **Audit Logging** - логирование всех операций
- **WAF** - базовый Web Application Firewall
- **CORS** - настраиваемая политика cross-origin
- **CSP** - Content Security Policy

## 🔗 API Endpoints

### Students
- `GET /api/students` - Список студентов
- `POST /api/students` - Создать студента
- `PUT /api/students/{id}` - Обновить студента
- `DELETE /api/students/{id}` - Удалить студента

### Analytics
- `GET /api/analytics/stats` - Статистика системы
- `GET /api/analytics/events` - История событий

### Real-time
- `WS /ws` - WebSocket соединение для live-данных

### Admin
- `GET /api/admin/security-log` - Лог безопасности
- `POST /api/admin/scan` - Запустить сканирование

## 🐛 Troubleshooting

### Windows: asyncio проблемы
Уже реализовано в main.py
asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

text

### CORS ошибки
Убедись, что в `.env` указаны правильные `ALLOWED_ORIGINS`:
ALLOWED_ORIGINS=["http://localhost:3000"]

text

### PostgreSQL подключение
Проверь строку подключения в `.env`:
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/spectrum_db

text

## 📝 Логирование

Все события безопасности записываются в `security_events.log`:
- Запуск/остановка системы
- API запросы (POST/PUT/DELETE)
- WAF блокировки
- Результаты сканирования

## 🤝 Contributing

Pull requests приветствуются! Для крупных изменений сначала открой issue.

## 📄 Лицензия

[MIT](LICENSE)

## 👤 Автор

**Alexander (vasdz)**
- GitHub: [@vasdz](https://github.com/vasdz)

---

⭐ Если проект был полезен, поставь звезду!