const coachingModel = require('../models/coachingModel');
const planModel = require('../models/planModel'); // 플랜 모델 추가
const axios = require('axios');

const getGptCoaching = (req, res) => {
  let user_idx = req.user?.id || req.body?.user_idx;

  if (!user_idx) {
    return res.status(401).json({ success: false, message: "사용자 인증 정보가 없습니다." });
  }

  // 1. 최근 2건의 피로도 분석 데이터를 가져와 비교 (Delta 계산용)
  coachingModel.getComparisonData(user_idx, async (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "DB 조회 오류" });

    if (!result || result.length === 0) {
      return res.status(404).json({ success: false, message: "분석할 데이터가 없습니다." });
    }

    const today = result[0];
    const yesterday = result.length > 1 ? result[1] : null;

    // 델타 점수 계산 (피로도 점수 차이)
    const today_score = parseFloat(today.fatigue_score || 0);
    const yesterday_score = yesterday ? parseFloat(yesterday.fatigue_score || 0) : today_score;
    const delta = Math.abs(today_score - yesterday_score);
    const is_critical = delta >= 15; // 15점 이상 차이 나면 Critical로 간주

    try {
      // 2. FastAPI 호출 (비교 분석 및 미션 생성)
      const pythonResponse = await axios.post('http://localhost:8000/coaching', {
        user_idx: user_idx,
        today: {
          sleep_hours: today.sleep_hours || 0,
          caffeine: today.caffeine || 0,
          work_hours: today.work_hours || 0,
          phone_hours: today.phone_hours || 0,
          exec_hours: today.exec_hours || 0,
          fatigue_reason: today.fatigue_reason || "기록 없음",
          analysis_result: today.analysis_result || "결과 없음"
        },
        yesterday: yesterday ? {
          sleep_hours: yesterday.sleep_hours || 0,
          caffeine: yesterday.caffeine || 0,
          work_hours: yesterday.work_hours || 0,
          phone_hours: yesterday.phone_hours || 0,
          exec_hours: yesterday.exec_hours || 0,
          fatigue_reason: yesterday.fatigue_reason || "기록 없음",
          analysis_result: yesterday.analysis_result || "결과 없음"
        } : null
      });

      const { solutions, analysis } = pythonResponse.data;

      // 3. 응답 반환 (델타 정보와 크리티컬 여부 포함)
      return res.status(200).json({
        success: true,
        solutions,
        comparison_analysis: analysis,
        delta_score: delta.toFixed(1),
        is_critical, // 프론트에서 B안(전체 재설정) 추천 팝업을 띄울 근거
        today_data: today // 최적화 시 참조할 데이터
      });

    } catch (error) {
      console.error("❌ AI 서버 연동 실패:", error.message);
      return res.status(502).json({ success: false, message: "AI 서버 연동 실패" });
    }
  });
};

/**
 * [추가] 사용자가 '재측정 결과 반영(B안)'을 승인했을 때 호출되는 API
 */
const applyOptimization = (req, res) => {
  const { user_idx, solutions } = req.body;
  
  // 1. 현재 활성화된 플랜 찾기
  planModel.getActivePlan(user_idx, (err, plan) => {
    if (err || !plan) return res.status(404).json({ success: false, message: "진행 중인 플랜이 없습니다." });

    // 2. 오늘이 몇 일차인지 계산 (단순화: start_date와 현재 차이)
    const start = new Date(plan.start_date);
    const now = new Date();
    const day_number = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;

    // 3. B안 실행: 오늘 일차 미션 전체 교체
    planModel.resetDailyMissions(plan.plan_idx, user_idx, day_number, solutions, (err2) => {
      if (err2) return res.status(500).json({ success: false, message: "플랜 최적화 실패" });
      res.json({ success: true, message: "오늘의 미션이 최신 상태로 재설정되었습니다." });
    });
  });
};

module.exports = { getGptCoaching };