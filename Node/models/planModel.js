const db = require('../config/db'); // 파일명이 db.js가 맞는지, 경로가 맞는지 꼭 확인!

/**
 * 특정 사용자의 현재 활성화된(가장 최근) 플랜 정보를 가져옵니다.
 */
const getActivePlan = (user_idx, cb) => {
  const sql = `SELECT * FROM tb_plan WHERE user_idx = ? ORDER BY start_date DESC LIMIT 1`;
  db.query(sql, [user_idx], cb);
};

/**
 * 특정 플랜의 특정 일차 미션들을 가져옵니다.
 */
const getDailyMissions = (plan_idx, day_number, cb) => {
  const sql = `SELECT * FROM tb_plan_detail WHERE plan_idx = ? AND day_number = ?`;
  db.query(sql, [plan_idx, day_number], cb);
};

/**
 * [B안: 전체 재설정] 특정 일차의 모든 미션을 삭제하고 새로운 5개 미션으로 교체합니다.
 */

const resetDailyMissions = (plan_idx, user_idx, day_number, newTasks, cb) => {
  db.beginTransaction((err) => {
    if (err) return cb(err);

    // 1. 기존 데이터 삭제 (중복 방지)
    db.query(
      'DELETE FROM tb_plan_detail WHERE plan_idx = ? AND day_number = ?',
      [plan_idx, day_number],
      (err) => {
        if (err) return db.rollback(() => cb(err));

        // 2. 새로운 5개 미션 삽입
        // 각 task(솔루션 문장)를 plan_task 컬럼에 매칭하고, 마지막에 1(plan_type)을 넣습니다.
        const detailRows = newTasks.map((task) => [
            plan_idx,   // plan_idx
            user_idx,   // user_idx
            day_number, // day_number
            task,       // plan_task (여기에 AI 솔루션 문장이 들어감!)
            1           // plan_type (요청하신 대로 1번 타입)
        ]);

        const sql = 'INSERT INTO tb_plan_detail (plan_idx, user_idx, day_number, plan_task, plan_type) VALUES ?';
        
        db.query(sql, [detailRows], (err) => {
          if (err) return db.rollback(() => cb(err));

          db.commit((err) => {
            if (err) return db.rollback(() => cb(err));
            cb(null);
          });
        });
      }
    );
  });
};

/**
 * 새로운 플랜 마스터 정보를 생성합니다.
 */
const insertPlan = (user_idx, plan_content, cb) => {
  // start_date는 DB에서 NOW()로 자동 입력되게 하거나 직접 넣습니다.
  const sql = `INSERT INTO tb_plan (user_idx, plan_content, start_date) VALUES (?, ?, NOW())`;
  db.query(sql, [user_idx, plan_content], cb);
};

/**
 * [A안: 부분 최적화] 완료되지 않은 미션만 선별적으로 교체합니다.
 */
const updateIncompleteMissions = (plan_idx, day_number, newTasks, cb) => {
  // 로직: 미완료 미션 삭제 후 부족한 만큼 삽입 (복잡하므로 우선 단순 삭제/교체 구조 권장)
  // ... 생략 (B안 우선 구현 후 필요시 확장)
};

module.exports = { getActivePlan, getDailyMissions, resetDailyMissions, updateIncompleteMissions, insertPlan };