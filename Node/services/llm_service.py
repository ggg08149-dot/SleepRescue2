import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List
import pymysql

# 1. 환경 변수 로드
load_dotenv()

# 2. GPT가 응답할 '그릇' 정의 (5가지 솔루션 리스트)
class SleepSolution(BaseModel):
    solutions: List[str] = Field(description="5가지 수면 개선 솔루션 리스트")

def get_sleep_analysis(user_info):
    """
    사용자 데이터를 받아 GPT에게 분석을 요청하고 5가지 대안을 반환합니다.
    user_info 예시: {"sleep_time": 5, "caffeine": 300, "fatigue_score": 85, ...}
    """
    # 모델 설정 (가성비와 속도가 좋은 3.5-turbo)
    llm = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.7)
    
    # JSON 형식으로 결과물을 받기 위한 파서
    parser = JsonOutputParser(pydantic_object=SleepSolution)

    # 3. 프롬프트 설계
    prompt = ChatPromptTemplate.from_template(
        """
        당신은 수면 과학 전문가이자 라이프 코치입니다.
        사용자의 데이터({user_data})를 바탕으로 {plan_days}일 동안의 수면 개선 플랜을 세워주세요.

        [미션 생성 규칙]
        1. 하루에 5개의 구체적인 미션을 제안하세요.
        2. 전문적인 도구와 구체적 행동을 포함하세요:
        - (수면) 멜라토닌 영양제 섭취, 암막 커튼 설치, 온열 스팀 안대 착용. 등.
        - (음료) 커피 대신 타트체리 주스, 카모마일 티, 대추차 추천. 등.
        - (운동) 저녁 7시 전 30분 러닝, 가벼운 필라테스 스트레칭, 요가 소머리 자세. 등.
        - (환경) 침실 온도 18-22도 유지, 화이트 노이즈(빗소리) 청취. 등.
        3. 일차별로 점진적인 변화를 주어야 합니다 (Day 1은 환경 차단, Day 2는 이완 등).

        [출력 형식 - 반드시 JSON 배열로 응답]
        [
        {{"day": 1, "tasks": ["오후 2시 이후 타트체리 주스 마시기", "취침 전 온열 스팀 안대 10분 착용", ...]}},
        {{"day": 2, "tasks": [...]}}
        ]
        """
    )

    # 4. 체인 구성 (프롬프트 -> 모델 -> 파서)
    chain = prompt | llm | parser

    try:
        # 실행
        result = chain.invoke({
            "user_data": user_info,
            "format_instructions": parser.get_format_instructions()
        })
        return result['solutions'] # 5개의 문자열 리스트 반환
    except Exception as e:
        print(f"LLM 분석 중 오류 발생: {e}")
        return ["충분한 휴식을 취하세요.", "규칙적인 수면을 하세요.", "카페인을 줄이세요.", "스마트폰을 멀리하세요.", "따뜻한 물로 샤워하세요."]

# --- 아래는 직접 실행 테스트용 ---
if __name__ == "__main__":
    sample_data = "수면시간 4시간, 카페인 2잔, 어제 운동 안함, 현재 매우 피곤함"
    print(get_sleep_analysis(sample_data))