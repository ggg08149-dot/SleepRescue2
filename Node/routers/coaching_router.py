from fastapi import APIRouter
from pydantic import BaseModel
from services.llm_service import get_sleep_analysis

router = APIRouter()

# 노드에서 보낼 데이터 규격 (Pydantic 모델)
class AnalysisRequest(BaseModel):
    user_idx: int
    sleep_hours: float
    caffeine: float
    work_hours: float
    phone_hours: float
    exec_hours: float
    fatigue_reason: str
    analysis_result: str

@router.post("/coaching") # 이제 주소는 http://localhost:8000/coaching 이 됩니다.
async def gpt_coaching(data: AnalysisRequest):
    # 💡 여기서 노드가 DB에서 가져온 데이터를 '문장'으로 만듭니다.
    # 이 과정이 있어야 llm_service.py의 {user_data}에 정보가 꽉 차서 들어갑니다.
    user_info_text = f"""
    이 사용자는 어제 {data.sleep_hours}시간 잤습니다. 
    카페인은 {data.caffeine}mg 섭취했고, {data.work_hours}시간 동안 근무했습니다. 
    스마트폰 사용은 {data.phone_hours}시간, 운동은 {data.exec_hours}시간 했습니다. 
    YOLO 분석 결과 다크서클 상태는 '{data.analysis_result}'이며, 
    사용자가 말한 피로 원인은 '{data.fatigue_reason}'입니다.
    """
    
    # 2. llm_service의 함수 호출 (우리가 아까 성공한 그 코드!)
    solutions = get_sleep_analysis(user_info_text)
    
    # 3. 결과 반환
    return {"status": "success", "solutions": solutions}