import { createContext, useContext, useEffect, useState } from 'react';
import { api as request } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const initialToken = localStorage.getItem('civicfix_token');
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('civicfix_user')); } catch { return null; }
  });
  const [authReady, setAuthReady] = useState(!initialToken);

  useEffect(() => {
    let active = true;
    const clearUser = () => setUser(null);
    window.addEventListener('civicfix:auth-expired', clearUser);
    const token = localStorage.getItem('civicfix_token');

    if (token) {
      request('/auth/me')
        .then(data => {
          if (localStorage.getItem('civicfix_token') === token) {
            localStorage.setItem('civicfix_user', JSON.stringify(data.user));
            setUser(data.user);
          }
        })
        .catch(() => {
          if (localStorage.getItem('civicfix_token') === token) {
            localStorage.removeItem('civicfix_token');
            localStorage.removeItem('civicfix_user');
            setUser(null);
          }
        })
        .finally(() => {
          if (active) setAuthReady(true);
        });
    }

    return () => {
      active = false;
      window.removeEventListener('civicfix:auth-expired', clearUser);
    };
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

  return <AuthContext.Provider value={{ user, authReady, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
