import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const LOCK_KEY = 'sleeprescue_lock_until';
const LOCK_PHRASE = '저는 오늘 수면을 포기합니다';

// ─── 잠금 화면 ────────────────────────────────────
function LockScreen({ lockUntil, onUnlock }) {
  const [remaining, setRemaining]       = useState('');
  const [showEmergency, setShowEmergency] = useState(false);
  const [phrase, setPhrase]             = useState('');
  const [shakeErr, setShakeErr]         = useState(false);
  const [tapCount, setTapCount]         = useState(0);

  // 카운트다운
  useEffect(() => {
    const tick = () => {
      const diff = lockUntil - Date.now();
      if (diff <= 0) { onUnlock(); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h > 0 ? h + '시간 ' : ''}${String(m).padStart(2,'0')}분 ${String(s).padStart(2,'0')}초`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockUntil, onUnlock]);

  // 뒤로가기 막기
  useEffect(() => {
    const block = () => window.history.pushState(null, null, window.location.href);
    window.history.pushState(null, null, window.location.href);
    window.addEventListener('popstate', block);
    return () => window.removeEventListener('popstate', block);
  }, []);

  // 화면 전체 탭 핸들러
  const handleTap = () => {
    if (showEmergency) return; // 비상해제 창 열려있으면 탭 무시
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= 5) {
      setShowEmergency(true);
      setTapCount(0);
    }
  };

  const handleEmergencyTry = () => {
    if (phrase === LOCK_PHRASE) {
      localStorage.removeItem(LOCK_KEY);
      onUnlock();
    } else {
      setShakeErr(true);
      setTimeout(() => setShakeErr(false), 600);
      setPhrase('');
    }
  };

  return (
    <div
      onClick={handleTap}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'linear-gradient(135deg, #0b0b13, #1a0a2e)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '30px', cursor: 'default',
      }}
    >
      {/* 달 아이콘 */}
      <div style={{ fontSize: '72px', marginBottom: '20px', filter: 'drop-shadow(0 0 20px rgba(110,231,247,0.4))' }}>
        🌙
      </div>

      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', color: 'var(--accent)', letterSpacing: '2px', marginBottom: '8px' }}>
        수면 잠금 중
      </div>

      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px', textAlign: 'center' }}>
        스마트폰을 내려놓고 수면을 취하세요 😴
      </div>

      {/* 카운트다운 */}
      <div style={{
        background: 'rgba(110,231,247,0.08)',
        border: '1px solid rgba(110,231,247,0.2)',
        borderRadius: '20px', padding: '24px 40px',
        textAlign: 'center', marginBottom: '40px',
      }}>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', letterSpacing: '1px' }}>
          잠금 해제까지
        </div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '36px', color: 'var(--accent)', letterSpacing: '2px' }}>
          {remaining}
        </div>
      </div>

      {/* 수면 팁 */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px', padding: '16px 20px',
        fontSize: '12px', color: 'rgba(255,255,255,0.4)',
        textAlign: 'center', lineHeight: 1.8, marginBottom: '40px',
        maxWidth: '300px',
      }}>
        💡 수면 중 스마트폰 블루라이트는<br />멜라토닌 분비를 억제해요.<br />눈을 감고 천천히 호흡해보세요.
      </div>

      {/* 탭 카운트 표시 */}
      {!showEmergency && (
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.15)', userSelect: 'none' }}>
          {tapCount > 0 ? `화면을 ${5 - tapCount}번 더 누르세요` : '　'}
        </div>
      )}

      {/* 비상 해제 창 */}
      {showEmergency && (
        <div
          onClick={e => e.stopPropagation()} // 탭 이벤트 전파 막기
          style={{ width: '100%', maxWidth: '320px' }}
        >
          <div style={{ fontSize: '12px', color: '#f87171', textAlign: 'center', marginBottom: '12px', fontWeight: 700 }}>
            ⚠️ 비상 해제
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: '10px', lineHeight: 1.7 }}>
            아래 문장을 정확히 입력하면 해제됩니다:<br />
            <span style={{ color: '#f87171', fontWeight: 700 }}>"{LOCK_PHRASE}"</span>
          </div>
          <input
            type="text"
            value={phrase}
            onChange={e => setPhrase(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleEmergencyTry(); }}
            placeholder="위 문장을 그대로 입력하세요"
            autoFocus
            style={{
              width: '100%', padding: '12px 14px',
              background: shakeErr ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${shakeErr ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: '10px', color: '#fff',
              fontFamily: "'Noto Sans KR', sans-serif", fontSize: '12px',
              outline: 'none', boxSizing: 'border-box',
              transition: 'border 0.2s',
            }}
          />
          {shakeErr && (
            <div style={{ fontSize: '11px', color: '#f87171', marginTop: '6px', textAlign: 'center' }}>
              문장이 정확하지 않아요. 다시 입력해주세요.
            </div>
          )}
          <button onClick={handleEmergencyTry} style={{
            width: '100%', marginTop: '10px', padding: '12px',
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '10px', color: '#f87171',
            fontFamily: "'Noto Sans KR', sans-serif", fontSize: '13px',
            fontWeight: 700, cursor: 'pointer',
          }}>
            해제하기
          </button>
          <button onClick={() => { setShowEmergency(false); setPhrase(''); setTapCount(0); }} style={{
            width: '100%', marginTop: '8px', padding: '10px',
            background: 'transparent', border: 'none',
            color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
            fontFamily: "'Noto Sans KR', sans-serif", fontSize: '12px',
          }}>
            취소
          </button>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
    </div>
  );
}

// ─── MyPage 메인 ──────────────────────────────────
function MyPage({ userName = '사용자', userEmail = 'user@email.com', userId = '', onLogout }) {
  const [section, setSection]           = useState(null);
  const [profileImg, setProfileImg]     = useState(null);
  const [toast, setToast]               = useState('');
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [lockHours, setLockHours]       = useState(2);
  const [lockUntil, setLockUntil]       = useState(() => {
    const v = localStorage.getItem(LOCK_KEY);
    return v ? parseInt(v) : null;
  });

  const [pwForm, setPwForm]             = useState({ currentPw: '', newPw: '', newPwConfirm: '' });
  const [currentPwValid, setCurrentPwValid] = useState(null);
  const [pwMatch, setPwMatch]           = useState(null);
  const { verifyPassword, changePassword } = useAuth();

  // 잠금 만료 확인
  useEffect(() => {
    if (lockUntil && Date.now() >= lockUntil) {
      setLockUntil(null);
      localStorage.removeItem(LOCK_KEY);
    }
  }, [lockUntil]);

  // 잠금 화면 표시
  if (lockUntil && Date.now() < lockUntil) {
    return (
      <LockScreen
        lockUntil={lockUntil}
        onUnlock={() => { setLockUntil(null); localStorage.removeItem(LOCK_KEY); }}
      />
    );
  }

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const handleProfileImg = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setProfileImg(ev.target.result);
    reader.readAsDataURL(file);
  };

  const verifyCurrentPassword = async (pw) => {
    if (!pw) { setCurrentPwValid(null); return; }
    const data = await verifyPassword(pw);
    setCurrentPwValid(data.success ?? null);
  };

  const handleChangePassword = async () => {
    if (!pwForm.currentPw || !pwForm.newPw || !pwForm.newPwConfirm) { showToast('⚠ 모든 항목을 입력해주세요'); return; }
    if (pwForm.newPw !== pwForm.newPwConfirm) { showToast('⚠ 새 비밀번호가 일치하지 않습니다'); return; }
    if (pwForm.newPw.length < 6) { showToast('⚠ 비밀번호는 6자 이상이어야 합니다'); return; }
    const data = await changePassword(pwForm.currentPw, pwForm.newPw);
    if (data.success) {
      showToast('✓ 비밀번호가 변경되었습니다');
      setPwForm({ currentPw: '', newPw: '', newPwConfirm: '' });
      setCurrentPwValid(null); setPwMatch(null); setSection(null);
    } else {
      showToast(`⚠ ${data.message || '서버 연결에 실패했습니다'}`);
    }
  };

  const handleStartLock = () => {
    const until = Date.now() + lockHours * 60 * 60 * 1000;
    localStorage.setItem(LOCK_KEY, String(until));
    setLockUntil(until);
    setSection(null);
  };

  const initials = userName.slice(0, 2).toUpperCase();

  const menuItems = [
    { id: 'profile',  icon: '🖼',  label: '프로필 사진 변경', sub: '나를 표현하는 사진을 설정하세요' },
    { id: 'userinfo', icon: '✏️',  label: '비밀번호 변경',    sub: '비밀번호 변경' },
    { id: 'lock',     icon: '🔒',  label: '수면 잠금',        sub: '설정 시간 동안 앱 사용을 잠급니다' },
    { id: 'support',  icon: '💬',  label: '고객센터',         sub: '문의 및 도움말' },
  ];

  return (
    <div className="mypage-screen">
      {toast && <div className="mypage-toast">{toast}</div>}

      {/* 프로필 헤더 */}
      <div className="mypage-hero">
        <div className="mypage-avatar-wrap">
          {profileImg
            ? <img src={profileImg} alt="프로필" className="mypage-avatar-img" />
            : <div className="mypage-avatar-initials">{initials}</div>}
          <div className="mypage-avatar-badge">😴</div>
        </div>
        <div className="mypage-hero-info">
          <div className="mypage-hero-name">{userName}</div>
          {userId && <div className="mypage-hero-email">아이디: {userId}</div>}
          <div className="mypage-hero-email">{userEmail}</div>
          <div className="mypage-hero-tag">수면 구조 중 🚑</div>
        </div>
      </div>

      {/* 수면 통계 */}
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
          <button key={item.id}
            className={`mypage-menu-item ${section === item.id ? 'mypage-menu-item--active' : ''}`}
            onClick={() => setSection(section === item.id ? null : item.id)}
          >
            <span className="mypage-menu-icon">{item.icon}</span>
            <div className="mypage-menu-text">
              <div className="mypage-menu-label">{item.label}</div>
              <div className="mypage-menu-sub">{item.sub}</div>
            </div>
            <span className="mypage-menu-arrow">{section === item.id ? '▲' : '▶'}</span>
          </button>
        ))}
      </div>

      {/* 프로필 사진 */}
      {section === 'profile' && (
        <div className="mypage-panel">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div className="mypage-avatar-preview">
              {profileImg
                ? <img src={profileImg} alt="미리보기" className="mypage-avatar-img" style={{ width: '80px', height: '80px' }} />
                : <div className="mypage-avatar-initials" style={{ width: '80px', height: '80px', fontSize: '24px' }}>{initials}</div>}
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
                <input type="password" className="mypage-form-input" placeholder="현재 비밀번호 입력"
                  value={pwForm.currentPw}
                  onChange={e => { setPwForm({ ...pwForm, currentPw: e.target.value }); setCurrentPwValid(null); }}
                  onBlur={e => verifyCurrentPassword(e.target.value)}
                  style={{ paddingRight: '32px' }} />
                {currentPwValid === true  && <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#22c55e', fontSize: '18px' }}>✓</span>}
                {currentPwValid === false && <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#f87171', fontSize: '16px' }}>✗</span>}
              </div>
            </div>
            <div className="mypage-form-group">
              <label className="mypage-form-label">새 비밀번호</label>
              <input type="password" className="mypage-form-input" placeholder="새 비밀번호 입력 (6자 이상)"
                value={pwForm.newPw}
                onChange={e => { const v = e.target.value; setPwForm(p => ({...p, newPw: v})); setPwMatch(pwForm.newPwConfirm ? v === pwForm.newPwConfirm : null); }} />
            </div>
            <div className="mypage-form-group">
              <label className="mypage-form-label">새 비밀번호 확인</label>
              <input type="password" className="mypage-form-input" placeholder="새 비밀번호 재입력"
                value={pwForm.newPwConfirm}
                onChange={e => { const v = e.target.value; setPwForm(p => ({...p, newPwConfirm: v})); setPwMatch(v ? pwForm.newPw === v : null); }} />
              {pwMatch === true  && <div style={{ marginTop: '4px', fontSize: '12px', color: '#22c55e' }}>✓ 일치합니다</div>}
              {pwMatch === false && <div style={{ marginTop: '4px', fontSize: '12px', color: '#f87171' }}>✗ 일치하지 않습니다</div>}
            </div>
            <button className="mypage-save-btn" onClick={handleChangePassword}>변경 저장</button>
          </div>
        </div>
      )}

      {/* 🔒 수면 잠금 */}
      {section === 'lock' && (
        <div className="mypage-panel">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔒</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '20px', color: 'var(--accent)', marginBottom: '6px' }}>
              수면 잠금
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
              설정한 시간 동안 앱이 잠겨요.<br />
              비상 해제 시 긴 문장을 입력해야 해요 😅
            </div>
          </div>

          {/* 잠금 시간 선택 */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', textAlign: 'center' }}>
              잠금 시간 선택
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 4, 8].map(h => (
                <button key={h} onClick={() => setLockHours(h)} style={{
                  flex: 1, padding: '12px 0', borderRadius: '12px',
                  border: `1px solid ${lockHours === h ? 'rgba(110,231,247,0.5)' : 'var(--border)'}`,
                  background: lockHours === h ? 'rgba(110,231,247,0.12)' : 'var(--bg2)',
                  color: lockHours === h ? 'var(--accent)' : 'var(--muted)',
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: '20px',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  {h}h
                </button>
              ))}
            </div>
          </div>

          {/* 비상해제 안내 */}
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '10px', padding: '12px 14px', marginBottom: '16px',
            fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7,
          }}>
            ⚠️ 비상 해제 방법:<br />
            화면을 <strong style={{ color: '#f87171' }}>5번 연속 탭</strong> → 입력창 등장<br />
            <span style={{ color: '#f87171', fontWeight: 700 }}>"{LOCK_PHRASE}"</span><br />
            위 문장을 정확히 입력해야 해제돼요!
          </div>

          {/* 잠금 시작 버튼 */}
          <button onClick={handleStartLock} style={{
            width: '100%', padding: '14px',
            background: 'linear-gradient(135deg, rgba(110,231,247,0.15), rgba(167,139,250,0.15))',
            border: '1px solid rgba(110,231,247,0.3)',
            borderRadius: '12px', color: 'var(--accent)',
            fontFamily: "'Noto Sans KR', sans-serif", fontSize: '14px', fontWeight: 700,
            cursor: 'pointer', transition: 'all 0.2s',
          }}>
            🌙 {lockHours}시간 수면 잠금 시작하기
          </button>
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

      {/* 회원탈퇴 모달 */}
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
