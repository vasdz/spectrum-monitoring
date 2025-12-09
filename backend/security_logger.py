import logging
import datetime
import os

# Убедимся, что файл лога создается в правильной папке
LOG_FILE = os.path.join(os.path.dirname(__file__), 'security_audit.log')

# Настройка логгера
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)


def log_security_event(event_type: str, user: str, details: str, ip: str = "Unknown"):
    """
    Записывает событие безопасности в файл и выводит в консоль.
    """
    timestamp = datetime.datetime.now().isoformat()
    log_msg = f"[{event_type.upper()}] User: {user} | IP: {ip} | Details: {details}"

    # 1. Вывод в консоль (чтобы вы видели, что работает)
    print(f"🛡️ {log_msg}")

    # 2. Запись в файл (Audit Log)
    logging.info(log_msg)
