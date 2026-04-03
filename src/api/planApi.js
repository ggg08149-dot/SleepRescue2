import axios from 'axios';

const API_URL = 'http://localhost:7000/api/plan';

/**
 * [통합 API] 플랜 시작하기
 * - 백엔드 /start 엔드포인트 사용
 * - 토큰 기반 인증으로 user_idx 생략 가능
 */
export const startPlan = async (planType) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/start`, 
    { plan_type: planType },
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  return response.data;
};

/**
 * [통합 API] 현재 플랜 상태 조회
 */
export const getPlanStatus = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};

/**
 * [통합 API] 특정 일차 미션 가져오기
 */
export const getDailyMissions = async (day) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/daily/${day}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};

/**
 * [통합 API] 미션 체크 상태 업데이트
 */
export const updateMissionCheck = async (detailIdx, isCompleted) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/check`, 
    { detail_idx: detailIdx, is_completed: isCompleted },
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  return response.data;
};
