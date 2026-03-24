import React, { useState } from 'react';

function MyPage({ userName = '사용자', userEmail = 'user@email.com', onLogout }) {

  const [section, setSection] = useState(null);
  // section: null | 'profile' | 'account' | 'userinfo' | 'support'

  const [profileImg, setProfileImg] = useState(null);
  const [toast, setToast] = useState('');

  // 회원정보 수정 폼
  const [userInfo, setUserInfo] = useState({
    name: userName,
    age: '',
    gender: '',
    email: userEmail,
  });

  // 계정설정 폼
  const [accountForm, setAccountForm] = useState({
    currentPw: '',
    newId: '',
    newPw: '',
    newPwConfirm: '',
  });

  const [showWithdraw, setShowWithdraw] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const handleProfileImg = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setProfileImg(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleSaveUserInfo = () => {
    showToast('✓ 회원정보가 저장되었습니다');
    setSection(null);
  };

  const handleSaveAccount = () => {
    if (accountForm.newPw && accountForm.newPw !== accountForm.newPwConfirm) {
      showToast('⚠ 비밀번호가 일치하지 않습니다');
      return;
    }
    showToast('✓ 계정 정보가 변경되었습니다');
    setSection(null);
  };

  const initials = userName.slice(0, 2).toUpperCase();

  const menuItems = [
    {
      id: 'profile',
      icon: '🖼',
      label: '프로필 사진 변경',
      sub: '나를 표현하는 사진을 설정하세요',
    },
    {
      id: 'account',
      icon: '🔑',
      label: '계정 설정',
      sub: '아이디 · 비밀번호 변경',
    },
    {
      id: 'userinfo',
      icon: '✏️',
      label: '회원정보 수정',
      sub: '이름 · 나이 · 성별 · 이메일',
    },
    {
      id: 'support',
      icon: '💬',
      label: '고객센터',
      sub: '문의 및 도움말',
    },
  ];

  return (
    <div className="mypage-screen">

      {/* 토스트 메시지 */}
      {toast && <div className="mypage-toast">{toast}</div>}

      {/* 프로필 헤더 */}
      <div className="mypage-hero">
        <div className="mypage-avatar-wrap">
          {profileImg
            ? <img src={profileImg} alt="프로필" className="mypage-avatar-img" />
            : <div className="mypage-avatar-initials">{initials}</div>
          }
          <div className="mypage-avatar-badge">😴</div>
        </div>
        <div className="mypage-hero-info">
          <div className="mypage-hero-name">{userName}</div>
          <div className="mypage-hero-email">{userEmail}</div>
          <div className="mypage-hero-tag">수면 구조 중 🚑</div>
        </div>
      </div>

      {/* 수면 요약 통계 */}
      <div className="mypage-stats-row">
        <div className="mypage-stat-box">
          <div className="mypage-stat-num">7일</div>
          <div className="mypage-stat-label">연속 달성</div>
        </div>
        <div className="mypage-stat-divider" />
        <div className="mypage-stat-box">
          <div className="mypage-stat-num">23회</div>
          <div className="mypage-stat-label">총 분석</div>
        </div>
        <div className="mypage-stat-divider" />
        <div className="mypage-stat-box">
          <div className="mypage-stat-num">6.8h</div>
          <div className="mypage-stat-label">평균 수면</div>
        </div>
      </div>

      {/* 메뉴 리스트 */}
      <div className="mypage-section-title">계정 및 환경설정</div>
      <div className="mypage-menu-list">
        {menuItems.map(item => (
          <button
            key={item.id}
            className={`mypage-menu-item ${section === item.id ? 'mypage-menu-item--active' : ''}`}
            onClick={() => setSection(section === item.id ? null : item.id)}
          >
            <span className="mypage-menu-icon">{item.icon}</span>
            <div className="mypage-menu-text">
              <div className="mypage-menu-label">{item.label}</div>
              <div className="mypage-menu-sub">{item.sub}</div>
            </div>
            <span className="mypage-menu-arrow">
              {section === item.id ? '▲' : '▶'}
            </span>
          </button>
        ))}
      </div>

      {/* 프로필 사진 변경 */}
      {section === 'profile' && (
        <div className="mypage-panel">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div className="mypage-avatar-preview">
              {profileImg
                ? <img src={profileImg} alt="미리보기" className="mypage-avatar-img" style={{ width: '80px', height: '80px' }} />
                : <div className="mypage-avatar-initials" style={{ width: '80px', height: '80px', fontSize: '24px' }}>{initials}</div>
              }
            </div>
            <label className="mypage-upload-btn">
              📁 사진 선택하기
              <input type="file" accept="image/*" onChange={handleProfileImg} style={{ display: 'none' }} />
            </label>
            {profileImg && (
              <button className="mypage-save-btn" onClick={() => { showToast('✓ 프로필 사진이 변경되었습니다'); setSection(null); }}>
                저장하기
              </button>
            )}
          </div>
        </div>
      )}

      {/* 계정 설정 */}
      {section === 'account' && (
        <div className="mypage-panel">
          <div className="mypage-form">
            <div className="mypage-form-group">
              <label className="mypage-form-label">새 아이디</label>
              <input
                className="mypage-form-input"
                placeholder="변경할 아이디 입력"
                value={accountForm.newId}
                onChange={e => setAccountForm({ ...accountForm, newId: e.target.value })}
              />
            </div>
            <div className="mypage-form-group">
              <label className="mypage-form-label">현재 비밀번호</label>
              <input
                type="password"
                className="mypage-form-input"
                placeholder="현재 비밀번호 입력"
                value={accountForm.currentPw}
                onChange={e => setAccountForm({ ...accountForm, currentPw: e.target.value })}
              />
            </div>
            <div className="mypage-form-group">
              <label className="mypage-form-label">새 비밀번호</label>
              <input
                type="password"
                className="mypage-form-input"
                placeholder="새 비밀번호 입력 (6자 이상)"
                value={accountForm.newPw}
                onChange={e => setAccountForm({ ...accountForm, newPw: e.target.value })}
              />
            </div>
            <div className="mypage-form-group">
              <label className="mypage-form-label">새 비밀번호 확인</label>
              <input
                type="password"
                className="mypage-form-input"
                placeholder="새 비밀번호 재입력"
                value={accountForm.newPwConfirm}
                onChange={e => setAccountForm({ ...accountForm, newPwConfirm: e.target.value })}
              />
            </div>
            <button className="mypage-save-btn" onClick={handleSaveAccount}>변경 저장</button>
          </div>
        </div>
      )}

      {/* 회원정보 수정 */}
      {section === 'userinfo' && (
        <div className="mypage-panel">
          <div className="mypage-form">
            <div className="mypage-form-group">
              <label className="mypage-form-label">이름</label>
              <input
                className="mypage-form-input"
                value={userInfo.name}
                onChange={e => setUserInfo({ ...userInfo, name: e.target.value })}
              />
            </div>
            <div className="mypage-form-group">
              <label className="mypage-form-label">나이</label>
              <input
                type="number"
                className="mypage-form-input"
                placeholder="나이 입력"
                value={userInfo.age}
                onChange={e => setUserInfo({ ...userInfo, age: e.target.value })}
              />
            </div>
            <div className="mypage-form-group">
              <label className="mypage-form-label">성별</label>
              <div className="mypage-gender-row">
                {['남성', '여성', '선택 안함'].map(g => (
                  <button
                    key={g}
                    className={`mypage-gender-btn ${userInfo.gender === g ? 'mypage-gender-btn--active' : ''}`}
                    onClick={() => setUserInfo({ ...userInfo, gender: g })}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="mypage-form-group">
              <label className="mypage-form-label">이메일</label>
              <input
                type="email"
                className="mypage-form-input"
                value={userInfo.email}
                onChange={e => setUserInfo({ ...userInfo, email: e.target.value })}
              />
            </div>
            <button className="mypage-save-btn" onClick={handleSaveUserInfo}>저장하기</button>
          </div>
        </div>
      )}

      {/* 고객센터 */}
      {section === 'support' && (
        <div className="mypage-panel">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { icon: '📋', label: '자주 묻는 질문 (FAQ)' },
              { icon: '✉️', label: '1:1 문의하기' },
              { icon: '📢', label: '공지사항' },
              { icon: '⭐', label: '앱 평가하기' },
            ].map(item => (
              <button key={item.label} className="mypage-support-item" onClick={() => showToast('준비 중인 기능이에요 😊')}>
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                <span style={{ fontSize: '13px', color: 'var(--text)' }}>{item.label}</span>
                <span style={{ marginLeft: 'auto', color: 'var(--muted)', fontSize: '11px' }}>▶</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 로그아웃 / 회원탈퇴 */}
      <div className="mypage-section-title" style={{ marginTop: '20px' }}>기타</div>
      <div className="mypage-menu-list">
        <button className="mypage-menu-item" onClick={() => { showToast('로그아웃 되었습니다'); setTimeout(() => onLogout && onLogout(), 1000); }}>
          <span className="mypage-menu-icon">🚪</span>
          <div className="mypage-menu-text">
            <div className="mypage-menu-label">로그아웃</div>
            <div className="mypage-menu-sub">계정에서 나가기</div>
          </div>
          <span className="mypage-menu-arrow">▶</span>
        </button>

        <button className="mypage-menu-item mypage-menu-item--danger" onClick={() => setShowWithdraw(true)}>
          <span className="mypage-menu-icon">⚠️</span>
          <div className="mypage-menu-text">
            <div className="mypage-menu-label" style={{ color: '#f87171' }}>회원탈퇴</div>
            <div className="mypage-menu-sub">모든 데이터가 삭제됩니다</div>
          </div>
          <span className="mypage-menu-arrow">▶</span>
        </button>
      </div>

      {/* 회원탈퇴 확인 모달 */}
      {showWithdraw && (
        <div className="mypage-modal-overlay" onClick={() => setShowWithdraw(false)}>
          <div className="mypage-modal" onClick={e => e.stopPropagation()}>
            <div className="mypage-modal-title">정말 탈퇴하시겠어요?</div>
            <div className="mypage-modal-sub">모든 수면 데이터와 코칭 기록이<br />영구적으로 삭제됩니다.</div>
            <div className="mypage-modal-btns">
              <button className="mypage-modal-cancel" onClick={() => setShowWithdraw(false)}>취소</button>
              <button className="mypage-modal-confirm" onClick={() => { setShowWithdraw(false); showToast('탈퇴 처리되었습니다'); }}>탈퇴하기</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: '20px' }} />
    </div>
  );
}

export default MyPage;
