const db = require('../config/db'); // [추가] DB 연결 설정 (안전장치)
const coachingModel = require('../models/coachingModel'); 
const axios = require('axios');

const getGptCoaching = (req, res) => {
  // verifyToken 미들웨어가 토큰을 해석해 req.user.id에 넣어준 값을 가져옵니다.
  const user_idx = (req.user && req.user.id) ? req.user.id : 1008; 
  
  console.log("🚀 [서버] 분석 시작! 대상 유저 번호:", user_idx);

  // 1. DB에서 데이터 가져오기
  coachingModel.getLatestSleepData(user_idx, async (err, result) => {
    if (err) {
      console.error("❌ DB 에러:", err);
      return res.status(500).json({ message: "DB 조회 중 오류 발생" });
    }

    if (!result || result.length === 0) {
      console.warn(`⚠️ 유저 ${user_idx}의 데이터가 DB에 없습니다.`);
      return res.status(404).json({ message: "분석할 데이터(수면/다크서클)가 없습니다. 먼저 등록해주세요." });
    }

    const userData = result[0];

    try {
      // 2. FastAPI(파이썬) 서버로 데이터 전송
      const pythonResponse = await axios.post('http://localhost:8000/coaching', {
        user_idx: user_idx,
        sleep_hours: userData.sleep_hours || 0,
        caffeine: userData.caffeine || 0,
        work_hours: userData.work_hours || 0,
        phone_hours: userData.phone_hours || 0,
        exec_hours: userData.exec_hours || 0,
        fatigue_reason: userData.fatigue_reason || "사유 없음",
        analysis_result: userData.analysis_result || "결과 없음"
      });

      // 3. 결과 반환
      return res.status(200).json({
        message: "GPT 코칭 완료!",
        solutions: pythonResponse.data.solutions
      });

    } catch (error) {
      console.error("❌ AI 서버 통신 에러:", error.message);
      return res.status(500).json({ message: "AI 분석 서버 연결 실패" });
    }
  });
};

module.exports = { getGptCoaching };