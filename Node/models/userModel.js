const db = require('../config/db');

const findByEmail = (email, cb) => {
  db.query('SELECT * FROM tb_user WHERE email = ?', [email], cb);
};

const insert = (data, cb) => {
  const sql = 'INSERT INTO tb_user (account_id, name, email, password, gender, birthdate, role) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(sql, [data.email, data.name, data.email, data.hashedPw, data.gender, data.birthdate, 'user'], cb);
};

const findById = (user_idx, cb) => {
  db.query('SELECT password FROM tb_user WHERE user_idx = ?', [user_idx], cb);
};

const updatePassword = (hashedPw, user_idx, cb) => {
  db.query('UPDATE tb_user SET password = ? WHERE user_idx = ?', [hashedPw, user_idx], cb);
};

// 회원 탈퇴: 해당 유저의 모든 데이터를 FK 순서에 맞게 트랜잭션으로 삭제
const deleteUser = (user_idx, cb) => {
  db.beginTransaction((err) => {
    if (err) return cb(err);

    const rollback = (e) => db.rollback(() => cb(e));

    // 1. tb_fatigue (tb_file, tb_lifelog 참조 → 먼저 삭제)
    const delFatigue = `
      DELETE f FROM tb_fatigue f
      JOIN tb_lifelog l ON f.lifelog_idx = l.lifelog_idx
      WHERE l.user_idx = ?`;
    db.query(delFatigue, [user_idx], (e) => {
      if (e) return rollback(e);

      // 2. tb_darkcircle (tb_file, tb_user 참조)
      db.query('DELETE FROM tb_darkcircle WHERE user_idx = ?', [user_idx], (e) => {
        if (e) return rollback(e);

        // 3. tb_plan_detail (tb_plan, tb_user 참조)
        db.query('DELETE FROM tb_plan_detail WHERE user_idx = ?', [user_idx], (e) => {
          if (e) return rollback(e);

          // 4. tb_plan (tb_user 참조)
          db.query('DELETE FROM tb_plan WHERE user_idx = ?', [user_idx], (e) => {
            if (e) return rollback(e);

            // 5. tb_lifelog (tb_user 참조)
            db.query('DELETE FROM tb_lifelog WHERE user_idx = ?', [user_idx], (e) => {
              if (e) return rollback(e);

              // 6. tb_file (tb_user 참조)
              db.query('DELETE FROM tb_file WHERE user_idx = ?', [user_idx], (e) => {
                if (e) return rollback(e);

                // 7. tb_user (마지막)
                db.query('DELETE FROM tb_user WHERE user_idx = ?', [user_idx], (e) => {
                  if (e) return rollback(e);
                  db.commit((e) => {
                    if (e) return rollback(e);
                    cb(null);
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};

module.exports = { findByEmail, insert, findById, updatePassword, deleteUser };
