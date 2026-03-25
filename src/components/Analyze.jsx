import React, { useState, useRef } from 'react';

const getFatigueMessage = (fatigue, userName, causeName) => {
  if (fatigue === 'high') return `분석 결과, ${userName}님의 오늘의 피로도가 '높음' 상태예요. ${causeName}의 영향으로 다크서클이 평소보다 훨씬 짙게 측정되었으니, 오늘만큼은 수면 구조대의 특급 처방전에 몸을 맡겨보세요!`;
  if (fatigue === 'mid') return `수면 구조대가 분석해보니, 오늘 ${userName}님의 피로도가 '주의' 단계에 들어섰어요. 특히 ${causeName}의 영향으로 눈가가 평소보다 어두워진 상태예요.`;
  return `수면 구조대가 분석해보니, 오늘 ${userName}님의 피로는 안정적인 '낮음' 단계예요. ${causeName} 수치가 잘 관리되고 있어 눈가도 평소보다 훨씬 맑고 생기 있어 보이는 상태예요. 지금의 컨디션을 내일도 유지할 수 있도록 가벼운 수면 처방을 확인해 보세요.`;
};

const FATIGUE_LEVELS = [
  { key: 'high', label: '높음', icon: '🔥', color: '#ef4444', bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)' },
  { key: 'mid',  label: '주의', icon: '⚠️', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.5)' },
  { key: 'low',  label: '낮음', icon: '✅', color: '#22c55e', bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)' },
];

const PLAN_DATA = [
  { n: 1,  days: '1',  label: '1일 플랜',  desc: '내일 중요한 미팅이 있나요?\n안색 긴급 복구를 시작하세요.' },
  { n: 7,  days: '7',  label: '7일 플랜',  desc: '일주일만 투자하세요.\n내 눈가를 어둡게 만든 진짜 범인을 찾아드립니다.' },
  { n: 15, days: '15', label: '15일 플랜', desc: '만성 피로 탈출 프로젝트.\n다크서클 없는 맑은 아침을 약속합니다.' },
];

function Analyze({ backHome, updateResult, startCoaching, userName = '사용자' }) {
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [drinks, setDrinks] = useState([]);
  const [result, setResult] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  // -------------------------------------------------
  const [lifestyleData, setLifestyleData] = useState({
    workout: '',      // 운동시간 (분)
    phone: '',        // 폰 사용 시간 (h)
    workHours: '',    // 근무시간 (h)
    relaxation: ''    // 휴식시간 (h) - 낮잠
    });
  // ---------------------------------------------------
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

  const doAnalyze = async () => {
  // 입력값 검증
  if (!lifestyleData.workout || !lifestyleData.phone || 
      !lifestyleData.workHours || !lifestyleData.relaxation) {
    alert('운동시간, 폰 사용, 근무시간, 휴식시간을 모두 입력해주세요!');
    return;
  }

  // 카페인 값 변환 (선택된 음료에서 추출)
  let caffeineValue = '없음';
  if (drinks.includes('☕ 아메리카노')) caffeineValue = '아메리카노';
  else if (drinks.includes('🧋 라떼')) caffeineValue = '라떼';
  else if (drinks.includes('⚡ 에너지음료')) caffeineValue = '에너지음료';
  else if (drinks.includes('🍵 녹차')) caffeineValue = '녹차';

  // 운동시간 분 → 시간으로 변환
  const workoutHours = parseFloat(lifestyleData.workout) / 60;
  // 휴식시간 분 → 시간으로 변환
  const relaxationHours = parseFloat(lifestyleData.relaxation) / 60;

  try {
    // 백엔드 API 호출
    const response = await fetch('http://localhost:5000/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workout: workoutHours,
        phone: parseFloat(lifestyleData.phone),
        workHours: parseFloat(lifestyleData.workHours),
        caffeine: caffeineValue,
        relaxation: relaxationHours
      })
    });
    
    const data = await response.json();
    
    // 예측 결과로 피로도 계산
    let fatigue = 'low';
    if (data.sleep_score < 30) fatigue = 'high';
    else if (data.sleep_score < 70) fatigue = 'mid';
    
    const res = {
      darkCircle: 72,
      sleepScore: data.predicted_hours,
      sleepScorePoint: data.sleep_score,
      avg3: 70,
      fatigue: fatigue
    };
    
    setResult(res);
    updateResult(res);
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    
  } catch (error) {
    console.error('예측 오류:', error);
    alert('분석 중 오류가 발생했습니다. 서버가 실행 중인지 확인해주세요.');
  }
};

  const handleSelectPlan = (n) => {
    setSelectedPlan(n);
  };

  const handleStartCoaching = () => {
    if (!selectedPlan) return;
    startCoaching(selectedPlan);
  };


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
            <div className="input-group">
              <div className="input-label">운동시간 (분)</div>
              <input 
                className="input-field" 
                type="number" 
                placeholder="45"
                value={lifestyleData.workout}
                onChange={(e) => setLifestyleData({...lifestyleData, workout: e.target.value})}
              />
            </div>
            <div className="input-group">
              <div className="input-label">근무시간 (h)</div>
              <input 
                className="input-field" 
                type="number" 
                placeholder="9"
                value={lifestyleData.workHours}
                onChange={(e) => setLifestyleData({...lifestyleData, workHours: e.target.value})}
              />
            </div>
          </div>
          <div className="input-row">
            <div className="input-group">
              <div className="input-label">폰 사용 (h)</div>
              <input 
                className="input-field" 
                type="number" 
                placeholder="6"
                value={lifestyleData.phone}
                onChange={(e) => setLifestyleData({...lifestyleData, phone: e.target.value})}
              />
            </div>
            <div className="input-group">
              <div className="input-label">휴식/낮잠 (분)</div>
              <input 
                className="input-field" 
                type="number" 
                placeholder="0"
                value={lifestyleData.relaxation}
                onChange={(e) => setLifestyleData({...lifestyleData, relaxation: e.target.value})}
              />
            </div>
            {/* 전날 수면 필드는 필요 없으니 삭제 또는 숨김 처리 */}
            <div className="input-group">
              <div className="input-label"> </div>
              <input className="input-field" type="hidden" />
            </div>
          </div>

          <div className="input-group">
          <div className="input-label">카페인 섭취량</div>
          <div className="drink-row" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '5px' }}>
            {drinkList.map(d => (
              <div 
                key={d} 
                className={`drink-btn ${drinks.includes(d) ? 'sel' : ''}`} 
                onClick={() => toggleDrink(d)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '20px',
                  background: drinks.includes(d) ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
                  color: drinks.includes(d) ? '#000' : 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.2s ease',
                  border: drinks.includes(d) ? 'none' : '1px solid rgba(255,255,255,0.2)'
                }}
              >
                {d}
              </div>
            ))}
          </div>
        </div>

          {/* -------------------------------------- */}
          <button className="analyze-btn" onClick={doAnalyze}>🔍 AI 분석 시작하기</button>
        </div>
      </div>

      {/* 분석 결과 */}
{result && (
  <div ref={resultRef}>

    {/* ✅ 추가: AI 수면 예측 결과 카드 */}
    <div style={{
      background: 'rgba(110,231,247,0.1)',
      border: '1px solid rgba(110,231,247,0.4)',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '14px',
      textAlign: 'center'
    }}>
      <div style={{ 
        fontSize: '12px', 
        color: '#6ee7f7', 
        marginBottom: '12px',
        letterSpacing: '1px',
        fontWeight: 500
      }}>
        🧠 AI 수면 예측 결과
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ 
            fontSize: '42px', 
            fontFamily: "'Bebas Neue', sans-serif", 
            color: '#6ee7f7',
            lineHeight: 1
          }}>
            {result.sleepScore}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
            예상 수면시간 (시간)
          </div>
        </div>
        <div>
          <div style={{ 
            fontSize: '42px', 
            fontFamily: "'Bebas Neue', sans-serif", 
            color: result.sleepScorePoint >= 70 ? '#22c55e' : result.sleepScorePoint >= 30 ? '#f59e0b' : '#ef4444',
            lineHeight: 1
          }}>
            {result.sleepScorePoint}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
            수면점수 (0~100점)
          </div>
        </div>
      </div>
      <div style={{ 
        fontSize: '10px', 
        color: 'rgba(255,255,255,0.4)', 
        marginTop: '12px',
        borderTop: '1px solid rgba(110,231,247,0.2)',
        paddingTop: '10px'
      }}>
        {result.sleepScorePoint >= 70 ? '✨ 양호한 수면 상태입니다!' : 
         result.sleepScorePoint >= 30 ? '⚠️ 수면 개선이 필요합니다.' : 
         '🔥 심각한 수면 부족 상태입니다! 당장 휴식이 필요해요!'}
      </div>
    </div>

    {/* 피로도 분석 결과 카드 */}
    <div style={{
      background: 'linear-gradient(135deg, #1e1040, #2a1a5e)',
      border: '1px solid rgba(167,139,250,0.25)',
      borderRadius: '16px', padding: '20px', marginBottom: '14px',
    }}>
      <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '16px', letterSpacing: '1px' }}>
        피로도 분석 결과
      </div>

      {/* 3단계 선택 인디케이터 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '18px' }}>
        {FATIGUE_LEVELS.map(lv => {
          const isActive = result.fatigue === lv.key;
          return (
            <div key={lv.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: isActive ? lv.bg : 'rgba(255,255,255,0.04)',
                border: `2px solid ${isActive ? lv.border : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px',
                boxShadow: isActive ? `0 0 14px ${lv.border}` : 'none',
                transition: 'all 0.3s ease',
              }}>
                {lv.icon}
              </div>
              <div style={{
                fontSize: '11px', fontWeight: isActive ? 700 : 400,
                color: isActive ? lv.color : 'rgba(255,255,255,0.3)',
                transition: 'all 0.3s ease',
              }}>{lv.label}</div>
            </div>
          );
        })}
      </div>

      {/* 피로도 레벨 뱃지 + 메시지 */}
      {(() => {
        const lv = FATIGUE_LEVELS.find(l => l.key === result.fatigue);
        const causeName = '다크서클 지수 상승';
        const msg = getFatigueMessage(result.fatigue, userName, causeName);
        return (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${lv.border}`,
            borderRadius: '12px', padding: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                background: lv.bg, border: `1px solid ${lv.border}`,
                color: lv.color, fontSize: '11px', fontWeight: 700,
                padding: '3px 10px', borderRadius: '20px',
              }}>{lv.label}</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                {userName}님의 피로 {lv.label}
              </span>
            </div>
            <div style={{
              fontSize: '12px', color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.8, fontWeight: 300,
            }}>
              {msg.split(causeName).map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span style={{ color: lv.color, fontWeight: 600 }}>{causeName}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        );
      })()}
    </div>

    {/* 플랜 선택 */}
    <div className="section-title">추천 수면 코칭 플랜</div>
    <div className="plan-grid">
      {PLAN_DATA.map(p => (
        <div key={p.n}
          className="plan-btn"
          onClick={() => handleSelectPlan(p.n)}
          style={selectedPlan === p.n ? { borderColor: 'var(--accent)', background: 'rgba(110,231,247,0.1)' } : {}}
        >
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '28px', color: selectedPlan === p.n ? 'var(--accent)' : 'var(--accent)',
            lineHeight: 1, marginBottom: '2px',
          }}>{p.days}</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
            {p.label}
          </div>
          <div style={{
            fontSize: '10px', color: 'rgba(255,255,255,0.4)',
            lineHeight: 1.6, whiteSpace: 'pre-line',
          }}>{p.desc}</div>
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