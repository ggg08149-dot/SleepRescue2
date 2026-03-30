import math
import pandas as pd
from models_loader.loader import ml_model

SLEEP_TARGET_HOURS = 7.5
SIGMA_UNDER        = 3.8
SIGMA_OVER         = 5.0


def _get_asymmetric_sleep_score(predicted_hours: float) -> float:
    """가우시안 비대칭 수면 점수 (0~100)"""
    sigma = SIGMA_UNDER if predicted_hours <= SLEEP_TARGET_HOURS else SIGMA_OVER
    score = 100 * math.exp(-((predicted_hours - SLEEP_TARGET_HOURS) ** 2) / (2 * sigma ** 2))
    return round(score, 1)


def _analyze_fatigue_cause_with_weight(workout: float, phone: float, work_hours: float, caffeine: float) -> str:
    """피로 원인 순위 분석 (가중치 적용)"""
    problem_items = []

    if work_hours <= 2:
        work_factor = 0.2
        work_note   = " (근무시간이 매우 짧아 여유로워요)"
    elif work_hours <= 4:
        work_factor = 0.5
        work_note   = " (근무시간이 짧아 여유로워요)"
    elif work_hours <= 6:
        work_factor = 0.8
        work_note   = " (근무시간이 적당해요)"
    elif work_hours <= 8:
        work_factor = 1.0
        work_note   = ""
    else:
        work_factor = 1.2
        work_note   = " (과로 상태예요)"

    if phone > 5:
        weight = int(4 * work_factor)
        if weight > 0:
            problem_items.append(('휴대폰 사용 시간', weight))
    elif phone > 3:
        weight = int(2 * work_factor)
        if weight > 0:
            problem_items.append(('휴대폰 사용 시간', weight))

    if work_hours > 9:
        problem_items.append(('근무 시간', 4))
    elif work_hours > 8:
        problem_items.append(('근무 시간', 3))

    if workout < 0.5:
        weight = int(2 * work_factor)
        if weight > 0:
            problem_items.append(('운동 부족', weight))

    if caffeine > 200:
        weight = int(3 * work_factor)
        if weight > 0:
            problem_items.append(('카페인 과다', weight))
    elif caffeine > 150:
        weight = int(2 * work_factor)
        if weight > 0:
            problem_items.append(('카페인 섭취', weight))

    problem_items.sort(key=lambda x: x[1], reverse=True)

    if not problem_items:
        return "모든 항목이 양호한 상태입니다."
    return " 및 ".join(name for name, _ in problem_items)


def _analyze_fatigue_cause_detail(workout: float, phone: float, work_hours: float, caffeine: float) -> list:
    """피로 원인 상세 분석"""
    causes = []

    if phone > 5:
        causes.append(f"📱 휴대폰 사용 시간 {phone:.1f}시간 | 하루 5시간 이상 사용하면 수면 질이 저하되고, 블루라이트가 멜라토닌 분비를 방해할 수 있어요.")
    elif phone > 3:
        causes.append(f"📱 휴대폰 사용 시간 {phone:.1f}시간 | 적정 수준이지만, 취침 1시간 전에는 사용을 피하는 게 좋아요.")
    else:
        causes.append(f"📱 휴대폰 사용 시간 {phone:.1f}시간 | 양호한 수준이에요, 현재 패턴을 유지해주세요.")

    if work_hours > 9:
        causes.append(f"💼 근무 {work_hours:.1f}시간 | 과로 상태예요, 업무 스트레스가 수면의 질을 크게 저하시킬 수 있어요.")
    elif work_hours > 8:
        causes.append(f"💼 근무 {work_hours:.1f}시간 | 장시간 근무로 피로가 누적되고 있어요, 퇴근 후 충분히 쉬어주세요.")
    elif work_hours <= 2:
        causes.append(f"💼 근무 {work_hours:.1f}시간 | 근무 시간이 매우 짧아 충분히 여유로워요.")
    elif work_hours <= 4:
        causes.append(f"💼 근무 {work_hours:.1f}시간 | 근무 시간이 짧아 여유로운 생활이 가능해요.")
    elif work_hours <= 6:
        causes.append(f"💼 근무 {work_hours:.1f}시간 | 근무 시간이 적당해요.")
    else:
        causes.append(f"💼 근무 {work_hours:.1f}시간 | 적정 근무 시간이에요, 현재 패턴을 유지해주세요.")

    if workout > 3:
        causes.append(f"🏃 운동 시간 {workout:.1f}시간 | 운동량이 너무 많아요. 과도한 운동은 오히려 피로를 쌓을 수 있으니 적당히 조절해주세요.")
    elif workout < 0.5:
        causes.append(f"🏃 운동 부족 (하루 {workout:.1f}시간) | 규칙적인 운동은 수면의 질을 30% 이상 향상시킬 수 있어요.")
    elif workout > 1.5:
        causes.append(f"🏃 적절한 운동 (하루 {workout:.1f}시간) | 좋은 수면 습관을 유지하고 계세요.")
    else:
        causes.append(f"🏃 운동 {workout:.1f}시간 | 적정 수준이에요, 꾸준히 유지해주세요.")

    if caffeine > 200:
        causes.append(f"☕ 카페인 {caffeine:.0f}mg | 과다 섭취하고 있어요, 오후 3시 이후에는 카페인 섭취를 피하는 게 좋아요.")
    elif caffeine > 150:
        causes.append(f"☕ 카페인 {caffeine:.0f}mg | 적정 범위를 초과했어요, 취침 6시간 전까지는 카페인 섭취를 줄이는 게 좋아요.")
    elif caffeine > 0:
        causes.append(f"☕ 카페인 {caffeine:.0f}mg | 적정 수준이에요, 현재 패턴을 유지해주세요.")
    else:
        causes.append("☕ 카페인 없음 | 양호해요.")

    return causes


def predict_lifestyle(workout: float, phone: float, work_hours: float, caffeine: float, sleep_time: float) -> dict:
    """생활패턴 기반 수면 점수 + 피로도 예측"""
    if ml_model is None:
        return {"status": "error", "message": "ML 모델이 로드되지 않았습니다."}

    relaxation = max(0, 24 - (workout + phone + work_hours + sleep_time))

    input_data = pd.DataFrame([{
        'WorkoutTime'   : workout,
        'PhoneTime'     : phone,
        'WorkHours'     : work_hours,
        'CaffeineIntake': caffeine,
        'RelaxationTime': relaxation,
    }])

    predicted_hours = round(float(ml_model.predict(input_data)[0]), 1)
    sleep_score     = _get_asymmetric_sleep_score(predicted_hours)
    fatigue_cause   = _analyze_fatigue_cause_with_weight(workout, phone, work_hours, caffeine)
    fatigue_details = _analyze_fatigue_cause_detail(workout, phone, work_hours, caffeine)

    return {
        "status"         : "success",
        "user_sleep"     : sleep_time,
        "predicted_hours": predicted_hours,
        "caffeine_mg"    : caffeine,
        "sleep_score"    : sleep_score,
        "fatigue_cause"  : fatigue_cause,
        "fatigue_details": fatigue_details,
    }
