import { useState } from 'react';
import * as authApi from '../api/authApi';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const loginUser = async (email, password) => {
    setLoading(true);
    setError('');
    try {
      return await authApi.login(email, password);
    } catch {
      setError('서버 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const signupUser = async (formData) => {
    setLoading(true);
    try {
      return await authApi.signup(formData);
    } catch {
      return { success: false, message: '서버 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.' };
    } finally {
      setLoading(false);
    }
  };

  const verifyPassword = async (currentPassword) => {
    try {
      return await authApi.verifyPassword(currentPassword);
    } catch {
      return { success: false };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      return await authApi.changePassword(currentPassword, newPassword);
    } catch {
      return { success: false, message: '서버 연결에 실패했습니다.' };
    }
  };

  return { loading, error, loginUser, signupUser, verifyPassword, changePassword };
};
