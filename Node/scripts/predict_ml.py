import sys
import json
import joblib
import pandas as pd
import os
import math

# 1. 카페인 변환 함수
def get_caffeine_mg(caffeine_input):
    val = str(caffeine_input).strip().replace(',', '')
    caffeine_map = {'아메리카노': 120, '라떼': 80, '에너지음료': 160, '녹차': 30, '없음': 0}
    try:
        return float(val)
    except ValueError:
        return caffeine_map.get(val, 0)

# 2. 모델 로드 (경로 자동 최적화)
base_path = os.path.dirname(os.path.abspath(__file__)) if '__file__' in globals() else os.getcwd()
candidates = [
    os.path.join(base_path, '..', 'models', 'Sleep_XGBoost(ML)', 'sleep_xgb_model.pkl'),
    os.path.join(base_path, 'sleep_xgb_model.pkl')
]
model = None
for path in candidates:
    if os.path.exists(path):
        model = joblib.load(path)
        break

if model is None:
    print(json.dumps({"status": "error", "message": "모델 파일을 찾을 수 없습니다."}))
    sys.exit(1)

# 3. 가우시안 점수 함수
def get_score(hours):
    target, s_before, s_after = 7.5, 1.8, 4.2
    sigma = s_before if hours <= target else s_after
    return round(100 * math.exp(-((hours - target)**2) / (2 * (sigma**2))), 1)

# 4. 메인 실행 로직
if len(sys.argv) >= 6:
    try:
        # 인자 5개 추출 (쉼표 제거 필터링)
        args = [arg.strip().replace(',', '') for arg in sys.argv[1:6]]
        workout, phone, work, c_raw, relax = args[0], args[1], args[2], args[3], args[4]
        
        caffeine = get_caffeine_mg(c_raw)
        
        # 데이터프레임 변환 및 예측
        df = pd.DataFrame([{'WorkoutTime': float(workout), 'PhoneTime': float(phone), 
                            'WorkHours': float(work), 'CaffeineIntake': caffeine, 
                            'RelaxationTime': float(relax)}])
        
        pred = round(float(model.predict(df)[0]), 1)
        print(json.dumps({"status": "success", "predicted_hours": pred, "sleep_score": get_score(pred)}, ensure_ascii=False))
    except Exception as e:
        print(json.dumps({"status": "error", "message": f"데이터 처리 오류: {str(e)}"}))
else:
    # 인자 없이 실행했을 때 (VS Code에서 직접 실행 시)
    print("\n[직접 입력 모드]")
    try:
        w = float(input("운동: "))
        p = float(input("폰: "))
        wh = float(input("근무: "))
        c = get_caffeine_mg(input("카페인(이름/숫자): "))
        r = float(input("휴식: "))
        df = pd.DataFrame([{'WorkoutTime': w, 'PhoneTime': p, 'WorkHours': wh, 'CaffeineIntake': c, 'RelaxationTime': r}])
        res = round(float(model.predict(df)[0]), 1)
        print(f"\n결과: {res}시간, {get_score(res)}점")
    except:
        print("입력 오류!")