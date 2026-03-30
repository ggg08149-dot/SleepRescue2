const fileModel = require('../models/fileModel');

const saveFile = (req, res) => {
  const { user_idx, file_name, file_size, file_ext } = req.body;
  if (!user_idx) return res.json({ success: false, message: 'user_idx가 필요합니다.' });

  fileModel.insert(
    {
      user_idx,
      file_name: file_name || 'capture.jpg',
      file_size: file_size || 0,
      file_ext : file_ext  || 'jpg',
    },
    (err, result) => {
      if (err) {
        console.error('❌ file 저장 오류:', err);
        return res.json({ success: false, message: 'file 저장에 실패했습니다.' });
      }
      res.json({ success: true, file_idx: result.insertId });
    }
  );
};

module.exports = { saveFile };
