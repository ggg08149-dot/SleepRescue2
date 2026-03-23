import React, { useEffect, useRef } from 'react';

const calData = {
  1:'bad',2:'warn',3:'good',4:'good',5:'warn',
  6:'good',7:'bad',8:'warn',9:'good',10:'good',
  11:'warn',12:'bad',13:'bad',14:'good',15:'good',
  16:'warn',17:'today'
};

const calScores = {
  1:'72',2:'65',3:'58',4:'55',5:'61',
  6:'52',7:'70',8:'63',9:'56',10:'54',
  11:'68',12:'74',13:'71',14:'59',15:'51',
  16:'66'
};

function Home({ goAnalyze, analysisResult, startCoaching }) {
  const arcRef = useRef(null);
  const numRef = useRef(null);
  const sg1Ref = useRef(null);
  const sg2Ref = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (arcRef.current) arcRef.current.style.strokeDashoffset = 264 - (264 * 0.72);
      if (sg1Ref.current) sg1Ref.current.style.strokeDashoffset = 157 - (157 * 0.72);
      if (sg2Ref.current) sg2Ref.current.style.strokeDashoffset = 157 - (157 * 0.80);
      let cur = 0;
      const t = setInterval(() => {
        cur = Math.min(cur + 1.2, 72);
        if (numRef.current) numRef.current.textContent = Math.round(cur) + '%';
        if (cur >= 72) clearInterval(t);
      }, 16);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const scores = [6.8, 5.2, 7.1, 4.9, 6.3, 5.8, 4.2];
  const maxS = Math.max(...scores);
  const days = ['월','화','수','목','금','토','일'];
  const calDays = ['일','월','화','수','목','금','토'];
  const firstDay = new Date(2026, 2, 1).getDay();

  return (
    <div className="home-screen">
      {/* 히어로 */}
      <div className="hero">
        <div className="hero-left">
          <div className="hero-badge">AI SLEEP ANALYSIS</div>
          <div className="hero-title">당신의<br />수면을<br /><span>구조합니다</span></div>
          <div className="hero-sub">웹캠으로 다크서클을 분석하고<br />생활 패턴 기반 맞춤형 수면 코칭 제공</div>
          <button className="scan-btn" onClick={goAnalyze}>📷 분석 시작하기</button>
        </div>
        <div className="cam-gauge">
          <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="gGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6ee7f7" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7"/>
            <circle ref={arcRef} cx="50" cy="50" r="42" fill="none"
              stroke="url(#gGrad)" strokeWidth="7" strokeLinecap="round"
              strokeDasharray="264" strokeDashoffset="264"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 1.4s ease' }} />
            <circle cx="50" cy="50" r="30" fill="rgba(110,231,247,0.04)" stroke="rgba(110,231,247,0.1)" strokeWidth="1"/>
          </svg>
          <div className="scan-line-box"><div className="scan-line"></div></div>
          <div className="cam-inner">
            <div className="cam-face">😴</div>
            <div className="cam-pct" ref={numRef}>0%</div>
            <div className="cam-danger">위험</div>
          </div>
        </div>
      </div>

      {/* TODAY'S ANALYSIS */}
      <div className="section-title">TODAY'S ANALYSIS</div>
      <div className="charts-grid">
        {/* 반원 게이지 - 다크서클 */}
        <div className="stat-card">
          <div className="stat-label">다크서클 지수</div>
          <div style={{ textAlign: 'center', marginTop: '4px' }}>
            <svg viewBox="0 0 120 70" width="100%" height="56">
              <defs>
                <linearGradient id="sg1g" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#22c55e"/>
                  <stop offset="50%" stopColor="#f59e0b"/>
                  <stop offset="100%" stopColor="#ef4444"/>
                </linearGradient>
              </defs>
              <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round"/>
              <path ref={sg1Ref} d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="url(#sg1g)" strokeWidth="10" strokeLinecap="round"
                strokeDasharray="157" strokeDashoffset="157" style={{ transition: 'stroke-dashoffset 1.2s ease' }}/>
              <text x="60" y="56" textAnchor="middle" fontFamily="'Bebas Neue'" fontSize="18" fill="#ef4444">72%</text>
            </svg>
            <div style={{ fontSize: '9px', color: '#f87171', marginTop: '-4px' }}>위험 단계</div>
          </div>
        </div>

        {/* 반원 게이지 - 피로도 */}
        <div className="stat-card">
          <div className="stat-label">최근 피로도</div>
          <div style={{ textAlign: 'center', marginTop: '4px' }}>
            <svg viewBox="0 0 120 70" width="100%" height="56">
              <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round"/>
              <path ref={sg2Ref} d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke="#ef4444" strokeWidth="10" strokeLinecap="round"
                strokeDasharray="157" strokeDashoffset="157" style={{ transition: 'stroke-dashoffset 1.2s ease' }}/>
              <text x="60" y="52" textAnchor="middle" fontFamily="'Bebas Neue'" fontSize="14" fill="#ef4444">HIGH</text>
              <text x="60" y="63" textAnchor="middle" fontFamily="'Noto Sans KR'" fontSize="7" fill="rgba(255,255,255,0.4)">즉각 조치</text>
            </svg>
          </div>
        </div>

        {/* 수면 점수 바 차트 */}
        <div className="stat-card">
          <div className="stat-label">최근 수면 점수</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '50px', marginTop: '8px' }}>
            {scores.map((s, i) => {
              const pct = (s / maxS * 100).toFixed(0);
              const isToday = i === 6;
              const bc = isToday ? '#6ee7f7' : s >= 6.5 ? '#22c55e' : s >= 5 ? '#f59e0b' : '#ef4444';
              return (
                <div key={i} style={{ flex: 1, height: `${pct}%`, background: bc, borderRadius: '3px 3px 0 0', minHeight: '3px', border: isToday ? '1px solid #6ee7f7' : 'none' }} />
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'rgba(255,255,255,0.3)', marginTop: '3px' }}>
            {days.map(d => <span key={d}>{d}</span>)}
          </div>
        </div>

        {/* 다크서클 라인 차트 */}
        <div className="stat-card">
          <div className="stat-label">다크서클 추이</div>
          <svg viewBox="0 0 100 50" width="100%" height="44" style={{ marginTop: '6px', overflow: 'visible' }}>
            <polyline points="5,35 20,28 35,30 50,22 65,25 80,20 95,15"
              fill="none" stroke="#6ee7f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            {[[5,35],[20,28],[35,30],[50,22],[65,25],[80,20]].map(([x,y],i) => (
              <circle key={i} cx={x} cy={y} r="2" fill="#6ee7f7" opacity=".6"/>
            ))}
            <circle cx="95" cy="15" r="3" fill="#ef4444"/>
            <text x="95" y="11" textAnchor="middle" fontSize="7" fill="#ef4444" fontFamily="'Noto Sans KR'">72%</text>
            <line x1="0" y1="48" x2="100" y2="48" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5"/>
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'rgba(255,255,255,0.3)' }}>
            <span>월</span><span>수</span><span>금</span><span>일</span>
          </div>
        </div>
      </div>

      {/* 라이프스타일 요인 */}
      <div className="section-title">LIFESTYLE FACTORS</div>
      <div className="stats-grid">
        {[
          { label: '카페인 섭취량', val: '280', unit: 'mg', pct: 85, color: '#ef4444', tag: '기준 초과' },
          { label: '스크린 타임', val: '6.5', unit: 'h', pct: 72, color: '#f59e0b', tag: '주의 필요' },
          { label: '운동시간', val: '45', unit: '분', pct: 75, color: '#22c55e', tag: '양호' },
          { label: '수면 시간', val: '5', unit: 'h', pct: 55, color: '#f59e0b', tag: '권장 7~8h' },
        ].map(item => (
          <div key={item.label} className="stat-card">
            <div className="stat-label">{item.label}</div>
            <div className="stat-val" style={{ color: item.color }}>{item.val}<span className="stat-unit">{item.unit}</span></div>
            <div className="stat-tag" style={{ color: item.color }}>{item.tag}</div>
            <div className="stat-bar"><div className="stat-bar-fill" style={{ width: `${item.pct}%`, background: item.color }}></div></div>
          </div>
        ))}
      </div>

      {/* 수면 캘린더 */}
      <div className="section-title">SLEEP CALENDAR</div>
      <div className="week-chart" style={{ padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <button className="cal-nav">◀</button>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', letterSpacing: '1px' }}>2026.03</div>
          <button className="cal-nav">▶</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
          {calDays.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '9px', color: 'rgba(255,255,255,0.3)', padding: '2px 0' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
          {Array(firstDay).fill(null).map((_, i) => <div key={'blank'+i} />)}
          {Array(31).fill(null).map((_, i) => {
            const d = i + 1;
            const type = calData[d];
            const score = calScores[d];
            const isToday = d === 17;
            const dotColor = type === 'good' ? 'rgba(34,197,94,0.3)' : type === 'warn' ? 'rgba(245,158,11,0.3)' : type === 'bad' ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.05)';
            const dotTextColor = type === 'good' ? '#22c55e' : type === 'warn' ? '#f59e0b' : type === 'bad' ? '#ef4444' : 'rgba(255,255,255,0.2)';
            return (
              <div key={d} style={{
                borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '3px 0', cursor: 'pointer',
                border: isToday ? '1px solid #6ee7f7' : '1px solid transparent',
                background: score ? 'rgba(255,255,255,0.02)' : 'transparent'
              }}>
                <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', lineHeight: 1 }}>{d}</div>
                <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: dotColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', color: dotTextColor, marginTop: '2px' }}>
                  {isToday ? '오' : score || '-'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Home;
