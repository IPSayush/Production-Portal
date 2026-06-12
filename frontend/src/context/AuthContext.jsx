import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { authApi, setUnauthorizedHandler } from '../api';

const TOKEN_KEY = 'prod_portal_token';
const USER_KEY = 'prod_portal_user';

const initialState = {
  user: null,
  token: null,
  role: null,
  loading: true,
  error: null,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        role: action.payload.user.role,
        loading: false,
        error: null,
      };
    case 'LOGOUT':
      return { ...initialState, loading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const logout = useCallback(async () => {
    try {
      if (state.role === 'viewer' && state.token) {
        await authApi.logout();
      }
    } catch {
      // ignore logout errors
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    dispatch({ type: 'LOGOUT' });
  }, [state.role, state.token]);

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    dispatch({ type: 'LOGOUT' });
    window.location.href = '/landing';
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
  }, [handleUnauthorized]);

  // ─── Persistent login: restore user from localStorage instantly, then verify with server ───
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    // Instantly restore cached user data so the UI loads without waiting for the server
    const cachedUser = localStorage.getItem(USER_KEY);
    if (cachedUser) {
      try {
        const user = JSON.parse(cachedUser);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { token, user },
        });
      } catch {
        // corrupted cache, ignore
      }
    }

    // Verify with server in background (updates cached data if valid, clears if invalid)
    authApi
      .me()
      .then((res) => {
        const user = res.data.user;
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { token, user },
        });
      })
      .catch((err) => {
        // Only clear on 401 (session invalid). Network errors keep the cached state.
        if (err.response?.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          dispatch({ type: 'LOGOUT' });
        } else {
          // Network error — keep cached user if we have one, otherwise clear loading
          if (!cachedUser) {
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        }
      });
  }, []);

  const login = async (userId, password, role) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    try {
      const res = await authApi.login(userId, password, role);
      const { token, user } = res.data;
      // Persist both token and user data for instant restore on next visit
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user } });
      return user;
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      dispatch({ type: 'SET_ERROR', payload: message });
      dispatch({ type: 'SET_LOADING', payload: false });
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        role: state.role,
        loading: state.loading,
        error: state.error,
        login,
        logout,
        isAuthenticated: !!state.token && !!state.user,
        isManager: state.role === 'manager',
        isViewer: state.role === 'viewer',
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
