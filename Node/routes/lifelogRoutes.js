const express = require('express');
const router  = express.Router();
const lifelogController = require('../controllers/lifelogController');

router.post('/lifelog/save',              lifelogController.saveLifelog);
router.get('/lifelog/latest/:user_idx',   lifelogController.getLatest);

module.exports = router;
