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
        당신은 수면 과학 전문가입니다. 반드시 제공된 [사용자 데이터]의 '숫자'를 근거로 분석하세요.
        
        [사용자 데이터]
        {user_data}
        
        [출력 규칙 - 반드시 지킬 것]
        1. 반드시 구체적인 해결책 5가지를 리스트 형태로 제안하세요.
        2. 모든 답변은 한국어로 작성하세요.
        3. 각 해결책은 1~2문장의 간결하고 명확한 문장이어야 합니다.
        4. 해결책 내에 데이터에 나온 수치(시간, mg 등)를 반드시 직접 언급하세요.
        5. 결과는 반드시 지정된 JSON 형식으로만 출력하세요.

        [데이터 해석 가이드라인]
        - 운동 시간이 0보다 크면 무조건 칭찬부터 하세요.
        - 근무 시간이 9시간 이상이면 과도한 업무임을 지적하세요.
        - 스마트폰 사용 시간이 5시간 이상이면 강력하게 경고하세요.
        - 카페인이 0mg이면 카페인 대신 다른 수면 방해 요인에 집중하세요.
        
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