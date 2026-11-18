// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, type User } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: 'ADMIN' | 'TRAINER' | 'STUDENT' | null;
  selectedBatchId: number | null;
  setSelectedBatchId: (id: number) => void;
  loginWithOtp: (mobile: string, otp: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('lms_user');
    if (!saved) return null;

    const savedUser: User = JSON.parse(saved);
    if (savedUser.role === 'TRAINER' && savedUser.mobile_number === '4545454545' && savedUser.trainer_id === 11) {
      savedUser.trainer_id = 1;
    }
    return savedUser;
  });

  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(() => {
    const saved = localStorage.getItem('lms_selected_batch');
    return saved ? Number(saved) : 2; // Default to existing batch 2
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('lms_user', JSON.stringify(user));
      if (user.batch_id && !selectedBatchId) {
        setSelectedBatchId(user.batch_id);
      }
    } else {
      localStorage.removeItem('lms_user');
    }
  }, [user]);

  useEffect(() => {
    if (selectedBatchId) {
      localStorage.setItem('lms_selected_batch', String(selectedBatchId));
    }
  }, [selectedBatchId]);

  const loginWithOtp = async (mobile: string, otp: string) => {
    const res = await api.verifyOtp(mobile, otp);
    if (res.success && res.data) {
      // Normalize role to uppercase
      const normalizedUser: User = {
        ...res.data,
        role: (res.data.role.toUpperCase() as 'ADMIN' | 'TRAINER' | 'STUDENT'),
      };
      setUser(normalizedUser);
      if (normalizedUser.batch_id) {
        setSelectedBatchId(normalizedUser.batch_id);
      }
      return { success: true };
    }
    return { success: false, message: res.message || res.error || 'Authentication failed' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('lms_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        selectedBatchId,
        setSelectedBatchId,
        loginWithOtp,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
