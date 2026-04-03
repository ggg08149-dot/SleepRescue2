import axios from 'axios';

const API_URL = 'http://localhost:7000/api/plan';

// 1. 플랜 시작하기 (AnalysisResult.jsx)
export const startPlan = async (planType) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/start`, 
    { plan_type: planType },
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  return response.data;
};

// 2. 현재 플랜 상태 조회 (Coaching.jsx 로딩 시)
// { plan_type, current_day_number, hasActivePlan } 등 반환
export const getPlanStatus = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/status`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};

// 3. 특정 일차 미션 가져오기 (Coaching.jsx)
export const getDailyMissions = async (day) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/daily/${day}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};

// 4. 미션 완료 여부 전송 (Coaching.jsx 체크박스 클릭 시)
export const updateMissionCheck = async (detailIdx, isCompleted) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/check`, 
    { detail_idx: detailIdx, is_completed: isCompleted },
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  return response.data;
};
