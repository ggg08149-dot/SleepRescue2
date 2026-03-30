const express = require('express');
const router  = express.Router();
const darkcircleController = require('../controllers/darkcircleController');

router.post('/darkcircle/save', darkcircleController.saveDarkcircle);

module.exports = router;
