'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/services/api/client';
import { tokenStorage } from '@/lib/token';

export interface AuthUser {
  id: string;
  username: string;
  name?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'teacher' | 'student';
  teacherId?: string;
  studentId?: string;
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
        const { data } = await apiClient.get('/users/me');
        setUser(data);
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
    const { data } = await apiClient.post('/auth/login', { username, password });
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data.user as AuthUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
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
