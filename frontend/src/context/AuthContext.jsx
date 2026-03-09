import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../services/api.js';

const TOKEN_KEY = 'finevsis_token';
const USER_KEY = 'finevsis_user';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => readStoredUser());
  const [ready, setReady] = useState(false);

  function persistSession(payload) {
    localStorage.setItem(TOKEN_KEY, payload.token);
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
    setToken(payload.token);
    setUser(payload.user);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }

  useEffect(() => {
    let active = true;

    async function hydrate() {
      if (!token) {
        setReady(true);
        return;
      }

      try {
        const response = await authAPI.me();
        if (!active) return;
        localStorage.setItem(USER_KEY, JSON.stringify(response.data));
        setUser(response.data);
      } catch {
        if (!active) return;
        logout();
      } finally {
        if (active) setReady(true);
      }
    }

    hydrate();
    return () => {
      active = false;
    };
  }, [token]);

  async function login(credentials) {
    const response = await authAPI.login(credentials);
    persistSession(response.data);
    return response.data.user;
  }

  async function register(payload) {
    const response = await authAPI.register(payload);
    persistSession(response.data);
    return response.data.user;
  }

  async function updateProfile(payload) {
    const response = await authAPI.updateMe(payload);
    localStorage.setItem(USER_KEY, JSON.stringify(response.data));
    setUser(response.data);
    return response.data;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        ready,
        isAuthenticated: Boolean(user),
        login,
        register,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
