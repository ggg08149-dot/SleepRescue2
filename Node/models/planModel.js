const db = require('../config/db');

/**
 * [Member A - Backend] MySQL 연동 핵심 모델
 */

// 1. 새로운 플랜 시작 (tb_plan)
exports.createPlan = (user_idx, plan_type, cb) => {
  const sql = `INSERT INTO tb_plan (user_idx, plan_type, start_date) VALUES (?, ?, NOW())`;
  db.query(sql, [user_idx, plan_type], cb);
};

// 2. 사용자의 현재 활성 플랜 및 경과 일수(day_number) 계산
// DATEDIFF를 사용하여 서버 시간 기준으로 오늘이 몇 일차인지 정확히 계산합니다.
exports.getActivePlanWithDay = (user_idx, cb) => {
  const sql = `
    SELECT *, 
    (DATEDIFF(NOW(), start_date) + 1) as current_day_number 
    FROM tb_plan 
    WHERE user_idx = ? 
    ORDER BY start_date DESC 
    LIMIT 1
  `;
  db.query(sql, [user_idx], cb);
};

// 3. 해당 일차의 미션 목록 조회 (tb_plan_detail)
exports.getMissionsByDay = (plan_idx, day_number, cb) => {
  const sql = `SELECT * FROM tb_plan_detail WHERE plan_idx = ? AND day_number = ?`;
  db.query(sql, [plan_idx, day_number], cb);
};

// 4. AI 솔루션을 DB에 저장 (오늘의 미션 생성)
exports.saveDailyMissions = (plan_idx, user_idx, day_number, missions, cb) => {
  // 기존에 해당 일차 데이터가 있으면 삭제 후 재삽입 (중복 방지)
  db.query('DELETE FROM tb_plan_detail WHERE plan_idx = ? AND day_number = ?', [plan_idx, day_number], (err) => {
    if (err) return cb(err);
    
    // missions 배열을 DB 규격에 맞춰 변환 [[plan_idx, user_idx, day_number, task], ...]
    const values = missions.map(task => [plan_idx, user_idx, day_number, task, 0]);
    const insertSql = `INSERT INTO tb_plan_detail (plan_idx, user_idx, day_number, plan_task, is_completed) VALUES ?`;
    db.query(insertSql, [values], cb);
  });
};

// 5. 미션 완료 상태 토글
exports.updateMissionStatus = (detail_idx, is_completed, cb) => {
  const sql = `UPDATE tb_plan_detail SET is_completed = ? WHERE detail_idx = ?`;
  db.query(sql, [is_completed, detail_idx], cb);
};
