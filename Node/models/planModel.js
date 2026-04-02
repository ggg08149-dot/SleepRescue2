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

    // 1. 기존 오늘 일차 미션 삭제
    db.query(
      'DELETE FROM tb_plan_detail WHERE plan_idx = ? AND day_number = ?',
      [plan_idx, day_number],
      (err) => {
        if (err) return db.rollback(() => cb(err));

        // 2. 새로운 5개 미션 삽입
        const detailRows = newTasks.map((task) => [plan_idx, user_idx, day_number, task]);
        db.query(
          'INSERT INTO tb_plan_detail (plan_idx, user_idx, day_number, plan_task) VALUES ?',
          [detailRows],
          (err) => {
            if (err) return db.rollback(() => cb(err));

            db.commit((err) => {
              if (err) return db.rollback(() => cb(err));
              cb(null);
            });
          }
        );
      }
    );
  });
};

/**
 * [A안: 부분 최적화] 완료되지 않은 미션만 선별적으로 교체합니다.
 */
const updateIncompleteMissions = (plan_idx, day_number, newTasks, cb) => {
  // 로직: 미완료 미션 삭제 후 부족한 만큼 삽입 (복잡하므로 우선 단순 삭제/교체 구조 권장)
  // ... 생략 (B안 우선 구현 후 필요시 확장)
};

module.exports = { getActivePlan, getDailyMissions, resetDailyMissions, updateIncompleteMissions };