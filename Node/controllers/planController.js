const planModel = require('../models/planModel');

/**
 * 팀원 A(백엔드)가 이 파일의 내부 로직을 완성하면 됩니다.
 */

// 1. 플랜 시작 및 1일차 미션 생성
exports.startNewPlan = (req, res) => {
  const { plan_type } = req.body;
  const user_idx = req.user.id;
  
  // TODO: tb_plan에 시작일 저장 + 1일차 AI 미션 tb_plan_detail에 생성
  res.json({ success: true, message: "1일차 플랜이 시작되었습니다." });
};

// 2. 해당 일차의 미션 리스트 조회
exports.getDailyMissions = (req, res) => {
  const { day } = req.params;
  const user_idx = req.user.id;

  // TODO: DB에서 day_number가 일치하는 미션들 조회
  res.json({ success: true, day_number: day, missions: [] });
};

// 3. 미션 체크 상태 변경
exports.toggleMissionCheck = (req, res) => {
  const { detail_idx, is_completed } = req.body;

  // TODO: tb_plan_detail의 is_completed 업데이트
  res.json({ success: true });
};
