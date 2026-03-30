import os
from ultralytics import YOLO
import joblib

# Node/ 디렉토리 기준 절대 경로
_node_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

yolo_model = None
ml_model   = None

try:
    yolo_model = YOLO(os.path.join(_node_dir, "models", "YOLO", "best.pt"))
    print("✅ YOLO 모델 로드 성공")
except Exception as e:
    print(f"❌ YOLO 모델 로드 실패: {e}")

try:
    ml_model = joblib.load(os.path.join(_node_dir, "models", "Sleep_XGBoost(ML)", "sleep_xgb_model.pkl"))
    print("✅ ML 모델 로드 성공")
except Exception as e:
    print(f"❌ ML 모델 로드 실패: {e}")
