// 진입점 - 앱 설정 및 포트 실행만 담당
const express = require('express');
const cors    = require('cors');
const coachingRoutes = require('./routes/coachingRoutes'); // <--- 추가!
require('dotenv').config();

require('./config/db'); // DB 연결 초기화

const authRoutes       = require('./routes/authRoutes');
const lifelogRoutes    = require('./routes/lifelogRoutes');
const fileRoutes       = require('./routes/fileRoutes');
const darkcircleRoutes = require('./routes/darkcircleRoutes');
const fatigueRoutes    = require('./routes/fatigueRoutes');
const planRoutes       = require('./routes/planRoutes');

const app  = express();
const PORT = 7000;

// ─── 미들웨어 ────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── 서버 동작 확인 ───────────────────────────
app.get('/', (req, res) => {
  res.json({ message: '수면구조대 서버 실행 중! 🚑' });
});

// ─── 라우터 등록 ─────────────────────────────
app.use('/api', authRoutes);
app.use('/api', lifelogRoutes);
app.use('/api', fileRoutes);
app.use('/api', darkcircleRoutes);
app.use('/api', fatigueRoutes);
app.use('/api', planRoutes);
app.use('/api/coaching', coachingRoutes); // <--- 이 줄을 추가하세요!

// ─── 서버 시작 ───────────────────────────────
app.listen(PORT, () => {
  console.log(`🚑 수면구조대 서버 실행 중! → http://localhost:${PORT}`);
});
