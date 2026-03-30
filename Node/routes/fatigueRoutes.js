const express = require('express');
const router  = express.Router();
const fatigueController = require('../controllers/fatigueController');

router.post('/fatigue/save', fatigueController.saveFatigue);
router.post('/predict',      fatigueController.predict);

module.exports = router;
