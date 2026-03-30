# FastAPI 진입점 — 포트 8000
# 실행: uvicorn fastapi_server:app --reload --port 8000
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.yolo_router import router as yolo_router
from routers.ml_router   import router as ml_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins    = ["http://localhost:5000", "http://127.0.0.1:5000"],
    allow_credentials= True,
    allow_methods    = ["*"],
    allow_headers    = ["*"],
)

app.include_router(yolo_router)
app.include_router(ml_router)
