const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'sleeprescue_secret_key';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.json({ success: false, message: '로그인이 필요합니다.' });

  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.json({ success: false, message: '유효하지 않은 토큰입니다.' });
  }
};

module.exports = { verifyToken };
