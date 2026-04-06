const db = require('../config/db');

/**
 * [Member A - Backend] 지능형 통합 모델
 */

// 1. 새로운 플랜 시작
exports.createPlan = (user_idx, plan_type, cb) => {
  const sql = `INSERT INTO tb_plan (user_idx, plan_type, start_date) VALUES (?, ?, NOW())`;
  db.query(sql, [user_idx, plan_type], cb);
};

// 2. 현재 활성 플랜 및 일차(day_number) 계산
exports.getActivePlanWithDay = (user_idx, cb) => {
  const sql = `
    SELECT *, (DATEDIFF(NOW(), start_date) + 1) as current_day_number 
    FROM tb_plan 
    WHERE user_idx = ? AND status = 'active'
    ORDER BY start_date DESC LIMIT 1
  `;
  db.query(sql, [user_idx], cb);
};

// 3. 미션 목록 조회 (is_ai_generated 필드 포함)
exports.getMissionsByDay = (plan_idx, day_number, cb) => {
  const sql = `SELECT * FROM tb_plan_detail WHERE plan_idx = ? AND day_number = ?`;
  db.query(sql, [plan_idx, day_number], cb);
};

// 4. 미션 저장 (AI 여부 태깅 포함)
exports.saveDailyMissions = (plan_idx, user_idx, day_number, missions, isAi, cb) => {
  db.query('DELETE FROM tb_plan_detail WHERE plan_idx = ? AND day_number = ?', [plan_idx, day_number], (err) => {
    if (err) return cb(err);
    const isAiVal = isAi ? 1 : 0;
    const values = missions.map(task => [plan_idx, user_idx, day_number, task, 0, isAiVal]);
    const insertSql = `INSERT INTO tb_plan_detail (plan_idx, user_idx, day_number, plan_task, is_completed, is_ai_generated) VALUES ?`;
    db.query(insertSql, [values], cb);
  });
};

// 5. 미션 완료 상태 업데이트
exports.updateMissionStatus = (detail_idx, is_completed, cb) => {
  const sql = `UPDATE tb_plan_detail SET is_completed = ? WHERE detail_idx = ?`;
  db.query(sql, [is_completed, detail_idx], cb);
};
