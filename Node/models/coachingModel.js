const db = require('../config/db');

/**
 * 특정 사용자의 가장 최근 피로도 분석 결과와 라이프로그 데이터를 가져옵니다.
 * @param {number} user_idx - 사용자의 고유 번호
 * @param {function} cb - 콜백 함수 (error, results)
 */
const getLatestSleepData = (user_idx, cb) => {
  // 두 테이블을 JOIN하여 필요한 컬럼만 쏙쏙 골라옵니다.
  const sql = `
    SELECT 
      f.fatigue_reason, 
      f.analysis_result,
      l.exec_hours, 
      l.phone_hours, 
      l.work_hours, 
      l.caffeine, 
      l.sleep_hours
    FROM tb_fatigue f
    JOIN tb_lifelog l ON f.user_idx = l.user_idx
    WHERE f.user_idx = ?
    ORDER BY f.created_at DESC, l.created_at DESC
    LIMIT 1
  `;

  db.query(sql, [user_idx], cb);
};

/**
 * GPT가 생성한 솔루션 5가지를 DB에 저장할 때 사용할 함수 (추후 필요)
 */
const insertCoachingPlan = (planData, cb) => {
  const sql = 'INSERT INTO tb_plan (user_idx, plan_content, created_at) VALUES (?, ?, NOW())';
  db.query(sql, [planData.user_idx, planData.content], cb);
};

module.exports = { 
  getLatestSleepData,
  insertCoachingPlan 
};