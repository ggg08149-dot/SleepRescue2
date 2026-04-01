import React, { useEffect, useRef, useState } from 'react';
import { getLatestFatigue, getWeeklyFatigue, getCalendarFatigue } from '../api/fatigueApi';
import { getLatestLifelog } from '../api/lifelogApi';

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

const buildLifestyleItems = (log) => {
  if (!log) return null;
  const { exec_hours, phone_hours, work_hours, caffeine, sleep_hours } = log;

  const cafPct   = Math.min((caffeine    / 400) * 100, 100);
  const cafColor = caffeine >= 300 ? '#ef4444' : caffeine >= 150 ? '#f59e0b' : '#22c55e';
  const cafTag   = caffeine >= 300 ? '기준 초과' : caffeine >= 150 ? '주의 필요' : '양호';

  const phonePct   = Math.min((phone_hours / 8) * 100, 100);
  const phoneColor = phone_hours >= 6 ? '#ef4444' : phone_hours >= 4 ? '#f59e0b' : '#22c55e';
  const phoneTag   = phone_hours >= 6 ? '과다 사용' : phone_hours >= 4 ? '주의 필요' : '양호';

  const workPct   = Math.min((work_hours / 10) * 100, 100);
  const workColor = work_hours >= 9 ? '#ef4444' : work_hours >= 7 ? '#f59e0b' : '#22c55e';
  const workTag   = work_hours >= 9 ? '초과 근무' : work_hours >= 7 ? '주의 필요' : '양호';

  const execMin   = Math.round(exec_hours * 60);
  const execPct   = Math.min((exec_hours  / 2)  * 100, 100);
  const execColor = exec_hours >= 1 ? '#22c55e' : exec_hours >= 0.3 ? '#f59e0b' : '#ef4444';
  const execTag   = exec_hours >= 1 ? '양호' : exec_hours >= 0.3 ? '권장량 미달' : '운동 부족';

  const sleepPct   = Math.min((sleep_hours / 10) * 100, 100);
  const sleepColor = (sleep_hours >= 7 && sleep_hours <= 9) ? '#22c55e' : sleep_hours >= 6 ? '#f59e0b' : '#ef4444';
  const sleepTag   = (sleep_hours >= 7 && sleep_hours <= 9) ? '권장 수면'
    : sleep_hours < 6 ? '수면 부족' : sleep_hours > 9 ? '과수면' : '약간 부족';

  return [
    { label: '카페인 섭취량', val: String(Math.round(caffeine)), unit: 'mg', pct: cafPct,   color: cafColor,   tag: cafTag   },
    { label: '스크린 타임',   val: String(phone_hours),           unit: 'h',  pct: phonePct, color: phoneColor, tag: phoneTag },
    { label: '근무시간',      val: String(work_hours),            unit: 'h',  pct: workPct,  color: workColor,  tag: workTag  },
    { label: '운동시간',      val: String(execMin),               unit: '분', pct: execPct,  color: execColor,  tag: execTag  },
    { label: '수면 시간',     val: String(sleep_hours),           unit: 'h',  pct: sleepPct, color: sleepColor, tag: sleepTag },
  ];
};

function Home({ goAnalyze, analysisResult, startCoaching, userName = '사용자' }) {
  const arcRef = useRef(null);
  const numRef = useRef(null);
  const sg2Ref = useRef(null);

  const [latestFatigue, setLatestFatigue] = useState(null);
  const [weeklyFatigue, setWeeklyFatigue] = useState([]);
  const [latestLifelog, setLatestLifelog] = useState(null);
  const [calFatigue,    setCalFatigue]    = useState({});

  const [streak, setStreak]               = useState(0);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [missionChecks, setMissionChecks] = useState([false, false, false]);
  const [missionSaved, setMissionSaved]   = useState(false);

  const today = new Date();
  const [calYear, setCalYear]       = useState(today.getFullYear());
  const [calMonth, setCalMonth]     = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

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

  // DB 데이터 fetch + 분석 횟수 카운팅
  useEffect(() => {
    const user_idx = localStorage.getItem('user_idx');
    if (!user_idx) return;

    // localStorage에서 분석 횟수 읽기
    try {
      const history = JSON.parse(
        localStorage.getItem('sleeprescue_analysis_history') || '[]'
      );
      setAnalysisCount(history.length);
    } catch (e) {}

    // 연속 달성 streak 계산
    try {
      const missionHistory = JSON.parse(
        localStorage.getItem('sleeprescue_mission_history') || '{}'
      );
      let count = 0;
      const now = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        if (missionHistory[key]) {
          count++;
        } else {
          break;
        }
      }
      setStreak(count > 0 ? count : 0);
    } catch (e) {}

    // DB 데이터 fetch
    getLatestFatigue(user_idx)
      .then(res => { if (res.success && res.data) setLatestFatigue(res.data); })
      .catch(() => {});
    getWeeklyFatigue(user_idx)
      .then(res => { if (res.success && res.data) setWeeklyFatigue(res.data); })
      .catch(() => {});
    getLatestLifelog(user_idx)
      .then(res => { if (res.success && res.data) setLatestLifelog(res.data); })
      .catch(() => {});
  }, [analysisResult]);

  // 캘린더 fetch
  useEffect(() => {
    const user_idx = localStorage.getItem('user_idx');
    if (!user_idx) return;
    getCalendarFatigue(user_idx, calYear, calMonth + 1)
      .then(res => {
        if (res.success && res.data) {
          const map = {};
          res.data.forEach(row => {
            map[row.day] = { level: row.fatigue_level, score: Math.round(row.fatigue_score) };
          });
          setCalFatigue(map);
        }
      })
      .catch(() => {});
  }, [calYear, calMonth, analysisResult]);

  const fatigue = analysisResult?.fatigue || latestFatigue?.fatigue_level || 'low';
  const fatigueInfo = getFatigueEmoji(latestFatigue?.fatigue_level || fatigue);
  const fireSize = Math.min(1 + (streak * 0.04), 1.8);
  const fatigueScore = latestFatigue
    ? Math.round(latestFatigue.fatigue_score)
    : (fatigue === 'high' ? 72 : fatigue === 'mid' ? 45 : 20);
  const fatigueDashTarget = 264 - (264 * (fatigueScore / 100));

  const recentLevel  = latestFatigue?.fatigue_level || fatigue;
  const recentColor  = recentLevel === 'high' ? '#ef4444' : recentLevel === 'mid' ? '#f59e0b' : '#22c55e';
  const recentText   = recentLevel === 'high' ? 'HIGH' : recentLevel === 'mid' ? 'MID' : 'LOW';
  const recentAction = recentLevel === 'high' ? '즉각 조치' : recentLevel === 'mid' ? '주의 필요' : '양호';
  const sg2DashTarget = 157 - (157 * (fatigueScore / 100));

  useEffect(() => {
    if (arcRef.current) arcRef.current.style.strokeDashoffset = '264';
    if (sg2Ref.current) sg2Ref.current.style.strokeDashoffset = '157';
    const timer = setTimeout(() => {
      if (arcRef.current) arcRef.current.style.strokeDashoffset = fatigueDashTarget;
      if (sg2Ref.current) sg2Ref.current.style.strokeDashoffset = sg2DashTarget;
      let cur = 0;
      const target = fatigueScore;
      const step = Math.max(1.2, target / 60);
      const t = setInterval(() => {
        cur = Math.min(cur + step, target);
        if (numRef.current) numRef.current.textContent = Math.round(cur) + '%';
        if (cur >= target) clearInterval(t);
      }, 16);
    }, 400);
    return () => clearTimeout(timer);
  }, [fatigueScore]);

  const toggleMission = (idx) => {
    const next = [...missionChecks];
    next[idx] = !next[idx];
    setMissionChecks(next);
    setMissionSaved(false);
  };

  const saveMissions = () => {
    setMissionSaved(true);
    if (missionChecks.every(Boolean)) {
      // 오늘 날짜로 미션 완료 저장
      const now = new Date();
      const key = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      const history = JSON.parse(localStorage.getItem('sleeprescue_mission_history') || '{}');
      history[key] = true;
      localStorage.setItem('sleeprescue_mission_history', JSON.stringify(history));
      setStreak(prev => prev + 1);
    }
  };

  const completedCount = missionChecks.filter(Boolean).length;

  const buildDateStr = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const sevenDaySlots = Array.from({ length: 7 }, (_, i) => buildDateStr(6 - i));
  const weeklyMap = {};
  weeklyFatigue.forEach(w => { if (w.log_date) weeklyMap[w.log_date] = w; });
  const sevenDayData = sevenDaySlots.map(date => weeklyMap[date] || null);
  const dayLabels = ['7일전','6일전','5일전','4일전','3일전','어제','오늘'];
  const maxW = Math.max(...sevenDayData.filter(Boolean).map(w => w.fatigue_score), 1);
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
              {/* 스트릭 메시지 */}
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>
                {streak >= 7 ? '🏆 일주일 달성!' : streak >= 3 ? '💪 계속 가즈아!' : '🌱 시작이 반이에요!'}
              </div>
              {/* 분석 횟수 카운팅 */}
              <div style={{ fontSize: '10px', color: 'var(--accent)', marginTop: '4px' }}>
                📊 총 분석 {analysisCount}회
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

      {/* 주간 피로지수 */}
      <div className="section-title">주간 피로지수</div>
      <div className="charts-grid">
        <div className="stat-card">
          <div className="stat-label">최근 피로도</div>
          {latestFatigue ? (
            <div style={{ textAlign: 'center', marginTop: '4px' }}>
              <svg viewBox="0 0 120 80" width="100%" height="76">
                <path d="M10 68 A50 50 0 0 1 110 68" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeLinecap="round"/>
                <path ref={sg2Ref} d="M10 68 A50 50 0 0 1 110 68" fill="none" stroke={recentColor} strokeWidth="12" strokeLinecap="round"
                  strokeDasharray="157" strokeDashoffset="157" style={{ transition: 'stroke-dashoffset 1.2s ease' }}/>
                <text x="60" y="56" textAnchor="middle" fontFamily="'Bebas Neue'" fontSize="22" fill={recentColor}>{fatigueScore}%</text>
                <text x="60" y="68" textAnchor="middle" fontFamily="'Bebas Neue'" fontSize="13" fill={recentColor}>{recentText}</text>
                <text x="60" y="78" textAnchor="middle" fontFamily="'Noto Sans KR'" fontSize="7" fill="rgba(255,255,255,0.4)">{recentAction}</text>
              </svg>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '11px', padding: '24px 0' }}>
              데이터 없음
            </div>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-label">주간 피로 추이</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '60px', marginTop: '8px' }}>
            {sevenDayData.map((w, i) => {
              if (!w) {
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                    <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px 3px 0 0' }} />
                  </div>
                );
              }
              const pct = Math.max((w.fatigue_score / maxW * 100), 5).toFixed(0);
              const isToday = i === 6;
              const bc = isToday ? '#6ee7f7'
                : w.fatigue_level === 'high' ? '#ef4444'
                : w.fatigue_level === 'mid'  ? '#f59e0b'
                : '#22c55e';
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '6px', color: 'rgba(255,255,255,0.4)' }}>{Math.round(w.fatigue_score)}</div>
                  <div style={{ width: '100%', height: `${pct}%`, background: bc, borderRadius: '3px 3px 0 0', border: isToday ? `1px solid #6ee7f7` : 'none' }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>
            {dayLabels.map(label => <span key={label}>{label}</span>)}
          </div>
        </div>
      </div>

      {/* 라이프스타일 요인 */}
      <div className="section-title">LIFESTYLE FACTORS</div>
      <div className="stats-grid">
        {buildLifestyleItems(latestLifelog)
          ? buildLifestyleItems(latestLifelog).map(item => (
              <div key={item.label} className="stat-card">
                <div className="stat-label">{item.label}</div>
                <div className="stat-val" style={{ color: item.color }}>{item.val}<span className="stat-unit">{item.unit}</span></div>
                <div className="stat-tag" style={{ color: item.color }}>{item.tag}</div>
                <div className="stat-bar"><div className="stat-bar-fill" style={{ width: `${item.pct}%`, background: item.color }}></div></div>
              </div>
            ))
          : (
            <div style={{
              gridColumn: '1 / -1', textAlign: 'center',
              padding: '24px 0', color: 'rgba(255,255,255,0.3)', fontSize: '12px',
            }}>
              분석을 시작하면 데이터가 표시됩니다
            </div>
          )
        }
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
            const todayObj   = new Date();
            const isToday    = todayObj.getFullYear() === calYear &&
                               todayObj.getMonth()    === calMonth &&
                               todayObj.getDate()     === d;
            const dbEntry    = calFatigue[d];
            const type       = dbEntry?.level === 'low'  ? 'good'
                             : dbEntry?.level === 'mid'  ? 'warn'
                             : dbEntry?.level === 'high' ? 'bad'
                             : null;
            const score      = dbEntry?.score ?? null;
            const isSelected = selectedDate?.year  === calYear &&
                               selectedDate?.month === calMonth &&
                               selectedDate?.day   === d;

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
              <div key={d}
                onClick={() => setSelectedDate({ year: calYear, month: calMonth, day: d })}
                style={{
                  borderRadius: '6px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '3px 0', cursor: 'pointer',
                  border: isSelected ? '1px solid var(--accent)' : isToday ? '1px solid #6ee7f7' : '1px solid transparent',
                  background: isSelected ? 'rgba(110,231,247,0.12)' : (score !== null || isToday) ? 'rgba(255,255,255,0.02)' : 'transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '8px', color: isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.3)', lineHeight: 1 }}>{d}</div>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  background: isSelected ? 'rgba(110,231,247,0.3)' : dotColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '7px', color: isSelected ? '#6ee7f7' : dotTextColor,
                  marginTop: '2px', transition: 'all 0.15s ease',
                }}>
                  {isToday ? '오' : score !== null ? score : '-'}
                </div>
              </div>
            );
          })}
        </div>

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
            {calFatigue[selectedDate.day] && selectedDate.year === calYear && selectedDate.month === calMonth ? (
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                피로지수 <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{calFatigue[selectedDate.day].score}점</span>
                <span style={{ marginLeft: '6px', fontSize: '10px', color:
                  calFatigue[selectedDate.day].level === 'high' ? '#ef4444' :
                  calFatigue[selectedDate.day].level === 'mid'  ? '#f59e0b' : '#22c55e' }}>
                  ({calFatigue[selectedDate.day].level === 'high' ? '위험' : calFatigue[selectedDate.day].level === 'mid' ? '주의' : '양호'})
                </span>
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>기록 없음</div>
            )}
            <button onClick={() => setSelectedDate(null)} style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '14px',
            }}>✕</button>
          </div>
        )}

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
