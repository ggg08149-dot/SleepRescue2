import React, { useState } from 'react';

function SignUp({ goLogin, goHome }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    age: '',
    sleepGoal: '7',
    wakeTime: '07:00',
    sleepIssue: [],
  });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const sleepIssues = [
    { id: 'insomnia', label: '불면증' },
    { id: 'snoring', label: '코골이' },
    { id: 'darkcircle', label: '다크서클' },
    { id: 'fatigue', label: '만성피로' },
    { id: 'earlyWake', label: '새벽 각성' },
    { id: 'oversleep', label: '과수면' },
  ];

  const update = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const toggleIssue = (id) => {
    setForm(prev => ({
      ...prev,
      sleepIssue: prev.sleepIssue.includes(id)
        ? prev.sleepIssue.filter(i => i !== id)
        : [...prev.sleepIssue, id],
    }));
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = '이름을 입력해주세요.';
    if (!form.email) newErrors.email = '이메일을 입력해주세요.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = '올바른 이메일 형식이 아닙니다.';
    if (!form.password) newErrors.password = '비밀번호를 입력해주세요.';
    else if (form.password.length < 6) newErrors.password = '비밀번호는 6자 이상이어야 합니다.';
    if (form.password !== form.passwordConfirm) newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name    : form.name,
          email   : form.email,
          password: form.password,
        })
      });

      const data = await response.json();

      if (data.success) {
        goHome(form.name, form.email);
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('서버 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };  // ← 여기가 빠져있었어요!

  const progressPct = step === 1 ? 50 : 100;

  return (
    <div className="auth-screen">
      <div className="auth-bg-circle auth-bg-circle--1" />
      <div className="auth-bg-circle auth-bg-circle--2" />

      <div className="auth-signup-header">
        <button className="auth-back-btn" onClick={step === 1 ? goLogin : () => setStep(1)}>
          ← 뒤로
        </button>
        <div className="auth-step-info">
          <span className="auth-step-text">{step} / 2단계</span>
        </div>
      </div>

      <div className="auth-progress-wrap">
        <div className="auth-progress-bar">
          <div className="auth-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <div className="auth-progress-steps">
          <span className={step >= 1 ? 'active' : ''}>기본 정보</span>
          <span className={step >= 2 ? 'active' : ''}>수면 정보</span>
        </div>
      </div>

      <div className="auth-card">
        {step === 1 ? (
          <>
            <div className="auth-card-header">
              <div className="auth-card-title">회원가입</div>
              <div className="auth-card-sub">기본 정보를 입력해주세요</div>
            </div>

            <div className="auth-form">
              <div className="auth-input-group">
                <label className="auth-label">이름</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">👤</span>
                  <input
                    type="text"
                    className={`auth-input ${errors.name ? 'auth-input--error' : ''}`}
                    placeholder="홍길동"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                  />
                </div>
                {errors.name && <div className="auth-field-error">{errors.name}</div>}
              </div>

              <div className="auth-input-group">
                <label className="auth-label">이메일</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">✉</span>
                  <input
                    type="text"
                    className={`auth-input ${errors.email ? 'auth-input--error' : ''}`}
                    placeholder="example@email.com"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                  />
                </div>
                {errors.email && <div className="auth-field-error">{errors.email}</div>}
              </div>

              <div className="auth-input-group">
                <label className="auth-label">비밀번호 <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(6자 이상)</span></label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">🔒</span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    className={`auth-input ${errors.password ? 'auth-input--error' : ''}`}
                    placeholder="비밀번호를 입력하세요"
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                  />
                  <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(!showPw)}>
                    {showPw ? '숨김' : '표시'}
                  </button>
                </div>
                {errors.password && <div className="auth-field-error">{errors.password}</div>}
              </div>

              <div className="auth-input-group">
                <label className="auth-label">비밀번호 확인</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">🔒</span>
                  <input
                    type="password"
                    className={`auth-input ${errors.passwordConfirm ? 'auth-input--error' : ''}`}
                    placeholder="비밀번호를 다시 입력하세요"
                    value={form.passwordConfirm}
                    onChange={(e) => update('passwordConfirm', e.target.value)}
                  />
                  {form.passwordConfirm && form.password === form.passwordConfirm && (
                    <span className="auth-input-check">✓</span>
                  )}
                </div>
                {errors.passwordConfirm && <div className="auth-field-error">{errors.passwordConfirm}</div>}
              </div>

              <button className="auth-submit-btn" onClick={handleNext}>
                다음 단계 →
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="auth-card-header">
              <div className="auth-card-title">수면 정보</div>
              <div className="auth-card-sub">맞춤 분석을 위해 알려주세요</div>
            </div>

            <div className="auth-form">
              <div className="auth-input-group">
                <label className="auth-label">
                  목표 수면 시간
                  <span className="auth-label-val">{form.sleepGoal}시간</span>
                </label>
                <div className="auth-slider-wrap">
                  <span className="auth-slider-min">5h</span>
                  <input
                    type="range"
                    min="5" max="10" step="0.5"
                    value={form.sleepGoal}
                    onChange={(e) => update('sleepGoal', e.target.value)}
                    className="auth-slider"
                  />
                  <span className="auth-slider-max">10h</span>
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-label">주로 일어나는 시간</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">⏰</span>
                  <input
                    type="time"
                    className="auth-input"
                    value={form.wakeTime}
                    onChange={(e) => update('wakeTime', e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-label">현재 수면 고민 <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(복수 선택 가능)</span></label>
                <div className="auth-issue-grid">
                  {sleepIssues.map(issue => (
                    <button
                      key={issue.id}
                      type="button"
                      className={`auth-issue-chip ${form.sleepIssue.includes(issue.id) ? 'auth-issue-chip--active' : ''}`}
                      onClick={() => toggleIssue(issue.id)}
                    >
                      {form.sleepIssue.includes(issue.id) && <span className="auth-chip-check">✓ </span>}
                      {issue.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className={`auth-submit-btn ${loading ? 'auth-submit-btn--loading' : ''}`}
                onClick={handleSignUp}
                disabled={loading}
              >
                {loading ? <span className="auth-spinner" /> : '🚀 가입 완료하기'}
              </button>
            </div>
          </>
        )}
      </div>

      {step === 1 && (
        <div className="auth-footer">
          이미 계정이 있으신가요?{' '}
          <span onClick={goLogin} style={{ color: 'var(--accent)', cursor: 'pointer' }}>
            로그인
          </span>
        </div>
      )}
    </div>
  );
}

export default SignUp;
