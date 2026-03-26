import React, { useState } from 'react';

const pad = (n) => String(n).padStart(2, '0');

function CalendarPicker({ value, onChange }) {
  const today = new Date();
  const initDate = value ? new Date(value) : today;

  const [year, setYear] = useState(initDate.getFullYear());
  const [month, setMonth] = useState(initDate.getMonth());
  const [tempDay, setTempDay] = useState(value ? initDate.getDate() : null);
  const [showYearList, setShowYearList] = useState(false);

  const thisYear = today.getFullYear();
  const yearList = Array.from({ length: thisYear - 1919 }, (_, i) => thisYear - i); // 올해 ~ 1920

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const weeks = ['일', '월', '화', '수', '목', '금', '토'];

  const prevMonth = () => { setMonth(m => m === 0 ? 11 : m - 1); setTempDay(null); };
  const nextMonth = () => { setMonth(m => m === 11 ? 0 : m + 1); setTempDay(null); };

  const isAfterToday = (d) => new Date(year, month, d) > today;

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const handleConfirm = () => {
    if (!tempDay) return;
    onChange(`${year}-${pad(month + 1)}-${pad(tempDay)}`);
  };

  return (
    <div style={{
      position: 'absolute', top: '110%', left: 0, zIndex: 9999,
      background: 'var(--card, #1e293b)', border: '1px solid var(--border, #334155)',
      borderRadius: '14px', padding: '16px', width: '280px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      {/* 헤더 - 연도 (클릭 시 목록) */}
      <div style={{ position: 'relative', marginBottom: '6px' }}>
        <button
          type="button"
          onClick={() => setShowYearList(v => !v)}
          style={{
            width: '100%', background: 'var(--border, #334155)', border: 'none',
            borderRadius: '8px', padding: '7px 12px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            color: 'var(--text)', fontWeight: 700, fontSize: '14px',
          }}
        >
          {year}년 <span style={{ fontSize: '10px', color: 'var(--muted)' }}>{showYearList ? '▲' : '▼'}</span>
        </button>

        {showYearList && (
          <div style={{
            position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 10000,
            background: 'var(--card, #1e293b)', border: '1px solid var(--border, #334155)',
            borderRadius: '10px', maxHeight: '180px', overflowY: 'auto',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}>
            {yearList.map(y => (
              <button
                key={y}
                type="button"
                onClick={() => { setYear(y); setTempDay(null); setShowYearList(false); }}
                style={{
                  width: '100%', background: y === year ? 'var(--accent, #6366f1)' : 'transparent',
                  border: 'none', padding: '8px 0', cursor: 'pointer',
                  color: y === year ? '#fff' : 'var(--text)',
                  fontWeight: y === year ? 700 : 400, fontSize: '13px',
                }}
              >
                {y}년
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 헤더 - 월 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <button type="button" onClick={prevMonth}
          style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '18px', padding: '0 6px' }}>
          ‹
        </button>
        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text)' }}>
          {month + 1}월
        </span>
        <button type="button" onClick={nextMonth}
          style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '18px', padding: '0 6px' }}>
          ›
        </button>
      </div>

      {/* 요일 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '6px' }}>
        {weeks.map((w, i) => (
          <div key={w} style={{
            textAlign: 'center', fontSize: '11px', fontWeight: 600,
            color: i === 0 ? '#f87171' : i === 6 ? '#60a5fa' : 'var(--muted)',
            padding: '4px 0',
          }}>{w}</div>
        ))}
      </div>

      {/* 날짜 grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />;
          const disabled = isAfterToday(day);
          const selected = tempDay === day;
          const col = idx % 7;
          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => setTempDay(day)}
              style={{
                border: 'none',
                borderRadius: '8px',
                padding: '6px 0',
                fontSize: '13px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: selected ? 'var(--accent, #6366f1)' : 'transparent',
                color: disabled ? 'var(--muted)' : selected ? '#fff'
                  : col === 0 ? '#f87171' : col === 6 ? '#60a5fa' : 'var(--text)',
                fontWeight: selected ? 700 : 400,
                opacity: disabled ? 0.3 : 1,
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* 확인 버튼 */}
      <button
        type="button"
        onClick={handleConfirm}
        disabled={!tempDay}
        style={{
          marginTop: '14px', width: '100%',
          padding: '9px 0', borderRadius: '10px', border: 'none',
          background: tempDay ? 'var(--accent, #6366f1)' : 'var(--border, #334155)',
          color: tempDay ? '#fff' : 'var(--muted)',
          fontWeight: 600, fontSize: '14px',
          cursor: tempDay ? 'pointer' : 'not-allowed',
        }}
      >
        확인
      </button>
    </div>
  );
}

function SignUp({ goLogin, goHome }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirm: '',
    birthdate: '',
    gender: '',
    sleepGoal: '7',
    wakeTime: '07:00',
    sleepIssue: [],
  });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCal, setShowCal] = useState(false);

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
    if (!form.birthdate) newErrors.birthdate = '생년월일을 선택해주세요.';
    if (!form.gender) newErrors.gender = '성별을 선택해주세요.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:7000/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name     : form.name,
          email    : form.email,
          password : form.password,
          birthdate: form.birthdate,
          gender   : form.gender,
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
  };

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

              {/* 생년월일 */}
              <div className="auth-input-group">
                <label className="auth-label">
                  생년월일 <span style={{ color: '#f87171', fontSize: '11px' }}>*필수</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <div
                    onClick={() => setShowCal(v => !v)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      cursor: 'pointer', padding: '10px 14px',
                      borderRadius: '10px',
                      border: `1.5px solid ${errors.birthdate ? '#f87171' : 'var(--border, #334155)'}`,
                      background: 'var(--input-bg, transparent)',
                      userSelect: 'none',
                    }}
                  >
                    <span style={{ fontSize: '16px', lineHeight: 1 }}>📅</span>
                    <span style={{
                      flex: 1, fontSize: '14px',
                      color: form.birthdate ? 'var(--text)' : 'var(--muted)',
                    }}>
                      {form.birthdate
                        ? `${form.birthdate.slice(0,4)}년 ${Number(form.birthdate.slice(5,7))}월 ${Number(form.birthdate.slice(8,10))}일`
                        : '생년월일을 선택하세요'}
                    </span>
                    <span style={{ color: 'var(--muted)', fontSize: '12px' }}>{showCal ? '▲' : '▼'}</span>
                  </div>

                  {showCal && (
                    <CalendarPicker
                      value={form.birthdate}
                      onChange={(date) => {
                        update('birthdate', date);
                        setShowCal(false);
                      }}
                    />
                  )}
                </div>
                {errors.birthdate && <div className="auth-field-error">{errors.birthdate}</div>}
              </div>

              {/* 성별 */}
              <div className="auth-input-group">
                <label className="auth-label">
                  성별 <span style={{ color: '#f87171', fontSize: '11px' }}>*필수</span>
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[{ val: 'M', label: '남성' }, { val: 'F', label: '여성' }].map(({ val, label }) => (
                    <label
                      key={val}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        cursor: 'pointer', fontSize: '14px',
                        padding: '10px 20px',
                        borderRadius: '10px',
                        border: `1.5px solid ${form.gender === val ? 'var(--accent)' : 'var(--border, #334155)'}`,
                        background: form.gender === val ? 'rgba(99,102,241,0.12)' : 'transparent',
                        color: form.gender === val ? 'var(--accent)' : 'var(--text)',
                        transition: 'all 0.15s',
                        flex: 1, justifyContent: 'center',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.gender === val}
                        onChange={() => update('gender', form.gender === val ? '' : val)}
                        style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {errors.gender && <div className="auth-field-error">{errors.gender}</div>}
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

    </div>
  );
}

export default SignUp;
