import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { api, ProfileInput, setAuthToken, User } from './api';

const STORAGE_KEY = 'vanaris.auth';

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, displayName: string) => Promise<void>;
  updateProfile: (data: ProfileInput) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const saved = JSON.parse(raw) as { token: string; user: User };
        setAuthToken(saved.token);
        setToken(saved.token);
        setUser(saved.user);
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = async (next: { token: string; user: User } | null) => {
    setAuthToken(next?.token ?? null);
    setToken(next?.token ?? null);
    setUser(next?.user ?? null);
    if (next) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else await AsyncStorage.removeItem(STORAGE_KEY);
  };

  const login = async (username: string, password: string) => {
    const result = await api.auth.login({ username, password });
    await persist(result);
  };

  const register = async (username: string, password: string, displayName: string) => {
    const result = await api.auth.register({ username, password, displayName });
    await persist(result);
  };

  const updateProfile = async (data: ProfileInput) => {
    const updated = await api.auth.updateMe(data);
    if (!token) return;
    await persist({ token, user: updated });
  };

  const logout = () => persist(null);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
