from fastapi import FastAPI, File, UploadFile, Form
from ultralytics import YOLO
import joblib
import pandas as pd
import io
from PIL import Image
import numpy as np
import cv2

app = FastAPI()

# 1. 두 모델 모두 로드
yolo_model = YOLO("models/YOLO/best.pt")
ml_model = joblib.load("models/Sleep_XGBoost(ML)/sleep_xgb_model.pkl")

# --- [방법 A] YOLO: 다크서클 분석 ---
@app.post("/predict/yolo")
async def predict_yolo(file: UploadFile = File(...)):
    # (위에서 짠 다크서클 밝기 계산 로직 그대로 입력)
    return {"status": "success", "dark_circle_score": 85.2}

# --- [방법 B] ML: 수면 시간 및 점수 예측 ---
@app.post("/predict/ml")
async def predict_ml(
    workout: float = Form(...), 
    phone: float = Form(...), 
    work: float = Form(...), 
    caffeine: float = Form(...), 
    relax: float = Form(...)
):
    # 팀원들이 입력한 데이터를 데이터프레임으로 변환
    df = pd.DataFrame([{
        'WorkoutTime': workout, 
        'PhoneTime': phone, 
        'WorkHours': work, 
        'CaffeineIntake': caffeine, 
        'RelaxationTime': relax
    }])
    
    # XGBoost 예측 실행
    pred_hours = round(float(ml_model.predict(df)[0]), 1)
    
    return {
        "status": "success",
        "predicted_sleep_hours": pred_hours,
        "message": "생활 데이터 기반 수면 분석 완료"
    }