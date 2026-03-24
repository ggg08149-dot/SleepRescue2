from ultralytics import YOLO
import os

# 1. 모델 경로 설정 (Node 폴더 기준)
model_path = os.path.join('models', 'YOLO', 'best.pt')

try:
    # 2. 모델 불러오기
    model = YOLO(model_path)
    print("✅ 성공: 모델을 정상적으로 불러왔습니다!")
    
    # 3. 모델 정보 살짝 보기
    print(f"모델 타입: {type(model)}")
    
except Exception as e:
    print(f"❌ 실패: 경로를 확인하세요. 에러내용: {e}")