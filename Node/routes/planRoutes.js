const express = require('express');
const router  = express.Router();
const planController = require('../controllers/planController');

router.post('/plan/save', planController.savePlan);

module.exports = router;
