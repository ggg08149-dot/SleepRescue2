import axios from 'axios';

const BASE     = 'http://localhost:7000';
const FASTAPI  = 'http://127.0.0.1:8000';

export const analyzeDarkcircle = async (imageBlob) => {
  const formData = new FormData();
  formData.append('file', imageBlob, 'capture.jpg');
  const res = await axios.post(`${FASTAPI}/predict/yolo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const saveFatigue = async (data) => {
  const res = await fetch(`${BASE}/api/fatigue/save`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify(data),
  });
  return res.json();
};
