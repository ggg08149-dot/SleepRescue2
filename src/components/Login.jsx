import React, { useState } from 'react';

function Login({ goHome, goSignUp }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
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

    setLoading(true);

    // 임시 로그인 처리 (백엔드 연결 전 UI 테스트용)
    setTimeout(() => {
      setLoading(false);
      // 실제 백엔드 연결 시 이 부분을 API 호출로 교체
      goHome(email.split('@')[0]);
    }, 1200);
  };

  return (
    <div className="auth-screen">
      {/* 배경 장식 */}
      <div className="auth-bg-circle auth-bg-circle--1" />
      <div className="auth-bg-circle auth-bg-circle--2" />

      {/* 로고 영역 */}
      <div className="auth-logo-area">
        <div className="auth-logo-badge">AI SLEEP RESCUE</div>
        <div className="auth-logo-title">수면<span>구조대</span></div>
        <div className="auth-logo-sub">당신의 수면을 분석하고 개선합니다</div>
      </div>

      {/* 로그인 카드 */}
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-card-title">로그인</div>
          <div className="auth-card-sub">계정에 접속하세요</div>
        </div>

        <form onSubmit={handleLogin} className="auth-form">
          {/* 이메일 */}
          <div className="auth-input-group">
            <label className="auth-label">이메일</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">✉</span>
              <input
                type="text"
                className="auth-input"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                autoComplete="email"
              />
            </div>
          </div>

          {/* 비밀번호 */}
          <div className="auth-input-group">
            <label className="auth-label">비밀번호</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔒</span>
              <input
                type={showPw ? 'text' : 'password'}
                className="auth-input"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="auth-pw-toggle"
                onClick={() => setShowPw(!showPw)}
              >
                {showPw ? '숨김' : '표시'}
              </button>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="auth-error">
              <span>⚠</span> {error}
            </div>
          )}

          {/* 로그인 버튼 */}
          <button
            type="submit"
            className={`auth-submit-btn ${loading ? 'auth-submit-btn--loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <span className="auth-spinner" />
            ) : (
              '로그인'
            )}
          </button>
        </form>

        {/* 구분선 */}
        <div className="auth-divider">
          <span>계정이 없으신가요?</span>
        </div>

        {/* 회원가입 이동 */}
        <button className="auth-secondary-btn" onClick={goSignUp}>
          회원가입 하기 →
        </button>
      </div>

      {/* 하단 안내 */}
      <div className="auth-footer">
        로그인 시 <span>서비스 이용약관</span>에 동의하는 것으로 간주합니다
      </div>
    </div>
  );
}

export default Login;
