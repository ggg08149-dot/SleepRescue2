import { useState } from 'react';
import { analyzeDarkcircle, saveFatigue } from '../api/fatigueApi';
import { saveLifelog }    from '../api/lifelogApi';
import { saveFile }       from '../api/fileApi';
import { saveDarkcircle } from '../api/darkcircleApi';

export const useAnalyze = () => {
  const [scanned, setScanned]         = useState(false);
  const [scanning, setScanning]       = useState(false);
  const [analyzing, setAnalyzing]     = useState(false);
  const [darkScore, setDarkScore]     = useState(0);
  const [analyzedImg, setAnalyzedImg] = useState(null);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [result, setResult]           = useState(null);

  const resetScan = () => {
    setScanned(false);
    setAnalyzedImg(null);
    setCapturedBlob(null);
    setResult(null);
  };

  // YOLO 다크서클 분석
  const doScan = async (webcamRef) => {
    if (scanning) return;
    setScanning(true);
    try {
      if (!webcamRef.current) throw new Error('카메라를 찾을 수 없습니다.');
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) throw new Error('캡처에 실패했습니다.');

      const imageRes  = await fetch(imageSrc);
      const imageBlob = await imageRes.blob();
      setCapturedBlob(imageBlob);

      const data = await analyzeDarkcircle(imageBlob);
      if (data.status === 'success') {
        setDarkScore(data.dark_circle_score);
        setAnalyzedImg(data.result_image);
        setScanned(true);
        console.log('분석 성공:', data.dark_circle_score);
      } else {
        alert('다크서클 검출에 실패했습니다. 조명을 밝게 하고 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('분석 실패:', error);
      alert('서버 연결에 실패했습니다. FastAPI 서버(8000포트)가 실행 중인지 확인해주세요!');
    } finally {
      setScanning(false);
    }
  };

  // 4단계 분석 + DB 저장
  const doAnalyze = async (lifestyleData, getTotalCaffeineMg, updateResult) => {
    if (analyzing) return;
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
    if (!user_idx) { alert('로그인이 필요합니다.'); return; }

    const workoutHours = parseFloat(lifestyleData.workout);
    const sleepHours   = parseFloat(lifestyleData.sleepTime);
    const caffeineMg   = getTotalCaffeineMg();

    setAnalyzing(true);
    try {
      // STEP 1: 생활패턴 저장
      const lifelogData = await saveLifelog({
        user_idx,
        exec_hours : workoutHours,
        phone_hours: parseFloat(lifestyleData.phone),
        work_hours : parseFloat(lifestyleData.workHours),
        caffeine   : caffeineMg,
        sleep_hours: sleepHours,
      });
      if (!lifelogData.success) { alert(`생활패턴 저장 실패: ${lifelogData.message}`); return; }

      // STEP 2: 파일 메타데이터 저장
      const fileData = await saveFile({
        user_idx,
        file_name: `capture_${Date.now()}.jpg`,
        file_size: capturedBlob ? capturedBlob.size : 0,
        file_ext : 'jpg',
      });
      if (!fileData.success) { alert(`파일 저장 실패: ${fileData.message}`); return; }

      // STEP 3: 다크서클 점수 저장
      const dcData = await saveDarkcircle({ file_idx: fileData.file_idx, user_idx, dc_score: darkScore });
      if (!dcData.success) { alert(`다크서클 저장 실패: ${dcData.message}`); return; }

      // STEP 4: ML 실행 + 피로도 저장
      const fatigueData = await saveFatigue({
        file_idx   : fileData.file_idx,
        lifelog_idx: lifelogData.lifelog_idx,
        workout    : workoutHours,
        phone      : parseFloat(lifestyleData.phone),
        workHours  : parseFloat(lifestyleData.workHours),
        caffeine   : caffeineMg,
        sleepTime  : sleepHours,
      });
      if (!fatigueData.success) { alert(`ML 분석 실패: ${fatigueData.message}`); return; }

      const res = {
        darkCircle     : darkScore,
        sleepScore     : fatigueData.predicted_hours,
        sleepScorePoint: fatigueData.sleep_score,
        avg3           : 70,
        fatigueScore   : fatigueData.fatigue_score,
        fatigue        : fatigueData.fatigue_level,
        fatigueCause   : fatigueData.fatigue_cause   || '복합적 요인',
        fatigueDetails : fatigueData.fatigue_details || [],
      };
      setResult(res);
      updateResult(res);
    } catch (error) {
      console.error('분석 오류:', error);
      alert(`분석 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  return {
    scanned, scanning, analyzing,
    darkScore, analyzedImg, capturedBlob, result,
    doScan, doAnalyze, resetScan,
  };
};
