import httpx
import logging

# Настройки твоего локального сервера Llama.cpp
AI_API_URL = "http://localhost:8085/v1/chat/completions"

# ВАЖНО: имя модели — как в metadata: general.name
MODEL_NAME = "ilyagusev_saiga_mistral_7b_merged"

# Системный промпт — самый важный элемент. Он задает модели роль и стиль.
SYSTEM_PROMPT = """
Ты — SPECTRUM, элитный ИИ-куратор системы мониторинга студентов.

Стиль:
- Киберпанк, лаконично, без воды.
- Используй термины: "Паттерн", "Синхронизация", "Аномалия", "Коэффициент", "Вектор".
- Отвечай ТОЛЬКО на русском языке.
- Максимум 3–4 коротких предложения.

Оценка риска:
- Используй только эти уровни: "Низкий", "Умеренный", "Высокий", "Критический".
- Если риск ≥ 60% — называй риск "Высокий" или "Критический" (выбери одно).
- Если риск ≤ 30% — "Низкий". Если между 30% и 60% — "Умеренный".

Формат ответа (один абзац, без нумерации):
1) Вердикт риска (уровень + 1 краткое пояснение).
2) Ключевые паттерны (что происходит с ELO, GPA, риском, активностью).
3) Тактические действия куратора (1–2 действия, максимально конкретно).
"""


async def get_ai_analysis(message: str, context: dict | None = None) -> str:
    """
    Отправляет запрос к локальной LLM, обогащая его контекстом из БД.
    """

    context_str = "[Общий запрос по системе]"
    if context:
        context_str = f"""
[ДАННЫЕ СУБЪЕКТА ДЛЯ АНАЛИЗА]
- Имя: {context.get('name', 'Неизвестно')}
- ID: {context.get('id', 'N/A')}
- Группа: {context.get('group', 'N/A')}
- ELO-рейтинг: {context.get('elo', 'N/A')} (Динамический показатель навыков)
- GPA: {context.get('gpa', 'N/A')} (Академическая успеваемость)
- Коэффициент риска: {context.get('risk', 'N/A')}% (Вероятность отчисления/выгорания)
"""

    final_user_message = f"{context_str}\n\n[ЗАПРОС ОПЕРАТОРА]\n{message}"

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": final_user_message}
        ],
        "temperature": 0.7,
        "max_tokens": 125
    }

    try:
        async with httpx.AsyncClient(timeout=140.0) as client:
            response = await client.post(AI_API_URL, json=payload)
            # Логируем raw-ответ для дебага
            logging.error(f"AI RAW RESPONSE: {response.text}")
            response.raise_for_status()

            data = response.json()

            # Универсальный разбор
            choices = data.get("choices", [])
            if not choices:
                return "⚠ Нейроядро вернуло пустой ответ (нет choices)."

            choice0 = choices[0] or {}

            # Формат OpenAI: message.content
            msg = choice0.get("message") or {}
            content = msg.get("content")

            # Некоторые сборки llama.cpp могут класть текст в .text
            if not content:
                content = choice0.get("text")

            if not content or not str(content).strip():
                return "⚠ Нейроядро вернуло пустой ответ (нет content/text)."

            return str(content).strip()

    except httpx.ConnectError:
        logging.error("AI Service: Connection to Llama.cpp server failed.")
        return "⚠ ОШИБКА СВЯЗИ: Локальное нейроядро (Port 8085) недоступно. Запустите сервер Llama.cpp."
    except Exception as e:
        logging.error(f"AI Service Exception: {e}")
        return "⚠ КРИТИЧЕСКИЙ СБОЙ: Канал связи с нейроядром нарушен. Анализ невозможен."
