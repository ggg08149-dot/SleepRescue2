const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const { verifyToken } = require('../middlewares/authMiddleware');

// 1. 플랜 시작하기 (AnalysisResult -> /api/plan/start)
router.post('/start', verifyToken, planController.startNewPlan);

// 2. 현재 플랜 상태 조회 (Coaching 로딩 시 -> /api/plan/status)
router.get('/status', verifyToken, planController.getPlanStatus);

// 3. 특정 일차의 미션 목록 조회 (Coaching -> /api/plan/daily/:day)
router.get('/daily/:day', verifyToken, planController.getDailyMissions);

// 4. 미션 완료 체크/해제하기 (Coaching -> /api/plan/check)
router.put('/check', verifyToken, planController.toggleMissionCheck);

module.exports = router;
