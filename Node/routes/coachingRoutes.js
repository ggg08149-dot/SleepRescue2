const express = require('express');
const router = express.Router();
const coachingController = require('../controllers/coachingController');
const { verifyToken } = require('../middlewares/authMiddleware');

// 리액트에서 POST http://localhost:7000/api/coaching/analyze 로 요청을 보낼 주소
router.post('/analyze', verifyToken, coachingController.getGptCoaching);

// [추가] 재측정 결과 기반 플랜 최적화 승인 API
router.post('/apply-optimization', verifyToken, coachingController.applyOptimization);

module.exports = router;