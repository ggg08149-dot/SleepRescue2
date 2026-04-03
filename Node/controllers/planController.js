const axios = require('axios');
const planModel = require('../models/planModel');
const coachingModel = require('../models/coachingModel');

/**
 * [Member A - Backend] API 로직 컨트롤러
 */

// 1. 플랜 시작하기 (플랜 레코드 생성 + 1일차 AI 미션 생성)
exports.startNewPlan = (req, res) => {
  const { plan_type } = req.body;
  const user_idx = req.user.id;

  planModel.createPlan(user_idx, plan_type, async (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "플랜 시작 실패" });

    const plan_idx = result.insertId;

    coachingModel.getComparisonData(user_idx, async (err2, rows) => {
      if (err2 || !rows || rows.length === 0) {
        return res.json({ success: true, message: `${plan_type}일 코칭 플랜이 시작되었습니다.` });
      }

      const today = rows[0];
      const yesterday = rows.length > 1 ? rows[1] : null;

      try {
        const pythonResponse = await axios.post('http://localhost:8000/coaching', {
          user_idx,
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

        const { solutions } = pythonResponse.data;

        planModel.saveDailyMissions(plan_idx, user_idx, 1, solutions, (err3) => {
          if (err3) console.error('1일차 미션 저장 실패:', err3.message);
          res.json({ success: true, message: `${plan_type}일 코칭 플랜이 시작되었습니다.` });
        });
      } catch (aiErr) {
        console.error('AI 미션 생성 실패:', aiErr.message);
        res.json({ success: true, message: `${plan_type}일 코칭 플랜이 시작되었습니다.` });
      }
    });
  });
};

// 2. 오늘의 미션 가져오기 (날짜 가드 로직 포함)
exports.getDailyMissions = (req, res) => {
  const user_idx = req.user.id;
  const requestedDay = parseInt(req.params.day);

  planModel.getActivePlanWithDay(user_idx, (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ success: false, message: "활성화된 플랜이 없습니다." });

    const plan = results[0];
    const currentDay = plan.current_day_number;

    // [중요 가드 로직] 요청한 날짜가 오늘보다 미래라면 차단 (안건 4번)
    if (requestedDay > currentDay) {
      return res.status(403).json({ 
        success: false, 
        message: "내일의 솔루션은 내일 분석 후 공개됩니다!",
        isLocked: true 
      });
    }

    // DB에서 해당 일차 미션 조회
    planModel.getMissionsByDay(plan.plan_idx, requestedDay, (err, missions) => {
      if (err) return res.status(500).json({ success: false, message: "미션 조회 실패" });
      
      res.json({ 
        success: true, 
        day_number: requestedDay, 
        current_day: currentDay, // 오늘이 몇 일차인지도 함께 전달
        missions: missions 
      });
    });
  });
};

// 3. 미션 체크 상태 변경
exports.toggleMissionCheck = (req, res) => {
  const { detail_idx, is_completed } = req.body;

  planModel.updateMissionStatus(detail_idx, is_completed ? 1 : 0, (err) => {
    if (err) return res.status(500).json({ success: false, message: "상태 업데이트 실패" });
    res.json({ success: true });
  });
};
