import sys
import json
import joblib
import numpy as np
import pandas as pd
import os
import math
import re

# =====================================================
# 1. 상수 정의 (매직 넘버 제거)
# =====================================================
SLEEP_TARGET_HOURS = 7.5
SIGMA_UNDER = 1.8
SIGMA_OVER = 4.2

CAFFEINE_MAP = {
    '아메리카노': 120,
    '라떼': 80,
    '에너지음료': 160,
    '녹차': 30,
    '없음': 0
}

# =====================================================
# 2. 에러 핸들러 (모드 통합)
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
# 5. 카페인 변환 함수 (mg 단위 입력도 처리)
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

        # 1순위: 딕셔너리에 등록된 음료명인지 먼저 확인
        if item in CAFFEINE_MAP:
            total += CAFFEINE_MAP[item]

        # 2순위: 순수 숫자 또는 "120mg" 형태인지 확인
        else:
            numeric_str = re.sub(r'[^\d.]', '', item)
            non_numeric_part = re.sub(r'[\d.mg]', '', item.lower())
            if numeric_str and not non_numeric_part:
                total += float(numeric_str)
            else:
                # "아메리카노1잔", "비타500" 등 인식 불가 입력
                unknown.append(item)

    if unknown:
        print(f"⚠️  인식되지 않은 카페인 입력: {', '.join(unknown)} → 0mg으로 처리됩니다.", file=sys.stderr)
        print(f"   👉 사용 가능한 음료: {', '.join(CAFFEINE_MAP.keys())}", file=sys.stderr)

    return total

# =====================================================
# 6. 입력 유효성 검사
# =====================================================
def validate_inputs(workout, phone, work_hours, relaxation):
    labels = {
        '운동 시간': workout,
        '핸드폰 사용 시간': phone,
        '근무 시간': work_hours,
        '휴식 시간': relaxation
    }

    # 0 미만 검사
    for name, val in labels.items():
        if val < 0:
            raise ValueError(f"⚠️  '{name}'은(는) 0보다 작을 수 없습니다. (입력값: {val}h)\n   👉 0 이상의 값을 입력해 주세요.")

    # 개별 24시간 초과 검사
    for name, val in labels.items():
        if val > 24:
            raise ValueError(f"⚠️  '{name}'이(가) 24시간을 초과했습니다. (입력값: {val}h)\n   👉 하루는 24시간입니다. 다시 입력해 주세요.")



# =====================================================
# 7. 입력 처리
# =====================================================
mode = "json"  # 기본값 먼저 선언 (스코프 버그 방지)

if len(sys.argv) >= 6:
    try:
        workout = float(sys.argv[1].replace(',', ''))
        phone = float(sys.argv[2].replace(',', ''))
        work_hours = float(sys.argv[3].replace(',', ''))

        caffeine_data = sys.argv[4] if len(sys.argv) == 6 else sys.argv[4:-1]
        caffeine = get_caffeine_mg(caffeine_data)
        relaxation = float(sys.argv[-1].replace(',', ''))
        mode = "json"
    except Exception as e:
        handle_error(f"입력 형식 오류: {str(e)}", mode="json")
else:
    mode = "interactive"
    print("\n" + "=" * 50)
    print("😴 생활패턴 수면 예측 (다중 입력 가능)")
    print("=" * 50)

    try:
        workout = float(input("운동 시간 (시간): "))
        phone = float(input("핸드폰 사용 시간 (시간): "))
        work_hours = float(input("근무 시간 (시간): "))
        caffeine_input = input("카페인 (음료명 또는 mg, 공백/쉼표 구분): ")
        caffeine = get_caffeine_mg(caffeine_input)
        relaxation = float(input("휴식 시간 (시간): "))
    except Exception as e:
        handle_error(str(e), mode="interactive")

# =====================================================
# 8. 유효성 검사 실행
# =====================================================
try:
    validate_inputs(workout, phone, work_hours, relaxation)
except ValueError as e:
    handle_error(str(e), mode=mode)

# =====================================================
# 9. 예측
# =====================================================
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
# 10. 예측 수면시간 포함 합계 검사
# =====================================================
time_sum = round(predicted_hours + work_hours + workout + relaxation + phone, 2)
if time_sum > 24:
    error_msg = (
        f"⚠️  예측 수면시간을 포함한 총 시간이 24시간을 초과했습니다.\n"
        f"   📋 수면: {predicted_hours}h + 근무: {work_hours}h + 운동: {workout}h + 휴식: {relaxation}h + 핸드폰: {phone}h = {time_sum}h\n"
        f"   👉 근무 / 운동 / 휴식 / 핸드폰 사용 시간을 줄여 합계가 24시간 이하가 되도록 조정해 주세요."
    )
    handle_error(error_msg, mode=mode)

# =====================================================
# 11. 결과 출력
# =====================================================
if mode == "json":
    result = {
        "status": "success",
        "predicted_hours": predicted_hours,
        "sleep_score": sleep_score,
        "total_caffeine_mg": caffeine
    }
    print(json.dumps(result, ensure_ascii=False))
else:
    print("\n" + "=" * 50)
    print("📊 분석 결과")
    print("=" * 50)
    print(f"📥 입력: 운동 {workout}h, 폰 {phone}h, 근무 {work_hours}h, 카페인 {caffeine}mg, 휴식 {relaxation}h")
    print("-" * 50)
    print(f"💤 예측 수면시간: {predicted_hours}시간")
    print(f"🏆 최종 수면점수: {sleep_score}점")
    print("=" * 50)