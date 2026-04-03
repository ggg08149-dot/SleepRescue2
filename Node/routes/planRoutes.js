const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const authMiddleware = require('../middlewares/authMiddleware');

/**
 * [약속된 데이터 규격 - Mission Object]
 * {
 *   detail_idx: 1,       // DB ID
 *   plan_task: "내용",    // 미션 텍스트
 *   is_completed: 0/1,   // 완료 여부
 *   day_number: 1,       // 몇 일차인지
 *   type: "필수/권장"     // 미션 타입 (임의 추가 가능)
 * }
 */

// 1. 플랜 시작하기 (분석 결과창에서 호출)
console.log("체크1 (미들웨어):", authMiddleware);
console.log("체크2 (컨트롤러):", planController.startNewPlan);
router.post('/save', authMiddleware.verifyToken, planController.startNewPlan);

// 2. 특정 일차의 미션 목록 가져오기 (코칭탭 로드 시)
router.get('/daily/:day', authMiddleware.verifyToken, planController.getDailyMissions);

// 3. 미션 완료 체크/해제하기
router.put('/check', authMiddleware.verifyToken, planController.toggleMissionCheck);

module.exports = router;
