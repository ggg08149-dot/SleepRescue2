import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import axios from 'axios';

const getFatigueMessage = (fatigue, userName, causeName) => {
  if (fatigue === 'high') return `분석 결과, ${userName}님의 오늘의 피로도가 '높음' 상태예요. ${causeName}의 영향으로 다크서클이 평소보다 훨씬 짙게 측정되었으니, 오늘만큼은 수면 구조대의 특급 처방전에 몸을 맡겨보세요!`;
  if (fatigue === 'mid') return `수면 구조대가 분석해보니, 오늘 ${userName}님의 피로도가 '주의' 단계에 들어섰어요. 특히 ${causeName}의 영향으로 눈가가 평소보다 어두워진 상태예요.`;
  return `수면 구조대가 분석해보니, 오늘 ${userName}님의 피로는 안정적인 '낮음' 단계예요. ${causeName} 수치가 잘 관리되고 있어 눈가도 평소보다 훨씬 맑고 생기 있어 보이는 상태예요. 지금의 컨디션을 내일도 유지할 수 있도록 가벼운 수면 처방을 확인해 보세요.`;
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

function Analyze({ backHome, updateResult, startCoaching, userName = '사용자' }) {
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [drinks, setDrinks] = useState([]);
  const [result, setResult] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // 분석결과를 화면에 보여주기 위한 상태들
  const [darkScore, setDarkScore] = useState(0); 
  const [statusMsg, setStatusMsg] = useState("준비 완료");
  const [analyzedImg, setAnalyzedImg] = useState(null); // 분석된 이미지(Base64) 저장
  const [capturedBlob, setCapturedBlob] = useState(null); // 파일 저장용 Blob
  // -------------------------------------------------
  const [lifestyleData, setLifestyleData] = useState({
    workout: '',      // 운동시간 (h)
    phone: '',        // 폰 사용 시간 (h)
    workHours: '',    // 근무시간 (h)
    sleepTime: ''     // 수면시간 (h)
    });
  // ---------------------------------------------------
  const resultRef = useRef(null);
  const webcamRef = useRef(null); // 웹캠 참조를 위한 ref

  //----------------------- [카페인 mg 계산 함수]------------------------------------------------------------
  const getTotalCaffeineMg = () => {
    if (drinks.includes('🚫 없음')) return 0;
    
    const caffeineMap = {
      '☕ 아메리카노': 120,
      '🧋 라떼': 80,
      '⚡ 에너지음료': 160,
      '🍵 녹차': 30
    };
    
    let total = 0;
    drinks.forEach(drink => {
      const match = drink.match(/([☕🧋⚡🍵].*?)\s*(\d+)잔/);
      if (match) {
        const drinkName = match[1];
        const count = parseInt(match[2]);
        total += (caffeineMap[drinkName] || 0) * count;
      }
    });
    
    return total;
  };

  // 버튼 클릭 시 잔 수 증가
  const addDrink = (drinkName) => {
    if (drinkName === '🚫 없음') {
      setDrinks(['🚫 없음']);
      return;
    }
    
    setDrinks(prev => {
      let newDrinks = prev.filter(d => d !== '🚫 없음');
      const existingIndex = newDrinks.findIndex(d => d.includes(drinkName));
      
      if (existingIndex !== -1) {
        const existing = newDrinks[existingIndex];
        const match = existing.match(/(\d+)잔/);
        const currentCount = match ? parseInt(match[1]) : 1;
        const newCount = currentCount + 1;
        newDrinks[existingIndex] = `${drinkName} ${newCount}잔`;
      } else {
        newDrinks.push(`${drinkName} 1잔`);
      }
      
      return newDrinks;
    });
  };

  // 특정 음료 제거 (잔 수 감소)
  const removeDrink = (drinkName) => {
    setDrinks(prev => {
      if (prev.includes('🚫 없음')) return prev;
      
      const existingIndex = prev.findIndex(d => d.includes(drinkName));
      
      if (existingIndex !== -1) {
        const existing = prev[existingIndex];
        const match = existing.match(/(\d+)잔/);
        const currentCount = match ? parseInt(match[1]) : 1;
        
        if (currentCount > 1) {
          const newCount = currentCount - 1;
          const newDrinks = [...prev];
          newDrinks[existingIndex] = `${drinkName} ${newCount}잔`;
          return newDrinks;
        } else {
          return prev.filter((_, idx) => idx !== existingIndex);
        }
      }
      
      return prev;
    });
  };

  // 특정 음료의 현재 잔 수 가져오기
  const getDrinkCount = (drinkName) => {
    if (drinks.includes('🚫 없음')) return 0;
    const drink = drinks.find(d => d.includes(drinkName));
    if (!drink) return 0;
    const match = drink.match(/(\d+)잔/);
    return match ? parseInt(match[1]) : 1;
  };

  // '없음'이 선택되었는지 확인
  const isNoneSelected = () => {
    return drinks.includes('🚫 없음');
  };

// ----------------------[YOLO 분석 함수]----------------------------------------------------------------------
  const doScan = async () => {
    if (scanning) return;

    setScanning(true);
    setStatusMsg("분석 중..."); // 상태 업데이트

    try {
          if (!webcamRef.current) throw new Error("카메라를 찾을 수 없습니다.");

          // 1. 웹캠에서 사진 캡처
          const imageSrc = webcamRef.current.getScreenshot(); 
          if (!imageSrc) throw new Error("캡처에 실패했습니다.");

          // 2. 서버 전송을 위해 Blob으로 변환
          const imageRes = await fetch(imageSrc);
          const imageBlob = await imageRes.blob();
          setCapturedBlob(imageBlob); // doAnalyze()에서 파일 크기 사용
          const formData = new FormData();
          formData.append('file', imageBlob, 'capture.jpg'); 

          // 3. FastAPI 서버로 전송 (YOLO 분석)
          const response = await axios.post('http://127.0.0.1:8000/predict/yolo', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
        if (response.data.status === "success") {
          // ✅ 선언한 상태 변수 이름에 맞춰서 저장
          setDarkScore(response.data.dark_circle_score);
          setAnalyzedImg(response.data.result_image); // "data:image/jpeg;base64,..." 형태
          setScanned(true);
          setStatusMsg("분석 완료");
          console.log("분석 성공:", response.data.dark_circle_score);
        } else {
          alert("다크서클 검출에 실패했습니다. 조명을 밝게 하고 다시 시도해주세요.");
        }

        } catch (error) {
          console.error("분석 실패:", error);
          setScanning(false);
          alert("서버 연결에 실패했습니다. FastAPI 서버(8000포트)가 실행 중인지 확인해주세요!");
        } finally {
          setScanning(false); // 성공하든 실패하든 로딩 해제
        }
      };


// --------------------[피로지수, 피로도 계산]----------------------------------------------------------------
  const doAnalyze = async () => {
    // 입력값 검증
    if (!lifestyleData.workout || !lifestyleData.phone ||
        !lifestyleData.workHours || !lifestyleData.sleepTime) {
      alert('운동시간, 폰 사용시간, 근무시간, 수면시간을 모두 입력해주세요!');
      return;
    }
    if (!scanned) {
      alert('먼저 웹캠 촬영 및 분석을 진행해주세요!');
      return;
    }

    const user_idx = sessionStorage.getItem('user_idx');
    if (!user_idx) {
      alert('로그인이 필요합니다.');
      return;
    }

    const workoutHours = parseFloat(lifestyleData.workout);
    const sleepHours   = parseFloat(lifestyleData.sleepTime);
    const caffeineMg   = getTotalCaffeineMg();
    const BASE = 'http://localhost:7000';

    try {
      // ── STEP 1: 생활패턴 저장 ────────────────────
      const lifelogRes  = await fetch(`${BASE}/api/lifelog/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_idx,
          exec_hours:  workoutHours,
          phone_hours: parseFloat(lifestyleData.phone),
          work_hours:  parseFloat(lifestyleData.workHours),
          caffeine:    caffeineMg,
          sleep_hours: sleepHours
        })
      });
      const lifelogData = await lifelogRes.json();
      if (!lifelogData.success) {
        alert(`생활패턴 저장 실패: ${lifelogData.message}`);
        return;
      }
      const lifelog_idx = lifelogData.lifelog_idx;

      // ── STEP 2: 파일 메타데이터 저장 ─────────────
      const fileName   = `capture_${Date.now()}.jpg`;
      const fileSize   = capturedBlob ? capturedBlob.size : 0;
      const fileRes    = await fetch(`${BASE}/api/file/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_idx,
          file_name: fileName,
          file_size: fileSize,
          file_ext:  'jpg'
        })
      });
      const fileData = await fileRes.json();
      if (!fileData.success) {
        alert(`파일 저장 실패: ${fileData.message}`);
        return;
      }
      const file_idx = fileData.file_idx;

      // ── STEP 3: 다크서클 점수 저장 ───────────────
      const dcRes  = await fetch(`${BASE}/api/darkcircle/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_idx, user_idx, dc_score: darkScore })
      });
      const dcData = await dcRes.json();
      if (!dcData.success) {
        alert(`다크서클 저장 실패: ${dcData.message}`);
        return;
      }

      // ── STEP 4: ML 실행 + 피로도 저장 ────────────
      const fatigueRes  = await fetch(`${BASE}/api/fatigue/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_idx,
          lifelog_idx,
          workout:   workoutHours,
          phone:     parseFloat(lifestyleData.phone),
          workHours: parseFloat(lifestyleData.workHours),
          caffeine:  caffeineMg,
          sleepTime: sleepHours
        })
      });
<<<<<<< HEAD
      const fatigueData = await fatigueRes.json();
      if (!fatigueData.success) {
        alert(`ML 분석 실패: ${fatigueData.message}`);
        return;
      }

      // ── 결과 화면 처리 ────────────────────────────
      let fatigue = 'low';
      if (fatigueData.sleep_score < 30) fatigue = 'high';
      else if (fatigueData.sleep_score < 70) fatigue = 'mid';

      const res = {
        darkCircle:     darkScore,
        sleepScore:     fatigueData.predicted_hours,
        sleepScorePoint: fatigueData.sleep_score,
        avg3:           70,
        fatigue,
        fatigueCause:   fatigueData.fatigue_cause   || '분석 중 오류가 발생했습니다.',
        fatigueDetails: fatigueData.fatigue_details || []
=======
      
      const data = await response.json();
      
      // 피로도 공식 : 피로지수 = 100 - 0.3*darkScore - 0.7*sleepScore
      // 현재 darkScore와 sleepScore는 값이 클수록 좋은 상태임
      // 피로지수는 낮을수록 좋은상태로 만들고 싶어서 이렇게 정의함
      const currentDarkScore = darkScore;
      const sleepScore = data.sleep_score;
      const fatigueScore = 100 - (currentDarkScore * 0.3) - (sleepScore * 0.7);

      // 피로지수 70이상: 피로도 높음, 30~70점: 주의, 330점 이하: 낮음
      let fatigue = 'low';
      if (fatigueScore >= 70) {
        fatigue = 'high';
      } else if (fatigueScore > 30) {
        fatigue = 'mid';
      } else {
        fatigue = 'low';
      }
      
      const res = {
        darkCircle: currentDarkScore,
        sleepScore: data.predicted_hours,
        sleepScorePoint: data.sleep_score,
        avg3: 70,
        fatigue: fatigue,
        fatigueCause: data.fatigue_cause || '분석 중 오류가 발생했습니다.',  // ← 피로 원인 추가
      fatigueDetails: data.fatigue_details || []  // ← 상세 원인 추가
>>>>>>> de02909 (analyze)
      };

      setResult(res);
      updateResult(res);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (error) {
      console.error('분석 오류:', error);
      alert(`분석 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  const handleSelectPlan = (n) => {
    setSelectedPlan(n);
  };

  const handleStartCoaching = () => {
    if (!selectedPlan) return;
    startCoaching(selectedPlan);
  };


  const drinkList = ['☕ 아메리카노', '🧋 라떼', '⚡ 에너지음료', '🍵 녹차', '🚫 없음'];

  return (
    <div className="analyze-screen">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <button onClick={() => backHome()} style={{
          background: 'var(--bg2)', border: '1px solid var(--border)', color: 'var(--muted)',
          padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
          fontFamily: "'Noto Sans KR', sans-serif", fontSize: '12px'
        }}>← 뒤로</button>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', color: 'var(--accent)', letterSpacing: '1px' }}>
          DARK CIRCLE SCAN
        </div>
      </div>

      {/* 웹캠 영역 */}
      <div className="cam-box-big">
        
        {/* 1. 카메라 상단 메인 안내 문구 (카메라 외부로 이동) */}
        {!scanned && !scanning && (
          <div style={{ 
            textAlign: 'center', 
            marginBottom: '15px', 
            padding: '10px',
            background: 'rgba(110, 231, 247, 0.1)', // 살짝 하늘색 배경
            borderRadius: '8px',
            border: '1px solid rgba(110, 231, 247, 0.3)'
          }}>
            <h3 style={{ color: '#6ee7f7', margin: '0 0 5px 0', fontSize: '18px' }}>
              💡 오늘의 피로도 측정을 시작합니다
            </h3>
            <p style={{ color: '#eee', fontSize: '14px', margin: 0, lineHeight: '1.4' }}>
              정확한 분석을 위해 <strong>얼굴을 가이드라인</strong>에 맞춰주세요!
            </p>
          </div>
        )}

        <div className="cam-preview" style={{ position: 'relative', overflow: 'hidden', background: '#000', borderRadius: '12px' }}>
          
          {/* 상황1. 촬영 전 (실시간 웹캠) */}
          {!scanned && !scanning && (
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={{ facingMode: "user" }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* 가이드라인 SVG (텍스트 제외, 가이드만 유지) */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <svg width="100%" height="100%" viewBox="0 0 400 300" style={{ fill: 'rgba(0,0,0,0.5)' }}>
                  <defs>
                    <mask id="hole-mask">
                      <rect width="400" height="300" fill="white" />
                      <ellipse cx="200" cy="150" rx="100" ry="130" fill="black" />
                    </mask>
                  </defs>
                  <rect width="400" height="300" mask="url(#hole-mask)" />
                  {/* 눈밑 점선 가이드 */}
                  <ellipse cx="160" cy="150" rx="20" ry="6" fill="none" stroke="#6ee7f7" strokeWidth="1" strokeDasharray="3,3" />
                  <ellipse cx="240" cy="150" rx="20" ry="6" fill="none" stroke="#6ee7f7" strokeWidth="1" strokeDasharray="3,3" />
                </svg>
              </div>

              {/* 조명 주의사항은 카메라 하단 내부에 작게 유지 (선택사항) */}
              <div style={{
                position: 'absolute', bottom: '15px', width: '100%',
                textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: '11px',
                textShadow: '0 1px 4px #000'
              }}>
                ⚠️ 어둡고 조명이 수직으로 내려오는 곳에서는<br /> 그림자가 다크서클로 보일 수 있으므로, 밝은 장소에서 촬영해주세요.
              </div>
            </div>
          )}

          {/* 상황2: 분석 중(로딩 화면) */}
          {scanning && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', zIndex: 10 }}>
              <div style={{ fontSize: '40px' }}>👁</div>
              <div style={{ fontSize: '14px', color: '#6ee7f7', marginTop: '10px' }}>AI가 다크서클을 분석하고 있습니다...</div>
            </div>
          )}
                  
          {/* 상황 3: 분석 완료 (박스 그려진 결과 이미지 출력) */}
          {scanned && analyzedImg && (
            <img 
              src={analyzedImg} 
              alt="분석 결과" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          {!scanned ? (
            <button className="scan-btn" onClick={doScan} disabled={scanning}>
              {scanning ? "분석 중..." : "📷 촬영 및 분석"}
            </button>
          ) : (
            <button onClick={() => {
                setScanned(false);
                setAnalyzedImg(null);
                setCapturedBlob(null);
                setResult(null);
              }} className="retry-btn">↺ 다시 촬영하기</button>
          )}
        </div>
        
        {/* 점수 표시 (선택사항) */}
        {scanned && (
          <div style={{ color: 'var(--accent)', fontWeight: 'bold', marginTop: '10px' }}>
            다크서클 점수: {darkScore}점
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
              <input 
                className="input-field" 
                type="number" 
                step="0.5"
                placeholder="1.5"
                value={lifestyleData.workout}
                onChange={(e) => setLifestyleData({...lifestyleData, workout: e.target.value})}
              />
            </div>
            <div className="input-group">
              <div className="input-label">근무시간 (h)</div>
              <input 
                className="input-field" 
                type="number" 
                placeholder="9"
                value={lifestyleData.workHours}
                onChange={(e) => setLifestyleData({...lifestyleData, workHours: e.target.value})}
              />
            </div>
          </div>
          <div className="input-row" style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <div className="input-group">
              <div className="input-label">폰 사용 (h)</div>
              <input 
                className="input-field" 
                type="number" 
                placeholder="6"
                value={lifestyleData.phone}
                onChange={(e) => setLifestyleData({...lifestyleData, phone: e.target.value})}
              />
            </div>
            <div className="input-group">
              <div className="input-label">수면시간 (h)</div>
              <input 
                className="input-field" 
                type="number" 
                step="0.5"
                placeholder="7.5"
                value={lifestyleData.sleepTime}
                onChange={(e) => setLifestyleData({...lifestyleData, sleepTime: e.target.value})}
              />
            </div>
            {/* 전날 수면 필드는 필요 없으니 삭제 또는 숨김 처리 */}
            <div className="input-group">
              <div className="input-label"> </div>
              <input className="input-field" type="hidden" />
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
                    <button
                      onClick={() => {
                        if (isNoneSelected()) {
                          setDrinks([]);
                        } else {
                          setDrinks(['🚫 없음']);
                        }
                      }}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '24px',
                        background: isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                        color: isSelected ? '#000' : 'rgba(255,255,255,0.7)',
                        border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500,
                        transition: 'all 0.2s ease',
                        minWidth: '120px'
                      }}
                    >
                      {drink}
                    </button>
                  </div>
                );
              }

              
              return (
                <div key={drink} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={() => addDrink(drink)}
                    disabled={isNoneSelected()}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '24px',
                      background: isSelected ? 'var(--accent)' : 'rgba(255,255,255,0.08)',
                      color: isSelected ? '#000' : 'rgba(255,255,255,0.7)',
                      border: isSelected ? 'none' : '1px solid rgba(255,255,255,0.2)',
                      cursor: isNoneSelected() ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      transition: 'all 0.2s ease',
                      minWidth: '100px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                      opacity: isNoneSelected() ? 0.5 : 1
                    }}
                  >
                    <span>{drink}</span>
                    {count > 0 && (
                      <span style={{ 
                        background: 'rgba(0,0,0,0.3)', 
                        padding: '2px 8px', 
                        borderRadius: '20px',
                        fontSize: '12px'
                      }}>
                        {count}잔
                      </span>
                    )}
                  </button>
                  
                  {count > 0 && !isNoneSelected() && (
                    <button
                      onClick={() => removeDrink(drink)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(239,68,68,0.2)',
                        border: '1px solid rgba(239,68,68,0.4)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      -
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* 선택된 음료 요약 표시 */}
          {!isNoneSelected() && drinks.length > 0 && (
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: 'rgba(110,231,247,0.1)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#6ee7f7'
            }}>
              📊 총 카페인: {getTotalCaffeineMg()}mg
            </div>
          )}
          
          {/* '없음' 선택 시 메시지 */}
          {isNoneSelected() && (
            <div style={{
              marginTop: '8px',
              padding: '8px 12px',
              background: 'rgba(110,231,247,0.1)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#6ee7f7'
            }}>
              ✅ 카페인 없음 (0mg)
            </div>
          )}
        </div>

          {/* -------------------------------------- */}
          <button className="analyze-btn" onClick={doAnalyze}>🔍 AI 분석 시작하기</button>
        </div>
      </div>

      {/* 분석 결과 */}
{result && (
  <div ref={resultRef}>

    {/* 피로도 분석 결과 카드 */}
    <div style={{
      background: 'linear-gradient(135deg, #1e1040, #2a1a5e)',
      border: '1px solid rgba(167,139,250,0.25)',
      borderRadius: '16px', padding: '20px', marginBottom: '14px',
    }}>
      <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '16px', letterSpacing: '1px' }}>
        피로도 분석 결과
      </div>

      {/* 3단계 선택 인디케이터 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '18px' }}>
        {FATIGUE_LEVELS.map(lv => {
          const isActive = result.fatigue === lv.key;
          return (
            <div key={lv.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: isActive ? lv.bg : 'rgba(255,255,255,0.04)',
                border: `2px solid ${isActive ? lv.border : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px',
                boxShadow: isActive ? `0 0 14px ${lv.border}` : 'none',
                transition: 'all 0.3s ease',
              }}>
                {lv.icon}
              </div>
              <div style={{
                fontSize: '11px', fontWeight: isActive ? 700 : 400,
                color: isActive ? lv.color : 'rgba(255,255,255,0.3)',
                transition: 'all 0.3s ease',
              }}>{lv.label}</div>
            </div>
          );
        })}
      </div>

      {/* 피로 원인 표시 (추가) */}
      {result.fatigueCause && (
        <div style={{
          background: 'rgba(110,231,247,0.15)',
          border: '1px solid rgba(110,231,247,0.3)',
          borderRadius: '12px',
          padding: '12px',
          marginBottom: '12px'
        }}>
          <div style={{ fontSize: '12px', color: '#6ee7f7', marginBottom: '6px', fontWeight: 500 }}>
            🔍 피로 원인 분석
          </div>
          <div style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>
            {result.fatigueCause}
          </div>
          {result.fatigueDetails && result.fatigueDetails.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              {result.fatigueDetails.map((detail, idx) => (
                <div key={idx} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
                  {detail}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 피로도 레벨 뱃지 + 메시지 */}
      {(() => {
        const lv = FATIGUE_LEVELS.find(l => l.key === result.fatigue);
        const causeName = result.fatigueCause || '다크서클 지수 상승';
        const msg = getFatigueMessage(result.fatigue, userName, causeName);
        return (
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${lv.border}`,
            borderRadius: '12px', padding: '14px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{
                background: lv.bg, border: `1px solid ${lv.border}`,
                color: lv.color, fontSize: '11px', fontWeight: 700,
                padding: '3px 10px', borderRadius: '20px',
              }}>{lv.label}</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                {userName}님의 피로 {lv.label}
              </span>
            </div>
            <div style={{
              fontSize: '12px', color: 'rgba(255,255,255,0.6)',
              lineHeight: 1.8, fontWeight: 300,
            }}>
              {msg}
            </div>
          </div>
        );
      })()}
    </div>

    {/* 플랜 선택 */}
    <div className="section-title">추천 수면 코칭 플랜</div>
    <div className="plan-grid">
      {PLAN_DATA.map(p => (
        <div key={p.n}
          className="plan-btn"
          onClick={() => handleSelectPlan(p.n)}
          style={selectedPlan === p.n ? { borderColor: 'var(--accent)', background: 'rgba(110,231,247,0.1)' } : {}}
        >
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '28px', color: selectedPlan === p.n ? 'var(--accent)' : 'var(--accent)',
            lineHeight: 1, marginBottom: '2px',
          }}>{p.days}</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
            {p.label}
          </div>
          <div style={{
            fontSize: '10px', color: 'rgba(255,255,255,0.4)',
            lineHeight: 1.6, whiteSpace: 'pre-line',
          }}>{p.desc}</div>
        </div>
      ))}
    </div>

    {/* 코칭 시작 버튼 */}
    {selectedPlan && (
      <button
        className="analyze-btn"
        onClick={handleStartCoaching}
        style={{ background: 'var(--accent2)', marginTop: '4px' }}
      >
        💬 {selectedPlan}일 플랜으로 코칭 시작하기 →
      </button>
    )}
  </div>
)}
    </div>
  );
}

export default Analyze;