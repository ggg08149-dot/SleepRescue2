# sleep_xgb_api.py
import sys
import json
import joblib
import numpy as np
import os
import math

# =====================================================
# 점수 계산 함수들 (네가 만든 함수 그대로 사용)
# =====================================================

def get_asymmetric_sleep_score_v2(predicted_hours):
    """예측 수면시간을 점수로 변환 (0~100점)"""
    target = 7.5
    
    # 수면 부족은 피로도, 집중력 저하, 다크서클 악화에 직접적 영향이 크므로 엄격하게 반영
    # 수면 과다(9~10시간)는 부족에 비해 건강 위험도가 상대적으로 낮고, 일시적 과수면은 회복 과정일 수 있어 관대하게 적용
    # 11시간 이상의 장시간 수면은 점차 감점하여 과수면 문제도 완전히 무시하지 않음
    
    sigma_before = 1.8   # 7.5시간 이전
    sigma_after = 4.2    # 7.5시간 이후
    
    if predicted_hours <= target:
        score = 100 * math.exp(-((predicted_hours - target)**2) / (2 * (sigma_before**2)))
    else:
        score = 100 * math.exp(-((predicted_hours - target)**2) / (2 * (sigma_after**2)))
    
    return round(score, 1)


def get_final_sleep_score(workout, phone, work_hours, caffeine, relaxation, predicted_hours):
    """
    생활패턴 기반 최종 수면 점수 계산
    
    가중치 구성:
     - 수면예상점수: 40% (ML로 예측한 수면시간을 점수화)
     - 운동: 10% (양의 상관관계 - 적당한 운동이 수면에 도움)
     - 핸드폰: 10% (음의 상관관계 - 사용시간이 적을수록 좋음)
     - 근무: 20% (음의 상관관계 - 근무시간이 적을수록 좋음)
     - 카페인: 10% (음의 상관관계 - 섭취량이 적을수록 좋음)
     - 휴식: 10% (양의 상관관계 - 충분한 휴식이 수면에 도움)
    """
    
    # ===== 1단계: 수면예상점수 계산 (40%) =====
    sleep_score = get_asymmetric_sleep_score_v2(predicted_hours)
    
    # ===== 2단계: 운동 점수 (10%) =====
    if workout <= 0.5:
        workout_score = 100 * (workout / 0.5)
    elif workout <= 1.5:
        workout_score = 100
    else:
        workout_score = 100 * max(0, 1 - (workout - 1.5) * 0.5)
    
    # ===== 3단계: 핸드폰 점수 (10%) =====
    optimal_phone = 1.0
    if phone <= optimal_phone:
        phone_score = 100
    else:
        excess_ratio = (phone - optimal_phone) / optimal_phone
        phone_score = 100 * max(0, 1 - excess_ratio * 0.5)
    
    # ===== 4단계: 근무 점수 (20%) =====
    optimal_work = 6.0
    if work_hours <= optimal_work:
        work_score = 100
    else:
        excess_ratio = (work_hours - optimal_work) / optimal_work
        work_score = 100 * max(0, 1 - excess_ratio * 0.8)
    
    # ===== 5단계: 카페인 점수 (10%) =====
    if caffeine <= 0:
        caffeine_score = 100
    elif caffeine <= 100:
        caffeine_score = 100 - (caffeine * 0.2)
    elif caffeine <= 300:
        caffeine_score = 80 - ((caffeine - 100) * 0.25)
    else:
        caffeine_score = max(0, 30 - ((caffeine - 300) * 0.15))
    
    # ===== 6단계: 휴식 점수 (10%) =====
    if relaxation <= 0.5:
        relax_score = 100 * (relaxation / 0.5)
    elif relaxation <= 2.0:
        relax_score = 100
    else:
        relax_score = 100 * max(0, 1 - (relaxation - 2.0) * 0.3)
    
    # ===== 7단계: 최종 점수 계산 =====
    final_score = (
        sleep_score * 0.4 +
        workout_score * 0.1 +
        phone_score * 0.1 +
        work_score * 0.2 +
        caffeine_score * 0.1 +
        relax_score * 0.1
    )
    
    return {
        'sleep_score': round(float(sleep_score), 1),
        'workout_score': round(float(workout_score), 1),
        'phone_score': round(float(phone_score), 1),
        'work_score': round(float(work_score), 1),
        'caffeine_score': round(float(caffeine_score), 1),
        'relax_score': round(float(relax_score), 1),
        'final_score': round(float(final_score), 1)
    }


def get_sleep_status(score):
    """점수에 따른 상태 메시지"""
    if score >= 90:
        status = "✨ 최고"
        description = "완벽한 생활패턴! 지금처럼만 유지하세요."
        emoji = "🏆"
    elif score >= 80:
        status = "🌟 매우 좋음"
        description = "아주 건강한 생활패턴입니다. 조금만 더 개선하면 최고점!"
        emoji = "⭐"
    elif score >= 70:
        status = "👍 좋음"
        description = "건강한 생활패턴을 유지하고 있어요."
        emoji = "😊"
    elif score >= 60:
        status = "👌 양호"
        description = "보통 수준이에요. 개선할 점을 찾아보세요."
        emoji = "🙂"
    elif score >= 50:
        status = "⚠️ 주의"
        description = "생활패턴 개선이 필요합니다."
        emoji = "😐"
    elif score >= 30:
        status = "🔴 경고"
        description = "생활패턴이 좋지 않습니다. 건강을 위해 개선하세요!"
        emoji = "⚠️"
    else:
        status = "💀 위험"
        description = "생활패턴이 매우 위험합니다! 전문가와 상담하세요!"
        emoji = "🚨"
    
    return status, description, emoji


# =====================================================
# 메인 실행
# =====================================================

# 모델 파일 경로
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, 'Sleep_XGBoost(ML)', 'sleep_xgb_model.pkl')

# 모델 로드
try:
    model = joblib.load(model_path)
except Exception as e:
    print(json.dumps({"status": "error", "message": f"모델 로드 실패: {str(e)}"}))
    sys.exit(1)

# 입력값 확인
if len(sys.argv) != 6:
    print(json.dumps({"status": "error", "message": "입력값이 5개 필요합니다. (운동, 핸드폰, 근무, 카페인, 휴식)"}))
    sys.exit(1)

# 입력값 파싱
try:
    workout = float(sys.argv[1])
    phone = float(sys.argv[2])
    work_hours = float(sys.argv[3])
    caffeine = float(sys.argv[4])
    relaxation = float(sys.argv[5])
except:
    print(json.dumps({"status": "error", "message": "입력값 변환 실패. 숫자를 입력해주세요."}))
    sys.exit(1)

# 예측 및 점수 계산
try:
    # ML 모델로 수면시간 예측
    features = np.array([[workout, phone, work_hours, caffeine, relaxation]])
    predicted_hours = model.predict(features)[0]
    predicted_hours = round(float(predicted_hours), 1)
    
    # 점수 계산
    scores = get_final_sleep_score(workout, phone, work_hours, caffeine, relaxation, predicted_hours)
    
    # 상태 메시지
    status, description, emoji = get_sleep_status(scores['final_score'])
    
    # 카페인 잔 수 계산 (아메리카노 120mg 기준)
    americano_cups = caffeine / 120
    
    # 결과 반환
    result = {
        "status": "success",
        "predicted_hours": predicted_hours,
        "input": {
            "workout": workout,
            "phone": phone,
            "work_hours": work_hours,
            "caffeine": caffeine,
            "caffeine_cups": round(americano_cups, 1),
            "relaxation": relaxation
        },
        "scores": {
            "sleep_score": scores['sleep_score'],
            "workout_score": scores['workout_score'],
            "phone_score": scores['phone_score'],
            "work_score": scores['work_score'],
            "caffeine_score": scores['caffeine_score'],
            "relax_score": scores['relax_score'],
            "final_score": scores['final_score']
        },
        "status": {
            "emoji": emoji,
            "title": status,
            "description": description
        }
    }
    print(json.dumps(result, ensure_ascii=False))
    
except Exception as e:
    print(json.dumps({"status": "error", "message": str(e)}))

# 터미널창에 -> python sleep_xgb_api.py 운동시간, 폰 사용시간, 근무시간, 카페인 섭취량, 휴식시간 순으로 데이터값 입력 
# python sleep_xgb_api.py 1.0, 2.0, 3.0, 100, 1.0