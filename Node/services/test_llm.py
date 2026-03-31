from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
import os

load_dotenv()

# API 키가 잘 읽히는지 확인
llm = ChatOpenAI(model="gpt-3.5-turbo")
response = llm.invoke("안녕? 너는 누구니?")
print(response.content)
