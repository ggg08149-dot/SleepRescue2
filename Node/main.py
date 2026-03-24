from fastapi import FastAPI
from ultralytics import YOLO
import os

app = FastAPI()

# 1. 모델 경로 설정 (사용자님 폴더 구조에 맞춤)
# 현재 main.py 위치가 Node/ 라면 아래 경로가 맞을 거예요.
MODEL_PATH = os.path.join("models", "YOLO", "best.pt") # 파일 이름이 'best.pt'가 맞는지 확인!

# 2. YOLO 모델 로드
# 서버가 켜질 때 모델을 미리 메모리에 올려두는 작업입니다.
try:
    model = YOLO(MODEL_PATH)
    print("✅ YOLO 모델 로드 성공!")
except Exception as e:
    print(f"❌ 모델 로드 실패: {e}")

@app.get("/")
def root():
    return {"message": "FastAPI 서버 가동 중!", "model_status": "Loaded" if model else "Failed"}