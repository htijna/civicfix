import { createContext, useContext, useEffect, useState } from 'react';
import { api as request } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('civicfix_user')); } catch { return null; }
  });

  useEffect(() => {
    const clearUser = () => setUser(null);
    window.addEventListener('civicfix:auth-expired', clearUser);
    if (localStorage.getItem('civicfix_token')) {
      request('/auth/me')
        .then(data => {
          localStorage.setItem('civicfix_user', JSON.stringify(data.user));
          setUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem('civicfix_token');
          localStorage.removeItem('civicfix_user');
          setUser(null);
        });
    }
    return () => window.removeEventListener('civicfix:auth-expired', clearUser);
  }, []);

  const login = async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password })
    });
    localStorage.setItem('civicfix_token', data.token);
    localStorage.setItem('civicfix_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const register = async values => {
    const data = await request('/auth/register', {
      method: 'POST', body: JSON.stringify(values)
    });
    localStorage.setItem('civicfix_token', data.token);
    localStorage.setItem('civicfix_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('civicfix_token');
    localStorage.removeItem('civicfix_user');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
