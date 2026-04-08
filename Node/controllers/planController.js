const axios = require('axios');
const planModel = require('../models/planModel');
const coachingModel = require('../models/coachingModel');

/**
 * [Member A - Backend] 지능형 통합 시작 및 원본 데이터 보존 엔진
 */

const FALLBACK_MISSIONS = [
  "오후 2시 이후 카페인 섭취 완전 차단하기",
  "취침 1시간 전 스마트폰 전원 종료하기",
  "침실 온도를 18~20도로 시원하게 유지하기",
  "기상 직후 햇볕 쬐며 가벼운 산책 10분 하기",
  "잠들기 전 4-7-8 호흡법 3회 반복하기"
];

const FALLBACK_ANALYSIS = "현재 AI 서버와의 연결이 원활하지 않아 수면 구조대의 표준 가이드를 제공해 드립니다. 오늘 밤은 기본에 충실한 수면 습관으로 피로를 관리해 보세요!";

function calcCurrentDay(start_date, plan_type) {
  if (!start_date) return 1;
  const start = new Date(start_date);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const elapsed = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;
  return Math.min(Math.max(elapsed, 1), plan_type);
}

// 1. 플랜 시작하기
exports.startNewPlan = (req, res) => {
  const { plan_type } = req.body;
  const user_idx = req.user.id;

  planModel.createPlan(user_idx, plan_type, async (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "플랜 시작 실패" });
    const plan_idx = result.insertId;

    coachingModel.getComparisonData(user_idx, async (err2, rows) => {
      let solutions = FALLBACK_MISSIONS;
      let analysis = FALLBACK_ANALYSIS;
      let isAi = false;

      if (!err2 && rows && rows.length > 0) {
        try {
          const pyRes = await axios.post('http://localhost:8000/coaching', {
            user_idx,
            today: rows[0],
            yesterday: rows.length > 1 ? rows[1] : null
          }, { timeout: 30000 });
          console.log("🔥 FastAPI 응답:", pyRes.data);
          
          if (pyRes.data && Array.isArray(pyRes.data.solutions)) {
            solutions = pyRes.data.solutions;
            analysis = pyRes.data.analysis; // GPT의 원본 분석글 추출
            isAi = true;
          }
        } catch (aiErr) {
          console.warn("⚠️ AI 서버 장애:", aiErr.message);
        }
      }

      // 1일차 데이터 저장 (원본 분석글 포함)
      planModel.saveDailyMissions(plan_idx, user_idx, 1, solutions, analysis, isAi, (err3) => {
        res.json({ success: true, message: "코칭 플랜이 시작되었습니다!" });
      });
    });
  });
};

// 2. 오늘의 미션 및 원본 분석글 가져오기
exports.getDailyMissions = (req, res) => {
  const user_idx = req.user.id;
  const requestedDay = parseInt(req.params.day);

  planModel.getActivePlanWithDay(user_idx, (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ success: false, message: "플랜 없음" });

    const plan = results[0];

    // ✅ 잠금 여부를 DB 값이 아닌 start_date 기준 실시간 계산으로 판단
    const realCurrentDay = calcCurrentDay(plan.start_date, plan.plan_type);

    if (requestedDay > realCurrentDay) {
      return res.status(403).json({ success: false, isLocked: true });
    }

    planModel.getMissionsByDay(plan.plan_idx, requestedDay, (err2, missions) => {
      if (err2 || missions.length === 0) return res.json({ success: false, message: "미션 없음" });

      // daily_analysis는 모든 행에 동일하게 저장되어 있으므로 첫 번째 행에서 추출
      const dailyAnalysis = missions[0].daily_analysis || "";

      const typedMissions = missions.map((m, i) => ({
        ...m,
        type: i < 3 ? '필수' : i === 3 ? '선택' : '권장',
      }));

      res.json({
        success: true,
        day_number: requestedDay,
        missions: typedMissions,
        daily_analysis: dailyAnalysis // 프론트엔드 상단 카드용 원본 데이터
      });
    });
  });
};

// 3. 플랜 상태 조회
exports.getPlanStatus = (req, res) => {
  planModel.getActivePlanWithDay(req.user.id, (err, r) => {
    if (err || r.length === 0) return res.json({ hasActivePlan: false });

    const plan = r[0];

    // ✅ start_date 기준으로 current_day_number 실시간 계산
    const current_day_number = calcCurrentDay(plan.start_date, plan.plan_type);

    res.json({
      success: true,
      hasActivePlan: true,
      plan_type: plan.plan_type,
      current_day_number,          // ← 계산된 값 반환
      start_date: plan.start_date, // ← 프론트 참고용
    });
  });
};

// 4. 미션 체크/해제
exports.toggleMissionCheck = (req, res) => {
  const { detail_idx, is_completed } = req.body;
  planModel.updateMissionStatus(detail_idx, is_completed ? 1 : 0, (err) => res.json({ success: !err }));
};

// 5. 활성 플랜의 전체 미션 일괄 조회
exports.getAllMissions = (req, res) => {
  const user_idx = req.user.id;
  planModel.getActivePlanWithDay(user_idx, (err, results) => {
    if (err || results.length === 0) return res.json({ success: false, message: "플랜 없음" });
    const plan = results[0];
    planModel.getAllMissions(plan.plan_idx, (err2, missions) => {
      if (err2) return res.status(500).json({ success: false });
      // day_number별로 그룹핑 + type 라벨 부여
      const byDay = {};
      missions.forEach(m => {
        if (!byDay[m.day_number]) byDay[m.day_number] = [];
        const idx = byDay[m.day_number].length;
        byDay[m.day_number].push({
          ...m,
          type: idx < 3 ? '필수' : idx === 3 ? '선택' : '권장',
        });
      });
      res.json({ success: true, missions_by_day: byDay });
    });
  });
};
