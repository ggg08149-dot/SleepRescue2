const BASE = 'http://localhost:7000';

export const saveFile = async (data) => {
  const res = await fetch(`${BASE}/api/file/save`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify(data),
  });
  return res.json();
};
