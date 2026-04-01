const coachingModel = require('../models/coachingModel');
const axios = require('axios');

const getGptCoaching = (req, res) => {
  // 1. 유저 ID 확보 (토큰 없으면 기본값 1008 사용)
  let user_idx = 1008;
  if (req && req.user && req.user.id) {
    user_idx = req.user.id;
  }

  console.log("🚀 분석 시작! 대상 유저 번호:", user_idx);

  // 2. DB 데이터 조회
  coachingModel.getLatestSleepData(user_idx, async (err, result) => {
    if (err) {
      console.error("❌ DB 에러:", err.message);
      return res.status(500).json({ message: "DB 조회 오류" });
    }

    if (!result || result.length === 0) {
      console.warn("⚠️ 유저 데이터 없음");
      return res.status(404).json({ message: "분석할 데이터가 없습니다." });
    }

    const userData = result[0];
    console.log("✅ DB 데이터 확보 성공");

    try {
      // 3. FastAPI 서버로 데이터 전송
      const pythonResponse = await axios.post('http://localhost:8000/coaching', {
        user_idx: user_idx,
        sleep_hours: userData.sleep_hours || 0,
        caffeine: userData.caffeine || 0,
        work_hours: userData.work_hours || 0,
        phone_hours: userData.phone_hours || 0,
        exec_hours: userData.exec_hours || 0,
        fatigue_reason: userData.fatigue_reason || "기록 없음",
        analysis_result: userData.analysis_result || "결과 없음"
      });

      // 4. 결과 반환
      return res.status(200).json({
        solutions: pythonResponse.data.solutions
      });

    } catch (error) {
      console.error("❌ FastAPI 연결 실패:", error.message);
      return res.status(500).json({ message: "AI 서버 연결 실패" });
    }
  });
};

module.exports = { getGptCoaching };