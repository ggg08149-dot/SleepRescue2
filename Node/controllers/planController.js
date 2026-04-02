const planModel = require('../models/planModel');

const savePlan = (req, res) => {
  const { user_idx, plan_type } = req.body;
  if (!user_idx || !plan_type) {
    return res.status(400).json({ success: false, message: 'user_idx, plan_type이 필요합니다.' });
  }

  planModel.insertPlan(user_idx, parseInt(plan_type), (err, plan_idx) => {
    if (err) {
      console.error('❌ 플랜 저장 오류:', err.message);
      return res.status(500).json({ success: false, message: err.message });
    }
    res.json({ success: true, plan_idx });
  });
};

// planController.js 에 추가
const toggleMission = (req, res) => {
  const { detail_idx, is_completed } = req.body; // is_completed는 true(1) 또는 false(0)

  planModel.updateMissionStatus(detail_idx, is_completed ? 1 : 0, (err, result) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true });
  });
};

module.exports = { savePlan, toggleMission };
