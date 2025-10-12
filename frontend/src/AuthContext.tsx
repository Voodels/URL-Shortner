/**
 * Authentication Context
 *
 * RESPONSIBILITIES:
 * - Persist authentication tokens
 * - Expose current user information across the app
 * - Provide helpers for login, registration, logout, and refresh operations
 */

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import {
    api,
    type APIError,
    type AuthCredentials,
    type AuthResponse,
    type PublicUser,
} from "./api";

interface AuthContextValue {
  user: PublicUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isAuthLoading: boolean;
  login: (credentials: AuthCredentials) => Promise<AuthResponse>;
  register: (credentials: AuthCredentials) => Promise<AuthResponse>;
  logout: () => void;
  refreshUser: () => Promise<PublicUser | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_STORAGE_KEY = "urlshortener:authToken";
const isBrowser = typeof window !== "undefined";

interface AuthProviderProps {
  children: ReactNode;
}

function usePersistedToken() {
  const [token, setTokenState] = useState<string | null>(null);

  const setToken = useCallback((value: string | null) => {
    setTokenState(value);
    if (isBrowser) {
      if (value) {
        localStorage.setItem(TOKEN_STORAGE_KEY, value);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
    api.setAuthToken(value);
  }, []);

  return { token, setToken } as const;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { token, setToken } = usePersistedToken();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [isInitializing, setInitializing] = useState(true);
  const [isAuthLoading, setAuthLoading] = useState(false);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setToken(null);
  }, [setToken]);

  useEffect(() => {
    if (!isBrowser) {
      setInitializing(false);
      return;
    }

    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken) {
      setInitializing(false);
      return;
    }

    setToken(storedToken);

    api
      .getCurrentUser()
      .then(({ user: currentUser }) => {
        setUser(currentUser);
      })
      .catch(() => {
        clearAuthState();
      })
      .finally(() => {
        setInitializing(false);
      });
  }, [clearAuthState, setToken]);

  const applyAuth = useCallback(
    (response: AuthResponse) => {
      setUser(response.user);
      setToken(response.token);
      return response;
    },
    [setToken]
  );

  const performAuth = useCallback(
    async (operation: () => Promise<AuthResponse>) => {
      setAuthLoading(true);
      try {
        const response = await operation();
        return applyAuth(response);
      } finally {
        setAuthLoading(false);
      }
    },
    [applyAuth]
  );

  const login = useCallback(
    async (credentials: AuthCredentials) => {
      return performAuth(() => api.login(credentials));
    },
    [performAuth]
  );

  const register = useCallback(
    async (credentials: AuthCredentials) => {
      return performAuth(() => api.register(credentials));
    },
    [performAuth]
  );

  const logout = useCallback(() => {
    clearAuthState();
  }, [clearAuthState]);

  const refreshUser = useCallback(async () => {
    if (!token) {
      clearAuthState();
      return null;
    }

    try {
      const { user: currentUser } = await api.getCurrentUser();
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      clearAuthState();
      throw error as APIError;
    }
  }, [clearAuthState, token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isInitializing,
      isAuthLoading,
      login,
      register,
      logout,
      refreshUser,
    }),
    [
      isAuthLoading,
      isInitializing,
      login,
      logout,
      register,
      refreshUser,
      token,
      user,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
