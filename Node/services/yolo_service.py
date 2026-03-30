import numpy as np
import cv2
import base64
from fastapi import UploadFile
from models_loader.loader import yolo_model


def _convert_to_score(ratio: float) -> float:
    """밝기 비율을 0~100 점수로 변환 (Colab 기준 함수)"""
    best, worst = 0.95, 0.70
    score = (ratio - worst) / (best - worst) * 100
    return max(0, min(100, round(score, 1)))


async def run_yolo(file: UploadFile) -> dict:
    """YOLO 다크서클 분석 실행"""
    if yolo_model is None:
        return {"status": "error", "message": "YOLO 모델이 로드되지 않았습니다."}

    contents = await file.read()
    nparr    = np.frombuffer(contents, np.uint8)
    image    = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        return {"status": "error", "message": "이미지를 읽을 수 없습니다."}

    gray    = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    results = yolo_model.predict(image, conf=0.3)

    final_score    = 0
    status         = "not_detected"
    encoded_image  = ""

    for r in results:
        boxes = r.boxes
        if len(boxes) > 0:
            box             = boxes[0]
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            w, h            = x2 - x1, y2 - y1

            # 다크서클 영역 (빨간 박스)
            cv2.rectangle(image, (x1, y1), (x2, y2), (0, 0, 255), 3)
            # 볼 영역 (초록 박스)
            s_y1 = min(image.shape[0] - 1, y1 + h + 5)
            s_y2 = min(image.shape[0], s_y1 + 20)
            cv2.rectangle(image, (x1, s_y1), (x1 + w, s_y2), (0, 255, 0), 3)

            # 다크서클 영역 밝기
            dark_roi  = gray[y1:y2, x1:x2]
            dark_val  = np.mean(dark_roi) if dark_roi.size > 0 else 0

            # 주변 피부 영역 샘플링
            s_y1     = min(gray.shape[0] - 1, y1 + h + 5)
            s_y2     = min(gray.shape[0], s_y1 + 20)
            skin_roi = gray[s_y1:s_y2, x1:x2]
            skin_val = np.mean(skin_roi) if skin_roi.size > 0 else dark_val

            norm_index  = dark_val / skin_val if skin_val != 0 else 0
            final_score = _convert_to_score(norm_index)
            status      = "success"

            _, buffer     = cv2.imencode('.jpg', image)
            encoded_image = base64.b64encode(buffer).decode('utf-8')
            break

    return {
        "status"          : status,
        "dark_circle_score": final_score,
        "result_image"    : f"data:image/jpeg;base64,{encoded_image}",
    }
