# 하위 호환 진입점 — uvicorn main:app --port 8000 도 동작합니다.
# 실제 앱 코드는 fastapi_server.py 에 있습니다.
from fastapi_server import app  # noqa: F401
