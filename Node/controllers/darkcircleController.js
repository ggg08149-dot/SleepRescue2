const darkcircleModel = require('../models/darkcircleModel');

const saveDarkcircle = (req, res) => {
  const { file_idx, user_idx, dc_score } = req.body;
  if (!file_idx || !user_idx) return res.json({ success: false, message: 'file_idx, user_idx가 필요합니다.' });

  darkcircleModel.insert(
    { file_idx, user_idx, dc_score: dc_score || 0 },
    (err, result) => {
      if (err) {
        console.error('❌ darkcircle 저장 오류:', err);
        return res.json({ success: false, message: '다크서클 점수 저장에 실패했습니다.' });
      }
      res.json({ success: true, dc_idx: result.insertId, dc_score });
    }
  );
};

module.exports = { saveDarkcircle };
