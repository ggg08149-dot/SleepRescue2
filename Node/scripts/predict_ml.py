import sys
import json
import joblib
import numpy as np
import pandas as pd
import os
import math
import re

# =====================================================
# 1. 상수 정의
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
# 5. 카페인 변환 함수
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
# 6. 입력 유효성 검사
# =====================================================
def validate_inputs(workout, phone, work_hours, user_sleep):
    labels = {
        '운동 시간': workout,
        '핸드폰 사용 시간': phone,
        '근무 시간': work_hours,
        '수면 시간': user_sleep
    }

    for name, val in labels.items():
        if val < 0:
            raise ValueError(f"⚠️ '{name}'은(는) 0보다 작을 수 없습니다. (입력값: {val}h)")
        if val > 24:
            raise ValueError(f"⚠️ '{name}'이(가) 24시간을 초과했습니다. (입력값: {val}h)")

# =====================================================
# 7. 입력 처리 (운동, 폰, 근무, 카페인, 수면시간)
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
        phone = float(input("[2] 핸드폰 사용 시간 (시간): "))
        work_hours = float(input("[3] 근무 시간 (시간): "))
        caffeine_input = input("[4] 카페인 (mg 또는 음료명): ")
        caffeine = get_caffeine_mg(caffeine_input)
        user_sleep = float(input("[5] 수면 시간 (시간): "))
    except Exception as e:
        handle_error(str(e), mode="interactive")

# =====================================================
# 8. 유효성 검사 실행
# =====================================================
try:
    validate_inputs(workout, phone, work_hours, user_sleep)
except ValueError as e:
    handle_error(str(e), mode=mode)

# =====================================================
# 9. 휴식시간 자동 계산
# =====================================================
# 휴식시간 = 24 - (운동 + 폰 + 근무 + 사용자 수면시간)
relaxation = 24 - (workout + phone + work_hours + user_sleep)
relaxation = max(0, relaxation)

# =====================================================
# 10. 예측 수면시간 구하기
# 입력: 운동, 폰, 근무, 카페인, 휴식시간(계산값)
# =====================================================
input_data = pd.DataFrame([{
    'WorkoutTime': workout,
    'PhoneTime': phone,
    'WorkHours': work_hours,
    'CaffeineIntake': caffeine,
    'RelaxationTime': relaxation
}])

predicted_hours = round(float(model.predict(input_data)[0]), 1)

# 수면 점수 계산
sleep_score = get_asymmetric_sleep_score(predicted_hours)

# =====================================================
# 11. 결과 출력
# =====================================================
if mode == "json":
    result = {
        "status": "success",
        "user_sleep": user_sleep,
        "predicted_hours": predicted_hours,
        "relaxation": round(relaxation, 2),
        "caffeine_mg": caffeine,
        "sleep_score": sleep_score
    }
    print(json.dumps(result, ensure_ascii=False))
else:
    print("\n" + "=" * 50)
    print("📊 분석 결과")
    print("=" * 50)
    print(f"\n[입력 데이터]")
    print(f"  운동시간: {workout}시간")
    print(f"  폰사용시간: {phone}시간")
    print(f"  근무시간: {work_hours}시간")
    print(f"  카페인: {caffeine}mg")
    print(f"  사용자 수면시간: {user_sleep}시간")
    print(f"\n[자동 계산]")
    print(f"  휴식시간: {relaxation:.2f}시간 (24 - 합계)")
    print(f"\n[예측 결과]")
    print(f"  AI 권장 수면: {predicted_hours}시간")
    print(f"  수면 점수: {sleep_score}점")
    print("=" * 50)

    # python Node/scripts/predict_ml.py (운동시간) (폰 사용시간) (근무시간) (카페인) (수면시간)