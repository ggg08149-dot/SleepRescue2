import React from 'react';

const coachData = [
  { icon:'☕', color:'#ef4444', tag:'카페인 관리', title:'오후 2시 이후 카페인 금지', desc:'카페인 섭취량(280mg)이 기준 초과. 수면 질 평균 1.8점 향상 효과.', pct:80 },
  { icon:'📱', color:'#f59e0b', tag:'스마트폰 관리', title:'취침 1시간 전 폰 사용 중단', desc:'청색광이 멜라토닌 분비를 억제해요. 입면 시간 평균 22분 단축.', pct:65 },
  { icon:'🌙', color:'#6ee7f7', tag:'수면 루틴', title:'일정한 취침·기상 시간 유지', desc:'매일 오전 7시 기상 시 2주 내 수면 점수 7점대 회복 가능.', pct:55 },
];

const music = [
  { title:'Rain & Piano', artist:'수면유도 플레이리스트', dur:'45:20' },
  { title:'Deep Sleep Waves', artist:'Binaural Beats', dur:'60:00' },
  { title:'Forest Night Sounds', artist:'자연의 소리', dur:'30:15' },
];

const DC_AVG = 70;

const getAllSolutions = (avg) => {
  const base = [
    { icon:'♨️', title:'스팀 온열 안대', desc:'취침 전 10분\n혈액순환 촉진\n피로 완화' },
    { icon:'🧊', title:'얼음팩 안대', desc:'기상 후 5분\n부기 & 색소\n진정 효과' },
    { icon:'🔄', title:'냉온 교대', desc:'온열 5분 후\n냉찜질 5분\n부기 최소화' },
  ];
  const extra = [
    { icon:'🥒', title:'오이 슬라이스 팩', desc:'수분 공급\n색소 진정\n10분 팩' },
    { icon:'💧', title:'수분 섭취', desc:'하루 2L 이상\n붓기 감소\n혈액순환 개선' },
    { icon:'😴', title:'수면 자세', desc:'높은 베개 사용\n림프 순환 촉진\n부기 예방' },
    { icon:'💊', title:'비타민 C 섭취', desc:'색소 침착 개선\n피부 재생 촉진\n항산화 효과' },
    { icon:'☀️', title:'자외선 차단', desc:'색소 침착 예방\n외출 시 선크림\nSPF 50+ 권장' },
  ];

  if (avg < 50) return base.slice(0, 2);
  if (avg < 65) return base;
  if (avg < 75) return [...base, ...extra.slice(0, 2)];
  return [...base, ...extra];
};

const getLevel = (avg) => {
  if (avg < 50) return { label:'예방 관리', color:'#22c55e' };
  if (avg < 65) return { label:'주의 단계', color:'#f59e0b' };
  if (avg < 75) return { label:'집중 케어 필요', color:'#ef4444' };
  return { label:'위험 — 즉각 케어', color:'#ef4444' };
};

function Coaching() {
  const solutions = getAllSolutions(DC_AVG);
  const level = getLevel(DC_AVG);

  return (
    <div className="coaching-screen">
      {/* 분석 결과 헤더 */}
      <div className="coaching-result-header">
        <div className="section-title" style={{color:'var(--accent2)'}}>ANALYSIS RESULT</div>
        <div style={{display:'flex',alignItems:'baseline',gap:'10px',marginBottom:'12px'}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'52px',color:'#fff',lineHeight:1}}>72</div>
          <div>
            <div style={{fontSize:'14px',color:'#ef4444',fontWeight:700}}>위험 단계</div>
            <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',fontWeight:300}}>피로도 지수</div>
          </div>
        </div>
        <div style={{display:'flex',gap:'8px'}}>
          {[{l:'다크서클',v:'72%',c:'#ef4444'},{l:'수면점수',v:'4.2',c:'#f59e0b'},{l:`3일평균`,v:`${DC_AVG}%`,c:'#ef4444'}].map(i => (
            <div key={i.l} style={{background:'rgba(255,255,255,0.05)',borderRadius:'8px',padding:'8px 14px',flex:1,textAlign:'center'}}>
              <div style={{fontSize:'10px',color:'rgba(255,255,255,0.4)'}}>{i.l}</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'22px',color:i.c}}>{i.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 코칭 카드 */}
      <div className="section-title">AI COACHING PLAN</div>
      {coachData.map((c, i) => (
        <div key={i} className="coaching-card">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <div style={{fontSize:'20px'}}>{c.icon}</div>
              <div>
                <div style={{fontSize:'10px',color:c.color,letterSpacing:'.5px',marginBottom:'2px'}}>{c.tag}</div>
                <div style={{fontSize:'14px',fontWeight:700}}>{c.title}</div>
              </div>
            </div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:'20px',color:c.color}}>{String(i+1).padStart(2,'0')}</div>
          </div>
          <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',lineHeight:1.7,fontWeight:300,marginBottom:'10px'}}>{c.desc}</div>
          <div className="stat-bar"><div className="stat-bar-fill" style={{width:`${c.pct}%`,background:c.color}}></div></div>
          <div style={{fontSize:'10px',color:'rgba(255,255,255,0.4)',marginTop:'4px'}}>피로 기여도 {c.pct}%</div>
        </div>
      ))}

      {/* 다크서클 케어 */}
      <div className="dc-care">
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
          <div style={{fontSize:'18px'}}>👁</div>
          <div>
            <div style={{fontSize:'10px',color:'#f87171',letterSpacing:'.5px',marginBottom:'2px'}}>DARK CIRCLE CARE</div>
            <div style={{fontSize:'14px',fontWeight:700}}>다크서클 집중 케어 필요</div>
          </div>
          <div className="dc-care-badge" style={{marginLeft:'auto',background:`rgba(239,68,68,0.15)`,border:`1px solid rgba(239,68,68,0.3)`,color:'#f87171'}}>
            3일 평균 {DC_AVG}% · {level.label}
          </div>
        </div>
        <div style={{fontSize:'12px',color:'rgba(255,255,255,0.4)',lineHeight:1.7,fontWeight:300,marginBottom:'12px'}}>
          3일 연속 다크서클 지수 65% 초과. 눈 주변 혈액순환 개선을 위한 케어 루틴 <span style={{color:'#f87171',fontWeight:700}}>{solutions.length}가지</span>를 추천해드려요.
        </div>
        <div className="solution-row" style={{flexWrap:'wrap'}}>
          {solutions.map(s => (
            <div key={s.title} className="solution-chip">
              <div style={{fontSize:'22px',marginBottom:'4px'}}>{s.icon}</div>
              <div style={{fontSize:'12px',fontWeight:700,marginBottom:'2px'}}>{s.title}</div>
              <div style={{fontSize:'10px',color:'rgba(255,255,255,0.4)',lineHeight:1.5,whiteSpace:'pre-line'}}>{s.desc}</div>
            </div>
          ))}
        </div>
        <div style={{marginTop:'12px',padding:'10px 14px',background:'rgba(255,255,255,0.04)',borderRadius:'8px',fontSize:'11px',color:'rgba(255,255,255,0.4)',lineHeight:1.6}}>
          💡 <span style={{color:'var(--accent2)'}}>추천 루틴</span> — 취침 전: 스팀 온열 안대 10분 → 기상 후: 냉찜질 5분. 2주 꾸준히 하면 다크서클 지수 평균 <span style={{color:'var(--accent)'}}>15~20% 감소</span> 효과.
        </div>
      </div>

      {/* 음악 */}
      <div className="music-card">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
          <div>
            <div style={{fontSize:'10px',color:'var(--accent)',letterSpacing:'1px',marginBottom:'4px'}}>🎵 수면유도 음악 추천</div>
            <div style={{fontSize:'14px',fontWeight:700}}>오늘의 플레이리스트</div>
          </div>
          <div className="music-badge">3곡</div>
        </div>
        {music.map(m => (
          <div key={m.title} className="music-row">
            <div className="music-icon">🎵</div>
            <div style={{flex:1}}>
              <div style={{fontSize:'13px',fontWeight:500}}>{m.title}</div>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)',fontWeight:300}}>{m.artist}</div>
            </div>
            <div style={{fontSize:'11px',color:'rgba(255,255,255,0.4)'}}>{m.dur}</div>
            <div className="play-btn">▶</div>
          </div>
        ))}
      </div>

      <button className="confirm-btn">✓ 코칭 확인 완료</button>
    </div>
  );
}

export default Coaching;
