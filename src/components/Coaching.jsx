import React, { useState, useRef, useEffect } from 'react';

const PLAN_MISSIONS = {
  1: [
    { day: 1, title: '카페인 & 스크린 차단', missions: [
      { id: 1, text: '오후 2시 이후 카페인 완전 차단', type: '필수' },
      { id: 2, text: '취침 1시간 전 스마트폰 종료', type: '필수' },
      { id: 3, text: '취침 전 스팀 온열 안대 10분', type: '권장' },
      { id: 4, text: '기상 후 냉찜질 5분', type: '권장' },
      { id: 5, text: '수면유도 백색소음 틀고 취침', type: '선택' },
    ]}
  ],
  7: [
    { day: 1, title: '카페인 & 스크린 차단', missions: [
      { id: 1, text: '오후 2시 이후 카페인 완전 차단', type: '필수' },
      { id: 2, text: '취침 1시간 전 스마트폰 종료', type: '필수' },
      { id: 3, text: '취침 전 스팀 온열 안대 10분', type: '권장' },
      { id: 4, text: '기상 후 냉찜질 5분', type: '권장' },
      { id: 5, text: '수면유도 백색소음 틀고 취침', type: '선택' },
    ]},
    { day: 2, title: '수면 환경 개선', missions: [
      { id: 1, text: '침실 온도 18~20도로 유지', type: '필수' },
      { id: 2, text: '완전 암막 커튼 또는 안대 착용', type: '필수' },
      { id: 3, text: '취침 2시간 전 조명 낮추기', type: '권장' },
      { id: 4, text: '백색소음 앱 켜고 취침', type: '선택' },
    ]},
    { day: 3, title: '다크서클 집중 케어', missions: [
      { id: 1, text: '스팀 온열 안대 10분 + 냉찜질 5분', type: '필수' },
      { id: 2, text: '오이 슬라이스 눈 팩 10분', type: '권장' },
      { id: 3, text: '하루 물 2L 이상 마시기', type: '필수' },
      { id: 4, text: '비타민 C 섭취', type: '선택' },
    ]},
    { day: 4, title: '운동 & 긴장 완화', missions: [
      { id: 1, text: '저녁 6시 이전 30분 유산소 운동', type: '필수' },
      { id: 2, text: '취침 전 스트레칭 10분', type: '권장' },
      { id: 3, text: '따뜻한 허브티 한 잔', type: '선택' },
    ]},
    { day: 5, title: '수면 리듬 고정', missions: [
      { id: 1, text: '오전 7시 정각 기상 (알람 설정)', type: '필수' },
      { id: 2, text: '낮잠 20분 이내로 제한', type: '필수' },
      { id: 3, text: '일정한 취침 시간 유지', type: '권장' },
    ]},
    { day: 6, title: '디지털 디톡스', missions: [
      { id: 1, text: '취침 2시간 전부터 폰 사용 금지', type: '필수' },
      { id: 2, text: '소셜 미디어 알림 끄기', type: '권장' },
      { id: 3, text: '종이책 or 명상 앱으로 대체', type: '선택' },
    ]},
    { day: 7, title: '종합 점검', missions: [
      { id: 1, text: '이번 주 수면 패턴 기록 확인', type: '필수' },
      { id: 2, text: '다크서클 변화 사진 비교', type: '권장' },
      { id: 3, text: '다음 주 플랜 목표 설정', type: '선택' },
    ]},
  ],
  15: [
    { day: 1,  title: '카페인 & 스크린 차단',   missions: [{ id:1, text:'오후 2시 이후 카페인 완전 차단', type:'필수' }, { id:2, text:'취침 1시간 전 스마트폰 종료', type:'필수' }, { id:3, text:'스팀 온열 안대 10분', type:'권장' }]},
    { day: 2,  title: '수면 환경 개선',          missions: [{ id:1, text:'침실 온도 18~20도 유지', type:'필수' }, { id:2, text:'완전 암막 커튼 착용', type:'필수' }, { id:3, text:'백색소음 켜고 취침', type:'선택' }]},
    { day: 3,  title: '다크서클 집중 케어',       missions: [{ id:1, text:'온열 안대 + 냉찜질', type:'필수' }, { id:2, text:'물 2L 이상 마시기', type:'필수' }]},
    { day: 4,  title: '운동 루틴 시작',           missions: [{ id:1, text:'30분 유산소 운동', type:'필수' }, { id:2, text:'취침 전 스트레칭', type:'권장' }]},
    { day: 5,  title: '수면 리듬 고정',           missions: [{ id:1, text:'오전 7시 정각 기상', type:'필수' }, { id:2, text:'낮잠 20분 이내', type:'필수' }]},
    { day: 6,  title: '디지털 디톡스',            missions: [{ id:1, text:'취침 2시간 전 폰 금지', type:'필수' }, { id:2, text:'명상 10분', type:'선택' }]},
    { day: 7,  title: '중간 점검',                missions: [{ id:1, text:'1주차 수면 패턴 확인', type:'필수' }, { id:2, text:'다크서클 변화 확인', type:'권장' }]},
    { day: 8,  title: '영양 관리',                missions: [{ id:1, text:'비타민 C + 철분 섭취', type:'권장' }, { id:2, text:'자외선 차단제 SPF50+', type:'필수' }]},
    { day: 9,  title: '깊은 수면 유도',           missions: [{ id:1, text:'수면 전 백색소음 30분', type:'권장' }, { id:2, text:'4-7-8 호흡법 실천', type:'선택' }]},
    { day: 10, title: '스트레스 관리',            missions: [{ id:1, text:'저녁 산책 20분', type:'필수' }, { id:2, text:'감사 일기 쓰기', type:'선택' }]},
    { day: 11, title: '피부 루틴 강화',           missions: [{ id:1, text:'눈가 전용 아이크림 사용', type:'권장' }, { id:2, text:'오이팩 10분', type:'선택' }]},
    { day: 12, title: '수면 자세 교정',           missions: [{ id:1, text:'높은 베개로 교체', type:'권장' }, { id:2, text:'똑바로 누워 자기', type:'필수' }]},
    { day: 13, title: '카페인 완전 차단',         missions: [{ id:1, text:'하루 종일 카페인 없이', type:'필수' }, { id:2, text:'허브티로 대체', type:'권장' }]},
    { day: 14, title: '종합 케어',                missions: [{ id:1, text:'전체 루틴 총복습', type:'필수' }, { id:2, text:'수면 점수 기록', type:'필수' }]},
    { day: 15, title: '15일 완주!',               missions: [{ id:1, text:'전후 다크서클 사진 비교', type:'필수' }, { id:2, text:'다음 달 목표 설정', type:'권장' }]},
  ]
};

// 백색소음 데이터
const WHITE_NOISE = [
  { id: 0, title: '빗소리',          artist: '자연 백색소음',  icon: '🌧', url: '/sounds/rain.mp3',    tags: ['스트레스', '불면증', '집중력'] },
  { id: 1, title: '파도 소리',       artist: '해변 백색소음',  icon: '🌊', url: '/sounds/wave.mp3',    tags: ['피로회복', '긴장완화', '명상'] },
  { id: 2, title: '숲속 바람',       artist: '자연 백색소음',  icon: '🌿', url: '/sounds/forest.mp3',  tags: ['수면유도', '자연치유', '안정'] },
  { id: 3, title: 'Deep Sleep Waves', artist: 'Binaural Beats', icon: '🎵', url: '/sounds/sleep.mp3',   tags: ['깊은수면', '뇌파조절', '다크서클'] },
  { id: 4, title: '산속 계곡',       artist: '자연 백색소음',  icon: '🏔', url: '/sounds/valley.mp3',  tags: ['스트레스', '자연치유', '안정'] },
  { id: 5, title: '캠프파이어',      artist: '자연 백색소음',  icon: '🔥', url: '/sounds/fire.mp3',    tags: ['긴장완화', '명상', '안정'] },
];

// 분석결과 기반 AI 추천 로직
const getAiRecommended = (analysisResult) => {
  if (!analysisResult) return 3; // 기본 Deep Sleep Waves
  const fatigue = analysisResult?.fatigue;
  const darkCircle = analysisResult?.darkCircle || 0;

  if (fatigue === 'high' || darkCircle > 65) return 3; // Deep Sleep Waves
  if (fatigue === 'mid') return 0;                      // 빗소리
  return 2;                                             // 숲속 바람
};

const getAiReason = (id, analysisResult) => {
  if (!analysisResult) {
    const reasons = ['', '', '', '다크서클 개선에 효과적인 뇌파 음악이에요'];
    return reasons[id];
  }
  const fatigue = analysisResult?.fatigue;
  if (id === 3 && fatigue === 'high') return '피로도가 높아요! 깊은 수면을 위한 뇌파 음악을 추천해요';
  if (id === 0 && fatigue === 'mid')  return '스트레스 완화에 빗소리가 효과적이에요';
  if (id === 2 && fatigue === 'low')  return '현재 컨디션 유지에 자연 소리가 좋아요';
  return '';
};

const TYPE_COLOR = {
  '필수': { bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.4)',   color: '#f87171' },
  '권장': { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.4)',  color: '#fbbf24' },
  '선택': { bg: 'rgba(110,231,247,0.1)',  border: 'rgba(110,231,247,0.3)', color: '#6ee7f7' },
};

const PLAN_INFO = {
  1:  { label: '1일',  desc: '안색 긴급 복구',  color: '#ef4444' },
  7:  { label: '7일',  desc: '진짜 원인 탐색',  color: '#f59e0b' },
  15: { label: '15일', desc: '만성 피로 탈출',  color: '#6ee7f7' },
};

// 음파 애니메이션 컴포넌트
function SoundWave() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '16px' }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          width: '3px', borderRadius: '2px',
          background: 'var(--accent)',
          animation: `soundwave ${0.4 + i * 0.1}s ease-in-out infinite alternate`,
          height: `${4 + i * 3}px`,
        }} />
      ))}
      <style>{`
        @keyframes soundwave {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1.2); }
        }
      `}</style>
    </div>
  );
}

function Coaching({ selectedPlan: initialPlan = 7, analysisResult }) {
  const [activePlan, setActivePlan] = useState(initialPlan);
  const [activeDay, setActiveDay]   = useState(1);
  const [checks, setChecks]         = useState({});

  // 백색소음 상태
  const [playingIdx, setPlayingIdx] = useState(null);
  const [volume, setVolume]         = useState(0.5);
  const [timer, setTimer]           = useState(null);      // 선택한 타이머 (분)
  const [timeLeft, setTimeLeft]     = useState(null);      // 남은 시간 (초)
  const audioRef                    = useRef(null);
  const timerRef                    = useRef(null);

  const aiRecommended = getAiRecommended(analysisResult);
  const planDays = PLAN_MISSIONS[activePlan] || PLAN_MISSIONS[7];

  // 볼륨 변경
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // 타이머 카운트다운
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      stopAudio();
      setTimeLeft(null);
      setTimer(null);
      return;
    }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft]);

  const stopAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setPlayingIdx(null);
    clearTimeout(timerRef.current);
    setTimeLeft(null);
    setTimer(null);
  };

  const handlePlay = (idx) => {
    if (playingIdx === idx) {
      stopAudio();
      return;
    }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(WHITE_NOISE[idx].url);
    audio.loop   = true;
    audio.volume = volume;
    audio.play().catch(() => {});
    audioRef.current = audio;
    setPlayingIdx(idx);

    // 타이머 설정
    if (timer) setTimeLeft(timer * 60);
  };

  const handleTimer = (min) => {
    if (timer === min) {
      setTimer(null);
      setTimeLeft(null);
      clearTimeout(timerRef.current);
    } else {
      setTimer(min);
      if (playingIdx !== null) setTimeLeft(min * 60);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  const currentDay = planDays.find(d => d.day === activeDay) || planDays[0];
  const dayKey     = `plan${activePlan}_day${activeDay}`;
  const dayChecks  = checks[dayKey] || {};
  const totalMissions = currentDay.missions.length;
  const doneMissions  = Object.values(dayChecks).filter(Boolean).length;
  const progressPct   = totalMissions > 0 ? Math.round((doneMissions / totalMissions) * 100) : 0;

  const totalAll = planDays.reduce((s, d) => s + d.missions.length, 0);
  const doneAll  = planDays.reduce((s, d) => {
    const k = `plan${activePlan}_day${d.day}`;
    return s + Object.values(checks[k] || {}).filter(Boolean).length;
  }, 0);
  const planProgress = totalAll > 0 ? Math.round((doneAll / totalAll) * 100) : 0;

  let streak = 0;
  for (let i = 1; i <= planDays.length; i++) {
    const k = `plan${activePlan}_day${i}`;
    const dc = checks[k] || {};
    const done = Object.values(dc).filter(Boolean).length;
    const total = planDays.find(d => d.day === i)?.missions.length || 0;
    if (done === total && total > 0) streak++;
    else break;
  }

  const toggleCheck = (missionId) => {
    setChecks(prev => ({
      ...prev,
      [dayKey]: { ...(prev[dayKey] || {}), [missionId]: !(prev[dayKey]?.[missionId]) }
    }));
  };

  const handlePlanChange = (plan) => {
    setActivePlan(plan);
    setActiveDay(1);
  };

  const getCharacter = () => {
    if (progressPct === 100) return { emoji: '🌟', msg: '오늘 완벽해요!' };
    if (progressPct >= 60)   return { emoji: '😊', msg: '잘하고 있어요!' };
    if (progressPct >= 30)   return { emoji: '😐', msg: '조금만 더!' };
    return { emoji: '😴', msg: '시작해볼까요?' };
  };

  const char = getCharacter();
  const fatigue    = analysisResult?.fatigue    || 'high';
  const darkCircle = analysisResult?.darkCircle || 72;
  const sleepScore = analysisResult?.sleepScore || 4.2;
  const fatigueNum   = fatigue === 'high' ? 72 : fatigue === 'mid' ? 45 : 20;
  const fatigueLabel = fatigue === 'high' ? '위험 단계' : fatigue === 'mid' ? '주의 단계' : '양호';
  const fatigueColor = fatigue === 'high' ? '#ef4444' : fatigue === 'mid' ? '#f59e0b' : '#22c55e';

  return (
    <div className="coaching-screen">

      {/* 플랜 선택 */}
      <div className="section-title">수면 코칭 플랜 선택</div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        {[1, 7, 15].map(plan => {
          const info = PLAN_INFO[plan];
          const isActive = activePlan === plan;
          return (
            <button key={plan} onClick={() => handlePlanChange(plan)} style={{
              flex: 1, padding: '14px 10px', borderRadius: '14px', cursor: 'pointer',
              border: `1px solid ${isActive ? info.color : 'var(--border)'}`,
              background: isActive ? `rgba(${plan === 1 ? '239,68,68' : plan === 7 ? '245,158,11' : '110,231,247'},0.1)` : 'var(--bg2)',
              textAlign: 'center', transition: 'all 0.2s ease',
            }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '28px', color: isActive ? info.color : 'var(--muted)', lineHeight: 1 }}>{info.label}</div>
              <div style={{ fontSize: '10px', color: isActive ? info.color : 'var(--muted)', marginTop: '4px' }}>{info.desc}</div>
            </button>
          );
        })}
      </div>

      {/* 분석 결과 헤더 */}
      <div className="coaching-result-header">
        <div className="section-title" style={{ color: 'var(--accent2)' }}>ANALYSIS RESULT</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '12px' }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '52px', color: '#fff', lineHeight: 1 }}>{fatigueNum}</div>
          <div>
            <div style={{ fontSize: '14px', color: fatigueColor, fontWeight: 700 }}>{fatigueLabel}</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 300 }}>피로도 지수</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[
            { l: '다크서클', v: `${darkCircle}%`, c: fatigueColor },
            { l: '수면점수',  v: `${sleepScore}`,  c: '#f59e0b' },
            { l: `${activePlan}일 진행`, v: `${planProgress}%`, c: '#6ee7f7' },
          ].map(i => (
            <div key={i.l} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px 14px', flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{i.l}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '22px', color: i.c }}>{i.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 플랜 진행률 */}
      <div className="week-chart" style={{ padding: '14px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '18px', letterSpacing: '1px' }}>{activePlan}일 집중 케어 플랜</div>
            {streak > 0 && <div style={{ fontSize: '10px', color: '#f59e0b', marginTop: '2px' }}>🔥 {streak}일 연속 달성!</div>}
          </div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '24px', color: 'var(--accent)' }}>{planProgress}%</div>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.07)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${planProgress}%`, background: 'linear-gradient(90deg,var(--accent),#4dd8ee)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '14px', overflowX: 'auto', paddingBottom: '4px' }}>
          {planDays.map(d => {
            const k = `plan${activePlan}_day${d.day}`;
            const dc = checks[k] || {};
            const done = Object.values(dc).filter(Boolean).length;
            const allDone = done === d.missions.length && d.missions.length > 0;
            const isActive = activeDay === d.day;
            return (
              <button key={d.day} onClick={() => setActiveDay(d.day)} style={{
                flexShrink: 0, padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                border: `1px solid ${isActive ? 'rgba(110,231,247,0.5)' : allDone ? 'rgba(34,197,94,0.4)' : 'var(--border)'}`,
                background: isActive ? 'rgba(110,231,247,0.12)' : allDone ? 'rgba(34,197,94,0.08)' : 'var(--bg3)',
                color: isActive ? 'var(--accent)' : allDone ? '#22c55e' : 'var(--muted)',
                fontFamily: "'Bebas Neue',sans-serif", fontSize: '13px', letterSpacing: '0.5px',
              }}>
                {allDone ? '✓' : `DAY${d.day}`}
              </button>
            );
          })}
        </div>
      </div>

      {/* 오늘 미션 */}
      <div className="section-title">DAY {activeDay} — {currentDay.title}</div>
      <div className="coaching-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(110,231,247,0.08)', border: '1px solid rgba(110,231,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>
            {char.emoji}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>
              <span>{char.msg}</span>
              <span style={{ color: doneMissions === totalMissions ? '#22c55e' : 'var(--accent)' }}>{doneMissions}/{totalMissions} 완료</span>
            </div>
            <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: progressPct === 100 ? 'linear-gradient(90deg,#22c55e,#4ade80)' : 'linear-gradient(90deg,var(--accent),#4dd8ee)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {currentDay.missions.map(mission => {
            const isChecked = dayChecks[mission.id] || false;
            const tc = TYPE_COLOR[mission.type];
            return (
              <div key={mission.id} onClick={() => toggleCheck(mission.id)} style={{
                display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 12px',
                background: isChecked ? 'rgba(110,231,247,0.05)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isChecked ? 'rgba(110,231,247,0.25)' : 'var(--border)'}`,
                borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s ease',
              }}>
                <div style={{ width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0, border: `1.5px solid ${isChecked ? 'var(--accent)' : 'rgba(255,255,255,0.2)'}`, background: isChecked ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#0b0b13', fontWeight: 700 }}>
                  {isChecked && '✓'}
                </div>
                <span style={{ fontSize: '12px', flex: 1, textDecoration: isChecked ? 'line-through' : 'none', color: isChecked ? 'rgba(255,255,255,0.35)' : 'var(--text)' }}>{mission.text}</span>
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', background: tc.bg, border: `1px solid ${tc.border}`, color: tc.color, flexShrink: 0 }}>{mission.type}</span>
              </div>
            );
          })}
        </div>

        {doneMissions === totalMissions && totalMissions > 0 && (
          <div style={{ marginTop: '14px', padding: '12px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '10px', textAlign: 'center', fontSize: '13px', color: '#4ade80', fontWeight: 700 }}>
            🎉 DAY {activeDay} 완료! 내일도 화이팅!
          </div>
        )}
      </div>

      {/* ─── 백색소음 (업그레이드) ─── */}
      <div className="music-card">
        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--accent)', letterSpacing: '1px', marginBottom: '4px' }}>🌙 수면 백색소음</div>
            <div style={{ fontSize: '14px', fontWeight: 700 }}>오늘의 백색소음</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {playingIdx !== null && (
              <div style={{ fontSize: '11px', color: 'var(--accent)', background: 'rgba(110,231,247,0.1)', border: '1px solid rgba(110,231,247,0.3)', borderRadius: '20px', padding: '3px 10px' }}>
                재생 중
              </div>
            )}
            <div className="music-badge">{WHITE_NOISE.length}개</div>
          </div>
        </div>

        {/* 음악 목록 */}
        {WHITE_NOISE.map((m, idx) => {
          const isPlaying = playingIdx === idx;
          const isAI      = aiRecommended === idx;
          const aiReason  = getAiReason(idx, analysisResult);
          return (
            <div key={m.title} style={{
              marginBottom: '8px',
              background: isPlaying ? 'rgba(110,231,247,0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isPlaying ? 'rgba(110,231,247,0.3)' : 'var(--border)'}`,
              borderRadius: '12px', padding: '12px 14px',
              transition: 'all 0.2s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* 아이콘 */}
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                  background: isPlaying ? 'rgba(110,231,247,0.15)' : 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
                }}>
                  {isPlaying ? <SoundWave /> : m.icon}
                </div>

                {/* 제목 + 뱃지 */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: isPlaying ? 'var(--accent)' : 'var(--text)' }}>{m.title}</span>
                    {isAI && (
                      <span style={{
                        fontSize: '9px', padding: '2px 7px', borderRadius: '20px', fontWeight: 700,
                        background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)',
                        color: 'var(--accent2)',
                      }}>
                        🤖 AI 추천
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{m.artist}</div>
                </div>

                {/* 재생 버튼 */}
                <div className="play-btn" onClick={() => handlePlay(idx)} style={{
                  background: isPlaying ? 'rgba(110,231,247,0.2)' : 'rgba(110,231,247,0.1)',
                  border: isPlaying ? '1px solid rgba(110,231,247,0.4)' : 'none',
                  flexShrink: 0,
                }}>
                  {isPlaying ? '⏸' : '▶'}
                </div>
              </div>

              {/* AI 추천 이유 */}
              {isAI && aiReason && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--accent2)', background: 'rgba(167,139,250,0.08)', borderRadius: '8px', padding: '6px 10px' }}>
                  💡 {aiReason}
                </div>
              )}
            </div>
          );
        })}

        {/* 볼륨 슬라이더 */}
        <div style={{ marginTop: '14px', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px' }}>🔈</span>
            <input
              type="range" min="0" max="1" step="0.05"
              value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--accent)', height: '4px' }}
            />
            <span style={{ fontSize: '14px' }}>🔊</span>
            <span style={{ fontSize: '11px', color: 'var(--muted)', minWidth: '32px', textAlign: 'right' }}>
              {Math.round(volume * 100)}%
            </span>
          </div>
        </div>

        {/* 수면 타이머 */}
        <div style={{ marginTop: '10px', padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>⏱ 수면 타이머</div>
            {timeLeft !== null && (
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '18px', color: 'var(--accent)' }}>
                {formatTime(timeLeft)}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[15, 30, 60].map(min => (
              <button key={min} onClick={() => handleTimer(min)} style={{
                flex: 1, padding: '8px 0', borderRadius: '10px', cursor: 'pointer',
                border: `1px solid ${timer === min ? 'rgba(110,231,247,0.5)' : 'var(--border)'}`,
                background: timer === min ? 'rgba(110,231,247,0.12)' : 'var(--bg2)',
                color: timer === min ? 'var(--accent)' : 'var(--muted)',
                fontFamily: "'Noto Sans KR', sans-serif", fontSize: '12px', fontWeight: timer === min ? 700 : 400,
                transition: 'all 0.2s',
              }}>
                {min}분
              </button>
            ))}
            {(timer || playingIdx !== null) && (
              <button onClick={stopAudio} style={{
                padding: '8px 12px', borderRadius: '10px', cursor: 'pointer',
                border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)',
                color: '#f87171', fontFamily: "'Noto Sans KR', sans-serif", fontSize: '12px',
              }}>
                정지
              </button>
            )}
          </div>
          {timer && (
            <div style={{ marginTop: '8px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
              {timer}분 후 자동으로 꺼져요 🌙
            </div>
          )}
        </div>
      </div>

      <button className="confirm-btn">✓ 오늘 코칭 확인 완료</button>
    </div>
  );
}

export default Coaching;
