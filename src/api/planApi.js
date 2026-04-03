import axios from 'axios';

const API_URL = 'http://localhost:7000/api/plan';

// 1. 플랜 시작하기 (AnalysisResult.jsx에서 사용)
export const startPlan = async (planType) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/start`, 
    { plan_type: planType },
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  return response.data;
};

// 2. 특정 일차 미션 가져오기 (Coaching.jsx에서 사용)
export const getDailyMissions = async (day) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/daily/${day}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};

// 3. 미션 완료 여부 전송
export const updateMissionCheck = async (detailIdx, isCompleted) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/check`, 
    { detail_idx: detailIdx, is_completed: isCompleted },
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  return response.data;
};
