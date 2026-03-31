const coachingModel = require('../models/coachingModel');
const axios = require('axios');

const getGptCoaching = (req, res) => {
  // 1. 리액트에서 보낸 사용자 ID (세션이나 파라미터에서 가져옴)
  const { user_idx } = req.body; 

  if (!user_idx) {
    return res.status(400).json({ message: "사용자 정보가 없습니다." });
  }

  // 2. 모델을 통해 DB에서 최신 수면/피로 데이터 7가지 가져오기
  coachingModel.getLatestSleepData(user_idx, async (err, results) => {
    if (err) {
      console.error("DB 조회 에러:", err);
      return res.status(500).json({ message: "데이터 조회 중 오류 발생" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "분석할 최신 데이터가 없습니다." });
    }

    const userData = results[0]; // 가장 최신 데이터 1건

    try {
      // 3. 파이썬(FastAPI) 서버로 데이터 쏴주기!
      // (파이썬 서버 주소가 http://localhost:8000/analyze 라고 가정)
      const pythonResponse = await axios.post('http://localhost:8000/coaching', {
        user_idx: user_idx,
        sleep_hours: userData.sleep_hours,
        caffeine: userData.caffeine,
        work_hours: userData.work_hours,
        phone_hours: userData.phone_hours,
        exec_hours: userData.exec_hours,
        fatigue_reason: userData.fatigue_reason,
        analysis_result: userData.analysis_result
      });

      // 4. GPT가 준 솔루션 5개를 리액트로 최종 반환!
      const gptSolutions = pythonResponse.data.solutions;
      
      return res.status(200).json({
        message: "GPT 코칭 완료!",
        solutions: gptSolutions
      });

    } catch (error) {
      console.error("파이썬 서버 통신 에러:", error);
      return res.status(500).json({ message: "AI 분석 서버 연결 실패" });
    }
  });
};

module.exports = { getGptCoaching };