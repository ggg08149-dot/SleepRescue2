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

    # 3. 프롬프트 설계 (팀장님의 노하우가 담길 곳!)
    prompt = ChatPromptTemplate.from_template(
        """
        당신은 수면 과학 전문가입니다. 반드시 제공된 [사용자 데이터]를 근거로 분석하세요.
        아래의 사용자 데이터를 분석하여 이 사용자의 피로를 해소하고 수면의 질을 높일 수 있는 **구체적인 해결책 5가지**를 제안하세요.
        
        [사용자 데이터]
        {user_data}
        
        주의사항:
        1. 반드시 한국어로 답변하세요.
        2. 각 해결책은 1~2문장의 간결하고 명확한 문장이어야 합니다.
        3. 결과는 반드시 지정된 JSON 형식으로만 출력하세요.
        4. "사용자님의 수면 시간이 n시간으로 부족하므로..." 처럼 
          데이터에 나온 수치를 직접 언급하면서 해결책을 제시하세요.
        
        {format_instructions}
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