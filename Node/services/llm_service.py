import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List

load_dotenv()

class SleepSolution(BaseModel):
    analysis: str = Field(description="어제와 오늘 데이터 비교 분석 내용 (개선된 점이나 주의점)")
    tasks: List[str] = Field(description="오늘 실천해야 할 구체적인 5가지 미션 리스트")

def get_sleep_analysis(data_payload):
    """
    오늘과 어제의 구조화된 데이터를 받아 비교 분석과 맞춤 코칭을 생성합니다.
    """
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)
    parser = JsonOutputParser(pydantic_object=SleepSolution)

    today = data_payload.get("today", {})
    yesterday = data_payload.get("yesterday")

    prompt_text = """
    당신은 수면 과학 전문가이자 라이프 코치입니다.
    사용자의 오늘 데이터({today})와 어제 데이터({yesterday})를 비교하여 수면 개선 분석과 오늘의 미션을 생성해주세요.

    [분석 및 미션 생성 규칙]
    1. 어제 데이터({yesterday})가 있다면 반드시 오늘 데이터와 비교하세요. 
       예: "어제보다 카페인을 100mg 덜 마셨네요!", "어제보다 수면 시간이 1시간 줄어 아쉽습니다." 등.
    2. 어제 데이터가 없다면(신규 유저), 오늘 데이터를 기준으로 첫 가이드를 정중하게 제공하세요.
    3. 구체적인 수치(카페인 {t_caffeine}mg, 수면 {t_sleep}시간 등)를 직접 언급하여 설득력을 높이세요.
    4. 오늘의 미션 5가지는 전문적이고 구체적이어야 합니다:
       - 멜라토닌 영양제, 온열 스팀 안대, 타트체리 주스, 4-7-8 호흡법, 필라테스/러닝 등 구체적 행동 포함.
    5. 사용자의 피로 원인({t_reason})을 분석에 반영하세요.

    {format_instructions}
    """

    prompt = ChatPromptTemplate.from_template(prompt_text)
    chain = prompt | llm | parser

    try:
        result = chain.invoke({
            "today": today,
            "yesterday": yesterday if yesterday else "기록 없음(신규 가입자)",
            "t_caffeine": today.get("caffeine", 0),
            "t_sleep": today.get("sleep_hours", 0),
            "t_reason": today.get("fatigue_reason", "알 수 없음"),
            "format_instructions": parser.get_format_instructions()
        })
        
        return {
            "analysis": result.get("analysis", ""),
            "solutions": result.get("tasks", [])
        }
    except Exception as e:
        print(f"❌ LLM 오류: {e}")
        return {
            "analysis": "데이터 분석 중 오류가 발생했습니다.",
            "solutions": ["충분한 휴식을 취하세요.", "카페인을 줄이세요.", "스마트폰을 멀리하세요.", "규칙적인 수면을 하세요.", "따뜻한 물로 샤워하세요."]
        }

if __name__ == "__main__":
    sample_data = "수면시간 4시간, 카페인 280mg, 어제 운동 안함, 스마트폰 6시간, 근무 9시간"
    print(get_sleep_analysis(sample_data))
