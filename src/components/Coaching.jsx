import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// ─── 상수 및 데이터 정의 ───
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
    ]},
    { day: 2, title: '수면 환경 개선', missions: [
      { id: 1, text: '침실 온도 18~20도로 유지', type: '필수' },
      { id: 2, text: '완전 암막 커튼 또는 안대 착용', type: '필수' },
    ]},
    // ... (필요에 따라 3~7일차 데이터 추가 가능)
  ],
  15: [
    { day: 1, title: '카페인 & 스크린 차단', missions: [{ id: 1, text: '오후 2시 이후 카페인 차단', type: '필수' }]},
    // ... (15일차까지의 데이터)
  ]
};

const WHITE_NOISE = [
  { id: 0, title: '빗소리', artist: '자연 백색소음', icon: '🌧', url: '/sounds/rain.mp3', tags: ['스트레스', '불면증'] },
  { id: 1, title: '파도 소리', artist: '해변 백색소음', icon: '🌊', url: '/sounds/wave.mp3', tags: ['피로회복', '긴장완화'] },
  { id: 2, title: '숲속 바람', artist: '자연 백색소음', icon: '🌿', url: '/sounds/forest.mp3', tags: ['수면유도', '안정'] },
  { id: 3, title: 'Deep Sleep Waves', artist: 'Binaural Beats', icon: '🎵', url: '/sounds/sleep.mp3', tags: ['깊은수면', '다크서클'] },
  { id: 4, title: '산속 계곡', artist: '자연 백색소음', icon: '🏔', url: '/sounds/valley.mp3', tags: ['자연치유', '안정'] },
  { id: 5, title: '캠프파이어', artist: '자연 백색소음', icon: '🔥', url: '/sounds/fire.mp3', tags: ['명상', '안정'] },
];

const TYPE_COLOR = {
  '필수': { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', color: '#f87171' },
  '권장': { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', color: '#fbbf24' },
  '선택': { bg: 'rgba(110,231,247,0.1)', border: 'rgba(110,231,247,0.3)', color: '#6ee7f7' },
};

const PLAN_INFO = {
  1: { label: '1일', desc: '안색 긴급 복구', color: '#ef4444' },
  7: { label: '7일', desc: '진짜 원인 탐색', color: '#f59e0b' },
  15: { label: '15일', desc: '만성 피로 탈출', color: '#6ee7f7' },
};

// ─── 헬퍼 함수 ───
const getAiRecommended = (analysisResult) => {
  if (!analysisResult) return 3;
  const fatigue = analysisResult?.fatigue;
  const darkCircle = analysisResult?.darkCircle || 0;
  if (fatigue === 'high' || darkCircle > 65) return 3;
  if (fatigue === 'mid') return 0;
  return 2;
};

const getAiReason = (id, analysisResult) => {
  if (!analysisResult) return id === 3 ? '다크서클 개선에 효과적인 뇌파 음악이에요' : '';
  const fatigue = analysisResult?.fatigue;
  if (id === 3 && fatigue === 'high') return '피로도가 높아요! 깊은 수면을 위한 뇌파 음악 추천';
  if (id === 0 && fatigue === 'mid') return '스트레스 완화에 빗소리가 효과적이에요';
  if (id === 2 && fatigue === 'low') return '현재 컨디션 유지에 자연 소리가 좋아요';
  return '';
};

// ─── 하위 컴포넌트 ───
function SoundWave() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '16px' }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{
          width: '3px', borderRadius: '2px', background: 'var(--accent)',
          animation: `soundwave ${0.4 + i * 0.1}s ease-in-out infinite alternate`,
          height: `${4 + i * 3}px`,
        }} />
      ))}
      <style>{`@keyframes soundwave { from{transform:scaleY(0.4)} to{transform:scaleY(1.2)} }`}</style>
    </div>
  );
}

// ─── 메인 컴포넌트 ───
function Coaching({ selectedPlan: initialPlan = 7, analysisResult }) {
  const [activePlan, setActivePlan] = useState(initialPlan);
  const [activeDay, setActiveDay] = useState(1);
  const [checks, setChecks] = useState({});
  
  // GPT & 분석 상태
  const [gptSolutions, setGptSolutions] = useState([]);
  const [gptAnalysis, setGptAnalysis] = useState("");
  const [loadingGpt, setLoadingGpt] = useState(false);

  // 재생 및 타이머 상태
  const [playingIdx, setPlayingIdx] = useState(null);
  const [volume, setVolume] = useState(0.5);
  const [timer, setTimer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  const aiRecommended = getAiRecommended(analysisResult);

  // GPT 코칭 데이터 가져오기
  useEffect(() => {
    let isMounted = true;
    const fetchGptCoaching = async () => {
      const analysisId = analysisResult ? JSON.stringify(analysisResult) : 'no_data';
      setLoadingGpt(true);
      try {
        const userIdx = localStorage.getItem('user_idx') || "1008";
        const token = localStorage.getItem('token');
        const response = await axios.post('http://localhost:7000/api/coaching/analyze',
          { user_idx: parseInt(userIdx) },
          { headers: { 'Authorization': token ? `Bearer ${token}` : '' } }
        );
        if (isMounted && response.data.success) {
          setGptSolutions(response.data.solutions || []);
          setGptAnalysis(response.data.comparison_analysis || "");
        }
      } catch (error) {
        console.error("GPT 코칭 로드 실패:", error);
      } finally {
        if (isMounted) setLoadingGpt(false);
      }
    };
    fetchGptCoaching();
    return () => { isMounted = false; };
  }, [analysisResult]);

  // 볼륨 제어 및 타이머 로직
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) { stopAudio(); return; }
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
    if (playingIdx === idx) { stopAudio(); return; }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(WHITE_NOISE[idx].url);
    audio.loop = true;
    audio.volume = volume;
    audio.play().catch(() => {});
    audioRef.current = audio;
    setPlayingIdx(idx);
    if (timer) setTimeLeft(timer * 60);
  };

  const handleTimer = (min) => {
    if (timer === min) { setTimer(null); setTimeLeft(null); }
    else { setTimer(min); if (playingIdx !== null) setTimeLeft(min * 60); }
  };

  const formatTime = (sec) => `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;

  // 진행률 계산
  const planDays = PLAN_MISSIONS[activePlan] || PLAN_MISSIONS[7];
  const currentDay = planDays.find(d => d.day === activeDay) || planDays[0];
  const dayKey = `plan${activePlan}_day${activeDay}`;
  const dayChecks = checks[dayKey] || {};
  const progressPct = Math.round((Object.values(dayChecks).filter(Boolean).length / currentDay.missions.length) * 100) || 0;

  const toggleCheck = (id) => {
    setChecks(prev => ({ ...prev, [dayKey]: { ...(prev[dayKey] || {}), [id]: !prev[dayKey]?.[id] } }));
  };

  return (
    <div className="coaching-screen">
      {/* AI 분석 요약 */}
      {gptAnalysis && (
        <div className="coaching-card" style={{ border: '1px solid rgba(167,139,250,0.3)', background: 'rgba(167,139,250,0.05)', marginBottom: '16px', padding: '15px' }}>
          <p style={{ fontSize: '13px', color: '#e2e8f0', margin: 0 }}>📢 {gptAnalysis}</p>
        </div>
      )}

      {/* AI 맞춤 솔루션 */}
      <div className="section-title" style={{ color: '#6ee7f7' }}>🤖 AI 맞춤 수면 솔루션</div>
      <div className="coaching-card" style={{ border: '1px solid rgba(110,231,247,0.3)', background: 'rgba(110,231,247,0.05)', marginBottom: '25px', padding: '15px' }}>
        {loadingGpt ? <p>분석 중...</p> : gptSolutions.map((s, i) => <div key={i} style={{ fontSize: '13px', marginBottom: '5px' }}>• {s}</div>)}
      </div>

      {/* 플랜 선택 */}
      <div className="section-title">코칭 플랜 선택</div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {[1, 7, 15].map(p => (
          <button key={p} onClick={() => {setActivePlan(p); setActiveDay(1);}} style={{ flex: 1, padding: '15px', borderRadius: '12px', background: activePlan === p ? 'rgba(110,231,247,0.1)' : 'var(--bg2)', border: `1px solid ${activePlan === p ? 'var(--accent)' : 'transparent'}` }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: activePlan === p ? 'var(--accent)' : '#fff' }}>{PLAN_INFO[p].label}</div>
            <div style={{ fontSize: '10px' }}>{PLAN_INFO[p].desc}</div>
          </button>
        ))}
      </div>

      {/* 오늘의 미션 */}
      <div className="section-title">DAY {activeDay} 미션</div>
      <div className="coaching-card" style={{ padding: '20px' }}>
        {currentDay.missions.map(m => (
          <div key={m.id} onClick={() => toggleCheck(m.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', marginBottom: '8px', cursor: 'pointer' }}>
            <div style={{ width: '20px', height: '20px', border: '1px solid #fff', borderRadius: '4px', background: dayChecks[m.id] ? 'var(--accent)' : 'transparent' }}>{dayChecks[m.id] && '✓'}</div>
            <span style={{ flex: 1, fontSize: '13px' }}>{m.text}</span>
            <span style={{ fontSize: '10px', color: TYPE_COLOR[m.type].color }}>{m.type}</span>
          </div>
        ))}
      </div>

      {/* 백색소음 */}
      <div className="music-card" style={{ marginTop: '20px', padding: '20px' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '15px' }}>🌙 수면 백색소음</div>
        {WHITE_NOISE.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: playingIdx === i ? 'rgba(110,231,247,0.1)' : 'transparent', borderRadius: '10px' }}>
            <div style={{ fontSize: '24px' }}>{playingIdx === i ? <SoundWave /> : m.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '600' }}>{m.title} {aiRecommended === i && '🤖'}</div>
              <div style={{ fontSize: '11px', color: 'gray' }}>{m.artist}</div>
            </div>
            <button onClick={() => handlePlay(i)} style={{ padding: '8px 15px', borderRadius: '8px', background: 'var(--accent)', border: 'none', color: '#000' }}>{playingIdx === i ? '⏸' : '▶'}</button>
          </div>
        ))}
        
        {/* 타이머 및 볼륨 */}
        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
          {[15, 30, 60].map(min => (
            <button key={min} onClick={() => handleTimer(min)} style={{ flex: 1, padding: '10px', borderRadius: '8px', background: timer === min ? 'var(--accent)' : 'rgba(255,255,255,0.1)', color: timer === min ? '#000' : '#fff', border: 'none' }}>{min}분</button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Coaching;