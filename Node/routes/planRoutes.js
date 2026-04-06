const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const authMiddleware = require('../middlewares/authMiddleware');

console.log('✅ authMiddleware 체크:', authMiddleware);
console.log('✅ planController 체크:', planController);

// 1. 플랜 시작하기 (AnalysisResult -> /api/plan/start)
router.post('/start', authMiddleware.verifyToken, planController.startNewPlan);

// 2. 현재 플랜 상태 조회 (Coaching 로딩 시 -> /api/plan/status)
// 응답 예시: { success: true, plan_type: 7, current_day_number: 3, start_date: "..." }
router.get('/status', authMiddleware.verifyToken, planController.getPlanStatus);

// 3. 특정 일차의 미션 목록 조회 (Coaching -> /api/plan/daily/:day)
router.get('/daily/:day', authMiddleware.verifyToken, planController.getDailyMissions);

// 4. 미션 완료 체크/해제하기 (Coaching -> /api/plan/check)
router.put('/check', authMiddleware.verifyToken, planController.toggleMissionCheck);

module.exports = router;
