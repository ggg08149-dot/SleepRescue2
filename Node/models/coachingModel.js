const db = require('../config/db');

const coachingModel = {
  /**
   * 사용자의 가장 최근 수면 데이터와 분석 결과를 JOIN해서 가져옵니다.
   * 사진으로 확인한 tb_fatigue의 lifelog_idx 구조를 반영했습니다.
   */
  getLatestSleepData: (user_idx, callback) => {
    const query = `
      SELECT 
        L.*, 
        F.fatigue_reason, 
        F.analysis_result 
      FROM tb_lifelog L
      LEFT JOIN tb_fatigue F ON L.lifelog_idx = F.lifelog_idx
      WHERE L.user_idx = ?
      ORDER BY L.created_at DESC
      LIMIT 1
    `;
    db.query(query, [user_idx], callback);
  },

  /**
   * (기존에 있던 함수 유지) GPT 솔루션을 저장할 때 사용
   */
  insertCoachingPlan: (planData, cb) => {
    const sql = 'INSERT INTO tb_plan (user_idx, plan_content, created_at) VALUES (?, ?, NOW())';
    db.query(sql, [planData.user_idx, planData.content], cb);
  }
};

module.exports = coachingModel;