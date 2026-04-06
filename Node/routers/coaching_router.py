from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, Any

router = APIRouter()

# 노드에서 보낼 데이터 규격 (오늘/어제 데이터 포함)
class SleepData(BaseModel):
    sleep_hours: float
    caffeine: float
    work_hours: float
    phone_hours: float
    exec_hours: float
    fatigue_reason: str
    analysis_result: str

class AnalysisRequest(BaseModel):
    user_idx: int
    today: SleepData
    yesterday: Optional[SleepData] = None

@router.post("/coaching")
async def gpt_coaching(data: AnalysisRequest):
    print("\n" + "="*60)
    print(f"🚀 [GPT 코칭 요청 수신] 유저번호: {data.user_idx}")
    print(f"📊 오늘 수면: {data.today.sleep_hours}h | 카페인: {data.today.caffeine}mg")
    if data.yesterday:
        print(f"📊 어제 수면: {data.yesterday.sleep_hours}h | 카페인: {data.yesterday.caffeine}mg")
    print("="*60 + "\n")

    try:
        from services.llm_service import get_sleep_analysis
        # 데이터 객체를 dict로 변환하여 전달
        result = get_sleep_analysis(data.model_dump())
        return {
            "status": "success", 
            "solutions": result.get("solutions", []),
            "analysis": result.get("analysis", "")
        }
    except Exception as e:
        print(f"❌ GPT 호출 중 에러 발생: {e}")
        return {"status": "error", "message": str(e)}
