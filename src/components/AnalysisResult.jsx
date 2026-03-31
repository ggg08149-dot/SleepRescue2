import React, { useState, useEffect } from 'react';
import { getFatigueHistory, deleteFatigueRecord } from '../api/fatigueApi';

const getFatigueMessage = (fatigue, userName, causeName) => {
  if (fatigue === 'high') return `분석 결과, ${userName}님의 오늘의 피로도가 '높음' 상태예요. ${causeName}의 영향으로 다크서클이 평소보다 훨씬 짙게 측정되었으니, 오늘만큼은 수면 구조대의 특급 처방전에 몸을 맡겨보세요!`;
  if (fatigue === 'mid') return `수면 구조대가 분석해보니, 오늘 ${userName}님의 피로도가 '주의' 단계에 들어섰어요. 특히 ${causeName}의 영향으로 눈가가 평소보다 어두워진 상태예요.`;
  return `수면 구조대가 분석해보니, 오늘 ${userName}님의 피로는 안정적인 '낮음' 단계예요. ${causeName} 수치가 잘 관리되고 있어 눈가도 평소보다 훨씬 맑고 생기 있어 보이는 상태예요.`;
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

// DB 레코드 → ResultCard props 변환
const toResultProps = (row) => ({
  fatigue      : row.fatigue_level,
  fatigueCause : row.fatigue_reason,
  fatigueDetails: (() => { try { return JSON.parse(row.analysis_result || '[]'); } catch { return []; } })(),
  score        : row.fatigue_score,
  savedAt      : row.created_at,
  fatigue_idx  : row.fatigue_idx,
});

// ─── 결과 카드 (단일) ────────────────────────────
export function ResultCard({ result, userName, selectedPlan, onSelectPlan, onStartCoaching }) {
  if (!result) return null;
  const lv = FATIGUE_LEVELS.find(l => l.key === result.fatigue) || FATIGUE_LEVELS[0];
  const causeName = result.fatigueCause === '모든 항목이 양호한 상태입니다.'
    ? '누적된 피로'
    : result.fatigueCause || '복합적 요인';
  const msg = getFatigueMessage(result.fatigue, userName, causeName);

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
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '18px' }}>
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
      <div className="section-title">추천 수면 코칭 플랜</div>
      <div className="plan-grid">
        {PLAN_DATA.map(p => (
          <div key={p.n} className="plan-btn"
            onClick={() => onSelectPlan(p.n)}
            style={selectedPlan === p.n ? { borderColor: 'var(--accent)', background: 'rgba(110,231,247,0.1)' } : {}}
          >
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', color: 'var(--accent)', lineHeight: 1, marginBottom: '2px' }}>{p.days}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>{p.label}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{p.desc}</div>
          </div>
        ))}
      </div>
      {selectedPlan && (
        <button className="analyze-btn" onClick={onStartCoaching}
          style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', marginTop: '8px' }}>
          🚀 {selectedPlan}일 플랜 진행하기
        </button>
      )}
    </div>
  );
}

const fatigueColor = (f) => f === 'high' ? '#ef4444' : f === 'mid' ? '#f59e0b' : '#22c55e';
const fatigueLabel = (f) => f === 'high' ? '높음' : f === 'mid' ? '주의' : '낮음';
const fatigueIcon  = (f) => f === 'high' ? '🔥' : f === 'mid' ? '⚠️' : '✅';

// ─── 분석 결과 탭 (DB 히스토리 포함) ──────────────
function AnalysisResult({ currentResult, existingResult, userName, userIdx, startCoaching, onSwitchToScan }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [history, setHistory]           = useState([]);
  const [expanded, setExpanded]         = useState(false);  // 펼쳐보기 상태
  const [viewItem, setViewItem]         = useState(null);   // 상세보기 중인 DB 레코드

  const displayResult = currentResult || existingResult;

  // DB에서 히스토리 불러오기
  const fetchHistory = async () => {
    if (!userIdx) return;
    try {
      const res = await getFatigueHistory(userIdx);
      if (res.success) setHistory(res.data || []);
    } catch (e) {
      console.error('히스토리 조회 실패:', e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [currentResult, userIdx]);

  // DB 삭제
  const handleDelete = async (e, fatigue_idx) => {
    e.stopPropagation();
    if (!window.confirm('이 분석 결과를 삭제할까요?')) return;
    try {
      const res = await deleteFatigueRecord(fatigue_idx, userIdx);
      if (res.success) {
        setHistory(prev => prev.filter(h => h.fatigue_idx !== fatigue_idx));
        if (viewItem?.fatigue_idx === fatigue_idx) setViewItem(null);
      } else {
        alert('삭제 실패: ' + (res.message || '오류'));
      }
    } catch (e) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // 표시할 히스토리 목록 (최신 결과와 중복 제거: 현재 결과가 있으면 첫 번째 건너뜀)
  const historyList = history;
  const visibleCount = expanded ? historyList.length : 2;
  const visibleHistory = historyList.slice(0, visibleCount);

  return (
    <div>
      {/* 이전 결과 상세 보기 모드 */}
      {viewItem ? (
        <>
          <button onClick={() => setViewItem(null)} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted)',
            padding: '6px 14px', borderRadius: '8px', cursor: 'pointer',
            fontFamily: "'Noto Sans KR', sans-serif", fontSize: '12px', marginBottom: '14px',
          }}>
            ← 목록으로
          </button>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginBottom: '10px' }}>
            📅 {viewItem.savedAt} 분석 결과
          </div>
          <ResultCard
            result={viewItem}
            userName={userName}
            selectedPlan={selectedPlan}
            onSelectPlan={setSelectedPlan}
            onStartCoaching={() => { if (selectedPlan) startCoaching(selectedPlan); }}
          />
        </>
      ) : (
        <>
          {/* 현재 분석 결과 */}
          {displayResult ? (
            <ResultCard
              result={displayResult}
              userName={userName}
              selectedPlan={selectedPlan}
              onSelectPlan={setSelectedPlan}
              onStartCoaching={() => { if (selectedPlan) startCoaching(selectedPlan); }}
            />
          ) : (
            <div style={{
              textAlign: 'center', padding: '50px 20px',
              background: 'var(--bg2)', borderRadius: '16px',
              border: '1px solid var(--border)', marginBottom: '14px',
            }}>
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

          {/* 이전 분석 결과 목록 */}
          {historyList.length > 0 && (
            <>
              <div className="section-title" style={{ marginTop: '8px' }}>이전 분석 결과</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {visibleHistory.map((item) => {
                  const props = toResultProps(item);
                  return (
                    <div key={item.fatigue_idx}
                      style={{
                        background: 'var(--bg2)', border: '1px solid var(--border)',
                        borderRadius: '12px', padding: '14px 16px',
                        display: 'flex', alignItems: 'center', gap: '12px',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                      onClick={() => setViewItem(props)}
                    >
                      <div style={{ fontSize: '22px' }}>{fatigueIcon(item.fatigue_level)}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                            피로도
                          </span>
                          <span style={{
                            fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 700,
                            color: fatigueColor(item.fatigue_level),
                            background: `${fatigueColor(item.fatigue_level)}22`,
                            border: `1px solid ${fatigueColor(item.fatigue_level)}66`,
                          }}>
                            {fatigueLabel(item.fatigue_level)}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                          📅 {item.created_at}
                          {item.fatigue_reason && ` · ${item.fatigue_reason.slice(0, 15)}...`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>상세보기 ▶</span>
                        <button
                          onClick={(e) => handleDelete(e, item.fatigue_idx)}
                          style={{
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                            color: '#f87171', borderRadius: '8px', padding: '4px 8px',
                            cursor: 'pointer', fontSize: '11px', fontFamily: "'Noto Sans KR', sans-serif",
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 펼쳐보기 / 접기 버튼 */}
              {historyList.length > 2 && (
                <button
                  onClick={() => setExpanded(prev => !prev)}
                  style={{
                    width: '100%', marginTop: '8px', padding: '10px',
                    background: 'var(--bg2)', border: '1px solid var(--border)',
                    borderRadius: '10px', color: 'var(--muted)',
                    fontFamily: "'Noto Sans KR', sans-serif", fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {expanded
                    ? `▲ 접기`
                    : `▼ 펼쳐보기 (${historyList.length - 2}건 더보기)`}
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default AnalysisResult;
