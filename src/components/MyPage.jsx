import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

function MyPage({ userName = '사용자', userEmail = 'user@email.com', userId = '', onLogout }) {

  const [section, setSection] = useState(null);
  // section: null | 'profile' | 'account' | 'userinfo' | 'support'

  const [profileImg, setProfileImg] = useState(null);
  const [toast, setToast] = useState('');

  // 비밀번호 변경 폼
  const [pwForm, setPwForm] = useState({
    currentPw: '',
    newPw: '',
    newPwConfirm: '',
  });
  const [currentPwValid, setCurrentPwValid] = useState(null); // null | true | false
  const [pwMatch, setPwMatch] = useState(null); // null | true | false
  const { verifyPassword, changePassword } = useAuth();


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

  const verifyCurrentPassword = async (pw) => {
    if (!pw) { setCurrentPwValid(null); return; }
    const data = await verifyPassword(pw);
    setCurrentPwValid(data.success ?? null);
  };

  const handleChangePassword = async () => {
    if (!pwForm.currentPw || !pwForm.newPw || !pwForm.newPwConfirm) {
      showToast('⚠ 모든 항목을 입력해주세요');
      return;
    }
    if (pwForm.newPw !== pwForm.newPwConfirm) {
      showToast('⚠ 새 비밀번호가 일치하지 않습니다');
      return;
    }
    if (pwForm.newPw.length < 6) {
      showToast('⚠ 비밀번호는 6자 이상이어야 합니다');
      return;
    }
    const data = await changePassword(pwForm.currentPw, pwForm.newPw);
    if (data.success) {
      showToast('✓ 비밀번호가 변경되었습니다');
      setPwForm({ currentPw: '', newPw: '', newPwConfirm: '' });
      setCurrentPwValid(null);
      setPwMatch(null);
      setSection(null);
    } else {
      showToast(`⚠ ${data.message || '서버 연결에 실패했습니다'}`);
    }
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
      id: 'userinfo',
      icon: '✏️',
      label: '비밀번호 변경',
      sub: '비밀번호 변경',
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
          {userId && <div className="mypage-hero-email">아이디: {userId}</div>}
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

      {/* 비밀번호 변경 */}
      {section === 'userinfo' && (
        <div className="mypage-panel">
          <div className="mypage-form">
            <div className="mypage-form-group">
              <label className="mypage-form-label">현재 비밀번호</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="mypage-form-input"
                  placeholder="현재 비밀번호 입력"
                  value={pwForm.currentPw}
                  onChange={e => {
                    setPwForm({ ...pwForm, currentPw: e.target.value });
                    setCurrentPwValid(null);
                  }}
                  onBlur={e => verifyCurrentPassword(e.target.value)}
                  style={{ paddingRight: '32px' }}
                />
                {currentPwValid === true && (
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#22c55e', fontSize: '18px' }}>✓</span>
                )}
                {currentPwValid === false && (
                  <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#f87171', fontSize: '16px' }}>✗</span>
                )}
              </div>
            </div>
            <div className="mypage-form-group">
              <label className="mypage-form-label">새 비밀번호</label>
              <input
                type="password"
                className="mypage-form-input"
                placeholder="새 비밀번호 입력 (6자 이상)"
                value={pwForm.newPw}
                onChange={e => {
                  const val = e.target.value;
                  setPwForm(prev => ({ ...prev, newPw: val }));
                  setPwMatch(pwForm.newPwConfirm ? val === pwForm.newPwConfirm : null);
                }}
              />
            </div>
            <div className="mypage-form-group">
              <label className="mypage-form-label">새 비밀번호 확인</label>
              <input
                type="password"
                className="mypage-form-input"
                placeholder="새 비밀번호 재입력"
                value={pwForm.newPwConfirm}
                onChange={e => {
                  const val = e.target.value;
                  setPwForm(prev => ({ ...prev, newPwConfirm: val }));
                  setPwMatch(val ? pwForm.newPw === val : null);
                }}
              />
              {pwMatch === true && (
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#22c55e' }}>✓ 일치합니다</div>
              )}
              {pwMatch === false && (
                <div style={{ marginTop: '4px', fontSize: '12px', color: '#f87171' }}>✗ 일치하지 않습니다</div>
              )}
            </div>
            <button className="mypage-save-btn" onClick={handleChangePassword}>변경 저장</button>
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
