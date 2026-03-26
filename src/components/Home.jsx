import React, { useEffect, useRef, useState } from 'react';

const getFatigueEmoji = (fatigue) => {
  if (fatigue === 'high') return { emoji: '😵', label: '위험', color: '#ef4444' };
  if (fatigue === 'mid') return { emoji: '😟', label: '주의', color: '#f59e0b' };
  return { emoji: '😊', label: '양호', color: '#22c55e' };
};

const DEFAULT_MISSIONS = [
  { id: 1, text: '오후 2시 이후 카페인 섭취 금지' },
  { id: 2, text: '취침 1시간 전 스마트폰 사용 중단' },
  { id: 3, text: '취침 전 스팀 온열 안대 10분' },
];

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const generateCalData = (year, month) => {
  const days = getDaysInMonth(year, month);
  const today = new Date();
  const todayYear  = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDate  = today.getDate();
  const isCurrentMonth = todayYear === year && todayMonth === month;
  const isPastMonth = year < todayYear || (year === todayYear && month < todayMonth);
  const data   = {};
  const scores = {};
  const types     = ['good', 'good', 'warn', 'bad', 'good', 'warn'];
  const scoreList = ['51','52','54','55','56','58','59','61','63','65','66','68','70','71','72','74'];
  for (let d = 1; d <= days; d++) {
    if (isCurrentMonth && d === todayDate) {
      data[d] = 'today';
    } else if (isCurrentMonth && d < todayDate) {
      data[d] = types[d % types.length];
      scores[d] = scoreList[d % scoreList.length];
    } else if (isPastMonth) {
      data[d] = types[d % types.length];
      scores[d] = scoreList[d % scoreList.length];
    }
  }
  return { data, scores };
};

function Home({ goAnalyze, analysisResult, startCoaching, userName = '사용자' }) {
  const arcRef = useRef(null);
  const numRef = useRef(null);
  const sg1Ref = useRef(null);
  const sg2Ref = useRef(null);

  const [streak, setStreak] = useState(5);
  const [missionChecks, setMissionChecks] = useState([false, false, false]);
  const [missionSaved, setMissionSaved] = useState(false);

  const today = new Date();
  const [calYear, setCalYear]     = useState(today.getFullYear());
  const [calMonth, setCalMonth]   = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const { data: calData, scores: calScores } = generateCalData(calYear, calMonth);
  const firstDay    = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const monthLabel  = `${calYear}.${String(calMonth + 1).padStart(2, '0')}`;

  const goPrevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };

  const goNextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  const fatigue = analysisResult?.fatigue || 'high';
  const fatigueInfo = getFatigueEmoji(fatigue);
  const fireSize = Math.min(1 + (streak * 0.04), 1.8);
  const fatigueScore = fatigue === 'high' ? 72 : fatigue === 'mid' ? 45 : 20;
  const fatigueDashTarget = 264 - (264 * (fatigueScore / 100));

  useEffect(() => {
    const timer = setTimeout(() => {
      if (arcRef.current) arcRef.current.style.strokeDashoffset = fatigueDashTarget;
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

  const toggleMission = (idx) => {
    const next = [...missionChecks];
    next[idx] = !next[idx];
    setMissionChecks(next);
    setMissionSaved(false);
  };

  const saveMissions = () => {
    setMissionSaved(true);
    if (missionChecks.every(Boolean)) setStreak(prev => prev + 1);
  };

  const completedCount = missionChecks.filter(Boolean).length;
  const scores = [6.8, 5.2, 7.1, 4.9, 6.3, 5.8, 4.2];
  const maxS = Math.max(...scores);
  const days = ['월','화','수','목','금','토','일'];
  const calDays = ['일','월','화','수','목','금','토'];

  return (
    <div className="home-screen">
      {/* 히어로 */}
      <div className="hero">
        <div className="hero-left">
          <div className="hero-badge">AI SLEEP ANALYSIS</div>
          <div className="hero-title">당신의<br />수면을<br /><span>구조합니다</span></div>
          <div className="hero-sub">
            안녕하세요 <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{userName}</span>님!<br />
            오늘도 수면 관리 함께해요
          </div>
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
            <div style={{ fontSize: '32px', lineHeight: 1, transition: 'all 0.5s ease' }}>
              {fatigueInfo.emoji}
            </div>
            <div className="cam-pct" ref={numRef} style={{ color: fatigueInfo.color }}>{fatigueScore}%</div>
            <div className="cam-danger" style={{ color: fatigueInfo.color, fontSize: '8px' }}>피로지수</div>
          </div>
        </div>
      </div>

      {/* 데일리 위젯 */}
      <div className="section-title">DAILY MISSION</div>
      <div className="daily-widget">
        <div className="streak-row">
          <div className="streak-fire-wrap">
            <span style={{
              fontSize: `${28 * fireSize}px`,
              display: 'inline-block',
              animation: 'fireWiggle 0.7s ease-in-out infinite alternate',
              filter: streak >= 7 ? 'drop-shadow(0 0 6px #f59e0b)' : 'none',
              transition: 'font-size 0.5s ease',
              lineHeight: 1,
            }}>🔥</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '28px',
                  color: streak >= 7 ? '#f59e0b' : streak >= 3 ? '#fbbf24' : 'var(--accent)',
                  lineHeight: 1,
                  transition: 'color 0.5s ease',
                }}>{streak}</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>일 연속 달성</span>
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                {streak >= 7 ? '🏆 일주일 달성!' : streak >= 3 ? '💪 계속 가즈아!' : '🌱 시작이 반이에요!'}
              </div>
            </div>
          </div>
          <div style={{ flex: 1, marginLeft: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginBottom: '5px' }}>
              <span>오늘 미션</span>
              <span style={{ color: completedCount === 3 ? '#22c55e' : 'rgba(255,255,255,0.4)' }}>{completedCount}/3</span>
            </div>
            <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${(completedCount / 3) * 100}%`,
                background: completedCount === 3 ? 'linear-gradient(90deg,#22c55e,#4ade80)' : 'linear-gradient(90deg, var(--accent), #4dd8ee)',
                borderRadius: '4px',
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        </div>

        <div style={{ margin: '12px 0 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {DEFAULT_MISSIONS.map((mission, idx) => (
            <div key={mission.id} onClick={() => toggleMission(idx)} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px',
              background: missionChecks[idx] ? 'rgba(110,231,247,0.05)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${missionChecks[idx] ? 'rgba(110,231,247,0.2)' : 'var(--border)'}`,
              borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s ease',
            }}>
              <div style={{
                width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                border: `1.5px solid ${missionChecks[idx] ? 'var(--accent)' : 'rgba(255,255,255,0.2)'}`,
                background: missionChecks[idx] ? 'var(--accent)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', color: '#0b0b13', fontWeight: 700, transition: 'all 0.2s ease',
              }}>
                {missionChecks[idx] && '✓'}
              </div>
              <span style={{
                fontSize: '12px', flex: 1,
                textDecoration: missionChecks[idx] ? 'line-through' : 'none',
                color: missionChecks[idx] ? 'rgba(255,255,255,0.35)' : 'var(--text)',
                transition: 'all 0.2s ease',
              }}>
                {mission.text}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={saveMissions} disabled={missionSaved} style={{
            background: missionSaved ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${missionSaved ? 'rgba(34,197,94,0.35)' : 'var(--border)'}`,
            color: missionSaved ? '#22c55e' : 'var(--muted)',
            padding: '9px 16px', borderRadius: '9px', fontSize: '12px',
            cursor: missionSaved ? 'default' : 'pointer',
            fontFamily: "'Noto Sans KR', sans-serif", transition: 'all 0.3s ease',
          }}>
            {missionSaved ? '✓ 저장됨' : '저장하기'}
          </button>
          <button onClick={() => startCoaching && startCoaching(7)} style={{
            flex: 1,
            background: 'linear-gradient(135deg, rgba(167,139,250,0.12), rgba(110,231,247,0.08))',
            border: '1px solid rgba(167,139,250,0.25)',
            color: 'var(--accent2)', padding: '9px 14px', borderRadius: '9px',
            fontSize: '12px', cursor: 'pointer',
            fontFamily: "'Noto Sans KR', sans-serif", transition: 'all 0.2s ease',
          }}>
            💬 지금 바로 오늘의 수면 미션을 확인하세요! →
          </button>
        </div>
      </div>

      {/* TODAY'S ANALYSIS */}
      <div className="section-title">TODAY'S ANALYSIS</div>
      <div className="charts-grid">
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

        <div className="stat-card">
          <div className="stat-label">최근 수면 점수</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '50px', marginTop: '8px' }}>
            {scores.map((s, i) => {
              const pct = (s / maxS * 100).toFixed(0);
              const isToday = i === 6;
              const bc = isToday ? '#6ee7f7' : s >= 6.5 ? '#22c55e' : s >= 5 ? '#f59e0b' : '#ef4444';
              return <div key={i} style={{ flex: 1, height: `${pct}%`, background: bc, borderRadius: '3px 3px 0 0', minHeight: '3px', border: isToday ? '1px solid #6ee7f7' : 'none' }} />;
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', color: 'rgba(255,255,255,0.3)', marginTop: '3px' }}>
            {days.map(d => <span key={d}>{d}</span>)}
          </div>
        </div>

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
          { label: '스크린 타임',   val: '6.5', unit: 'h',  pct: 72, color: '#f59e0b', tag: '주의 필요' },
          { label: '근무시간',      val: '9',   unit: 'h',  pct: 75, color: '#f59e0b', tag: '주의 필요' },
          { label: '운동시간',      val: '45',  unit: '분', pct: 75, color: '#22c55e', tag: '양호' },
          { label: '수면 시간',     val: '5',   unit: 'h',  pct: 55, color: '#f59e0b', tag: '권장 7~8h' },
        ].map(item => (
          <div key={item.label} className="stat-card">
            <div className="stat-label">{item.label}</div>
            <div className="stat-val" style={{ color: item.color }}>{item.val}<span className="stat-unit">{item.unit}</span></div>
            <div className="stat-tag" style={{ color: item.color }}>{item.tag}</div>
            <div className="stat-bar"><div className="stat-bar-fill" style={{ width: `${item.pct}%`, background: item.color }}></div></div>
          </div>
        ))}
      </div>

      {/* 캘린더 */}
      <div className="section-title">SLEEP CALENDAR</div>
      <div className="week-chart" style={{ padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <button className="cal-nav" onClick={goPrevMonth}>◀</button>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', letterSpacing: '1px' }}>
            {monthLabel}
          </div>
          <button className="cal-nav" onClick={goNextMonth}>▶</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
          {calDays.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '9px', color: 'rgba(255,255,255,0.3)', padding: '2px 0' }}>{d}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
          {Array(firstDay).fill(null).map((_, i) => <div key={'blank'+i} />)}
          {Array(daysInMonth).fill(null).map((_, i) => {
            const d = i + 1;
            const type  = calData[d];
            const score = calScores[d];
            const isToday    = type === 'today';
            const isSelected = selectedDate?.year === calYear &&
                               selectedDate?.month === calMonth &&
                               selectedDate?.day === d;

            const dotColor = type === 'good' ? 'rgba(34,197,94,0.3)'
              : type === 'warn' ? 'rgba(245,158,11,0.3)'
              : type === 'bad'  ? 'rgba(239,68,68,0.3)'
              : isToday         ? 'rgba(110,231,247,0.15)'
              : 'rgba(255,255,255,0.05)';
            const dotTextColor = type === 'good' ? '#22c55e'
              : type === 'warn' ? '#f59e0b'
              : type === 'bad'  ? '#ef4444'
              : isToday         ? '#6ee7f7'
              : 'rgba(255,255,255,0.2)';

            return (
              <div
                key={d}
                onClick={() => setSelectedDate({ year: calYear, month: calMonth, day: d })}
                style={{
                  borderRadius: '6px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '3px 0', cursor: 'pointer',
                  border: isSelected
                    ? '1px solid var(--accent)'
                    : isToday
                    ? '1px solid #6ee7f7'
                    : '1px solid transparent',
                  background: isSelected
                    ? 'rgba(110,231,247,0.12)'
                    : score || isToday
                    ? 'rgba(255,255,255,0.02)'
                    : 'transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{
                  fontSize: '8px',
                  color: isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.3)',
                  lineHeight: 1,
                }}>{d}</div>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: isSelected ? 'rgba(110,231,247,0.3)' : dotColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '7px',
                  color: isSelected ? '#6ee7f7' : dotTextColor,
                  marginTop: '2px',
                  transition: 'all 0.15s ease',
                }}>
                  {isToday ? '오' : score || '-'}
                </div>
              </div>
            );
          })}
        </div>

        {/* 선택된 날짜 정보 */}
        {selectedDate && (
          <div style={{
            marginTop: '12px', padding: '10px 14px',
            background: 'rgba(110,231,247,0.06)',
            border: '1px solid rgba(110,231,247,0.2)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '20px', color: 'var(--accent)' }}>
              {selectedDate.year}.{String(selectedDate.month + 1).padStart(2,'0')}.{String(selectedDate.day).padStart(2,'0')}
            </div>
            {calScores[selectedDate.day] && selectedDate.year === calYear && selectedDate.month === calMonth ? (
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                수면 점수 <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{calScores[selectedDate.day]}점</span>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                기록 없음
              </div>
            )}
            <button
              onClick={() => setSelectedDate(null)}
              style={{
                marginLeft: 'auto', background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '14px',
              }}
            >✕</button>
          </div>
        )}

        {/* 범례 */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', justifyContent: 'center' }}>
          {[
            { color: 'rgba(34,197,94,0.3)',  text: '양호', textColor: '#22c55e' },
            { color: 'rgba(245,158,11,0.3)', text: '주의', textColor: '#f59e0b' },
            { color: 'rgba(239,68,68,0.3)',  text: '위험', textColor: '#ef4444' },
          ].map(l => (
            <div key={l.text} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: l.color }} />
              <span style={{ fontSize: '9px', color: l.textColor }}>{l.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
