# backend/logic/elo_system.py
import math

# Базовые константы
BASE_K_FACTOR = 30  # Стандартный коэффициент изменения (для обычных пар)
COMPETITION_K_FACTOR = 100  # Хакатоны влияют сильнее
BONUS_CAP = 50  # Максимум бонусов за поощрения в семестр


def calculate_expected_score(student_rating, task_difficulty):
    """
    Вероятность успеха студента (0.0 - 1.0).
    Если Рейтинг >> Сложности, ожидаем 1.0 (успех).
    """
    return 1 / (1 + math.pow(10, (task_difficulty - student_rating) / 400))


def calculate_academic_change(current_rating, grade, task_type="EXAM"):
    """
    Расчет изменения рейтинга за учебу.
    grade: Оценка (2, 3, 4, 5)
    task_type: "HOMEWORK", "TEST", "EXAM"
    """
    # 1. Определяем сложность задачи и "вес" (K)
    # Чем выше тип задачи, тем больше очков на кону
    if task_type == "EXAM":
        k_factor = 60
        difficulty = 1500  # Экзамен сложен по дефолту
    elif task_type == "TEST":
        k_factor = 40
        difficulty = 1200
    else:  # HOMEWORK
        k_factor = 20
        difficulty = 1000

    # 2. Нормализуем оценку в результат (0.0 - 1.0)
    # 5 -> 1.0 (Win), 4 -> 0.75, 3 -> 0.25, 2 -> 0.0 (Loss)
    actual_score = {5: 1.0, 4: 0.75, 3: 0.25, 2: 0.0}.get(grade, 0.0)

    # 3. Считаем ожидание
    expected_score = calculate_expected_score(current_rating, difficulty)

    # 4. КОРРЕКЦИЯ "ОТЛИЧНИКА"
    # Если рейтинг высокий (>1800) и оценка "4" (0.75), то
    # expected_score будет близко к 0.9.
    # (0.75 - 0.9) = -0.15. Отличник потеряет очки за четверку!
    # Это жестко, но справедливо для топ-рейтинга.

    delta = k_factor * (actual_score - expected_score)

    # Округляем
    return round(delta)


def calculate_competition_change(current_rating, placement, participants_count=50):
    """
    Расчет за соревнования (Хакатоны).
    placement: Место (1 - первое, 2 - второе...)
    """
    # Участие всегда дает маленький плюс (за смелость), даже если проиграл
    participation_bonus = 5

    if placement > 10:
        return participation_bonus

    # Если в топе - серьезный буст
    # 1 место: K=100 * (1.0 - exp)
    # Сложность победы в хакатоне считаем как ОЧЕНЬ высокую (2000)
    difficulty = 2000

    # Чем выше место, тем ближе 'actual_score' к 1.0
    # 1 место = 1.0, 2 место = 0.9, 3 место = 0.8...
    actual_score = max(0, 1.0 - (placement - 1) * 0.1)

    expected_score = calculate_expected_score(current_rating, difficulty)

    delta = COMPETITION_K_FACTOR * (actual_score - expected_score)

    # Гарантируем, что за топ-3 студент не уйдет в минус даже при высоком рейтинге
    return max(participation_bonus, round(delta)) + participation_bonus


def apply_kudos(current_rating, bonus_amount):
    """
    Поощрения от кафедры (небольшие).
    Имеют diminishing returns (чем выше рейтинг, тем меньше влияют).
    """
    # Если рейтинг 1000 -> множитель 1.0
    # Если рейтинг 2000 -> множитель 0.5
    multiplier = 1000 / max(1000, current_rating)

    real_bonus = bonus_amount * multiplier
    # Ограничиваем влияние поощрений, чтобы не накрутили
    return round(min(real_bonus, 20))
