const axios = require('axios');
const planModel = require('../models/planModel');
const coachingModel = require('../models/coachingModel');

/**
 * [Member A - Backend] 지능형 통합 시작 및 자체 복구 엔진
 */

// 표준 권장 미션 (AI 장애 시 Fallback용)
const FALLBACK_MISSIONS = [
  "오후 2시 이후 카페인 섭취 완전 차단하기",
  "취침 1시간 전 스마트폰 전원 종료하기",
  "침실 온도를 18~20도로 시원하게 유지하기",
  "기상 직후 햇볕 쬐며 가벼운 산책 10분 하기",
  "잠들기 전 4-7-8 호흡법 3회 반복하기"
];

/**
 * ✅ start_date 기준으로 오늘이 몇 일차인지 계산
 * 시작일 = 1일차, 다음날 = 2일차 ...
 * plan_type 초과하지 않도록 clamp
 */
function calcCurrentDay(start_date, plan_type) {
  if (!start_date) return 1;
  const start = new Date(start_date);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const elapsed = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
  return Math.min(Math.max(elapsed, 1), plan_type);
}

// 1. 플랜 시작하기 (통합 로직)
exports.startNewPlan = (req, res) => {
  const { plan_type } = req.body;
  const user_idx = req.user.id;

  planModel.createPlan(user_idx, plan_type, async (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "플랜 시작 실패" });
    const plan_idx = result.insertId;

    coachingModel.getComparisonData(user_idx, async (err2, rows) => {
      let solutions = FALLBACK_MISSIONS;
      let isAi = false;

      if (!err2 && rows && rows.length > 0) {
        try {
          const pythonResponse = await axios.post('http://localhost:8000/coaching', {
            user_idx,
            today: rows[0],
            yesterday: rows.length > 1 ? rows[1] : null
          }, { timeout: 5000 });
          
          if (pythonResponse.data.solutions) {
            solutions = pythonResponse.data.solutions;
            isAi = true;
          }
        } catch (aiErr) {
          console.warn("⚠️ AI 서버 장애로 표준 미션을 제공합니다.");
        }
      }

      planModel.saveDailyMissions(plan_idx, user_idx, 1, solutions, isAi, (err3) => {
        res.json({ success: true, message: isAi ? "AI 맞춤 코칭이 시작되었습니다!" : "표준 수면 케어 코칭이 시작되었습니다." });
      });
    });
  });
};

// 2. 오늘의 미션 가져오기 (지능형 복구 로직 포함)
exports.getDailyMissions = (req, res) => {
  const user_idx = req.user.id;
  const requestedDay = parseInt(req.params.day);

  planModel.getActivePlanWithDay(user_idx, (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ success: false, message: "플랜 정보 없음" });

    const plan = results[0];

    // ✅ 잠금 여부를 DB 값이 아닌 start_date 기준 실시간 계산으로 판단
    const realCurrentDay = calcCurrentDay(plan.start_date, plan.plan_type);

    if (requestedDay > realCurrentDay) {
      return res.status(403).json({ success: false, isLocked: true });
    }

    planModel.getMissionsByDay(plan.plan_idx, requestedDay, async (err2, missions) => {
      const needsUpgrade = missions.length > 0 && missions[0].is_ai_generated === 0 && missions.every(m => m.is_completed === 0);

      if (needsUpgrade) {
        coachingModel.getComparisonData(user_idx, async (err3, rows) => {
          if (!err3 && rows && rows.length > 0) {
            try {
              const pyRes = await axios.post('http://localhost:8000/coaching', { user_idx, today: rows[0], yesterday: rows[1] }, { timeout: 3000 });
              if (pyRes.data.solutions) {
                planModel.saveDailyMissions(plan.plan_idx, user_idx, requestedDay, pyRes.data.solutions, true, () => {
                  planModel.getMissionsByDay(plan.plan_idx, requestedDay, (err4, newMissions) => {
                    res.json({ success: true, day_number: requestedDay, missions: newMissions, upgraded: true });
                  });
                });
                return;
              }
            } catch (e) { /* 무시하고 기존 미션 반환 */ }
          }
          res.json({ success: true, day_number: requestedDay, missions });
        });
      } else {
        res.json({ success: true, day_number: requestedDay, missions });
      }
    });
  });
};

// 3. 플랜 상태 조회
exports.getPlanStatus = (req, res) => {
  planModel.getActivePlanWithDay(req.user.id, (err, r) => {
    if (err || r.length === 0) return res.json({ hasActivePlan: false });

    const plan = r[0];

    // ✅ start_date 기준으로 current_day_number 실시간 계산
    const current_day_number = calcCurrentDay(plan.start_date, plan.plan_type);

    res.json({
      success: true,
      hasActivePlan: true,
      plan_type: plan.plan_type,
      current_day_number,          // ← 계산된 값 반환
      start_date: plan.start_date, // ← 프론트 참고용
    });
  });
};

// 4. 미션 체크/해제
exports.toggleMissionCheck = (req, res) => {
  const { detail_idx, is_completed } = req.body;
  planModel.updateMissionStatus(detail_idx, is_completed ? 1 : 0, (err) => res.json({ success: !err }));
};
