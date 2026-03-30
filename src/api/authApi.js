const BASE = 'http://localhost:7000';

export const login = async (email, password) => {
  const res = await fetch(`${BASE}/api/login`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ email, password }),
  });
  return res.json();
};

export const signup = async ({ name, email, password, birthdate, gender }) => {
  const res = await fetch(`${BASE}/api/signup`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({ name, email, password, birthdate, gender }),
  });
  return res.json();
};

export const verifyPassword = async (currentPassword) => {
  const res = await fetch(`${BASE}/api/user/verify-password`, {
    method : 'POST',
    headers: {
      'Content-Type' : 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({ currentPassword }),
  });
  return res.json();
};

export const changePassword = async (currentPassword, newPassword) => {
  const res = await fetch(`${BASE}/api/user/password`, {
    method : 'PUT',
    headers: {
      'Content-Type' : 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return res.json();
};
