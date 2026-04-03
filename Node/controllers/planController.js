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

// 1. 플랜 시작하기 (통합 로직)
exports.startNewPlan = (req, res) => {
  const { plan_type } = req.body;
  const user_idx = req.user.id;

  // 1. 플랜 레코드 생성
  planModel.createPlan(user_idx, plan_type, async (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "플랜 시작 실패" });
    const plan_idx = result.insertId;

    // 2. AI 분석 시도
    coachingModel.getComparisonData(user_idx, async (err2, rows) => {
      let solutions = FALLBACK_MISSIONS;
      let isAi = false;

      if (!err2 && rows && rows.length > 0) {
        try {
          const pythonResponse = await axios.post('http://localhost:8000/coaching', {
            user_idx,
            today: rows[0],
            yesterday: rows.length > 1 ? rows[1] : null
          }, { timeout: 5000 }); // 5초 타임아웃
          
          if (pythonResponse.data.solutions) {
            solutions = pythonResponse.data.solutions;
            isAi = true;
          }
        } catch (aiErr) {
          console.warn("⚠️ AI 서버 장애로 표준 미션을 제공합니다.");
        }
      }

      // 3. 1일차 미션 저장
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
    if (requestedDay > plan.current_day_number) {
      return res.status(403).json({ success: false, isLocked: true });
    }

    planModel.getMissionsByDay(plan.plan_idx, requestedDay, async (err2, missions) => {
      // [지능형 자체 복구] 기본 미션이고, 수행한 게 하나도 없다면 AI 업그레이드 시도
      const needsUpgrade = missions.length > 0 && missions[0].is_ai_generated === 0 && missions.every(m => m.is_completed === 0);

      if (needsUpgrade) {
        coachingModel.getComparisonData(user_idx, async (err3, rows) => {
          if (!err3 && rows && rows.length > 0) {
            try {
              const pyRes = await axios.post('http://localhost:8000/coaching', { user_idx, today: rows[0], yesterday: rows[1] }, { timeout: 3000 });
              if (pyRes.data.solutions) {
                // 새로운 AI 미션으로 교체
                planModel.saveDailyMissions(plan.plan_idx, user_idx, requestedDay, pyRes.data.solutions, true, () => {
                  // 교체된 미션 다시 조회하여 반환
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

exports.getPlanStatus = (req, res) => {
  planModel.getActivePlanWithDay(req.user.id, (err, r) => {
    if (err || r.length === 0) return res.json({ hasActivePlan: false });
    res.json({ success: true, hasActivePlan: true, plan_type: r[0].plan_type, current_day_number: r[0].current_day_number });
  });
};

exports.toggleMissionCheck = (req, res) => {
  const { detail_idx, is_completed } = req.body;
  planModel.updateMissionStatus(detail_idx, is_completed ? 1 : 0, (err) => res.json({ success: !err }));
};
