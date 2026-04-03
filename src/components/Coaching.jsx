import React, { useState, useEffect, useRef } from 'react';
import { useCoaching } from '../hooks/useCoaching';

// ✅ 백색소음 목록
const WHITE_NOISE = [
  { title: '빗소리',          artist: '자연 백색소음',  icon: '🌧', url: '/sounds/rain.mp3',    aiTag: 'stress' },
  { title: '파도 소리',       artist: '해변 백색소음',  icon: '🌊', url: '/sounds/wave.mp3',    aiTag: 'fatigue' },
  { title: '숲속 바람',       artist: '자연 백색소음',  icon: '🌿', url: '/sounds/forest.mp3',  aiTag: 'sleep' },
  { title: 'Deep Sleep Waves', artist: 'Binaural Beats', icon: '🎵', url: '/sounds/sleep.mp3',   aiTag: 'darkcircle' },
  { title: '산속 계곡',       artist: '자연 백색소음',  icon: '🏔', url: '/sounds/valley.mp3',  aiTag: 'stress' },
  { title: '캠프파이어',      artist: '자연 백색소음',  icon: '🔥', url: '/sounds/fire.mp3',    aiTag: 'relax' },
];

const getAiRecommended = (analysisResult) => {
  if (!analysisResult) return 3;
  const fatigue = analysisResult?.fatigue;
  if (fatigue === 'high') return 3;
  if (fatigue === 'mid')  return 0;
  return 2;
};

const getAiReason = (idx, analysisResult) => {
  if (!analysisResult) return idx === 3 ? '다크서클 개선에 효과적인 뇌파 음악이에요' : '';
  const fatigue = analysisResult?.fatigue;
  if (idx === 3 && fatigue === 'high') return '피로도가 높아요! 깊은 수면을 위한 뇌파 음악 추천';
  if (idx === 0 && fatigue === 'mid')  return '스트레스 완화에 빗소리가 효과적이에요';
  if (idx === 2 && fatigue === 'low')  return '현재 컨디션 유지에 자연 소리가 좋아요';
  return '';
};

function SoundWave() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '16px' }}>
      {[1,2,3,4].map(i => (
        <div key={i} style={{
          width: '3px', borderRadius: '2px',
          background: 'var(--accent)',
          animation: `soundwave ${0.4 + i * 0.1}s ease-in-out infinite alternate`,
          height: `${4 + i * 3}px`,
        }} />
      ))}
      <style>{`@keyframes soundwave { from{transform:scaleY(0.4)} to{transform:scaleY(1.2)} }`}</style>
    </div>
  );
}

const TYPE_COLOR = {
  '필수': { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', color: '#f87171' },
  '권장': { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', color: '#fbbf24' },
  '선택': { bg: 'rgba(110,231,247,0.1)', border: 'rgba(110,231,247,0.3)', color: '#6ee7f7' },
};

function Coaching({ analysisResult }) {
  const { planStatus, activeDay, setActiveDay, missions, dailyAnalysis, isLocked, loadingMissions, toggleCheck } = useCoaching();
  const [playingIdx, setPlayingIdx]     = useState(null);
  const [volume, setVolume]             = useState(0.5);
  const [timer, setTimer]               = useState(null);
  const [timeLeft, setTimeLeft]         = useState(null);
  const audioRef  = useRef(null);
  const timerRef  = useRef(null);

  const planType       = planStatus?.plan_type || 7;
  const currentDayNum  = planStatus?.current_day_number || 1;
  const aiRecommended = getAiRecommended(analysisResult);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) { stopAudio(); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft]);

  const stopAudio = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setPlayingIdx(null); clearTimeout(timerRef.current); setTimeLeft(null); setTimer(null);
  };

  const handlePlay = (idx) => {
    if (playingIdx === idx) { stopAudio(); return; }
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(WHITE_NOISE[idx].url);
    audio.loop = true; audio.volume = volume; audio.play().catch(() => {});
    audioRef.current = audio; setPlayingIdx(idx); if (timer) setTimeLeft(timer * 60);
  };

  const handleTimer = (min) => {
    if (timer === min) { setTimer(null); setTimeLeft(null); clearTimeout(timerRef.current); }
    else { setTimer(min); if (playingIdx !== null) setTimeLeft(min * 60); }
  };

  const formatTime = (sec) => `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;

  const fatigue     = analysisResult?.fatigue    || 'high';
  const darkCircle  = analysisResult?.darkCircle || 72;
  const sleepScore  = analysisResult?.sleepScore || 4.2;
  const fatigueNum  = fatigue === 'high' ? 72 : fatigue === 'mid' ? 45 : 20;
  const fatigueLabel = fatigue === 'high' ? '위험 단계' : fatigue === 'mid' ? '주의 단계' : '양호';
  const fatigueColor = fatigue === 'high' ? '#ef4444' : fatigue === 'mid' ? '#f59e0b' : '#22c55e';

  const totalMissions = missions.length;
  const doneMissions  = missions.filter(m => m.is_completed).length;
  const progressPct   = totalMissions > 0 ? Math.round((doneMissions / totalMissions) * 100) : 0;

  const getCharacter = () => {
    if (progressPct === 100) return { emoji: '🌟', msg: '오늘 완벽해요!' };
    if (progressPct >= 60)   return { emoji: '😊', msg: '잘하고 있어요!' };
    if (progressPct >= 30)   return { emoji: '😐', msg: '조금만 더!' };
    return { emoji: '😴', msg: '시작해볼까요?' };
  };
  const char = getCharacter();

  return (
    <div className="coaching-screen">

      {/* ✅ AI 맞춤 솔루션 카드 (서버에서 온 원본 글 출력) */}
      <div className="section-title" style={{ color: '#6ee7f7' }}>🤖 AI 맞춤 수면 솔루션</div>
      <div className="coaching-card" style={{ border: '1px solid rgba(110,231,247,0.3)', background: 'rgba(110,231,247,0.05)', marginBottom: '25px' }}>
        {loadingMissions ? (
          <div style={{ textAlign: 'center', padding: '20px' }}><p style={{ color: 'var(--muted)', fontSize: '13px' }}>AI 데이터를 불러오는 중...</p></div>
        ) : dailyAnalysis ? (
          <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: '1.6', wordBreak: 'keep-all' }}>{dailyAnalysis}</div>
        ) : (
          <p style={{ color: 'var(--muted)', fontSize: '12px', textAlign: 'center' }}>데이터를 분석할 수 없습니다. 수면 기록을 먼저 등록해 주세요.</p>
        )}
      </div>

      {/* 플랜 정보 + 날짜 탭 */}
      <div className="section-title">수면 코칭 플랜 — {planType}일 과정</div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
        {Array.from({ length: planType }, (_, i) => i + 1).map(day => {
          const isFuture  = day > currentDayNum;
          const isActive  = activeDay === day;
          return (
            <button key={day} onClick={() => !isFuture && setActiveDay(day)} disabled={isFuture} style={{
                flexShrink: 0, minWidth: '44px', padding: '8px 6px',
                borderRadius: '10px', border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                background: isActive ? 'rgba(110,231,247,0.12)' : 'var(--bg2)',
                color: isFuture ? 'rgba(255,255,255,0.2)' : isActive ? 'var(--accent)' : 'var(--muted)',
                cursor: isFuture ? 'not-allowed' : 'pointer', fontSize: '11px', fontWeight: isActive ? 700 : 400, transition: 'all 0.2s',
              }}>{isFuture ? '🔒' : `D${day}`}</button>
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
            { l: '수면점수',  v: `${sleepScore}`,  c: '#f59e0b' },
            { l: `${planType}일 진행`, v: `${progressPct}%`, c: '#6ee7f7' },
          ].map(i => (
            <div key={i.l} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '8px 14px', flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{i.l}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '22px', color: i.c }}>{i.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 오늘 미션 */}
      <div className="section-title">DAY {activeDay} 미션</div>
      <div className="coaching-card">
        {loadingMissions ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--muted)', fontSize: '13px' }}>미션을 불러오는 중...</div>
        ) : isLocked ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔒</div>
            <p style={{ color: 'var(--muted)', fontSize: '13px', margin: 0 }}>내일의 솔루션은 내일 분석 후 공개됩니다!</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(110,231,247,0.08)', border: '1px solid rgba(110,231,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>{char.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px' }}>
                  <span>{char.msg}</span>
                  <span style={{ color: doneMissions === totalMissions && totalMissions > 0 ? '#22c55e' : 'var(--accent)' }}>{doneMissions}/{totalMissions} 완료</span>
                </div>
                <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progressPct}%`, background: progressPct === 100 ? 'linear-gradient(90deg,#22c55e,#4ade80)' : 'linear-gradient(90deg,var(--accent),#4dd8ee)', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {missions.map(mission => {
                const isChecked = mission.is_completed === 1;
                const tc = TYPE_COLOR[mission.type] || TYPE_COLOR['선택'];
                return (
                  <div key={mission.detail_idx} onClick={() => toggleCheck(mission.detail_idx, mission.is_completed)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 12px', background: isChecked ? 'rgba(110,231,247,0.05)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isChecked ? 'rgba(110,231,247,0.25)' : 'var(--border)'}`, borderRadius: '10px', cursor: 'pointer' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: `1.5px solid ${isChecked ? 'var(--accent)' : 'rgba(255,255,255,0.2)'}`, background: isChecked ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: '#0b0b13', fontWeight: 700 }}>{isChecked && '✓'}</div>
                    <span style={{ fontSize: '12px', flex: 1, textDecoration: isChecked ? 'line-through' : 'none', color: isChecked ? 'rgba(255,255,255,0.35)' : 'var(--text)' }}>{mission.plan_task}</span>
                    {mission.type && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '12px', background: tc.bg, border: `1px solid ${tc.border}`, color: tc.color }}>{mission.type}</span>}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 백색소음 업그레이드 */}
      <div className="music-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--accent)', letterSpacing: '1px', marginBottom: '4px' }}>🌙 수면 백색소음</div>
            <div style={{ fontSize: '14px', fontWeight: 700 }}>오늘의 백색소음</div>
          </div>
        </div>
        {WHITE_NOISE.map((m, idx) => {
          const isPlaying = playingIdx === idx;
          const isAI = aiRecommended === idx;
          const aiReason = getAiReason(idx, analysisResult);
          return (
            <div key={m.title} style={{ marginBottom: '8px', background: isPlaying ? 'rgba(110,231,247,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isPlaying ? 'rgba(110,231,247,0.3)' : 'var(--border)'}`, borderRadius: '12px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0, background: isPlaying ? 'rgba(110,231,247,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>{isPlaying ? <SoundWave /> : m.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: isPlaying ? 'var(--accent)' : 'var(--text)' }}>{m.title}</span>
                    {isAI && <span style={{ fontSize: '9px', padding: '2px 7px', borderRadius: '20px', fontWeight: 700, background: 'rgba(167,139,250,0.2)', border: '1px solid rgba(167,139,250,0.4)', color: 'var(--accent2)' }}>🤖 AI 추천</span>}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{m.artist}</div>
                </div>
                <div className="play-btn" onClick={() => handlePlay(idx)} style={{ background: isPlaying ? 'rgba(110,231,247,0.2)' : 'rgba(110,231,247,0.1)' }}>{isPlaying ? '⏸' : '▶'}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Coaching;
