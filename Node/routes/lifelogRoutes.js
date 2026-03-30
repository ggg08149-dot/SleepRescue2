const express = require('express');
const router  = express.Router();
const lifelogController = require('../controllers/lifelogController');

router.post('/lifelog/save', lifelogController.saveLifelog);

module.exports = router;
