const express = require('express');
const router  = express.Router();
const authController  = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

router.post('/signup',               authController.signup);
router.post('/login',                authController.login);
router.get('/auth/check',            authController.authCheck);
router.post('/user/verify-password', verifyToken, authController.verifyPassword);
router.put('/user/password',         verifyToken, authController.changePassword);
router.delete('/user/withdraw',      verifyToken, authController.withdrawUser);

module.exports = router;
