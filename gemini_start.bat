@echo off
setlocal
:: UTF-8 인코딩 설정 (한글 깨짐 방지)
chcp 65001 >nul
title 🚑 수면구조대 2 (Sleep Rescue 2) - Gemini CLI AI-Agent

:: 1. 현재 폴더로 이동 (프로젝트 루트 보장)
cd /d "%~dp0"

echo ======================================================
echo   🚑 수면구조대 2 (Sleep Rescue 2) AI 개발 허브
echo   - GEMINI.md 지침 로드 완료
echo   - 바이브 코딩 (Vibe Coding) 활성화
echo ======================================================
echo.

:: 2. Conda 가상환경 활성화 (sleep_rescue)
:: Anaconda 설치 경로가 표준인 경우를 대비하여 여러 경로를 체크합니다.
set CONDA_ACTIVATE_PATH=C:\Users\SMHRD-\anaconda3\Scripts\activate.bat

if exist "%CONDA_ACTIVATE_PATH%" (
    echo [환경] 가상환경(sleep_rescue)을 활성화합니다...
    call "%CONDA_ACTIVATE_PATH%" sleep_rescue
) else (
    echo [경고] Conda 활성화 파일을 찾을 수 없습니다. 기본 환경에서 계속합니다.
)

echo.
echo [준비] 제미나이 AI 에이전트가 연결되었습니다.
echo 💡 팁: "프로젝트 현황 요약해줘" 또는 "분석 결과 화면 수정해줘"라고 입력해 보세요.
echo.

:: 3. 제미나이 CLI 실행 (현재 프로젝트 폴더 컨텍스트 유지)
:: cmd /k 를 사용하여 gemini 실행 후에도 세션이 유지되게 함
:: gemini 명령어는 현재 폴더의 GEMINI.md를 자동으로 인식합니다.
cmd /k "gemini"

endlocal
