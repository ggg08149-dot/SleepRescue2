import sys
import json
import joblib
import numpy as np
import pandas as pd
import os
import math
import io
import re

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# =====================================================
# 1. 상수 정의
# =====================================================
SLEEP_TARGET_HOURS = 7.5
SIGMA_UNDER = 3.8
SIGMA_OVER = 5.0

CAFFEINE_MAP = {
    '아메리카노': 120,
    '라떼': 80,
    '에너지음료': 160,
    '녹차': 30,
    '없음': 0
}

# =====================================================
# 2. 에러 핸들러
# =====================================================
def handle_error(message, mode="json"):
    if mode == "json":
        print(json.dumps({"status": "error", "message": message}, ensure_ascii=False))
    else:
        print(f"❌ {message}")
    sys.exit(1)

# =====================================================
# 3. 모델 로드
# =====================================================
current_dir = os.path.dirname(os.path.abspath(__file__))
candidates = [
    os.path.join(current_dir, '..', 'models', 'Sleep_XGBoost(ML)', 'sleep_xgb_model.pkl'),
    os.path.join(current_dir, 'sleep_xgb_model.pkl')
]

model = None
for path in candidates:
    if os.path.exists(path):
        model = joblib.load(path)
        break

if model is None:
    handle_error("모델 파일을 찾을 수 없습니다.")

# =====================================================
# 4. 가우시안 점수 함수
# =====================================================
def get_asymmetric_sleep_score(predicted_hours):
    if predicted_hours <= SLEEP_TARGET_HOURS:
        sigma = SIGMA_UNDER
    else:
        sigma = SIGMA_OVER
    score = 100 * math.exp(-((predicted_hours - SLEEP_TARGET_HOURS) ** 2) / (2 * sigma ** 2))
    return round(score, 1)

# =====================================================
# 5. 피로 원인 분석 함수 (순위용 - 가중치 적용)
# =====================================================
def analyze_fatigue_cause_with_weight(workout, phone, work_hours, caffeine):
    problem_items = []  # (이름, 값, 설명, 가중치)

    # 근무시간에 따른 가중치 조정
    if work_hours <= 2:
        work_factor = 0.2
        work_note = " (근무시간이 매우 짧아 여유로워요)"
    elif work_hours <= 4:
        work_factor = 0.5
        work_note = " (근무시간이 짧아 여유로워요)"
    elif work_hours <= 6:
        work_factor = 0.8
        work_note = " (근무시간이 적당해요)"
    elif work_hours <= 8:
        work_factor = 1.0
        work_note = ""
    else:
        work_factor = 1.2
        work_note = " (과로 상태예요)"

    # 1. 휴대폰 사용 시간
    if phone > 5:
        weight = int(4 * work_factor)
        if weight > 0:
            problem_items.append(('휴대폰 사용 시간', phone, f'하루 {phone:.1f}시간 사용하고 있어요 (권장 3시간 이하){work_note}', weight))
    elif phone > 3:
        weight = int(2 * work_factor)
        if weight > 0:
            problem_items.append(('휴대폰 사용 시간', phone, f'하루 {phone:.1f}시간 사용하고 있어요 (권장 3시간 이하){work_note}', weight))

    # 2. 근무 시간
    if work_hours > 9:
        problem_items.append(('근무 시간', work_hours, f'하루 {work_hours:.1f}시간 근무하고 있어요 (권장 8시간 이하) - 과로 상태예요', 4))
    elif work_hours > 8:
        problem_items.append(('근무 시간', work_hours, f'하루 {work_hours:.1f}시간 근무하고 있어요 (권장 8시간 이하) - 장시간 근무예요', 3))

    # 3. 운동
    if workout < 0.5:
        weight = int(2 * work_factor)
        if weight > 0:
            problem_items.append(('운동 부족', workout, f'하루 {workout*60:.0f}분 운동하고 있어요 (권장 30분 이상){work_note}', weight))

    # 4. 카페인 (기준 150mg)
    if caffeine > 200:
        weight = int(3 * work_factor)
        if weight > 0:
            problem_items.append(('카페인 과다', caffeine, f'카페인 {caffeine:.0f}mg 섭취하고 있어요 (권장 200mg 이하){work_note}', weight))
    elif caffeine > 150:
        weight = int(2 * work_factor)
        if weight > 0:
            problem_items.append(('카페인 섭취', caffeine, f'카페인 {caffeine:.0f}mg 섭취하고 있어요 (권장 150mg 이하){work_note}', weight))

    # 가중치 기준으로 정렬
    problem_items.sort(key=lambda x: x[3], reverse=True)

    # 순위 매기기
    if len(problem_items) == 0:
        return "모든 항목이 양호한 상태입니다."
    else:
        rank_str = []
        for i, (name, val, desc, weight) in enumerate(problem_items, 1):
            rank_str.append(f"{name}")
        return  " 및 ".join(rank_str)


# =====================================================
# 6. 피로 원인 상세 분석 함수 (가중치 없이 원본 데이터)
# =====================================================
def analyze_fatigue_cause_detail(workout, phone, work_hours, caffeine):
    causes = []
    
    # 1. 휴대폰 사용 시간
    if phone > 5:
        causes.append(f"📱 휴대폰 사용 시간 {phone:.1f}시간 | 하루 5시간 이상 사용하면 수면 질이 저하되고, 블루라이트가 멜라토닌 분비를 방해할 수 있어요.")
    elif phone > 3:
        causes.append(f"📱 휴대폰 사용 시간 {phone:.1f}시간 | 적정 수준이지만, 취침 1시간 전에는 사용을 피하는 게 좋아요.")
    else:
        causes.append(f"📱 휴대폰 사용 시간 {phone:.1f}시간 | 양호한 수준이에요, 현재 패턴을 유지해주세요.")
    
    # 2. 근무 시간
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
    
    # 3. 운동
    if workout > 3:
        causes.append(f"🏃 운동 시간 {workout:.1f}시간 | 운동량이 너무 많아요. 과도한 운동은 오히려 피로를 쌓을 수 있으니 적당히 조절해주세요.")
    elif workout < 0.5:
        causes.append(f"🏃 운동 부족 (하루 {workout:.1f}시간) | 규칙적인 운동은 수면의 질을 30% 이상 향상시킬 수 있어요.")
    elif workout > 1.5:
        causes.append(f"🏃 적절한 운동 (하루 {workout:.1f}시간) | 좋은 수면 습관을 유지하고 계세요.")
    else:
        causes.append(f"🏃 운동 {workout:.1f}시간 | 적정 수준이에요, 꾸준히 유지해주세요.")
    
    # 4. 카페인 (기준 150mg)
    if caffeine > 200:
        causes.append(f"☕ 카페인 {caffeine:.0f}mg | 과다 섭취하고 있어요, 오후 3시 이후에는 카페인 섭취를 피하는 게 좋아요.")
    elif caffeine > 150:
        causes.append(f"☕ 카페인 {caffeine:.0f}mg | 적정 범위를 초과했어요, 취침 6시간 전까지는 카페인 섭취를 줄이는 게 좋아요.")
    elif caffeine > 0:
        causes.append(f"☕ 카페인 {caffeine:.0f}mg | 적정 수준이에요, 현재 패턴을 유지해주세요.")
    else:
        causes.append(f"☕ 카페인 없음 | 양호해요.")
    
    return causes


# =====================================================
# 7. 카페인 변환 함수
# =====================================================
def get_caffeine_mg(caffeine_inputs):
    if isinstance(caffeine_inputs, str):
        caffeine_inputs = caffeine_inputs.replace(',', ' ').split()

    total = 0
    unknown = []

    for item in caffeine_inputs:
        item = str(item).strip()
        if not item:
            continue

        if item in CAFFEINE_MAP:
            total += CAFFEINE_MAP[item]
        else:
            numeric_str = re.sub(r'[^\d.]', '', item)
            non_numeric_part = re.sub(r'[\d.mg]', '', item.lower())
            if numeric_str and not non_numeric_part:
                total += float(numeric_str)
            else:
                unknown.append(item)

    if unknown:
        print(f"⚠️  인식되지 않은 카페인 입력: {', '.join(unknown)} → 0mg으로 처리됩니다.", file=sys.stderr)
        print(f"   👉 사용 가능한 음료: {', '.join(CAFFEINE_MAP.keys())}", file=sys.stderr)

    return total


# =====================================================
# 8. 입력 유효성 검사
# =====================================================
def validate_inputs(workout, phone, work_hours, user_sleep):
    labels = {
        '운동 시간': workout,
        '휴대폰 사용 시간': phone,
        '근무 시간': work_hours,
        '수면 시간': user_sleep
    }

    for name, val in labels.items():
        if val < 0:
            raise ValueError(f"⚠️ '{name}'은(는) 0보다 작을 수 없습니다. (입력값: {val}h)")
        if val > 24:
            raise ValueError(f"⚠️ '{name}'이(가) 24시간을 초과했습니다. (입력값: {val}h)")


# =====================================================
# 9. 입력 처리 (운동, 휴대폰, 근무, 카페인, 수면시간)
# =====================================================
mode = "json"

if len(sys.argv) == 6:
    # CLI 모드
    try:
        workout = float(sys.argv[1].replace(',', ''))
        phone = float(sys.argv[2].replace(',', ''))
        work_hours = float(sys.argv[3].replace(',', ''))
        caffeine = get_caffeine_mg(sys.argv[4])
        user_sleep = float(sys.argv[5].replace(',', ''))
        mode = "json"
    except Exception as e:
        handle_error(f"입력 형식 오류: {str(e)}", mode="json")
else:
    # 대화형 모드
    mode = "interactive"
    print("\n" + "=" * 50)
    print("😴 생활패턴 입력 (직접 입력 모드)")
    print("=" * 50)
    print("\n[입력 방법]")
    print("  - 카페인: 숫자(mg) 또는 음료명(아메리카노/라떼/에너지음료/녹차/없음) 입력")
    print("-" * 50)

    try:
        workout = float(input("\n[1] 운동 시간 (시간): "))
        phone = float(input("[2] 휴대폰 사용 시간 (시간): "))
        work_hours = float(input("[3] 근무 시간 (시간): "))
        caffeine_input = input("[4] 카페인 (mg 또는 음료명): ")
        caffeine = get_caffeine_mg(caffeine_input)
        user_sleep = float(input("[5] 수면 시간 (시간): "))
    except Exception as e:
        handle_error(str(e), mode="interactive")


# =====================================================
# 10. 유효성 검사 실행
# =====================================================
try:
    validate_inputs(workout, phone, work_hours, user_sleep)
except ValueError as e:
    handle_error(str(e), mode=mode)


# =====================================================
# 11. 휴식시간 자동 계산
# =====================================================
relaxation = 24 - (workout + phone + work_hours + user_sleep)
relaxation = max(0, relaxation)


# =====================================================
# 12. 예측 수면시간 구하기
# =====================================================
print(f"🔍 디버그 - 운동:{workout}, 휴대폰:{phone}, 근무:{work_hours}, 카페인:{caffeine}mg, 수면:{user_sleep}, 휴식:{relaxation}", file=sys.stderr)

input_data = pd.DataFrame([{
    'WorkoutTime': workout,
    'PhoneTime': phone,
    'WorkHours': work_hours,
    'CaffeineIntake': caffeine,
    'RelaxationTime': relaxation
}])

predicted_hours = round(float(model.predict(input_data)[0]), 1)
sleep_score = get_asymmetric_sleep_score(predicted_hours)


# =====================================================
# 13. 피로 원인 분석
# =====================================================
# 순위 (가중치 적용)
fatigue_rank = analyze_fatigue_cause_with_weight(workout, phone, work_hours, caffeine)
# 상세 분석 (원본 데이터)
fatigue_details = analyze_fatigue_cause_detail(workout, phone, work_hours, caffeine)


# =====================================================
# 14. 결과 출력
# =====================================================
if mode == "json":
    result = {
        "status": "success",
        "user_sleep": user_sleep,
        "predicted_hours": predicted_hours,
        # "relaxation": round(relaxation, 2),
        "caffeine_mg": caffeine,
        "sleep_score": sleep_score,
        "fatigue_cause": fatigue_rank,
        "fatigue_details": fatigue_details
    }
    print(json.dumps(result, ensure_ascii=False))
else:
    print("\n" + "=" * 50)
    print("📊 분석 결과")
    print("=" * 50)
    print(f"\n[입력 데이터]")
    print(f"  운동시간: {workout}시간")
    print(f"  휴대폰 사용시간: {phone}시간")
    print(f"  근무시간: {work_hours}시간")
    print(f"  수면시간: {user_sleep}시간")
    print(f"  카페인: {caffeine}mg")
    print(f"\n[자동 계산]")
    print(f"  휴식시간: {relaxation:.2f}시간 (24 - 합계)")
    print(f"\n[예측 결과]")
    print(f"  AI 권장 수면: {predicted_hours}시간")
    print(f"  수면 점수: {sleep_score}점")
    print(f"\n[피로 원인 분석]")
    print(f"  {fatigue_rank}")
    print(f"\n[상세 분석]")
    for detail in fatigue_details:
        print(f"  {detail}")
    print("=" * 50)