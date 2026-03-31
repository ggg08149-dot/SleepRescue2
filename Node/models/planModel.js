const db = require('../config/db');

// plan_type별 일별 할 일 목록
const PLAN_TASKS = {
  1: [
    '오늘 밤 10시 이전 취침 / 카페인 섭취 중단 / 10분 명상으로 하루 마무리',
  ],
  7: [
    '취침 시간 1시간 앞당기기',
    '오후 2시 이후 카페인 섭취 금지',
    '취침 전 스마트폰 30분 사용 금지',
    '20분 가벼운 유산소 운동',
    '취침 전 따뜻한 물로 족욕 또는 샤워',
    '낮잠 20분 이내로 제한',
    '수면 패턴 점검 및 7일 루틴 유지',
  ],
  15: [
    '수면 시간 기록 시작',
    '취침 시간 30분 앞당기기',
    '카페인 섭취량 50% 줄이기',
    '취침 전 스트레칭 10분',
    '스마트폰 사용 시간 1시간 줄이기',
    '오후 2시 이후 카페인 완전 금지',
    '1주일 수면 패턴 점검',
    '20분 유산소 운동 시작',
    '취침 1시간 전 블루라이트 차단',
    '규칙적인 기상 시간 설정',
    '수면 환경 개선 (조명, 온도 조절)',
    '명상 또는 호흡법 5분',
    '야식 및 늦은 식사 금지',
    '2주 수면 패턴 비교 분석',
    '건강한 수면 루틴 완성 및 유지 계획 수립',
  ],
};

// tb_plan INSERT → tb_plan_detail 다건 INSERT (트랜잭션)
const insertPlan = (user_idx, plan_type, cb) => {
  const tasks = PLAN_TASKS[plan_type];
  if (!tasks) return cb(new Error('유효하지 않은 plan_type'));

  db.beginTransaction((err) => {
    if (err) return cb(err);

    db.query(
      'INSERT INTO tb_plan (user_idx, plan_type, start_date) VALUES (?, ?, NOW())',
      [user_idx, plan_type],
      (err, result) => {
        if (err) return db.rollback(() => cb(err));

        const plan_idx = result.insertId;
        const detailRows = tasks.map((task, i) => [plan_idx, user_idx, i + 1, task]);

        db.query(
          'INSERT INTO tb_plan_detail (plan_idx, user_idx, day_number, plan_task) VALUES ?',
          [detailRows],
          (err) => {
            if (err) return db.rollback(() => cb(err));

            db.commit((err) => {
              if (err) return db.rollback(() => cb(err));
              cb(null, plan_idx);
            });
          }
        );
      }
    );
  });
};

module.exports = { insertPlan, PLAN_TASKS };
