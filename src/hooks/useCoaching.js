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
 * 코칭 플랜 데이터 훅
 * - 서버에서 플랜 상태(plan_type, current_day_number) 로드
 * - 선택한 날짜의 미션 목록 로드
 * - 체크박스: 낙관적 업데이트(즉시 반영) → DB 동기화
 */
export function useCoaching() {
  const [planStatus, setPlanStatus] = useState(null); // { plan_type, current_day_number }
  const [activeDay, setActiveDay] = useState(1);
  const [missions, setMissions] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [loadingMissions, setLoadingMissions] = useState(false);

  // 플랜 상태 로드 (마운트 시 1회)
  useEffect(() => {
    const userIdx = localStorage.getItem('user_idx') || '1008';
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

  // 날짜 변경 시 미션 로드
  useEffect(() => {
    if (!planStatus) return;

    setLoadingMissions(true);
    setMissions([]);

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
        setMissions(data.missions || []);
      })
      .catch(err => {
        console.error('미션 로드 실패:', err);
      })
      .finally(() => setLoadingMissions(false));
  }, [activeDay, planStatus]);

  // 체크박스 토글: 낙관적 업데이트 후 DB 동기화
  const toggleCheck = useCallback(async (detailIdx, currentIsCompleted) => {
    const newVal = currentIsCompleted ? 0 : 1;

    // 즉시 UI 반영
    setMissions(prev =>
      prev.map(m => m.detail_idx === detailIdx ? { ...m, is_completed: newVal } : m)
    );

    // DB 동기화
    try {
      await updateMissionCheck(detailIdx, newVal === 1);
    } catch (err) {
      console.error('미션 상태 업데이트 실패, 롤백합니다:', err);
      // 실패 시 롤백
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
    isLocked,
    loadingPlan,
    loadingMissions,
    toggleCheck,
  };
}
