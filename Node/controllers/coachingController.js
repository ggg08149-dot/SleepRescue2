const coachingModel = require('../models/coachingModel');
const axios = require('axios');

const getGptCoaching = (req, res) => {

const user_idx = req.session.user ? req.session.user.user_idx : 1; // 테스트용으로 1번 고정 가능
  console.log("1. 분석 시작! 대상 유저:", user_idx);

  const sql = "SELECT * FROM tb_lifelog WHERE user_idx = ? ORDER BY created_at DESC LIMIT 1";
  
  db.query(sql, [user_idx], async (err, result) => {
    if (err) {
      console.error("2. DB 에러 발생:", err);
      return res.status(500).send("DB 오류");
    }

    if (result.length === 0) {
      console.warn("⚠️ 2. 데이터가 없습니다! DB에 먼저 값을 입력했는지 확인하세요.");
      return res.status(404).json({ message: "분석할 데이터가 부족합니다." });
    }

    const userData = result[0];
    console.log("3. DB 데이터 확보 성공!:", userData);

    try {
      console.log("4. 파이썬 서버로 출발합니다...");
      const pythonResponse = await axios.post('http://localhost:8000/coaching', {
        user_idx: user_idx,
        sleep_hours: userData.sleep_hours || 0, // DB 컬럼명 확인!
        caffeine: userData.caffeine || 0,
        work_hours: userData.work_hours || 0,   // 파이썬 Pydantic 모델과 이름 맞추기
        phone_hours: userData.phone_hours || 0,
        exec_hours: userData.exec_hours || 0,
        fatigue_reason: userData.fatigue_reason || "",
        analysis_result: userData.analysis_result || ""
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