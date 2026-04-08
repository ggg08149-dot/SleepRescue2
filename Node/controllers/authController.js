const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const userModel = require('../models/userModel');

const SECRET = process.env.JWT_SECRET || 'sleeprescue_secret_key';

const signup = async (req, res) => {
  const { name, email, password, birthdate, gender } = req.body;
  if (!name || !email || !password || !birthdate || !gender) {
    return res.json({ success: false, message: '모든 항목을 입력해주세요.' });
  }
  try {
    const hashedPw = await bcrypt.hash(password, 10);
    userModel.insert({ email, name, hashedPw, gender, birthdate }, (err, results) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.json({ success: false, message: '이미 사용 중인 이메일입니다.' });
        console.log('회원가입 에러:', err);
        return res.json({ success: false, message: '회원가입에 실패했습니다.' });
      }
      const user_idx = results.insertId;
      const token = jwt.sign(
        { id: user_idx, name },
        SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: '회원가입 성공! 🎉',
        token,
        user_idx,
        userName: name,
        userEmail: email,
      });
    });

  } catch (err) {
    console.log('서버 에러:', err);
    res.json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.json({ success: false, message: '이메일과 비밀번호를 입력해주세요.' });

  userModel.findByEmail(email, async (err, results) => {
    if (err) {
      console.log('로그인 에러:', err);
      return res.json({ success: false, message: '서버 오류가 발생했습니다.' });
    }
    if (results.length === 0) return res.json({ success: false, message: '이메일 또는 비밀번호가 틀렸습니다.' });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.json({ success: false, message: '이메일 또는 비밀번호가 틀렸습니다.' });

    const token = jwt.sign({ id: user.user_idx, name: user.name }, SECRET, { expiresIn: '7d' });
    res.json({
      success  : true,
      token,
      user_idx : user.user_idx,
      userId   : user.account_id,
      userName : user.name,
      userEmail: user.email,
      message  : '로그인 성공! 🎉',
    });
  });
};

const authCheck = (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.json({ valid: false });
  try {
    const decoded = jwt.verify(token, SECRET);
    res.json({ valid: true, user_idx: decoded.id });
  } catch {
    res.json({ valid: false });
  }
};

const verifyPassword = async (req, res) => {
  const { currentPassword } = req.body;
  if (!currentPassword) return res.json({ success: false });

  userModel.findById(req.user.id, async (err, results) => {
    if (err || results.length === 0) return res.json({ success: false });
    const isMatch = await bcrypt.compare(currentPassword, results[0].password);
    res.json({ success: isMatch });
  });
};

const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.json({ success: false, message: '모든 항목을 입력해주세요.' });

  userModel.findById(req.user.id, async (err, results) => {
    if (err || results.length === 0) return res.json({ success: false, message: '사용자를 찾을 수 없습니다.' });

    const isMatch = await bcrypt.compare(currentPassword, results[0].password);
    if (!isMatch) return res.json({ success: false, message: '현재 비밀번호가 틀렸습니다.' });

    const hashedPw = await bcrypt.hash(newPassword, 10);
    userModel.updatePassword(hashedPw, req.user.id, (err2) => {
      if (err2) return res.json({ success: false, message: '비밀번호 변경에 실패했습니다.' });
      res.json({ success: true, message: '비밀번호가 변경되었습니다.' });
    });
  });
};

module.exports = { signup, login, authCheck, verifyPassword, changePassword };
