const BASE = 'http://localhost:7000';

export const saveDarkcircle = async (data) => {
  const res = await fetch(`${BASE}/api/darkcircle/save`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify(data),
  });
  return res.json();
};
