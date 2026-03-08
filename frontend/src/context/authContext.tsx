// File Manager - authContext.tsx

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "../api/auth";
import type { LoginPayload, RegisterPayload } from "../api/auth";

interface AuthState {
  token: string | null;
  email: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: localStorage.getItem("token"),
    email: localStorage.getItem("userEmail"),
    isAuthenticated: !!localStorage.getItem("token"),
    isLoading: false,
  });

  const login = useCallback(async (payload: LoginPayload) => {
    const { access_token } = await authApi.login(payload);
    localStorage.setItem("token", access_token);
    localStorage.setItem("userEmail", payload.email);
    setState({
      token: access_token,
      email: payload.email,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await authApi.register(payload);
    // Auto-login after registration
    const { access_token } = await authApi.login(payload);
    localStorage.setItem("token", access_token);
    localStorage.setItem("userEmail", payload.email);
    setState({
      token: access_token,
      email: payload.email,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    setState({ token: null, email: null, isAuthenticated: false, isLoading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  
  return ctx;
}