const axios        = require('axios');
const fatigueModel = require('../models/fatigueModel');
const lifelogModel = require('../models/lifelogModel');

const FASTAPI = 'http://127.0.0.1:8000';

// ── STEP 4: FastAPI ML 호출 + tb_fatigue INSERT + tb_lifelog sleep_score UPDATE ────
const saveFatigue = (req, res) => {
  const { file_idx, lifelog_idx, workout, phone, workHours, caffeine, sleepTime } = req.body;
  if (!file_idx || !lifelog_idx) return res.json({ success: false, message: 'file_idx, lifelog_idx가 필요합니다.' });

  console.log(`🌐 FastAPI ML 호출: ${FASTAPI}/predict/lifestyle`);

  axios.post(`${FASTAPI}/predict/lifestyle`, {
    workout  : parseFloat(workout)   || 0,
    phone    : parseFloat(phone)     || 0,
    workHours: parseFloat(workHours) || 0,
    caffeine : parseFloat(caffeine)  || 0,
    sleepTime: parseFloat(sleepTime) || 0,
  })
  .then((response) => {
    const mlResult = response.data;
    if (mlResult.status === 'error') {
      return res.status(500).json({ success: false, message: mlResult.message || 'ML 분석 오류' });
    }

    const { sleep_score, predicted_hours, fatigue_cause, fatigue_details } = mlResult;

    let fatigue_level = 'low';
    if (sleep_score < 30) fatigue_level = 'high';
    else if (sleep_score < 70) fatigue_level = 'mid';

    const analysis_result = JSON.stringify(fatigue_details || []);

    fatigueModel.insert(
      { file_idx, lifelog_idx, fatigue_score: sleep_score, fatigue_reason: fatigue_cause, fatigue_level, analysis_result },
      (err) => {
        if (err) {
          console.error('❌ fatigue 저장 오류:', err);
          return res.status(500).json({ success: false, message: 'fatigue 저장에 실패했습니다.' });
        }

        lifelogModel.updateSleepScore(sleep_score, lifelog_idx, (err2) => {
          if (err2) {
            console.error('❌ lifelog 업데이트 오류:', err2);
            return res.status(500).json({ success: false, message: 'lifelog 업데이트에 실패했습니다.' });
          }

          res.json({
            success        : true,
            sleep_score,
            predicted_hours,
            fatigue_level,
            fatigue_cause,
            fatigue_details: fatigue_details || [],
          });
        });
      }
    );
  })
  .catch((error) => {
    console.error('❌ FastAPI 호출 오류:', error.message);
    return res.status(500).json({ success: false, message: 'ML 분석 중 오류가 발생했습니다. FastAPI 서버(8000포트)가 실행 중인지 확인해주세요.' });
  });
};

// ── 독립 예측 API (/api/predict) ──────────────────────────────────────────
const predict = (req, res) => {
  console.log(`🌐 FastAPI ML 호출: ${FASTAPI}/predict/lifestyle`);

  axios.post(`${FASTAPI}/predict/lifestyle`, {
    workout  : parseFloat(req.body.workout)   || 0,
    phone    : parseFloat(req.body.phone)     || 0,
    workHours: parseFloat(req.body.workHours) || 0,
    caffeine : parseFloat(req.body.caffeine)  || 0,
    sleepTime: parseFloat(req.body.sleepTime) || 0,
  })
  .then((response) => {
    res.json(response.data);
  })
  .catch((error) => {
    console.error('❌ FastAPI 호출 오류:', error.message);
    res.status(500).json({ error: 'AI 분석 중 오류가 발생했습니다.' });
  });
};

module.exports = { saveFatigue, predict };
