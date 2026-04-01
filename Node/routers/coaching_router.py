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
    # 1. [로그 확인] 노드 서버가 데이터를 제대로 보냈는지 터미널에서 확인!
    print("\n" + "="*60)
    print(f"🚀 [GPT 코칭 요청 수신] 유저번호: {data.user_idx}")
    print(f"📊 수면: {data.sleep_hours}h | 카페인: {data.caffeine}mg | 근무: {data.work_hours}h")
    print(f"📱 스마트폰: {data.phone_hours}h | 운동: {data.exec_hours}h")
    print(f"🧐 피로원인: {data.fatigue_reason}")
    print(f"📸 분석결과: {data.analysis_result}")
    print("="*60 + "\n")

    # 2. 💡 여기서 노드가 DB에서 가져온 데이터를 '문장'으로 만듭니다.
    # 이 과정이 있어야 llm_service.py의 {user_data}에 정보가 꽉 차서 들어갑니다.
    user_info_text = f"""
        [현재 사용자의 실제 기록 데이터]
        - 어제 실제 수면 시간: {data.sleep_hours}시간
        - 카페인 섭취량: {data.caffeine}mg
        - 총 근무 시간: {data.work_hours}시간
        - 스마트폰 사용 시간: {data.phone_hours}시간
        - 실제 운동(유산소/근력) 시간: {data.exec_hours}시간
        - AI가 분석한 다크서클 상태: {data.analysis_result}
        - 피로 원인: {data.fatigue_reason}
        """
    
    # 3. [GPT 호출] 완성된 텍스트를 서비스 레이어로 전달
    try:
        solutions = get_sleep_analysis(user_info_text)
        return {"status": "success", "solutions": solutions}
    except Exception as e:
        print(f"❌ GPT 호출 중 에러 발생: {e}")
        return {"status": "error", "message": str(e)}
