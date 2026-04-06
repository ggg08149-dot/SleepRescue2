const axios        = require('axios');
const fatigueModel = require('../models/fatigueModel');
const lifelogModel = require('../models/lifelogModel');
const darkcircleModel = require('../models/darkcircleModel'); // ✅ 추가

const FASTAPI = 'http://127.0.0.1:8000';

// ── STEP 4: FastAPI ML 호출 + tb_fatigue INSERT + tb_lifelog sleep_score UPDATE ────
const saveFatigue = (req, res) => {
  const { file_idx, lifelog_idx, workout, phone, workHours, caffeine, sleepTime } = req.body;
  if (!file_idx || !lifelog_idx) return res.json({ success: false, message: 'file_idx, lifelog_idx가 필요합니다.' });

  // 1️⃣ DB에서 해당 파일의 다크서클 점수(dc_score)를 먼저 가져옵니다.
  darkcircleModel.getScoreByFile(file_idx, (err, dc_score) => {
    if (err) {
      console.error('❌ 다크서클 조회 오류:', err);
      return res.status(500).json({ success: false, message: '다크서클 데이터를 찾을 수 없습니다.' });
    }

    const current_dc_score = dc_score || 80; // 점수 없으면 기본값 80점
    console.log(`🌐 FastAPI ML 호출 및 다크서클(${current_dc_score}) 합산 시작`);

// 2️⃣ FastAPI 호출 (생활패턴 기반 수면 점수 70%용)
  axios.post(`${FASTAPI}/predict/ml`, {
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

// 3️⃣ 🔥 핵심: 3:7 합산 로직 적용 (다크서클 30% + 수면점수 70%)
      const final_fatigue_score = 100 - (current_dc_score * 0.3) - (sleep_score * 0.7);

    let fatigue_level = 'low';
    if (final_fatigue_score > 70) fatigue_level = 'high';
    else if (final_fatigue_score > 30) fatigue_level = 'mid';

    const analysis_result = JSON.stringify(fatigue_details || []);

// 5️⃣ 최종 합산 점수를 DB에 저장
    fatigueModel.insert(
      { file_idx, 
        lifelog_idx, 
        fatigue_score: final_fatigue_score, // ✅ 합산된 점수 저장
        fatigue_reason: fatigue_cause, 
        fatigue_level, 
        analysis_result 
      },
      (err) => {
        if (err) {
          console.error('❌ fatigue 저장 오류:', err);
          return res.status(500).json({ success: false, message: 'fatigue 저장에 실패했습니다.' });
        }

        lifelogModel.updateSleepPrediction(sleep_score, lifelog_idx, (err2) => {
          if (err2) {
            console.error('❌ lifelog 업데이트 오류:', err2);
            return res.status(500).json({ success: false, message: 'lifelog 업데이트에 실패했습니다.' });
          }
          // 모든 과정 성공 시 응답
          res.json({
            success : true,
            sleep_score,
            predicted_hours,
            fatigue_score: final_fatigue_score,
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
});
};

// ── 독립 예측 API (/api/predict) ──────────────────────────────────────────
const predict = (req, res) => {
  console.log(`🌐 FastAPI ML 호출: ${FASTAPI}/predict/ml`);

  axios.post(`${FASTAPI}/predict/ml`, {
    // 독립 예측 API는 단순 테스트용이므로 기존 로직 유지
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

// 최근 피로지수 1건
const getLatest = (req, res) => {
  const { user_idx } = req.params;
  fatigueModel.getLatestByUser(user_idx, (err, data) => {
    if (err) return res.status(500).json({ success: false, message: 'DB 조회 오류' });
    res.json({ success: true, data });
  });
};

// 주간 피로지수 최대 7건
const getWeekly = (req, res) => {
  const { user_idx } = req.params;
  fatigueModel.getWeeklyByUser(user_idx, (err, data) => {
    if (err) return res.status(500).json({ success: false, message: 'DB 조회 오류' });
    res.json({ success: true, data });
  });
};

// 캘린더용: 월별 일자별 최신 피로지수
const getCalendar = (req, res) => {
  const { user_idx, year, month } = req.params;
  fatigueModel.getCalendarByUser(user_idx, year, month, (err, data) => {
    if (err) return res.status(500).json({ success: false, message: 'DB 조회 오류' });
    res.json({ success: true, data });
  });
};

// 분석 히스토리 최신순 20건
const getHistory = (req, res) => {
  const { user_idx } = req.params;
  fatigueModel.getHistoryByUser(user_idx, (err, data) => {
    if (err) return res.status(500).json({ success: false, message: 'DB 조회 오류' });
    res.json({ success: true, data });
  });
};

// 분석 결과 삭제 (연관 레코드 연쇄 삭제)
const deleteOne = (req, res) => {
  const { fatigue_idx, user_idx } = req.params;
  fatigueModel.deleteWithCascade(fatigue_idx, user_idx, (err) => {
    if (err) {
      if (err.message === '권한 없음 또는 데이터 없음') return res.status(403).json({ success: false, message: err.message });
      return res.status(500).json({ success: false, message: 'DB 삭제 오류' });
    }
    res.json({ success: true });
  });
};

module.exports = { saveFatigue, predict, getLatest, getWeekly, getCalendar, getHistory, deleteOne };
