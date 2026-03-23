import React, { useState, useRef } from 'react';

function Analyze({ backHome, updateResult, startCoaching }) {
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [drinks, setDrinks] = useState([]);
  const [result, setResult] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const shadowRef = useRef(null);
  const pctRef = useRef(null);
  const statusRef = useRef(null);
  const resultRef = useRef(null);

  const toggleDrink = (drink) => {
    setDrinks(prev =>
      prev.includes(drink) ? prev.filter(d => d !== drink) : [...prev, drink]
    );
  };

  const doScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScanned(true);
      let cur = 0;
      const timer = setInterval(() => {
        cur = Math.min(cur + 1.2, 72);
        if (pctRef.current) pctRef.current.textContent = Math.round(cur) + '%';
        if (shadowRef.current) {
          shadowRef.current.setAttribute('opacity', (cur / 100) * 0.85);
          shadowRef.current.setAttribute('ry', 8 + (cur / 100) * 18);
        }
        if (cur >= 72) {
          clearInterval(timer);
          if (statusRef.current) statusRef.current.textContent = '위험 단계';
        }
      }, 18);
    }, 1500);
  };

  const doAnalyze = () => {
    const res = {
      darkCircle: 72,
      sleepScore: 4.2,
      avg3: 70,
      fatigue: 'high',
    };
    setResult(res);
    updateResult(res);
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSelectPlan = (n) => {
    setSelectedPlan(n);
  };

  const handleStartCoaching = () => {
    if (!selectedPlan) return;
    startCoaching(selectedPlan);
  };

  const getFatigueStyle = () => {
    if (!result) return null;
    if (result.fatigue === 'high') return {
      bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)',
      color: '#ef4444', icon: '🔴', label: '높음 — 즉각 조치 필요'
    };
    if (result.fatigue === 'mid') return {
      bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)',
      color: '#f59e0b', icon: '🟡', label: '주의 — 관리 필요'
    };
    return {
      bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)',
      color: '#22c55e', icon: '🟢', label: '낮음 — 양호한 상태'
    };
  };

  const fs = getFatigueStyle();
  const drinkList = ['☕ 아메리카노', '🧋 라떼', '⚡ 에너지음료', '🍵 녹차', '🚫 없음'];

  return (
    <div className="analyze-screen">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <button onClick={() => backHome()} style={{
          background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted)',
          padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
          fontFamily: "'Noto Sans KR', sans-serif", fontSize: '12px'
        }}>← 뒤로</button>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', color: 'var(--accent)', letterSpacing: '1px' }}>
          DARK CIRCLE SCAN
        </div>
      </div>

      {/* 웹캠 영역 */}
      <div className="cam-box-big">
        <div className="cam-preview">
          <div className="cam-scan-anim"></div>
          {scanning ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '40px' }}>👁</div>
              <div style={{ fontSize: '10px', color: '#6ee7f7', marginTop: '6px' }}>다크서클 분석중...</div>
            </div>
          ) : !scanned ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px' }}>📷</div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>카메라 연결 대기중</div>
            </div>
          ) : (
            <div className="eye-section">
              <div className="eye-wrap">
                <svg viewBox="0 0 160 110" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="dcGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4a1a2a" stopOpacity="0"/>
                      <stop offset="100%" stopColor="#9b2335" stopOpacity="0.9"/>
                    </linearGradient>
                  </defs>
                  <path d="M10 55 Q80 5 150 55 Q80 105 10 55 Z" fill="#e8e8f0" opacity="0.9"/>
                  <ellipse ref={shadowRef} cx="80" cy="80" rx="52" ry="8" fill="url(#dcGrad)" opacity="0"/>
                  <circle cx="80" cy="55" r="26" fill="#1a3a6e"/>
                  <circle cx="80" cy="55" r="13" fill="#050508"/>
                  <circle cx="88" cy="48" r="5" fill="rgba(255,255,255,0.6)"/>
                  <path d="M25 22 Q80 10 135 22" fill="none" stroke="#888" strokeWidth="3" strokeLinecap="round" opacity="0.7"/>
                  <path d="M10 55 Q80 5 150 55" fill="none" stroke="#222" strokeWidth="3" opacity="0.8"/>
                  <path d="M20 60 Q80 100 140 60" fill="none" stroke="#333" strokeWidth="2" opacity="0.6"/>
                </svg>
              </div>
              <div style={{ flex: 1, textAlign: 'center' }}>
                <div ref={pctRef} style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '42px', color: '#ef4444', lineHeight: 1 }}>0%</div>
                <div ref={statusRef} style={{ fontSize: '11px', color: '#f87171', fontWeight: 700, marginTop: '2px' }}>분석 중...</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                  최근 3일 대비 <span style={{ color: '#ef4444' }}>+20%</span>
                </div>
                <div style={{ marginTop: '10px' }}>
                  {[{ l: '3일 전', v: 68, c: '#f59e0b' }, { l: '2일 전', v: 71, c: '#f59e0b' }, { l: '오늘', v: 72, c: '#ef4444' }, { l: '3일 평균', v: 70, c: '#ef4444' }]
                    .map(b => (
                      <div key={b.l} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', width: '48px', flexShrink: 0 }}>{b.l}</div>
                        <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${b.v}%`, background: b.c, borderRadius: '3px', transition: 'width 1.2s ease' }}></div>
                        </div>
                        <div style={{ fontSize: '10px', color: b.c, width: '28px', textAlign: 'right', fontFamily: "'Bebas Neue', sans-serif" }}>{b.v}%</div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="scan-btn" onClick={doScan}>📷 촬영 시작</button>
          <button onClick={() => setScanned(false)} style={{
            background: 'var(--bg3)', border: '1px solid var(--border)', color: 'var(--muted)',
            padding: '10px 16px', borderRadius: '10px', fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: '13px', cursor: 'pointer'
          }}>↺ 재촬영</button>
        </div>
      </div>

      {/* 생활 패턴 입력 */}
      <div className="section-title">생활 패턴 입력</div>
      <div className="input-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="input-row">
            <div className="input-group"><div className="input-label">운동시간 (분)</div><input className="input-field" type="number" placeholder="45"/></div>
            <div className="input-group"><div className="input-label">근무시간 (h)</div><input className="input-field" type="number" placeholder="9"/></div>
            <div className="input-group"><div className="input-label">수면시간 (h)</div><input className="input-field" type="number" placeholder="5"/></div>
          </div>
          <div className="input-row">
            <div className="input-group"><div className="input-label">폰 사용 (h)</div><input className="input-field" type="number" placeholder="6"/></div>
            <div className="input-group"><div className="input-label">낮잠 (분)</div><input className="input-field" type="number" placeholder="0"/></div>
            <div className="input-group"><div className="input-label">전날 수면 (h)</div><input className="input-field" type="number" placeholder="6"/></div>
          </div>
          <div className="input-group">
            <div className="input-label">카페인 섭취량</div>
            <div className="drink-row">
              {drinkList.map(d => (
                <div key={d} className={`drink-btn ${drinks.includes(d) ? 'sel' : ''}`} onClick={() => toggleDrink(d)}>{d}</div>
              ))}
            </div>
          </div>
          <button className="analyze-btn" onClick={doAnalyze}>🔍 AI 분석 시작하기</button>
        </div>
      </div>

      {/* 분석 결과 */}
      {result && fs && (
        <div ref={resultRef}>
          <div className="section-title">분석 결과</div>

          {/* 피로도 경고 배너 */}
          <div style={{
            background: fs.bg, border: `1px solid ${fs.border}`,
            borderRadius: '12px', padding: '14px', marginBottom: '12px',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <div style={{ fontSize: '28px', flexShrink: 0 }}>{fs.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>현재 피로도 상태</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', color: fs.color, lineHeight: 1 }}>{fs.label}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '3px' }}>
                다크서클 {result.darkCircle}% · 수면점수 {result.sleepScore}pts · 3일 평균 {result.avg3}%
              </div>
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '36px', color: fs.color, lineHeight: 1 }}>{result.darkCircle}</div>
              <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)' }}>피로지수</div>
            </div>
          </div>

          {/* 플랜 선택 */}
          <div className="section-title">수면 코칭 플랜 선택</div>
          <div className="plan-grid">
            {[
              { n: 1, title: '1일 플랜', sub: '빠른 응급 케어', desc: '오늘 당장 실천할 3가지' },
              { n: 7, title: '7일 플랜', sub: '단기 집중 케어', desc: '일주일 루틴 개선' },
              { n: 15, title: '15일 플랜', sub: '장기 자기관리', desc: '습관 정착 완전 개선' },
            ].map(p => (
              <div key={p.n}
                className="plan-btn"
                onClick={() => handleSelectPlan(p.n)}
                style={selectedPlan === p.n ? { borderColor: 'var(--accent)', background: 'rgba(110,231,247,0.1)' } : {}}
              >
                <div className="plan-btn-title">{p.title}</div>
                <div className="plan-btn-sub">{p.sub}</div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>{p.desc}</div>
              </div>
            ))}
          </div>

          {/* 코칭 시작 버튼 */}
          {selectedPlan && (
            <button
              className="analyze-btn"
              onClick={handleStartCoaching}
              style={{ background: 'var(--accent2)', marginTop: '4px' }}
            >
              💬 {selectedPlan}일 플랜으로 코칭 시작하기 →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default Analyze;
