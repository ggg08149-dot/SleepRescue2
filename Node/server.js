// 메인서버
const express = require('express');
const mysql   = require('mysql2');
const cors    = require('cors');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const { exec } = require('child_process');
const path = require('path');
require('dotenv').config(); // env에 db 정보 넣어놓고 불러옴

const app    = express();
const PORT   = 7000;
const SECRET = 'sleeprescue_secret_key';

// ─── 미들웨어 ────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── DB 연결 ─────────────────────────────────
const db = mysql.createConnection({
  host    : process.env.DB_HOST,
  port    : process.env.DB_PORT,
  user    : process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});
// 기존대로 하면 db 정보 털린대서 이렇게 바꿈

db.connect((err) => {
  if (err) {
    console.log('❌ DB 연결 실패:', err.message);
    return;
  }
  console.log('✅ DB 연결 성공!');
});

// ─── 서버 동작 확인용 ────────────────────────
// 브라우저에서 http://localhost:8080 열면 확인 가능
app.get('/', (req, res) => {
  res.json({ message: '수면구조대 서버 실행 중! 🚑' });
});

// ─── 회원가입 API ────────────────────────────
// 주소: POST http://localhost:8080/api/signup
app.post('/api/signup', async (req, res) => {
  const { name, email, password, birthdate, gender } = req.body;

  // 입력값 확인
  if (!name || !email || !password || !birthdate || !gender) {
    return res.json({ success: false, message: '모든 항목을 입력해주세요.' });
  }

  try {
    // 비밀번호 암호화 (숫자 10 = 암호화 강도)
    const hashedPw = await bcrypt.hash(password, 10);

    const sql = 'INSERT INTO tb_user (account_id, name, email, password, gender, birthdate, role) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [email, name, email, hashedPw, gender, birthdate, 'user'], (err, result) => {
      if (err) {
        // 이메일 중복
        if (err.code === 'ER_DUP_ENTRY') {
          return res.json({ success: false, message: '이미 사용 중인 이메일입니다.' });
        }
        console.log('회원가입 에러:', err);
        return res.json({ success: false, message: '회원가입에 실패했습니다.' });
      }
      res.json({ success: true, message: '회원가입 성공! 🎉' });
    });
  } catch (err) {
    console.log('서버 에러:', err);
    res.json({ success: false, message: '서버 오류가 발생했습니다.' });
  }
});

// ─── 로그인 API ──────────────────────────────
// 주소: POST http://localhost:3000/api/login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  // 입력값 확인
  if (!email || !password) {
    return res.json({ success: false, message: '이메일과 비밀번호를 입력해주세요.' });
  }

  const sql = 'SELECT * FROM tb_user WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err) {
      console.log('로그인 에러:', err);
      return res.json({ success: false, message: '서버 오류가 발생했습니다.' });
    }

    // 이메일 없음
    if (results.length === 0) {
      return res.json({ success: false, message: '이메일 또는 비밀번호가 틀렸습니다.' });
    }

    const user = results[0];

    // 비밀번호 확인
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: '이메일 또는 비밀번호가 틀렸습니다.' });
    }

    // 로그인 토큰 발급 (7일 유효)
    const token = jwt.sign(
      { id: user.user_idx, name: user.name },
      SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success  : true,
      token    : token,
      userId   : user.account_id,
      userName : user.name,
      userEmail: user.email,
      message  : '로그인 성공! 🎉'
    });
  });
});


// ─── 수면 예측 API (추가) ─────────────────────
app.post('/api/predict', (req, res) => {
  // 1. 프론트에서 보낸 값들을 숫자로 바꿉니다. (값이 없으면 0)
  const workout = parseFloat(req.body.workout) || 0;
  const phone = parseFloat(req.body.phone) || 0;
  const workHours = parseFloat(req.body.workHours) || 0;
  const caffeine = parseFloat(req.body.caffeine) || 0;
  const sleepTime = parseFloat(req.body.sleepTime) || 0;

  const pythonScript = path.join(__dirname, 'scripts', 'predict_ml.py');

  // 2. 파이썬 코드의 sys.argv 순서에 맞게 5개를 배열로 만듭니다.
  // [1:운동, 2:폰, 3:근무, 4:카페인, 5:수면시간]
  const args = [
    String(workout),
    String(phone),
    String(workHours),
    String(caffeine),
    String(sleepTime)
  ];

  console.log(`🐍 파이썬 실행: python "${pythonScript}" ${args.join(' ')}`);

  exec(`python "${pythonScript}" ${args.join(' ')}`, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ 실행 오류:', error);
      return res.status(500).json({ error: 'AI 분석 중 오류가 발생했습니다.' });
    }

    try {
      const result = JSON.parse(stdout.trim());
      res.json(result); // 파이썬이 계산한 결과(휴식시간 포함)를 리액트로 보냄
    } catch (e) {
      console.error('❌ JSON 파싱 오류:', e);
      res.status(500).json({ error: '결과 데이터 처리 오류' });
    }
  });
});

// ─── 현재 비밀번호 확인 API ──────────────────
// 주소: POST http://localhost:7000/api/user/verify-password
app.post('/api/user/verify-password', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.json({ success: false });

  let decoded;
  try { decoded = jwt.verify(token, SECRET); }
  catch { return res.json({ success: false }); }

  const { currentPassword } = req.body;
  if (!currentPassword) return res.json({ success: false });

  db.query('SELECT password FROM tb_user WHERE user_idx = ?', [decoded.id], async (err, results) => {
    if (err || results.length === 0) return res.json({ success: false });
    const isMatch = await bcrypt.compare(currentPassword, results[0].password);
    res.json({ success: isMatch });
  });
});

// ─── 비밀번호 변경 API ────────────────────────
// 주소: PUT http://localhost:7000/api/user/password
app.put('/api/user/password', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.json({ success: false, message: '로그인이 필요합니다.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, SECRET);
  } catch {
    return res.json({ success: false, message: '유효하지 않은 토큰입니다.' });
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.json({ success: false, message: '모든 항목을 입력해주세요.' });
  }

  db.query('SELECT * FROM tb_user WHERE user_idx = ?', [decoded.id], async (err, results) => {
    if (err || results.length === 0) {
      return res.json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    const user = results[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: '현재 비밀번호가 틀렸습니다.' });
    }

    const hashedPw = await bcrypt.hash(newPassword, 10);
    db.query('UPDATE tb_user SET password = ? WHERE user_idx = ?', [hashedPw, decoded.id], (err) => {
      if (err) return res.json({ success: false, message: '비밀번호 변경에 실패했습니다.' });
      res.json({ success: true, message: '비밀번호가 변경되었습니다.' });
    });
  });
});

// ─── 서버 시작 ───────────────────────────────
app.listen(PORT, () => {
  console.log(`🚑 수면구조대 서버 실행 중! → http://localhost:${PORT}`);
});