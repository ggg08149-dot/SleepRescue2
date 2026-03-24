import sys
import json
import joblib
import numpy as np
import pandas as pd
import os
import math

# =====================================================
# 1. 모델 로드 (지능형 경로 적용)
# =====================================================
if '__file__' in globals():
    base_path = os.path.dirname(os.path.abspath(__file__))
else:
    base_path = os.getcwd()

# 다양한 실행 환경에 대응하는 후보 경로들
candidates = [
    os.path.join(base_path, 'sleep_xgb_model.pkl'),
    os.path.join(base_path, '..', 'models', 'Sleep_XGBoost(ML)', 'sleep_xgb_model.pkl'),
    os.path.join(base_path, 'Node', 'models', 'Sleep_XGBoost(ML)', 'sleep_xgb_model.pkl')
]

model = None
for path in candidates:
    if os.path.exists(path):
        try:
            model = joblib.load(path)
            break
        except:
            continue

if model is None:
    # 에러 메시지도 반드시 JSON으로만 출력 (Node.js 파싱을 위해)
    print(json.dumps({"status": "error", "message": "모델 파일을 찾을 수 없습니다."}, ensure_ascii=False))
    sys.exit(1)

# =====================================================
# 2. 가우시안 점수 함수 (동일)
# =====================================================
def get_asymmetric_sleep_score_v2(predicted_hours):
    target = 7.5
    sigma_before = 1.8 
    sigma_after = 4.2 
    
    # math.exp를 사용해 연산 (numpy 의존도 낮춤)
    if predicted_hours <= target:
        score = 100 * math.exp(-((predicted_hours - target)**2) / (2 * (sigma_before**2)))
    else:
        score = 100 * math.exp(-((predicted_hours - target)**2) / (2 * (sigma_after**2)))
    
    return round(score, 1)

# =====================================================
# 3. 메인 실행
# =====================================================

# 입력값 개수 확인
if len(sys.argv) != 6:
    print(json.dumps({"status": "error", "message": "입력값 5개가 필요합니다. (운동, 폰, 근무, 카페인, 휴식)"}, ensure_ascii=False))
    sys.exit(1)

try:
    # 입력값 파싱 (쉼표가 섞여 들어올 경우를 대비해 replace(',') 추가)
    args = [arg.replace(',', '') for arg in sys.argv[1:]]
    workout, phone, work_hours, caffeine, relaxation = map(float, args)
    
    # 예측 수행
    input_data = pd.DataFrame([{
        'WorkoutTime': workout,
        'PhoneTime': phone,
        'WorkHours': work_hours,
        'CaffeineIntake': caffeine,
        'RelaxationTime': relaxation
    }])

    # 예측된 수면시간을 가우시안 점수로 변환
    predicted_hours = round(float(model.predict(input_data)[0]), 1)
    sleep_score = get_asymmetric_sleep_score_v2(predicted_hours)
    
    # 결과 출력
    result = {
        "status": "success",
        "predicted_hours": predicted_hours,
        "sleep_score": sleep_score
    }
    print(json.dumps(result, ensure_ascii=False))

except ValueError:
    print(json.dumps({"status": "error", "message": "입력값이 올바른 숫자가 아닙니다."}, ensure_ascii=False))
except Exception as e:
    print(json.dumps({"status": "error", "message": f"실행 오류: {str(e)}"}, ensure_ascii=False))