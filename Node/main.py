from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import joblib
import pandas as pd
import io
from PIL import Image
import numpy as np
import cv2
import base64
import math

app = FastAPI()

# cors 설정 추가 (리액트 5000번 포트 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://127.0.0.1:5000"],
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST 등 모든 방식 허용
    allow_headers=["*"],  # 모든 헤더 허용
)

# 1. 두 모델 모두 로드
yolo_model = YOLO("models/YOLO/best.pt")
ml_model = joblib.load("models/Sleep_XGBoost(ML)/sleep_xgb_model.pkl")

# --- [방법 A] YOLO: 다크서클 분석 ---
# [Colab에서 가져온 점수 환산 함수]
def convert_to_score(ratio):
    best, worst = 0.95, 0.70
    score = (ratio - worst) / (best - worst) * 100
    return max(0, min(100, round(score, 1)))

@app.post("/predict/yolo")
async def predict_yolo(file: UploadFile = File(...)):
    print("📸 사진 수신 완료! 분석 시작합니다...")
    # 1. 전송받은 파일 읽기
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        return {"status": "error", "message": "이미지를 읽을 수 없습니다."}
    
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) # 그레이스케일
    
    # 2. YOLO 모델로 예측 (best.pt 사용)
    results = yolo_model.predict(image, conf=0.3)
    final_score = 0
    status = "not_detected"
    encoded_image = ""

    # 3. 분석 로직 (Colab 코드 이식)
    for r in results:
            boxes = r.boxes
            if len(boxes) > 0:
                box = boxes[0] # 가장 확신도 높은 박스
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                w, h = x2 - x1, y2 - y1

                # 시각화
                # 다크서클 영역 (빨간 박스)
                cv2.rectangle(image, (x1, y1), (x2, y2), (0, 0, 255), 3)
                # 볼 영역 (초록 박스)
                sample_y1 = min(image.shape[0] - 1, y1 + h + 5)
                sample_y2 = min(image.shape[0], sample_y1 + 20)
                cv2.rectangle(image, (x1, sample_y1), (x1 + w, sample_y2), (0, 255, 0), 3)

                # [다크서클 영역 밝기]
                dark_roi = gray[y1:y2, x1:x2]
                dark_val = np.mean(dark_roi) if dark_roi.size > 0 else 0

                # [주변 피부 영역 샘플링]
                sample_y1 = min(gray.shape[0] - 1, y1 + h + 5)
                sample_y2 = min(gray.shape[0], sample_y1 + 20)
                skin_roi = gray[sample_y1:sample_y2, x1:x2]
                skin_val = np.mean(skin_roi) if skin_roi.size > 0 else dark_val

                # [비율 및 점수 계산]
                norm_index = dark_val / skin_val if skin_val != 0 else 0
                final_score = convert_to_score(norm_index)
                status = "success"

                # 박스 그린 이미지를 문자로 변환 (리액트 전달용)
                _, buffer = cv2.imencode('.jpg', image)
                encoded_image = base64.b64encode(buffer).decode('utf-8')
                break # 첫 번째 검출 결과만 사용

    return {
            "status": status,
            "dark_circle_score": final_score,
            "result_image": f"data:image/jpeg;base64,{encoded_image}" # 이미지 추가!
    }

# --- [방법 B] ML: 수면 시간 및 점수 예측 ---
# [이식할 가우시안 점수 함수]
def get_asymmetric_sleep_score(predicted_hours):
    SLEEP_TARGET_HOURS = 7.5
    SIGMA_UNDER = 3.8
    SIGMA_OVER = 5.0
    
    if predicted_hours <= SLEEP_TARGET_HOURS:
        sigma = SIGMA_UNDER
    else:
        sigma = SIGMA_OVER
    
    # 가우시안 종 모양 곡선 로직
    score = 100 * math.exp(-((predicted_hours - SLEEP_TARGET_HOURS) ** 2) / (2 * sigma ** 2))
    return round(score, 1)

@app.post("/predict/ml")
async def predict_ml(
    workout: float, 
    phone: float, 
    workHours: float, 
    caffeine: float, 
    sleepTime: float
):
    
# 1. 휴식 시간(RelaxationTime) 자동 계산 (이것도 원래 코드에 있었네요!)
    # 24시간에서 나머지 활동을 뺀 값
    relaxation = max(0, 24 - (workout + phone + workHours + sleepTime))

    # 2. 데이터프레임 변환
    df = pd.DataFrame([{
        'WorkoutTime': workout, 
        'PhoneTime': phone, 
        'WorkHours': workHours, 
        'CaffeineIntake': caffeine, 
        'RelaxationTime': relaxation
    }])
    
    # 3. XGBoost 예측 실행
    pred_hours = round(float(ml_model.predict(df)[0]), 1)
    
    # 4. 드디어 찾은 그 로직으로 점수 계산!
    sleep_score = get_asymmetric_sleep_score(pred_hours)
    
    return {
        "status": "success",
        "sleep_score": sleep_score,        # Node.js가 기다리는 70% 비중의 그 점수!
        "predicted_hours": pred_hours,
        "message": "생활 데이터 기반 수면 분석 완료"
    }