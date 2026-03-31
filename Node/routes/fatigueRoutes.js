const express = require('express');
const router  = express.Router();
const fatigueController = require('../controllers/fatigueController');

router.post('/fatigue/save',              fatigueController.saveFatigue);
router.post('/predict',                   fatigueController.predict);
router.get('/fatigue/latest/:user_idx',              fatigueController.getLatest);
router.get('/fatigue/weekly/:user_idx',              fatigueController.getWeekly);
router.get('/fatigue/calendar/:user_idx/:year/:month', fatigueController.getCalendar);
router.get('/fatigue/history/:user_idx',               fatigueController.getHistory);
router.delete('/fatigue/:fatigue_idx/:user_idx',        fatigueController.deleteOne);

module.exports = router;
