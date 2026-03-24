import sys
import json
import joblib
import numpy as np
import pandas as pd
import os
import math

# =====================================================
# 1. 모델 로드 (경로 유연하게 설정)
# =====================================================
current_dir = os.path.dirname(os.path.abspath(__file__))
# 기존 경로 시도 후 실패 시 현재 디렉토리 시도
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
    print(json.dumps({"status": "error", "message": "모델 파일을 찾을 수 없습니다."}))
    sys.exit(1)

# =====================================================
# 2. 가우시안 점수 함수
# =====================================================
def get_asymmetric_sleep_score_v2(predicted_hours):
    target = 7.5
    sigma_before = 1.8
    sigma_after = 4.2
    
    if predicted_hours <= target:
        score = 100 * math.exp(-((predicted_hours - target)**2) / (2 * (sigma_before**2)))
    else:
        score = 100 * math.exp(-((predicted_hours - target)**2) / (2 * (sigma_after**2)))
    
    return round(score, 1)

# =====================================================
# 3. 카페인 변환 함수 (개선됨: 문자열/리스트/쉼표/공백 모두 대응)
# =====================================================
def get_caffeine_mg(caffeine_inputs):
    caffeine_map = {
        '아메리카노': 120, '라떼': 80, '에너지음료': 160, '녹차': 30, '없음': 0
    }
    
    # 입력이 단일 문자열인 경우 (예: "아메리카노,라떼") 리스트로 분리
    if isinstance(caffeine_inputs, str):
        caffeine_inputs = caffeine_inputs.replace(',', ' ').split()
    
    total = 0
    for item in caffeine_inputs:
        item = str(item).strip()
        if not item: continue
        
        try:
            # 숫자 형태인 경우 바로 더함
            total += float(item.replace(',', ''))
        except ValueError:
            # 문자 형태인 경우 맵에서 찾음
            total += caffeine_map.get(item, 0)
    return total

# =====================================================
# 4. 입력 방식 판별 (더 똑똑해진 CLI 인자 처리)
# =====================================================
if len(sys.argv) >= 6:
    # A. Node.js / 터미널 인자 방식
    try:
        workout = float(sys.argv[1].replace(',', ''))
        phone = float(sys.argv[2].replace(',', ''))
        work_hours = float(sys.argv[3].replace(',', ''))
        
        # 카페인: 4번째 인자부터 마지막-1 인자까지 모두 합침
        # 예1: python p.py 1 2 3 "아메리카노 라떼" 2 -> sys.argv[4] 사용
        # 예2: python p.py 1 2 3 아메리카노 라떼 2 -> sys.argv[4:-1] 사용
        if len(sys.argv) == 6:
            caffeine_data = sys.argv[4]
        else:
            caffeine_data = sys.argv[4:-1]
            
        caffeine = get_caffeine_mg(caffeine_data)
        relaxation = float(sys.argv[-1].replace(',', ''))
        mode = "json"
    except Exception as e:
        print(json.dumps({"status": "error", "message": f"입력 형식 오류: {str(e)}"}))
        sys.exit(1)
else:
    # B. VS Code 직접 실행 / input() 방식
    mode = "interactive"
    print("\n" + "="*50)
    print("😴 생활패턴 수면 예측 (다중 입력 가능)")
    print("="*50)
    
    try:
        workout = float(input("운동 시간 (시간): "))
        phone = float(input("핸드폰 사용 시간 (시간): "))
        work_hours = float(input("근무 시간 (시간): "))
        caffeine_input = input("카페인 (음료명 또는 mg, 공백/쉼표 구분): ")
        caffeine = get_caffeine_mg(caffeine_input)
        relaxation = float(input("휴식 시간 (시간): "))
    except Exception as e:
        print(f"❌ 입력 오류: {e}")
        sys.exit(1)

# =====================================================
# 5. 예측 및 결과 생성
# =====================================================
input_data = pd.DataFrame([{
    'WorkoutTime': workout,
    'PhoneTime': phone,
    'WorkHours': work_hours,
    'CaffeineIntake': caffeine,
    'RelaxationTime': relaxation
}])

predicted_hours = round(float(model.predict(input_data)[0]), 1)
sleep_score = get_asymmetric_sleep_score_v2(predicted_hours)

# =====================================================
# 6. 결과 출력
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
    print("\n" + "="*50)
    print("📊 분석 결과")
    print("="*50)
    print(f"📥 입력: 운동 {workout}h, 폰 {phone}h, 근무 {work_hours}h, 카페인 {caffeine}mg, 휴식 {relaxation}h")
    print("-" * 50)
    print(f"💤 예측 수면시간: {predicted_hours}시간")
    print(f"🏆 최종 수면점수: {sleep_score}점")
    print("="*50)