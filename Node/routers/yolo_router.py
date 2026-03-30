from fastapi import APIRouter, File, UploadFile
from services.yolo_service import run_yolo

router = APIRouter()


@router.post("/predict/darkcircle")
async def predict_darkcircle(file: UploadFile = File(...)):
    print("📸 사진 수신 완료! 다크서클 분석 시작...")
    return await run_yolo(file)
