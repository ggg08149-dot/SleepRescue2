from fastapi import APIRouter
from pydantic import BaseModel
from services.ml_service import predict_lifestyle

router = APIRouter()


class LifestyleInput(BaseModel):
    workout  : float
    phone    : float
    workHours: float
    caffeine : float
    sleepTime: float


@router.post("/predict/ml")
async def predict_lifestyle_route(data: LifestyleInput):
    print("📊 생활패턴 데이터 수신! ML 분석 시작...")
    return predict_lifestyle(
        workout    = data.workout,
        phone      = data.phone,
        work_hours = data.workHours,
        caffeine   = data.caffeine,
        sleep_time = data.sleepTime,
    )
