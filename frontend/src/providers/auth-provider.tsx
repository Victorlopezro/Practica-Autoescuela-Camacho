'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { services } from '@/services';
import { tokenStorage } from '@/lib/token';

export interface AuthUser {
  id: string;
  username: string;
  name: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  role: 'admin' | 'teacher' | 'student';
  teacherId: string | null;
  studentId: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // On mount, try to restore session from stored tokens
  useEffect(() => {
    const restoreSession = async () => {
      if (!tokenStorage.hasTokens()) {
        setIsLoading(false);
        return;
      }

      try {
        // Try to get the current user profile
        const userData = await services.auth.getMe();
        setUser(userData);
      } catch {
        // Token invalid/expired, clear
        tokenStorage.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await services.auth.login({ username, password });
    tokenStorage.setTokens(response.accessToken, response.refreshToken);
    setUser(response.user);
    return response.user as AuthUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        await services.auth.logout(refreshToken);
      }
    } catch {
      // Ignore errors during logout
    } finally {
      tokenStorage.clearTokens();
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
