from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import joblib
import pandas as pd
import numpy as np
import cv2
import base64
import os

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 모델 경로 자동 계산 (어디서 실행해도 찾을 수 있게)
BASE = os.path.dirname(os.path.abspath(__file__))
YOLO_PATH = os.path.join(BASE, "models", "YOLO", "best.pt")
ML_PATH   = os.path.join(BASE, "models", "Sleep_XGBoost(ML)", "sleep_xgb_model.pkl")

print(f"📂 YOLO 경로: {YOLO_PATH}")
print(f"📂 ML 경로: {ML_PATH}")

# 모델 로드
yolo_model = YOLO(YOLO_PATH)
ml_model   = joblib.load(ML_PATH)

print("✅ 모델 로드 완료!")

# 다크서클 점수 환산 함수
def convert_to_score(ratio):
    best, worst = 0.95, 0.70
    score = (ratio - worst) / (best - worst) * 100
    return max(0, min(100, round(score, 1)))

# 서버 확인용
@app.get("/")
def root():
    return {"message": "🚑 수면구조대 FastAPI 서버 실행 중!"}

# YOLO 다크서클 분석
@app.post("/predict/yolo")
async def predict_yolo(file: UploadFile = File(...)):
    print("📸 사진 수신 완료! 분석 시작합니다...")
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        return {"status": "error", "message": "이미지를 읽을 수 없습니다."}

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    results = yolo_model.predict(image, conf=0.3)
    final_score = 0
    status = "not_detected"
    encoded_image = ""

    for r in results:
        boxes = r.boxes
        if len(boxes) > 0:
            box = boxes[0]
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            w, h = x2 - x1, y2 - y1

            cv2.rectangle(image, (x1, y1), (x2, y2), (0, 0, 255), 3)
            sample_y1 = min(image.shape[0] - 1, y1 + h + 5)
            sample_y2 = min(image.shape[0], sample_y1 + 20)
            cv2.rectangle(image, (x1, sample_y1), (x1 + w, sample_y2), (0, 255, 0), 3)

            dark_roi = gray[y1:y2, x1:x2]
            dark_val = np.mean(dark_roi) if dark_roi.size > 0 else 0

            sample_y1 = min(gray.shape[0] - 1, y1 + h + 5)
            sample_y2 = min(gray.shape[0], sample_y1 + 20)
            skin_roi = gray[sample_y1:sample_y2, x1:x2]
            skin_val = np.mean(skin_roi) if skin_roi.size > 0 else dark_val

            norm_index = dark_val / skin_val if skin_val != 0 else 0
            final_score = convert_to_score(norm_index)
            status = "success"

            _, buffer = cv2.imencode('.jpg', image)
            encoded_image = base64.b64encode(buffer).decode('utf-8')
            break

    return {
        "status": status,
        "dark_circle_score": final_score,
        "result_image": f"data:image/jpeg;base64,{encoded_image}"
    }

# ML 수면 예측
@app.post("/predict/ml")
async def predict_ml(
    workout : float = Form(...),
    phone   : float = Form(...),
    work    : float = Form(...),
    caffeine: float = Form(...),
    relax   : float = Form(...)
):
    df = pd.DataFrame([{
        'WorkoutTime'   : workout,
        'PhoneTime'     : phone,
        'WorkHours'     : work,
        'CaffeineIntake': caffeine,
        'RelaxationTime': relax
    }])

    pred_hours = round(float(ml_model.predict(df)[0]), 1)

    return {
        "status"               : "success",
        "predicted_sleep_hours": pred_hours,
        "message"              : "생활 데이터 기반 수면 분석 완료"
    }
