import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string, password_confirmation: string, phone?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateUser: (updated: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('bubluv_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('bubluv_token');
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem('bubluv_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session expired or invalid token');
          localStorage.removeItem('bubluv_token');
          localStorage.removeItem('bubluv_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    fetchUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success) {
        const u = res.data.user;
        const t = res.data.token;
        setUser(u);
        setToken(t);
        localStorage.setItem('bubluv_token', t);
        localStorage.setItem('bubluv_user', JSON.stringify(u));
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Login gagal.' };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Email atau kata sandi salah.';
      return { success: false, message: msg };
    }
  };

  const register = async (name: string, email: string, password: string, password_confirmation: string, phone?: string) => {
    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        password,
        password_confirmation,
        phone,
      });

      if (res.data?.success) {
        const u = res.data.user;
        const t = res.data.token;
        setUser(u);
        setToken(t);
        localStorage.setItem('bubluv_token', t);
        localStorage.setItem('bubluv_user', JSON.stringify(u));
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Registrasi gagal.' };
    } catch (err: any) {
      const msg = err.response?.data?.message || (Object.values(err.response?.data?.errors || {}) as string[][])[0]?.[0] || 'Registrasi gagal.';
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('bubluv_token');
      localStorage.removeItem('bubluv_user');
    }
  };

  const updateUser = (updated: User) => {
    setUser(updated);
    localStorage.setItem('bubluv_user', JSON.stringify(updated));
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, loading, isAdmin, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
