import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '../services/api.js';

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
  const [user, setUser] = useState(() => readStoredUser());
  const [ready, setReady] = useState(false);

  function persistSession(payload) {
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
    setUser(payload.user);
  }

  async function logout() {
    try {
      await authAPI.logout();
    } catch (e) {
      console.error('Logout failed', e);
    }
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  useEffect(() => {
    let active = true;

    async function hydrate() {
      // Always try to fetch the active user session from cookies via /me
      try {
        const response = await authAPI.me();
        if (!active) return;
        localStorage.setItem(USER_KEY, JSON.stringify(response.data));
        setUser(response.data);
      } catch {
        if (!active) return;
        localStorage.removeItem(USER_KEY);
        setUser(null);
      } finally {
        if (active) setReady(true);
      }
    }

    hydrate();
    return () => {
      active = false;
    };
  }, []);

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
