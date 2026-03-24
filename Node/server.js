// 메인서버
const express = require('express');
const mysql   = require('mysql2');
const cors    = require('cors');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');

const app    = express();
const PORT   = 7000;
const SECRET = 'sleeprescue_secret_key';

// ─── 미들웨어 ────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── DB 연결 ─────────────────────────────────
const db = mysql.createConnection({
  host    : 'project-db-campus.smhrd.com',
  port    : 3312,
  user    : 'sc_25K_HI3_p2_2',
  password: 'smhrd2',
  database: 'sc_25K_HI3_p2_2',
});

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
  const { name, email, password } = req.body;

  // 입력값 확인
  if (!name || !email || !password) {
    return res.json({ success: false, message: '모든 항목을 입력해주세요.' });
  }

  try {
    // 비밀번호 암호화 (숫자 10 = 암호화 강도)
    const hashedPw = await bcrypt.hash(password, 10);

    const sql = 'INSERT INTO tb_user (account_id, name, email, password) VALUES (?, ?, ?, ?)';
    db.query(sql, [email, name, email, hashedPw], (err, result) => {
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
      userName : user.name,
      userEmail: user.email,
      message  : '로그인 성공! 🎉'
    });
  });
});

// ─── 서버 시작 ───────────────────────────────
app.listen(PORT, () => {
  console.log(`🚑 수면구조대 서버 실행 중! → http://localhost:${PORT}`);
});
