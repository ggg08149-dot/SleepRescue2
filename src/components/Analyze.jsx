import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { useAnalyze } from '../hooks/useAnalyze';
import AnalysisResult from './AnalysisResult';
import axios from 'axios';

function Analyze({ backHome, updateResult, startCoaching, userName = '사용자', userIdx, existingResult }) {
  const [drinks, setDrinks]               = useState([]);
  const [lifestyleData, setLifestyleData] = useState({
    workout  : '1.5',
    phone    : '6',
    workHours: '9',
    sleepTime: '7.5',
  });
  const [viewTab, setViewTab] = useState(existingResult ? 'result' : 'scan');

  const {
    scanned, scanning, analyzing,
    darkScore, analyzedImg, result,
    doScan, doAnalyze, resetScan,
  } = useAnalyze();

  const webcamRef = useRef(null);
  const displayResult = result || existingResult;

  // ─── 카페인 계산 ──────────────────────────────
  const getTotalCaffeineMg = () => {
    if (drinks.includes('없음')) return 0;
    const caffeineMap = { '아메리카노': 120, '라떼': 80, '에너지음료': 160, '녹차': 30 };
    return drinks.reduce((sum, d) => sum + (caffeineMap[d] || 0), 0);
  };

  // ─── 스텝퍼 조절 ──────────────────────────────
  const handleAdj = (field, delta, min, max) => {
    setLifestyleData(prev => {
      const cur = parseFloat(prev[field]) || 0;
      const next = Math.round((cur + delta) * 10) / 10;
      return { ...prev, [field]: String(Math.max(min, Math.min(max, next))) };
    });
  };

  const handleInput = (field, val, min, max) => {
    const n = parseFloat(val);
    if (!isNaN(n)) {
      setLifestyleData(prev => ({ ...prev, [field]: String(Math.max(min, Math.min(max, n))) }));
    } else {
      setLifestyleData(prev => ({ ...prev, [field]: val }));
    }
  };

  // ─── 분석 핸들러 ──────────────────────────────
  const handleScan = () => doScan(webcamRef);

  const handleAnalyze = () => {
    doAnalyze(lifestyleData, getTotalCaffeineMg, async (res) => {
      updateResult(res);
      setViewTab('result');
      try {
        const token = localStorage.getItem('token');
        const gptRes = await axios.post('http://localhost:7000/api/coaching/analyze',
          { user_idx: userIdx },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        const { is_critical, delta_score, solutions, comparison_analysis } = gptRes.data;
        // 분석 완료 시 항상 오늘 일차 미션 DB 저장
        await axios.post('http://localhost:7000/api/coaching/apply-optimization',
          { user_idx: userIdx, solutions, analysis: comparison_analysis || "" },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        localStorage.removeItem(`last_gpt_coaching_${userIdx}`);
        // 상태 변화가 클 때만 추가 알림
        if (is_critical) {
          alert(`⚠️ 상태 변화 감지 (차이: ${delta_score}점)\n오늘의 미션이 현재 상태에 맞춰 재설정되었습니다.`);
        }
      } catch (err) {
        console.error("GPT 코칭 분석/최적화 실패:", err);
      }
    });
  };

  // ─── 카페인 토글 ──────────────────────────────
  const toggleDrink = (name) => {
    if (name === '없음') {
      setDrinks(prev => prev.includes('없음') ? [] : ['없음']);
      return;
    }
    setDrinks(prev => {
      const without = prev.filter(d => d !== '없음');
      return without.includes(name) ? without.filter(d => d !== name) : [...without, name];
    });
  };

  const drinkList = [
    { name: '아메리카노', icon: '☕' },
    { name: '라떼',       icon: '🧋' },
    { name: '에너지음료', icon: '⚡' },
    { name: '녹차',       icon: '🍵' },
    { name: '없음',       icon: '🚫' },
  ];

  const fields = [
    { key: 'workout',   label: '운동시간',    icon: '🏃', min: 0, max: 12, step: 0.5 },
    { key: 'workHours', label: '근무시간',    icon: '💼', min: 0, max: 16, step: 0.5 },
    { key: 'phone',     label: '휴대폰 사용', icon: '📱', min: 0, max: 16, step: 0.5 },
    { key: 'sleepTime', label: '수면시간',    icon: '😴', min: 0, max: 12, step: 0.5 },
  ];

  return (
    <div className="analyze-screen">

      {/* 상단 탭 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button onClick={() => setViewTab('scan')} style={{
          flex: 1, padding: '10px', borderRadius: '12px',
          fontFamily: "'Noto Sans KR', sans-serif", fontSize: '13px', cursor: 'pointer',
          border: `1px solid ${viewTab === 'scan' ? 'rgba(110,231,247,0.5)' : 'var(--border)'}`,
          background: viewTab === 'scan' ? 'rgba(110,231,247,0.12)' : 'var(--bg2)',
          color: viewTab === 'scan' ? 'var(--accent)' : 'var(--muted)',
        }}>📷 다크서클 스캔</button>
        <button onClick={() => setViewTab('result')} style={{
          flex: 1, padding: '10px', borderRadius: '12px',
          fontFamily: "'Noto Sans KR', sans-serif", fontSize: '13px', cursor: 'pointer',
          border: `1px solid ${viewTab === 'result' ? 'rgba(167,139,250,0.5)' : 'var(--border)'}`,
          background: viewTab === 'result' ? 'rgba(167,139,250,0.12)' : 'var(--bg2)',
          color: viewTab === 'result' ? 'var(--accent2)' : 'var(--muted)',
        }}>
          📊 분석 결과
          {displayResult && (
            <span style={{ marginLeft: '6px', background: 'rgba(167,139,250,0.3)', border: '1px solid rgba(167,139,250,0.5)', borderRadius: '20px', padding: '1px 8px', fontSize: '10px', color: 'var(--accent2)' }}>NEW</span>
          )}
        </button>
      </div>

      {/* ─── 스캔 탭 ─── */}
      {viewTab === 'scan' && (
        <>
          <div className="cam-box-big">
            {!scanned && !scanning && (
              <div style={{ textAlign: 'center', marginBottom: '15px', padding: '10px', background: 'rgba(110,231,247,0.1)', borderRadius: '8px', border: '1px solid rgba(110,231,247,0.3)' }}>
                <h3 style={{ color: '#6ee7f7', margin: '0 0 5px 0', fontSize: '18px' }}>💡 오늘의 피로도 측정을 시작합니다</h3>
                <p style={{ color: '#eee', fontSize: '14px', margin: 0, lineHeight: '1.4' }}>
                  정확한 분석을 위해 <strong>얼굴을 가이드라인</strong>에 맞춰주세요!
                </p>
              </div>
            )}
            <div className="cam-preview" style={{ position: 'relative', overflow: 'hidden', background: '#000', borderRadius: '12px' }}>
              {!scanned && !scanning && (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <Webcam audio={false} ref={webcamRef} screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: 'user' }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                    <svg width="100%" height="100%" viewBox="0 0 400 300" style={{ fill: 'rgba(0,0,0,0.5)' }}>
                      <defs>
                        <mask id="hole-mask">
                          <rect width="400" height="300" fill="white" />
                          <ellipse cx="200" cy="150" rx="100" ry="130" fill="black" />
                        </mask>
                      </defs>
                      <rect width="400" height="300" mask="url(#hole-mask)" />
                      <ellipse cx="160" cy="150" rx="20" ry="6" fill="none" stroke="#6ee7f7" strokeWidth="1" strokeDasharray="3,3" />
                      <ellipse cx="240" cy="150" rx="20" ry="6" fill="none" stroke="#6ee7f7" strokeWidth="1" strokeDasharray="3,3" />
                    </svg>
                  </div>
                  <div style={{ position: 'absolute', bottom: '15px', width: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: '11px', textShadow: '0 1px 4px #000' }}>
                    ⚠️ 밝은 장소에서 촬영해주세요.
                  </div>
                </div>
              )}
              {scanning && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', zIndex: 10 }}>
                  <div style={{ fontSize: '40px' }}>👁</div>
                  <div style={{ fontSize: '14px', color: '#6ee7f7', marginTop: '10px' }}>AI가 다크서클을 분석하고 있습니다...</div>
                </div>
              )}
              {scanned && analyzedImg && (
                <img src={analyzedImg} alt="분석 결과" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              {!scanned ? (
                <button className="scan-btn" onClick={handleScan} disabled={scanning}>
                  {scanning ? '분석 중...' : '📷 촬영 및 분석'}
                </button>
              ) : (
                <button onClick={() => resetScan()} className="retry-btn">↺ 다시 촬영하기</button>
              )}
            </div>
            {scanned && (
              <div style={{ color: 'var(--accent)', fontWeight: 'bold', marginTop: '10px' }}>
                눈가 컨디션: {darkScore}점
              </div>
            )}
          </div>

          {/* ✅ 생활 패턴 입력 */}
          <div className="section-title">생활 패턴 입력</div>
          <div className="input-card">

            {/* ✅ 스텝퍼 그리드 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              {fields.map(({ key, label, icon, min, max, step }) => (
                <div key={key} style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px', padding: '14px 12px',
                  display: 'flex', flexDirection: 'column', gap: '10px',
                }}>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>{icon}</span>{label}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                    <div
                      onClick={() => handleAdj(key, -step, min, max)}
                      style={{ width: '28px', height: '28px', flexShrink: 0, borderRadius: '50%', border: '1px solid rgba(110,231,247,0.25)', background: 'rgba(110,231,247,0.06)', color: '#6ee7f7', fontSize: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', userSelect: 'none' }}
                    >−</div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                      <input
                        type="number"
                        min={min} max={max} step={step}
                        value={lifestyleData[key]}
                        onChange={e => handleInput(key, e.target.value, min, max)}
                        onFocus={e => e.target.style.borderBottomColor = '#6ee7f7'}
                        onBlur={e => e.target.style.borderBottomColor = 'rgba(110,231,247,0.2)'}
                        style={{
                          width: '100%', background: 'transparent', border: 'none',
                          borderBottom: '1px solid rgba(110,231,247,0.2)',
                          color: '#fff', fontSize: '20px', fontWeight: 600,
                          textAlign: 'center', outline: 'none', padding: '2px 0 4px',
                          fontFamily: "'Noto Sans KR', sans-serif",
                          MozAppearance: 'textfield',
                        }}
                      />
                      <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>시간</span>
                    </div>
                    <div
                      onClick={() => handleAdj(key, step, min, max)}
                      style={{ width: '28px', height: '28px', flexShrink: 0, borderRadius: '50%', border: '1px solid rgba(110,231,247,0.25)', background: 'rgba(110,231,247,0.06)', color: '#6ee7f7', fontSize: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', userSelect: 'none' }}
                    >+</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ✅ 카페인 섭취량 */}
            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 0 14px' }} />
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              ☕ 카페인 섭취량
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
              {drinkList.map(({ name, icon }) => {
                const isOn = drinks.includes(name);
                return (
                  <button
                    key={name}
                    onClick={() => toggleDrink(name)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '8px 14px', borderRadius: '10px',
                      border: isOn ? '1px solid rgba(110,231,247,0.45)' : '1px solid rgba(255,255,255,0.08)',
                      background: isOn ? 'rgba(110,231,247,0.1)' : 'rgba(255,255,255,0.03)',
                      color: isOn ? '#6ee7f7' : 'rgba(255,255,255,0.45)',
                      fontSize: '12px', cursor: 'pointer',
                      fontFamily: "'Noto Sans KR', sans-serif",
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: '15px' }}>{icon}</span>{name}
                  </button>
                );
              })}
            </div>

            {/* 카페인 합계 */}
            {drinks.length > 0 && (
              <div style={{ marginTop: '10px', padding: '8px 12px', background: 'rgba(110,231,247,0.08)', borderRadius: '8px', fontSize: '12px', color: '#6ee7f7', border: '1px solid rgba(110,231,247,0.15)' }}>
                {drinks.includes('없음') ? '✅ 카페인 없음 (0mg)' : `📊 총 카페인: ${getTotalCaffeineMg()}mg`}
              </div>
            )}

            {/* ✅ AI 분석 버튼 */}
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              style={{
                width: '100%', marginTop: '16px', padding: '14px',
                borderRadius: '12px', border: '2px solid #6ee7f7',
                background: analyzing ? 'rgba(110,231,247,0.04)' : 'rgba(110,231,247,0.25)',
                color: '#6ee7f7', fontSize: '14px', fontWeight: 700,
                cursor: analyzing ? 'not-allowed' : 'pointer',
                fontFamily: "'Noto Sans KR', sans-serif", letterSpacing: '0.03em',
                opacity: analyzing ? 0.5 : 1, transition: 'background 0.2s, box-shadow 0.2s',
                boxShadow: analyzing ? 'none' : '0 0 16px rgba(110,231,247,0.3), inset 0 0 20px rgba(110,231,247,0.1)',
              }}
              onMouseEnter={e => { if (!analyzing) { e.currentTarget.style.background = 'rgba(110,231,247,0.38)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(110,231,247,0.5), inset 0 0 28px rgba(110,231,247,0.2)'; }}}
              onMouseLeave={e => { if (!analyzing) { e.currentTarget.style.background = 'rgba(110,231,247,0.25)'; e.currentTarget.style.boxShadow = '0 0 16px rgba(110,231,247,0.3), inset 0 0 20px rgba(110,231,247,0.1)'; }}}
            >
              {analyzing ? '⏳ 분석 중...' : '🔍 AI 분석 시작하기'}
            </button>
          </div>
        </>
      )}

      {/* ─── 결과 탭 ─── */}
      {viewTab === 'result' && (
        <AnalysisResult
          currentResult={displayResult}
          existingResult={existingResult}
          userName={userName}
          startCoaching={startCoaching}
          onSwitchToScan={() => setViewTab('scan')}
        />
      )}
    </div>
  );
}

export default Analyze;
