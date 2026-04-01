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
    1. 첫 문장은 어제보다 개선된 수치(카페인 감소, 수면 증가 등)를 찾아 무조건 적극적으로 칭찬하며 시작하세요.
    2. 사용자의 피로 원인({t_reason})을 분석에 반영하세요.
    3. 구체적인 수치(카페인 {t_caffeine}mg, 수면 {t_sleep}시간 등)를 직접 언급하여 설득력을 높이세요.
    4. "수면이 3.5시간입니다"라는 결과 나열 대신, "어제보다 2.5시간 줄어들었네요"처럼 {today}와 {yesterday}의 '차이값'을 언급하세요.
    5. {t_reason}이 '운동/근무'라면 "정말 고생 많으셨어요, 활동량이 많았던 만큼 깊은 휴식이 필요해 보여요", '스마트폰/카페인'이라면 "뇌와 눈이 잠시 쉬고 싶어 할 것 같아요"라고 상황에 공감하세요.
    6. "아쉽습니다", "악화되었습니다" 대신 "~가 숙면을 방해했을 수 있어요" 또는 "~에 조금 더 신경 써볼까요?"라고 표현하세요.
    7. 전체 분석 코멘트는 지친 유저가 한눈에 읽기 좋게 최대 5~6문장 이내로 작성하세요.
    8. 오늘의 미션 5가지는 멜라토닌 영양제, 온열 안대, 타트체리 주스, 4-7-8 호흡법 등 아주 구체적인 행동을 포함하세요.
    9. 어제 데이터가 없다면 오늘 데이터를 기준으로 다정한 첫 가이드를 제공하세요
    10. '어제보다 2.5시간 줄었네요'**와 같이 변화량만 간결하게 언급하여 유저가 변화를 즉각 체감하게 하세요.
    11. 분석 문구에는 가장 큰 변화가 있었던 항목 또는 피로의 결정적 원인({t_reason})으로 지목한 항목 딱 1~2개에 대해서만 구체적인 수치를 언급하세요.
      그 외의 관련 없는 데이터(예: 수면이 문제인데 굳이 언급하는 운동 시간 등)는 문장에서 과감히 삭제하여 가독성을 높이세요.
    12. 모든 응답은 반드시 JSON 형식으로만 작성해. 서론이나 결론, 부연 설명은 절대 포함하지 마. Markdown 코드 블록(```json)도 제외하고 오직 순수 JSON 데이터만 출력하세요.
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
