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
      user_idx : user.user_idx,
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

// ─── 인증 상태 확인 API ───────────────────────
// GET /api/auth/check → JWT 토큰 검증 (req.session 대신 JWT 사용)
app.get('/api/auth/check', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.json({ valid: false });

  try {
    const decoded = jwt.verify(token, SECRET);
    res.json({ valid: true, user_idx: decoded.id });
  } catch {
    res.json({ valid: false });
  }
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

// ─── STEP 1: 생활패턴 저장 API ───────────────
// POST /api/lifelog/save → tb_lifelog INSERT, lifelog_idx 반환
app.post('/api/lifelog/save', (req, res) => {
  const { user_idx, exec_hours, phone_hours, work_hours, caffeine, sleep_hours } = req.body;
  if (!user_idx) return res.json({ success: false, message: 'user_idx가 필요합니다.' });

  const sql = `INSERT INTO tb_lifelog (user_idx, exec_hours, phone_hours, work_hours, caffeine, sleep_hours)
               VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(sql, [user_idx, exec_hours || 0, phone_hours || 0, work_hours || 0, caffeine || 0, sleep_hours || 0], (err, result) => {
    if (err) {
      console.error('❌ lifelog 저장 오류:', err);
      return res.json({ success: false, message: 'lifelog 저장에 실패했습니다.' });
    }
    res.json({ success: true, lifelog_idx: result.insertId });
  });
});

// ─── STEP 2: 파일 메타데이터 저장 API ─────────
// POST /api/file/save → tb_file INSERT, file_idx 반환
app.post('/api/file/save', (req, res) => {
  const { user_idx, file_name, file_size, file_ext } = req.body;
  if (!user_idx) return res.json({ success: false, message: 'user_idx가 필요합니다.' });

  const sql = `INSERT INTO tb_file (user_idx, file_name, file_size, file_ext)
               VALUES (?, ?, ?, ?)`;
  db.query(sql, [user_idx, file_name || 'capture.jpg', file_size || 0, file_ext || 'jpg'], (err, result) => {
    if (err) {
      console.error('❌ file 저장 오류:', err);
      return res.json({ success: false, message: 'file 저장에 실패했습니다.' });
    }
    res.json({ success: true, file_idx: result.insertId });
  });
});

// ─── STEP 3: 다크서클 점수 저장 API ──────────
// POST /api/darkcircle/save → tb_darkcircle INSERT, dc_score 반환
app.post('/api/darkcircle/save', (req, res) => {
  const { file_idx, user_idx, dc_score } = req.body;
  if (!file_idx || !user_idx) return res.json({ success: false, message: 'file_idx, user_idx가 필요합니다.' });

  const sql = `INSERT INTO tb_darkcircle (file_idx, user_idx, dc_score) VALUES (?, ?, ?)`;
  db.query(sql, [file_idx, user_idx, dc_score || 0], (err, result) => {
    if (err) {
      console.error('❌ darkcircle 저장 오류:', err);
      return res.json({ success: false, message: '다크서클 점수 저장에 실패했습니다.' });
    }
    res.json({ success: true, dc_idx: result.insertId, dc_score });
  });
});

// ─── STEP 4: ML 실행 + 피로도 저장 API ────────
// POST /api/fatigue/save → ML 실행 + tb_fatigue INSERT + tb_lifelog sleep_score UPDATE
app.post('/api/fatigue/save', (req, res) => {
  const { file_idx, lifelog_idx, workout, phone, workHours, caffeine, sleepTime } = req.body;
  if (!file_idx || !lifelog_idx) return res.json({ success: false, message: 'file_idx, lifelog_idx가 필요합니다.' });

  const pythonScript = path.join(__dirname, 'scripts', 'predict_ml.py');
  const args = [
    String(parseFloat(workout)   || 0),
    String(parseFloat(phone)     || 0),
    String(parseFloat(workHours) || 0),
    String(parseFloat(caffeine)  || 0),
    String(parseFloat(sleepTime) || 0)
  ];

  console.log(`🐍 ML 실행: python "${pythonScript}" ${args.join(' ')}`);

  exec(`python "${pythonScript}" ${args.join(' ')}`, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ ML 실행 오류:', error);
      return res.status(500).json({ success: false, message: 'ML 분석 중 오류가 발생했습니다.' });
    }

    let mlResult;
    try {
      mlResult = JSON.parse(stdout.trim());
    } catch (e) {
      console.error('❌ ML JSON 파싱 오류:', e, '\nstdout:', stdout);
      return res.status(500).json({ success: false, message: 'ML 결과 처리 오류' });
    }

    const { sleep_score, predicted_hours, fatigue_cause, fatigue_details } = mlResult;

    // 피로도 레벨 결정
    let fatigue_level = 'low';
    if (sleep_score < 30) fatigue_level = 'high';
    else if (sleep_score < 70) fatigue_level = 'mid';

    const analysis_result = JSON.stringify(fatigue_details || []);

    // tb_fatigue INSERT
    const insertSql = `INSERT INTO tb_fatigue (file_idx, lifelog_idx, fatigue_score, fatigue_reason, fatigue_level, analysis_result)
                       VALUES (?, ?, ?, ?, ?, ?)`;
    db.query(insertSql, [file_idx, lifelog_idx, sleep_score, fatigue_cause, fatigue_level, analysis_result], (err) => {
      if (err) {
        console.error('❌ fatigue 저장 오류:', err);
        return res.status(500).json({ success: false, message: 'fatigue 저장에 실패했습니다.' });
      }

      // tb_lifelog sleep_score UPDATE
      db.query('UPDATE tb_lifelog SET sleep_score = ? WHERE lifelog_idx = ?', [sleep_score, lifelog_idx], (err2) => {
        if (err2) {
          console.error('❌ lifelog 업데이트 오류:', err2);
          return res.status(500).json({ success: false, message: 'lifelog 업데이트에 실패했습니다.' });
        }

        res.json({
          success: true,
          sleep_score,
          predicted_hours,
          fatigue_level,
          fatigue_cause,
          fatigue_details: fatigue_details || []
        });
      });
    });
  });
});

// ─── 서버 시작 ───────────────────────────────
app.listen(PORT, () => {
  console.log(`🚑 수면구조대 서버 실행 중! → http://localhost:${PORT}`);
});