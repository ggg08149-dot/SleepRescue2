import React, { useState, useEffect } from 'react';
import { getLatestFatigue } from '../api/fatigueApi';
import { startPlan } from '../api/planApi';
import { getPlanStatus } from '../api/planApi';

const dbRowToResult = (row) => ({
  fatigue      : row.fatigue_level,
  fatigueCause : row.fatigue_reason,
  fatigueDetails: (() => { try { return JSON.parse(row.analysis_result || '[]'); } catch { return []; } })(),
  score        : row.fatigue_score,
  savedAt      : row.created_at,
});

const getFatigueMessage = (fatigue, userName, causeName) => {
  if (fatigue === 'high') return `분석 결과, ${userName}님의 오늘의 피로도가 '높음' 상태예요. ${causeName}의 영향으로 다크서클이 평소보다 훨씬 짙게 측정되었으니, 오늘만큼은 수면 구조대의 특급 처방전에 몸을 맡겨보세요!`;
  if (fatigue === 'mid') return `수면 구조대가 분석해보니, 오늘 ${userName}님의 피로도가 '주의' 단계에 들어섰어요. 특히 ${causeName}의 영향으로 눈가가 평소보다 어두워진 상태예요.`;
  return `수면 구조대가 분석해보니, 오늘 ${userName}님의 피로는 안정적인 '낮음' 단계예요. ${causeName} 수치가 잘 관리되고 있어 눈가도 평소보다 훨씬 맑고 생기 있어 보이는 상태예요.`;
};

// 홈탭 피로지수와 동일한 이모지/색상 로직
const getFatigueEmoji = (fatigue) => {
  if (fatigue === 'high') return { emoji: '😵', color: '#ef4444' };
  if (fatigue === 'mid')  return { emoji: '😟', color: '#f59e0b' };
  return { emoji: '😊', color: '#22c55e' };
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

// ─── 결과 카드 ────────────────────────────────────
export function ResultCard({
  result,
  userName,
  selectedPlan,
  onSelectPlan,
  onStartCoaching,
  planSaving = false,
  isPlanActive,
  activePlanType
}) {
  if (!result) return null;
  const lv = FATIGUE_LEVELS.find(l => l.key === result.fatigue) || FATIGUE_LEVELS[0];
  const { emoji, color: emojiColor } = getFatigueEmoji(result.fatigue);
  const fatigueScore = Math.round(result.fatigueScore || result.score || 0);
  const causeName = result.fatigueCause === '모든 항목이 양호한 상태입니다.'
    ? '누적된 피로'
    : result.fatigueCause || '복합적 요인';
  const msg = getFatigueMessage(result.fatigue, userName, causeName);

  // 게이지 대시오프셋 계산 (홈탭과 동일한 로직)
  const fatigueDash = 264 - (264 * (fatigueScore / 100));

  return (
    <div>
      {/* 피로도 분석 결과 카드 */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1040, #2a1a5e)',
        border: '1px solid rgba(167,139,250,0.25)',
        borderRadius: '16px', padding: '20px', marginBottom: '14px',
      }}>
        <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 500, color: '#fff', marginBottom: '16px', letterSpacing: '1px' }}>
          피로도 분석 결과
        </div>

        {/* 3단계 인디케이터 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '20px' }}>
          {FATIGUE_LEVELS.map(level => {
            const isActive = result.fatigue === level.key;
            return (
              <div key={level.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '50%',
                  background: isActive ? level.bg : 'rgba(255,255,255,0.04)',
                  border: `2px solid ${isActive ? level.border : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px',
                  boxShadow: isActive ? `0 0 14px ${level.border}` : 'none',
                }}>
                  {level.icon}
                </div>
                <div style={{ fontSize: '11px', fontWeight: isActive ? 700 : 400, color: isActive ? level.color : 'rgba(255,255,255,0.3)' }}>
                  {level.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* ✅ 피로지수 게이지 (홈탭과 동일) */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px',
          background: 'rgba(255,255,255,0.04)', borderRadius: '14px',
          padding: '16px', marginBottom: '16px',
          border: `1px solid ${lv.border}`,
        }}>
          {/* SVG 게이지 */}
          <div style={{ position: 'relative', width: '80px', height: '80px' }}>
            <svg viewBox="0 0 100 100" width="80" height="80">
              <defs>
                <linearGradient id="faGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6ee7f7" />
                  <stop offset="50%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="42" fill="none"
                stroke="rgba(255,255,255,0.05)" strokeWidth="7"/>
              <circle cx="50" cy="50" r="42" fill="none"
                stroke="url(#faGrad)" strokeWidth="7" strokeLinecap="round"
                strokeDasharray="264"
                strokeDashoffset={fatigueDash}
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dashoffset 1.4s ease' }}/>
            </svg>
            {/* 이모지 (홈탭과 동일) */}
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontSize: '24px', lineHeight: 1 }}>{emoji}</div>
            </div>
          </div>

          {/* 수치 + 라벨 */}
          <div>
            <div style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '44px', lineHeight: 1,
              color: emojiColor,
            }}>
              {fatigueScore}%
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
              피로지수
            </div>
            <div style={{
              marginTop: '6px', fontSize: '11px', fontWeight: 700,
              padding: '3px 10px', borderRadius: '20px',
              background: lv.bg, border: `1px solid ${lv.border}`,
              color: lv.color, display: 'inline-block',
            }}>
              {lv.label}
            </div>
          </div>
        </div>

        {/* 피로 원인 */}
        {result.fatigueCause && (
          <div style={{ background: 'rgba(110,231,247,0.13)', border: '1px solid rgba(110,231,247,0.3)', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
            <div style={{ fontSize: '15px', color: '#fff', marginBottom: '6px', fontWeight: 500 }}>
              🔍 피로 원인 분석&nbsp;
              <span style={{ fontSize: '13px', color: '#6ee7f7' }}>{result.fatigueCause}</span>
            </div>
            {result.fatigueDetails?.map((d, i) => (
              <div key={i} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>{d}</div>
            ))}
          </div>
        )}

        {/* 메시지 */}
        <div style={{ background: 'rgba(255,255,255,0.12)', border: `1px solid ${lv.border}`, borderRadius: '12px', padding: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff' }}>
              🛌 {userName}님의 오늘의 피로도&nbsp;
              <span style={{ background: lv.bg, border: `1px solid ${lv.border}`, color: lv.color, fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px' }}>
                {lv.label}
              </span>
            </span>
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, fontWeight: 300 }}>{msg}</div>
        </div>
      </div>

      {/* 플랜 선택 */}
      {isPlanActive ? (
        <div style={{
          marginTop: '16px',
          padding: '20px',
          borderRadius: '14px',
          background: 'rgba(124,58,237,0.12)',
          border: '1px solid rgba(167,139,250,0.4)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>
            🚀 진행 중인 플랜
          </div>
          <div style={{ fontSize: '14px', color: '#ddd', marginBottom: '12px' }}>
            이미 <strong>{activePlanType}일 플랜</strong>을 진행 중입니다.<br/>
            코칭 탭에서 미션을 계속 수행해보세요!
          </div>
          <button
            className="analyze-btn"
            onClick={onStartCoaching}
            style={{ fontSize: '14px' }}
          >
            📋 코칭 탭으로 이동
          </button>
        </div>
      ) : (
        <>
          <div className="section-title">추천 수면 코칭 플랜</div>

          <div className="plan-grid">
            {PLAN_DATA.map(p => (
              <div key={p.n} className="plan-btn"
                onClick={() => onSelectPlan(p.n)}
                style={selectedPlan === p.n ? { borderColor: 'var(--accent)', background: 'rgba(110,231,247,0.1)' } : {}}
              >
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', color: 'var(--accent)' }}>
                  {p.days}
                </div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>{p.label}</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', whiteSpace: 'pre-line' }}>
                  {p.desc}
                </div>
              </div>
            ))}
          </div>

          {!isPlanActive && selectedPlan && (
            <button className="analyze-btn" onClick={onStartCoaching} disabled={planSaving}>
              {planSaving ? '⏳ 저장 중...' : `🚀 ${selectedPlan}일 플랜 진행하기`}
            </button>
          )}
        </>
      )}

      {!selectedPlan && (
        <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--muted)', marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.12)' }}>
          플랜을 선택하면 진행하기 버튼이 활성화됩니다
        </div>
      )}
    </div>
  );
}

// ─── 분석 결과 탭 ─────────────────────────────────
function AnalysisResult({ currentResult, existingResult, userName, startCoaching, onSwitchToScan }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planSaving, setPlanSaving]     = useState(false);
  const [latestFromDB, setLatestFromDB] = useState(null);

  const [isPlanActive, setIsPlanActive] = useState(false);
  const [activePlanType, setActivePlanType] = useState(null);

  useEffect(() => {
    const checkPlanStatus = async () => {
      try {
        const data = await getPlanStatus();
        if (!data || !data.start_date || !data.plan_type) return;

        const start = new Date(data.start_date);
        const today = new Date();

        start.setHours(0,0,0,0);
        today.setHours(0,0,0,0);

        const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;

        if (diff >= 1 && diff <= data.plan_type) {
          setIsPlanActive(true);
          setActivePlanType(data.plan_type);
        } else {
          setIsPlanActive(false);
        }

      } catch (err) {
        console.error('플랜 상태 확인 실패:', err);
      }
    };

    checkPlanStatus();
  }, []);

  const displayResult = currentResult || existingResult || latestFromDB;

  const dateLabel = (() => {
    if (currentResult) return null;
    const src = existingResult || latestFromDB;
    if (!src?.savedAt) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const rec   = new Date(src.savedAt); rec.setHours(0, 0, 0, 0);
    const diff  = Math.round((today - rec) / 86400000);
    if (diff <= 0) return null;
    return `${diff}일 전 기록입니다`;
  })();

 const handleStartCoaching = async (planN) => {
  if (!planN) return;

  // ✅ 먼저 즉시 이동!
  startCoaching(planN);

  // ✅ 활성 플랜 없을 때만 신규 생성 (기존 플랜 진행 중이면 이어서 진행)
  if (!isPlanActive) {
    startPlan(planN).catch(e => console.error('플랜 저장 실패:', e));
  }
};

  return (
    <div>
      {displayResult ? (
        <>
          {dateLabel && (
            <div style={{ marginBottom: '10px', padding: '8px 14px', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '10px', fontSize: '12px', color: 'var(--accent2)', textAlign: 'center', fontWeight: 500 }}>
              📅 {dateLabel}
            </div>
          )}
            <ResultCard
              result={displayResult}
              userName={userName}
              selectedPlan={selectedPlan}
              onSelectPlan={setSelectedPlan}
              onStartCoaching={() => handleStartCoaching(activePlanType || selectedPlan)}
              planSaving={planSaving}
              isPlanActive={isPlanActive}
              activePlanType={activePlanType}
            />
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--bg2)', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '14px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', color: 'var(--accent)', marginBottom: '8px' }}>
            아직 분석 결과가 없어요
          </div>
          <div style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '20px' }}>
            스캔 탭에서 촬영 후<br />AI 분석을 시작해보세요!
          </div>
          <button onClick={onSwitchToScan} className="scan-btn">📷 분석하러 가기</button>
        </div>
      )}
    </div>
  );
}

export default AnalysisResult;
