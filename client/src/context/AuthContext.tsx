'use client';

import {
  createContext, useContext, useState, useEffect, useCallback,
  ReactNode,
} from 'react';

export interface AuthUser {
  _id:   string;
  name:  string;
  email: string;
  phone?: string;
  role:  'user' | 'admin';
}

interface AuthContextValue {
  user:     AuthUser | null;
  loading:  boolean;
  login:    (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout:   () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user:     null,
  loading:  true,
  login:    async () => { throw new Error('AuthProvider missing'); },
  register: async () => { throw new Error('AuthProvider missing'); },
  logout:   () => {},
});

const API = '/api';

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    if (res.status === 502 || res.status === 503 || res.status === 504 || text === '' ) {
      throw new Error('Cannot reach the backend server. Please make sure it is running on port 5000.');
    }
    throw new Error(`Server returned an unexpected response (${res.status}). Please try again.`);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }

    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        if (!r.ok) return null;
        return parseJson<AuthUser>(r).catch(() => null);
      })
      .then((data) => { if (data) setUser(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<AuthUser> => {
    
    const res  = await fetch(`${API}/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });
    const data = await parseJson<{ token: string; user: AuthUser; message?: string }>(res);
    if (!res.ok) throw new Error(data.message || 'Login failed');
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<AuthUser> => {
    const res  = await fetch(`${API}/auth/register`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password }),
    });
    const data = await parseJson<{ token: string; user: AuthUser; message?: string }>(res);
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextValue => useContext(AuthContext);
