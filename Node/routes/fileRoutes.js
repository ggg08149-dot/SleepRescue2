const express = require('express');
const router  = express.Router();
const fileController = require('../controllers/fileController');

router.post('/file/save', fileController.saveFile);

module.exports = router;
