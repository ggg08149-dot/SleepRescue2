import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const AUTO_LOGIN_KEY = 'sleeprescue_auto_login';

function Login({ goHome, goSignUp }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [autoLogin, setAutoLogin] = useState(false);
  const { loading, loginUser }  = useAuth();

  // 자동로그인 저장 정보 불러오기
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTO_LOGIN_KEY);
      if (saved) {
        const { email: savedEmail, password: savedPw } = JSON.parse(saved);
        setEmail(savedEmail || '');
        setPassword(savedPw || '');
        setAutoLogin(true);
      }
    } catch (e) {}
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }

    const data = await loginUser(email, password);
    if (data.success) {
      // 자동로그인 체크 시 저장 / 해제 시 삭제
      if (autoLogin) {
        localStorage.setItem(AUTO_LOGIN_KEY, JSON.stringify({ email, password }));
      } else {
        localStorage.removeItem(AUTO_LOGIN_KEY);
      }
      localStorage.setItem('token', data.token);
      localStorage.setItem('user_idx', data.user_idx);

      const idForCoaching = data.user_idx || data.id || 1008; 
      localStorage.setItem('coaching_user_id', idForCoaching); // 이름을 유니크하게!

      goHome(data.userName, data.userEmail, data.userId);
    } else {
      setError(data.message || '서버 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.');
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-bg-circle auth-bg-circle--1" />
      <div className="auth-bg-circle auth-bg-circle--2" />

      <div className="auth-logo-area">
        <div className="auth-logo-badge">AI SLEEP RESCUE</div>
        <div className="auth-logo-title">수면<span>구조대</span></div>
        <div className="auth-logo-sub">당신의 수면을 분석하고 개선합니다</div>
      </div>

      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-card-title">로그인</div>
          <div className="auth-card-sub">계정에 접속하세요</div>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="auth-input-group">
            <label className="auth-label">이메일</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">✉</span>
              <input
                type="text"
                className="auth-input"
                placeholder="example@email.com"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-label">비밀번호</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔒</span>
              <input
                type={showPw ? 'text' : 'password'}
                className="auth-input"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                autoComplete="current-password"
              />
              <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                {showPw ? '숨김' : '표시'}
              </button>
            </div>
          </div>

          {/* 자동로그인 체크박스 */}
          <div
            onClick={() => setAutoLogin(!autoLogin)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              cursor: 'pointer', marginTop: '2px', marginBottom: '4px',
            }}
          >
            <div style={{
              width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
              border: `1.5px solid ${autoLogin ? 'var(--accent)' : 'rgba(255,255,255,0.2)'}`,
              background: autoLogin ? 'var(--accent)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', color: '#0b0b13', fontWeight: 700,
              transition: 'all 0.2s ease',
            }}>
              {autoLogin && '✓'}
            </div>
            <span style={{ fontSize: '13px', color: autoLogin ? 'var(--accent)' : 'rgba(255,255,255,0.5)', transition: 'color 0.2s' }}>
              자동 로그인
            </span>
            {autoLogin && (
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>
                정보가 저장됩니다
              </span>
            )}
          </div>

          {error && (
            <div className="auth-error">
              <span>⚠</span> {error}
            </div>
          )}

          <button
            type="submit"
            className={`auth-submit-btn ${loading ? 'auth-submit-btn--loading' : ''}`}
            disabled={loading}
          >
            {loading ? <span className="auth-spinner" /> : '로그인'}
          </button>
        </form>

        <div className="auth-divider">
          <span>계정이 없으신가요?</span>
        </div>

        <button className="auth-secondary-btn" onClick={goSignUp}>
          회원가입 하기 →
        </button>
      </div>

      <div className="auth-footer">
        로그인 시 <span>서비스 이용약관</span>에 동의하는 것으로 간주합니다
      </div>
    </div>
  );
}

export default Login;
