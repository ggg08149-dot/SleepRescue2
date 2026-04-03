const planModel = require('../models/planModel');

/**
 * [Member A - Backend] API 로직 컨트롤러 최종본
 */

// 1. 플랜 시작하기
exports.startNewPlan = (req, res) => {
  const { plan_type } = req.body;
  const user_idx = req.user.id;

  planModel.createPlan(user_idx, plan_type, (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "플랜 시작 실패" });
    res.json({ success: true, message: `${plan_type}일 코칭 플랜이 시작되었습니다.` });
  });
};

// 2. 현재 사용자의 활성화된 플랜 정보 및 오늘 일차(Day N) 조회
exports.getPlanStatus = (req, res) => {
  const user_idx = req.user.id;

  planModel.getActivePlanWithDay(user_idx, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: "플랜 상태 조회 실패" });
    if (results.length === 0) return res.json({ success: false, hasActivePlan: false });

    const plan = results[0];
    res.json({
      success: true,
      hasActivePlan: true,
      plan_idx: plan.plan_idx,
      plan_type: plan.plan_type,
      current_day_number: plan.current_day_number,
      start_date: plan.start_date
    });
  });
};

// 3. 오늘의 미션 가져오기 (날짜 가드 로직 포함)
exports.getDailyMissions = (req, res) => {
  const user_idx = req.user.id;
  const requestedDay = parseInt(req.params.day);

  planModel.getActivePlanWithDay(user_idx, (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ success: false, message: "활성화된 플랜이 없습니다." });

    const plan = results[0];
    const currentDay = plan.current_day_number;

    // 가드 로직: 미래 일차 조회 시 차단
    if (requestedDay > currentDay) {
      return res.status(403).json({ 
        success: false, 
        message: "내일의 솔루션은 내일 분석 후 공개됩니다!",
        isLocked: true 
      });
    }

    planModel.getMissionsByDay(plan.plan_idx, requestedDay, (err, missions) => {
      if (err) return res.status(500).json({ success: false, message: "미션 조회 실패" });
      res.json({ 
        success: true, 
        day_number: requestedDay, 
        current_day: currentDay, 
        missions: missions 
      });
    });
  });
};

// 4. 미션 완료 체크 상태 변경
exports.toggleMissionCheck = (req, res) => {
  const { detail_idx, is_completed } = req.body;

  planModel.updateMissionStatus(detail_idx, is_completed ? 1 : 0, (err) => {
    if (err) return res.status(500).json({ success: false, message: "상태 업데이트 실패" });
    res.json({ success: true });
  });
};
