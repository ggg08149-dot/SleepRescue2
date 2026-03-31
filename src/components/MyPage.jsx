import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

const LOCK_KEY  = 'sleeprescue_lock_until';
const ALARM_KEY = 'sleeprescue_alarms';
const LOCK_PHRASE = '저는 오늘 수면을 포기합니다';

// ─── 알람 문구 ────────────────────────────────────
const SLEEP_MESSAGES = [
  "수면구조대 긴급 출동 🚑 지금 당장 누우세요!",
  "🚨 수면구조대 경보 발령! 다크서클 위험 수치 감지됨",
  "수면구조대장 명령 — 폰 내려놓고 즉시 취침! 🛌",
  "🚑 수면구조대가 당신의 눈 밑을 걱정하고 있어요. 지금 자세요!",
];

const WAKE_MESSAGES = [
  "🚑 수면구조대 보고서 도착! 오늘의 수면 점수를 확인하세요",
  "수면구조대 기상 확인 완료 ✅ 오늘 다크서클 검사 받으러 가볼까요?",
  "🌅 수면구조대 일일 브리핑 시작! 어젯밤 수면은 어떠셨나요?",
  "🚑 수면구조대 모닝콜! 오늘도 건강한 하루 시작해봐요",
];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ─── 알람 팝업 ────────────────────────────────────
function AlarmPopup({ message, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '30px',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1a0a2e, #0b0b13)',
        border: '1px solid rgba(110,231,247,0.3)',
        borderRadius: '20px', padding: '32px 24px',
        textAlign: 'center', maxWidth: '320px', width: '100%',
      }}>
        <div style={{ fontSize: '52px', marginBottom: '16px' }}>🚑</div>
        <div style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '18px', color: 'var(--accent)',
          letterSpacing: '1px', marginBottom: '16px',
        }}>
          수면구조대 알림
        </div>
        <div style={{
          fontSize: '14px', color: '#fff',
          lineHeight: 1.8, marginBottom: '24px',
          fontFamily: "'Noto Sans KR', sans-serif",
        }}>
          {message}
        </div>
        <button onClick={onClose} style={{
          width: '100%', padding: '13px',
          background: 'rgba(110,231,247,0.12)',
          border: '1px solid rgba(110,231,247,0.3)',
          borderRadius: '12px', color: 'var(--accent)',
          fontFamily: "'Noto Sans KR', sans-serif",
          fontSize: '14px', fontWeight: 700, cursor: 'pointer',
        }}>
          확인했어요 ✓
        </button>
      </div>
    </div>
  );
}

// ─── 잠금 화면 ────────────────────────────────────
function LockScreen({ lockUntil, onUnlock }) {
  const [remaining, setRemaining]         = useState('');
  const [showEmergency, setShowEmergency] = useState(false);
  const [phrase, setPhrase]               = useState('');
  const [shakeErr, setShakeErr]           = useState(false);
  const [tapCount, setTapCount]           = useState(0);

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

  useEffect(() => {
    const block = () => window.history.pushState(null, null, window.location.href);
    window.history.pushState(null, null, window.location.href);
    window.addEventListener('popstate', block);
    return () => window.removeEventListener('popstate', block);
  }, []);

  const handleTap = () => {
    if (showEmergency) return;
    const next = tapCount + 1;
    setTapCount(next);
    if (next >= 5) { setShowEmergency(true); setTapCount(0); }
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
    <div onClick={handleTap} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(135deg, #0b0b13, #1a0a2e)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '30px', cursor: 'default',
    }}>
      <div style={{ fontSize: '72px', marginBottom: '20px', filter: 'drop-shadow(0 0 20px rgba(110,231,247,0.4))' }}>🌙</div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', color: 'var(--accent)', letterSpacing: '2px', marginBottom: '8px' }}>
        수면 잠금 중
      </div>
      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px', textAlign: 'center' }}>
        스마트폰을 내려놓고 수면을 취하세요 😴
      </div>
      <div style={{ background: 'rgba(110,231,247,0.08)', border: '1px solid rgba(110,231,247,0.2)', borderRadius: '20px', padding: '24px 40px', textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px', letterSpacing: '1px' }}>잠금 해제까지</div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '36px', color: 'var(--accent)', letterSpacing: '2px' }}>{remaining}</div>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '16px 20px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 1.8, marginBottom: '40px', maxWidth: '300px' }}>
        💡 수면 중 스마트폰 블루라이트는<br />멜라토닌 분비를 억제해요.<br />눈을 감고 천천히 호흡해보세요.
      </div>
      {!showEmergency && (
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.15)', userSelect: 'none' }}>
          {tapCount > 0 ? `화면을 ${5 - tapCount}번 더 누르세요` : '　'}
        </div>
      )}
      {showEmergency && (
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '320px' }}>
          <div style={{ fontSize: '12px', color: '#f87171', textAlign: 'center', marginBottom: '12px', fontWeight: 700 }}>⚠️ 비상 해제</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: '10px', lineHeight: 1.7 }}>
            아래 문장을 정확히 입력하면 해제됩니다:<br />
            <span style={{ color: '#f87171', fontWeight: 700 }}>"{LOCK_PHRASE}"</span>
          </div>
          <input type="text" value={phrase} onChange={e => setPhrase(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleEmergencyTry(); }}
            placeholder="위 문장을 그대로 입력하세요" autoFocus
            style={{ width: '100%', padding: '12px 14px', background: shakeErr ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', border: `1px solid ${shakeErr ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.15)'}`, borderRadius: '10px', color: '#fff', fontFamily: "'Noto Sans KR', sans-serif", fontSize: '12px', outline: 'none', boxSizing: 'border-box' }} />
          {shakeErr && <div style={{ fontSize: '11px', color: '#f87171', marginTop: '6px', textAlign: 'center' }}>문장이 정확하지 않아요. 다시 입력해주세요.</div>}
          <button onClick={handleEmergencyTry} style={{ width: '100%', marginTop: '10px', padding: '12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '10px', color: '#f87171', fontFamily: "'Noto Sans KR', sans-serif", fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>해제하기</button>
          <button onClick={() => { setShowEmergency(false); setPhrase(''); setTapCount(0); }} style={{ width: '100%', marginTop: '8px', padding: '10px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif", fontSize: '12px' }}>취소</button>
        </div>
      )}
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

  // 알람 상태
  const [sleepAlarm, setSleepAlarm]     = useState('');  // 취침 알람 시간
  const [wakeAlarm, setWakeAlarm]       = useState('');  // 기상 알람 시간
  const [sleepAlarmOn, setSleepAlarmOn] = useState(false);
  const [wakeAlarmOn, setWakeAlarmOn]   = useState(false);
  const [alarmPopup, setAlarmPopup]     = useState(null); // 팝업 메시지
  const alarmRef = useRef(null);
  const lastFiredRef = useRef('');

  const [pwForm, setPwForm]             = useState({ currentPw: '', newPw: '', newPwConfirm: '' });
  const [currentPwValid, setCurrentPwValid] = useState(null);
  const [pwMatch, setPwMatch]           = useState(null);
  const { verifyPassword, changePassword } = useAuth();

  // 알람 로컬스토리지 불러오기
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(ALARM_KEY) || '{}');
      if (saved.sleepAlarm)   setSleepAlarm(saved.sleepAlarm);
      if (saved.wakeAlarm)    setWakeAlarm(saved.wakeAlarm);
      if (saved.sleepAlarmOn) setSleepAlarmOn(saved.sleepAlarmOn);
      if (saved.wakeAlarmOn)  setWakeAlarmOn(saved.wakeAlarmOn);
    } catch (e) {}
  }, []);

  // 알람 저장
  const saveAlarms = (data) => {
    localStorage.setItem(ALARM_KEY, JSON.stringify(data));
  };

  // 알람 체크 (1분마다)
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

      if (lastFiredRef.current === hhmm) return;

      if (sleepAlarmOn && sleepAlarm && hhmm === sleepAlarm) {
        setAlarmPopup(getRandom(SLEEP_MESSAGES));
        lastFiredRef.current = hhmm;
      }
      if (wakeAlarmOn && wakeAlarm && hhmm === wakeAlarm) {
        setAlarmPopup(getRandom(WAKE_MESSAGES));
        lastFiredRef.current = hhmm;
      }
    };

    alarmRef.current = setInterval(check, 10000); // 10초마다 체크
    return () => clearInterval(alarmRef.current);
  }, [sleepAlarm, wakeAlarm, sleepAlarmOn, wakeAlarmOn]);

  // 잠금 만료 확인
  useEffect(() => {
    if (lockUntil && Date.now() >= lockUntil) {
      setLockUntil(null);
      localStorage.removeItem(LOCK_KEY);
    }
  }, [lockUntil]);

  // 잠금 화면
  if (lockUntil && Date.now() < lockUntil) {
    return <LockScreen lockUntil={lockUntil} onUnlock={() => { setLockUntil(null); localStorage.removeItem(LOCK_KEY); }} />;
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
    { id: 'alarm',    icon: '⏰',  label: '수면 알람',        sub: '취침 & 기상 알람 설정' },
    { id: 'lock',     icon: '🔒',  label: '수면 잠금',        sub: '설정 시간 동안 앱 사용을 잠급니다' },
    { id: 'support',  icon: '💬',  label: '고객센터',         sub: '문의 및 도움말' },
  ];

  return (
    <div className="mypage-screen">
      {toast && <div className="mypage-toast">{toast}</div>}

      {/* 알람 팝업 */}
      {alarmPopup && <AlarmPopup message={alarmPopup} onClose={() => setAlarmPopup(null)} />}

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
        <div className="mypage-stat-box"><div className="mypage-stat-num">7일</div><div className="mypage-stat-label">연속 달성</div></div>
        <div className="mypage-stat-divider" />
        <div className="mypage-stat-box"><div className="mypage-stat-num">23회</div><div className="mypage-stat-label">총 분석</div></div>
        <div className="mypage-stat-divider" />
        <div className="mypage-stat-box"><div className="mypage-stat-num">6.8h</div><div className="mypage-stat-label">평균 수면</div></div>
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
              <button className="mypage-save-btn" onClick={() => { showToast('✓ 프로필 사진이 변경되었습니다'); setSection(null); }}>저장하기</button>
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
                  onBlur={e => verifyCurrentPassword(e.target.value)} style={{ paddingRight: '32px' }} />
                {currentPwValid === true  && <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#22c55e', fontSize: '18px' }}>✓</span>}
                {currentPwValid === false && <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#f87171', fontSize: '16px' }}>✗</span>}
              </div>
            </div>
            <div className="mypage-form-group">
              <label className="mypage-form-label">새 비밀번호</label>
              <input type="password" className="mypage-form-input" placeholder="새 비밀번호 입력 (6자 이상)"
                value={pwForm.newPw} onChange={e => { const v = e.target.value; setPwForm(p => ({...p, newPw: v})); setPwMatch(pwForm.newPwConfirm ? v === pwForm.newPwConfirm : null); }} />
            </div>
            <div className="mypage-form-group">
              <label className="mypage-form-label">새 비밀번호 확인</label>
              <input type="password" className="mypage-form-input" placeholder="새 비밀번호 재입력"
                value={pwForm.newPwConfirm} onChange={e => { const v = e.target.value; setPwForm(p => ({...p, newPwConfirm: v})); setPwMatch(v ? pwForm.newPw === v : null); }} />
              {pwMatch === true  && <div style={{ marginTop: '4px', fontSize: '12px', color: '#22c55e' }}>✓ 일치합니다</div>}
              {pwMatch === false && <div style={{ marginTop: '4px', fontSize: '12px', color: '#f87171' }}>✗ 일치하지 않습니다</div>}
            </div>
            <button className="mypage-save-btn" onClick={handleChangePassword}>변경 저장</button>
          </div>
        </div>
      )}

      {/* ⏰ 수면 알람 */}
      {section === 'alarm' && (
        <div className="mypage-panel">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>⏰</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '20px', color: 'var(--accent)', marginBottom: '6px' }}>
              수면 알람 설정
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
              수면구조대가 알맞은 시간에 알려드려요! 🚑
            </div>
          </div>

          {/* 취침 알람 */}
          <div style={{ background: 'rgba(110,231,247,0.06)', border: '1px solid rgba(110,231,247,0.2)', borderRadius: '14px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '3px' }}>🌙 취침 알람</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>잘 시간을 수면구조대가 알려드려요</div>
              </div>
              {/* 토글 */}
              <div onClick={() => {
                  const next = !sleepAlarmOn;
                  setSleepAlarmOn(next);
                  saveAlarms({ sleepAlarm, wakeAlarm, sleepAlarmOn: next, wakeAlarmOn });
                }}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer',
                  background: sleepAlarmOn ? 'var(--accent)' : 'rgba(255,255,255,0.15)',
                  position: 'relative', transition: 'all 0.2s',
                }}>
                <div style={{
                  position: 'absolute', top: '3px',
                  left: sleepAlarmOn ? '23px' : '3px',
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s',
                }} />
              </div>
            </div>
            <input type="time" value={sleepAlarm}
              onChange={e => {
                setSleepAlarm(e.target.value);
                saveAlarms({ sleepAlarm: e.target.value, wakeAlarm, sleepAlarmOn, wakeAlarmOn });
              }}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
                color: sleepAlarmOn ? 'var(--accent)' : 'var(--muted)',
                fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px',
                outline: 'none', boxSizing: 'border-box', textAlign: 'center',
              }} />
            {sleepAlarmOn && sleepAlarm && (
              <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--accent)', textAlign: 'center' }}>
                🚑 매일 {sleepAlarm} 에 수면구조대가 출동해요!
              </div>
            )}
          </div>

          {/* 기상 알람 */}
          <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '3px' }}>🌅 기상 알람</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>일어날 시간을 수면구조대가 알려드려요</div>
              </div>
              {/* 토글 */}
              <div onClick={() => {
                  const next = !wakeAlarmOn;
                  setWakeAlarmOn(next);
                  saveAlarms({ sleepAlarm, wakeAlarm, sleepAlarmOn, wakeAlarmOn: next });
                }}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer',
                  background: wakeAlarmOn ? '#f59e0b' : 'rgba(255,255,255,0.15)',
                  position: 'relative', transition: 'all 0.2s',
                }}>
                <div style={{
                  position: 'absolute', top: '3px',
                  left: wakeAlarmOn ? '23px' : '3px',
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s',
                }} />
              </div>
            </div>
            <input type="time" value={wakeAlarm}
              onChange={e => {
                setWakeAlarm(e.target.value);
                saveAlarms({ sleepAlarm, wakeAlarm: e.target.value, sleepAlarmOn, wakeAlarmOn });
              }}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
                color: wakeAlarmOn ? '#f59e0b' : 'var(--muted)',
                fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px',
                outline: 'none', boxSizing: 'border-box', textAlign: 'center',
              }} />
            {wakeAlarmOn && wakeAlarm && (
              <div style={{ marginTop: '8px', fontSize: '11px', color: '#f59e0b', textAlign: 'center' }}>
                🌅 매일 {wakeAlarm} 에 수면구조대 모닝콜이 와요!
              </div>
            )}
          </div>

          {/* 알람 문구 미리보기 */}
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>💬 알람 문구 미리보기</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>
              🌙 취침: <span style={{ color: 'var(--accent)' }}>"{getRandom(SLEEP_MESSAGES)}"</span>
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginTop: '6px' }}>
              🌅 기상: <span style={{ color: '#f59e0b' }}>"{getRandom(WAKE_MESSAGES)}"</span>
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
              * 알람마다 랜덤으로 다른 문구가 표시돼요 😊
            </div>
          </div>
        </div>
      )}

      {/* 🔒 수면 잠금 */}
      {section === 'lock' && (
        <div className="mypage-panel">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔒</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '20px', color: 'var(--accent)', marginBottom: '6px' }}>수면 잠금</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
              설정한 시간 동안 앱이 잠겨요.<br />비상 해제 시 긴 문장을 입력해야 해요 😅
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px', textAlign: 'center' }}>잠금 시간 선택</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[1, 2, 4, 8].map(h => (
                <button key={h} onClick={() => setLockHours(h)} style={{ flex: 1, padding: '12px 0', borderRadius: '12px', border: `1px solid ${lockHours === h ? 'rgba(110,231,247,0.5)' : 'var(--border)'}`, background: lockHours === h ? 'rgba(110,231,247,0.12)' : 'var(--bg2)', color: lockHours === h ? 'var(--accent)' : 'var(--muted)', fontFamily: "'Bebas Neue', sans-serif", fontSize: '20px', cursor: 'pointer', transition: 'all 0.2s' }}>
                  {h}h
                </button>
              ))}
            </div>
          </div>
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
            ⚠️ 비상 해제 방법:<br />
            화면을 <strong style={{ color: '#f87171' }}>5번 연속 탭</strong> → 입력창 등장<br />
            <span style={{ color: '#f87171', fontWeight: 700 }}>"{LOCK_PHRASE}"</span><br />
            위 문장을 정확히 입력해야 해제돼요!
          </div>
          <button onClick={handleStartLock} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, rgba(110,231,247,0.15), rgba(167,139,250,0.15))', border: '1px solid rgba(110,231,247,0.3)', borderRadius: '12px', color: 'var(--accent)', fontFamily: "'Noto Sans KR', sans-serif", fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
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
          <div className="mypage-menu-text"><div className="mypage-menu-label">로그아웃</div><div className="mypage-menu-sub">계정에서 나가기</div></div>
          <span className="mypage-menu-arrow">▶</span>
        </button>
        <button className="mypage-menu-item mypage-menu-item--danger" onClick={() => setShowWithdraw(true)}>
          <span className="mypage-menu-icon">⚠️</span>
          <div className="mypage-menu-text"><div className="mypage-menu-label" style={{ color: '#f87171' }}>회원탈퇴</div><div className="mypage-menu-sub">모든 데이터가 삭제됩니다</div></div>
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
