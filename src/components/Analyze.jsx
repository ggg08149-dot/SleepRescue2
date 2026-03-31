import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { useAnalyze } from '../hooks/useAnalyze';
import AnalysisResult from './AnalysisResult';
import axios from 'axios';

function Analyze({ backHome, updateResult, startCoaching, userName = '사용자', userIdx, existingResult }) {
  const [drinks, setDrinks]               = useState([]);
  const [lifestyleData, setLifestyleData] = useState({
    workout  : '',
    phone    : '',
    workHours: '',
    sleepTime: '',
  });
  const [viewTab, setViewTab] = useState('scan'); // 'scan' | 'result'

  const {
    scanned, scanning, analyzing,
    darkScore, analyzedImg, result,
    doScan, doAnalyze, resetScan,
  } = useAnalyze();

  const webcamRef = useRef(null);

  const displayResult = result || existingResult;

  // ─── 카페인 계산 ──────────────────────────────
  const getTotalCaffeineMg = () => {
    if (drinks.includes('🚫 없음')) return 0;
    const caffeineMap = { '☕ 아메리카노': 120, '🧋 라떼': 80, '⚡ 에너지음료': 160, '🍵 녹차': 30 };
    let total = 0;
    drinks.forEach(drink => {
      const match = drink.match(/([☕🧋⚡🍵].*?)\s*(\d+)잔/);
      if (match) total += (caffeineMap[match[1]] || 0) * parseInt(match[2]);
    });
    return total;
  };

  // ─── 핸들러 ───────────────────────────────────
  const handleScan = () => doScan(webcamRef);

  const handleAnalyze = () => {
    // 1. doAnalyze 실행 (콜백 함수 앞에 async를 붙여야 await 사용 가능!)
    doAnalyze(lifestyleData, getTotalCaffeineMg, async (res) => {
      updateResult(res);
      setViewTab('result'); // 분석 완료 시 결과 탭으로 자동 전환

      // 🚀 [추가] 분석 결과가 나오자마자 노드 서버의 GPT 코칭 호출!
      try {
        console.log("GPT 코칭을 요청합니다...");
        const gptRes = await axios.post('http://localhost:7000/api/coaching/analyze', {
          user_idx: userIdx, 
        });
        console.log("GPT 답변 수신 성공:", gptRes.data.solutions);
        // 여기서 setGptSolutions(gptRes.data.solutions) 같은 걸로 저장하면 베스트!
      } catch (err) {
        console.error("GPT 코칭 호출 실패:", err);
      }
    }); // <--- doAnalyze를 닫는 괄호
  }; // <--- handleAnalyze 전체를 닫는 괄호

  // ─── 음료 관련 ────────────────────────────────
  const addDrink = (drinkName) => {
    if (drinkName === '🚫 없음') { setDrinks(['🚫 없음']); return; }
    setDrinks(prev => {
      let nd = prev.filter(d => d !== '🚫 없음');
      const idx = nd.findIndex(d => d.includes(drinkName));
      if (idx !== -1) {
        const cnt = (nd[idx].match(/(\d+)잔/)?.[1] ? parseInt(nd[idx].match(/(\d+)잔/)[1]) : 1) + 1;
        nd[idx] = `${drinkName} ${cnt}잔`;
      } else {
        nd.push(`${drinkName} 1잔`);
      }
      return nd;
    });
  };

  const removeDrink = (drinkName) => {
    setDrinks(prev => {
      if (prev.includes('🚫 없음')) return prev;
      const idx = prev.findIndex(d => d.includes(drinkName));
      if (idx !== -1) {
        const cnt = prev[idx].match(/(\d+)잔/)?.[1] ? parseInt(prev[idx].match(/(\d+)잔/)[1]) : 1;
        if (cnt > 1) { const nd = [...prev]; nd[idx] = `${drinkName} ${cnt - 1}잔`; return nd; }
        return prev.filter((_, i) => i !== idx);
      }
      return prev;
    });
  };

  const getDrinkCount  = (d) => { if (drinks.includes('🚫 없음')) return 0; const f = drinks.find(x => x.includes(d)); if (!f) return 0; return parseInt(f.match(/(\d+)잔/)?.[1] || '1'); };
  const isNoneSelected = () => drinks.includes('🚫 없음');
  const drinkList = ['☕ 아메리카노', '🧋 라떼', '⚡ 에너지음료', '🍵 녹차', '🚫 없음'];

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
        }}>
          📷 다크서클 스캔
        </button>
        <button onClick={() => setViewTab('result')} style={{
          flex: 1, padding: '10px', borderRadius: '12px',
          fontFamily: "'Noto Sans KR', sans-serif", fontSize: '13px', cursor: 'pointer',
          border: `1px solid ${viewTab === 'result' ? 'rgba(167,139,250,0.5)' : 'var(--border)'}`,
          background: viewTab === 'result' ? 'rgba(167,139,250,0.12)' : 'var(--bg2)',
          color: viewTab === 'result' ? 'var(--accent2)' : 'var(--muted)',
        }}>
          📊 분석 결과
          {displayResult && (
            <span style={{ marginLeft: '6px', background: 'rgba(167,139,250,0.3)', border: '1px solid rgba(167,139,250,0.5)', borderRadius: '20px', padding: '1px 8px', fontSize: '10px', color: 'var(--accent2)' }}>
              NEW
            </span>
          )}
        </button>
      </div>

      {/* ─── 스캔 탭 ─── */}
      {viewTab === 'scan' && (
        <>
          {/* 웹캠 영역 */}
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

          {/* 생활 패턴 입력 */}
          <div className="section-title">생활 패턴 입력</div>
          <div className="input-card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="input-row" style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <div className="input-group">
                  <div className="input-label">운동시간 (h)</div>
                  <input className="input-field" type="number" step="0.5" placeholder="1.5"
                    value={lifestyleData.workout} onChange={e => setLifestyleData({...lifestyleData, workout: e.target.value})} />
                </div>
                <div className="input-group">
                  <div className="input-label">근무시간 (h)</div>
                  <input className="input-field" type="number" placeholder="9"
                    value={lifestyleData.workHours} onChange={e => setLifestyleData({...lifestyleData, workHours: e.target.value})} />
                </div>
              </div>
              <div className="input-row" style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <div className="input-group">
                  <div className="input-label">휴대폰 사용시간 (h)</div>
                  <input className="input-field" type="number" placeholder="6"
                    value={lifestyleData.phone} onChange={e => setLifestyleData({...lifestyleData, phone: e.target.value})} />
                </div>
                <div className="input-group">
                  <div className="input-label">수면시간 (h)</div>
                  <input className="input-field" type="number" step="0.5" placeholder="7.5"
                    value={lifestyleData.sleepTime} onChange={e => setLifestyleData({...lifestyleData, sleepTime: e.target.value})} />
                </div>
              </div>

              <div className="input-group">
                <div className="input-label">카페인 섭취량</div>
                <div className="drink-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '8px', marginBottom: '12px' }}>
                  {drinkList.map(drink => {
                    const count = getDrinkCount(drink);
                    const isNone = drink === '🚫 없음';
                    const isSelected = isNone ? isNoneSelected() : count > 0;
                    if (isNone) {
                      return (
                        <div key={drink} style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'center' }}>
                          <button onClick={() => isNoneSelected() ? setDrinks([]) : setDrinks(['🚫 없음'])}
                            style={{ padding: '10px 16px', borderRadius: '24px', background: isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.08)', color: isSelected ? '#000' : 'rgba(255,255,255,0.7)', border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: '13px', fontWeight: 500, minWidth: '120px' }}>
                            {drink}
                          </button>
                        </div>
                      );
                    }
                    return (
                      <div key={drink} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button onClick={() => addDrink(drink)} disabled={isNoneSelected()}
                          style={{ padding: '10px 16px', borderRadius: '24px', background: isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.08)', color: isSelected ? '#000' : 'rgba(255,255,255,0.7)', border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.2)', cursor: isNoneSelected() ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 500, minWidth: '100px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', opacity: isNoneSelected() ? 0.5 : 1 }}>
                          <span>{drink}</span>
                          {count > 0 && <span style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '20px', fontSize: '12px' }}>{count}잔</span>}
                        </button>
                        {count > 0 && !isNoneSelected() && (
                          <button onClick={() => removeDrink(drink)}
                            style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', cursor: 'pointer', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            -
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                {!isNoneSelected() && drinks.length > 0 && (
                  <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(110,231,247,0.1)', borderRadius: '8px', fontSize: '12px', color: '#6ee7f7' }}>
                    📊 총 카페인: {getTotalCaffeineMg()}mg
                  </div>
                )}
                {isNoneSelected() && (
                  <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(110,231,247,0.1)', borderRadius: '8px', fontSize: '12px', color: '#6ee7f7' }}>
                    ✅ 카페인 없음 (0mg)
                  </div>
                )}
              </div>

              <button className="analyze-btn" onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? '⏳ 분석 중...' : '🔍 AI 분석 시작하기'}
              </button>
            </div>
          </div>

        </>
      )}

      {/* ─── 결과 탭 ─── */}
      {viewTab === 'result' && (
        <AnalysisResult
          currentResult={displayResult}
          existingResult={existingResult}
          userName={userName}
          userIdx={userIdx}
          startCoaching={startCoaching}
          onSwitchToScan={() => setViewTab('scan')}
        />
      )}
    </div>
  );
}

export default Analyze;
