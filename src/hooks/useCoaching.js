import { useState, useEffect, useCallback } from 'react';
import { getPlanStatus, getDailyMissions, updateMissionCheck } from '../api/planApi';

const getCurrentDayFromStart = (startDate) => {
  if (!startDate) return 1;

  const start = new Date(startDate);
  const today = new Date();

  start.setHours(0,0,0,0);
  today.setHours(0,0,0,0);

  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  return diff + 1;
};

/**
 * 코칭 플랜 데이터 훅 (원본 분석글 dailyAnalysis 추가)
 */
export function useCoaching() {
  const [planStatus, setPlanStatus] = useState(null); 
  const [activeDay, setActiveDay] = useState(1);
  const [missions, setMissions] = useState([]);
  const [dailyAnalysis, setDailyAnalysis] = useState(""); // 원본 분석글 상태 추가
  const [isLocked, setIsLocked] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [loadingMissions, setLoadingMissions] = useState(false);

  // 플랜 상태 로드
  useEffect(() => {
    setLoadingPlan(true);
    getPlanStatus()
      .then(data => {
        if (!data) return;

        // ✅ current_day 직접 계산
        const computedDay = getCurrentDayFromStart(data.start_date);

        const updated = {
          ...data,
          current_day_number: Math.min(computedDay, data.plan_type) // max 제한
        };

        setPlanStatus(updated);
        setActiveDay(updated.current_day_number);
      })
      .catch(err => {
        console.error('플랜 상태 로드 실패:', err);
      })
      .finally(() => setLoadingPlan(false));
  }, []);

  // 날짜 변경 시 미션 + 원본 분석글 로드
  useEffect(() => {
    if (!planStatus) return;

    setLoadingMissions(true);
    setMissions([]);
    setDailyAnalysis("");

    const isFuture = activeDay > planStatus.current_day_number;

    // ✅ 프론트에서 lock 처리
    if (isFuture) {
      setIsLocked(true);
      setLoadingMissions(false);
      return;
    }

    setIsLocked(false);

    getDailyMissions(activeDay)
      .then(data => {
        if (data.success) {
          setMissions(data.missions || []);
          setDailyAnalysis(data.daily_analysis || ""); // 서버에서 받은 원본 글 저장
        }
      })
      .catch(err => {
        console.error('미션 로드 실패:', err);
      })
      .finally(() => setLoadingMissions(false));
  }, [activeDay, planStatus]);

  const toggleCheck = useCallback(async (detailIdx, currentIsCompleted) => {
    const newVal = currentIsCompleted ? 0 : 1;
    setMissions(prev =>
      prev.map(m => m.detail_idx === detailIdx ? { ...m, is_completed: newVal } : m)
    );
    try {
      await updateMissionCheck(detailIdx, newVal === 1);
    } catch (err) {
      setMissions(prev =>
        prev.map(m => m.detail_idx === detailIdx ? { ...m, is_completed: currentIsCompleted } : m)
      );
    }
  }, []);

  return {
    planStatus,
    activeDay,
    setActiveDay,
    missions,
    dailyAnalysis, // 노출
    isLocked,
    loadingPlan,
    loadingMissions,
    toggleCheck,
  };
}
