import axios from 'axios';

const API_URL = 'http://localhost:7000/api/plan';

// 1. 플랜 시작하기 (플랜 생성 + 1일차 미션 초기화)
export const savePlan = async (userIdx, planType) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(`${API_URL}/save`, 
    { user_idx: userIdx, plan_type: planType },
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  return response.data;
};

// 2. 현재 진행 중인 플랜의 메타데이터 가져오기 (현재 몇 일차인지 등)
export const getPlanStatus = async (userIdx) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/status/${userIdx}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};

// 3. 특정 일차의 미션 목록 가져오기
export const getDailyMissions = async (userIdx, day) => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/daily/${userIdx}/${day}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.data;
};

// 4. 미션 체크 상태 업데이트
export const updateMissionCheck = async (detailIdx, isCompleted) => {
  const token = localStorage.getItem('token');
  const response = await axios.put(`${API_URL}/check`, 
    { detail_idx: detailIdx, is_completed: isCompleted },
    { headers: { 'Authorization': `Bearer ${token}` } }
  );
  return response.data;
};
