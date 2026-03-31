const express = require('express');
const router = express.Router();
const coachingController = require('../controllers/coachingController');

// 리액트에서 POST http://localhost:3000/coaching/analyze 로 요청을 보낼 주소
router.post('/analyze', coachingController.getGptCoaching);

module.exports = router;