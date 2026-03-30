const lifelogModel = require('../models/lifelogModel');

const saveLifelog = (req, res) => {
  const { user_idx, exec_hours, phone_hours, work_hours, caffeine, sleep_hours } = req.body;
  if (!user_idx) return res.json({ success: false, message: 'user_idx가 필요합니다.' });

  lifelogModel.insert(
    {
      user_idx,
      exec_hours : exec_hours  || 0,
      phone_hours: phone_hours || 0,
      work_hours : work_hours  || 0,
      caffeine   : caffeine    || 0,
      sleep_hours: sleep_hours || 0,
    },
    (err, result) => {
      if (err) {
        console.error('❌ lifelog 저장 오류:', err);
        return res.json({ success: false, message: 'lifelog 저장에 실패했습니다.' });
      }
      res.json({ success: true, lifelog_idx: result.insertId });
    }
  );
};

module.exports = { saveLifelog };
