const BASE = 'http://localhost:7000';

export const savePlan = async (user_idx, plan_type) => {
  const res = await fetch(`${BASE}/api/plan/save`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ user_idx, plan_type }),
  });
  return res.json();
};
