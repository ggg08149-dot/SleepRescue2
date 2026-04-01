import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List

load_dotenv()

class SleepSolution(BaseModel):
    solutions: List[str] = Field(description="5가지 수면 개선 솔루션 리스트")

def get_sleep_analysis(user_info, plan_days=7):
    llm    = ChatOpenAI(model="gpt-3.5-turbo", temperature=0.7)
    parser = JsonOutputParser(pydantic_object=SleepSolution)

    prompt = ChatPromptTemplate.from_template(
        """
        당신은 수면 과학 전문가이자 라이프 코치입니다.

        아래는 이 사용자의 실제 측정 데이터입니다:
        {user_data}

        위 데이터를 분석하여 이 사용자에게 딱 맞는 수면 개선 솔루션 5가지를 제안해주세요.

        [규칙]
        1. 반드시 위 사용자의 실제 수치를 언급하며 맞춤형으로 작성하세요.
           예) "카페인을 {{caffeine}}mg 섭취했으니 오후 2시 이후 카페인을 끊으세요" 처럼 수치 언급
        2. 구체적인 행동과 제품을 포함하세요 (온열 스팀 안대, 타트체리 주스, 암막 커튼 등)
        3. 각 솔루션은 1-2문장으로 간결하게 작성하세요.
        4. 절대 예시를 그대로 복사하지 마세요. 이 사용자 데이터 기반으로만 작성하세요.

        {format_instructions}
        """
    )

    chain = prompt | llm | parser

    try:
        result = chain.invoke({
            "user_data"           : user_info,
           
            "format_instructions" : parser.get_format_instructions()
        })

        if isinstance(result, dict) and 'solutions' in result:
            return result['solutions']
        elif isinstance(result, list):
            return result
        else:
            return list(result.values())[0] if result else []

    except Exception as e:
        print(f"❌ LLM 오류: {e}")
        return [
            "충분한 휴식을 취하세요.",
            "규칙적인 수면을 하세요.",
            "카페인을 줄이세요.",
            "스마트폰을 멀리하세요.",
            "따뜻한 물로 샤워하세요."
        ]

if __name__ == "__main__":
    sample_data = "수면시간 4시간, 카페인 280mg, 어제 운동 안함, 스마트폰 6시간, 근무 9시간"
    print(get_sleep_analysis(sample_data))
