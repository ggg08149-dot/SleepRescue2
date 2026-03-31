const BASE = 'http://localhost:7000';

export const saveLifelog = async (data) => {
  const res = await fetch(`${BASE}/api/lifelog/save`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify(data),
  });
  return res.json();
};

export const getLatestLifelog = async (user_idx) => {
  const res = await fetch(`${BASE}/api/lifelog/latest/${user_idx}`);
  return res.json();
};
