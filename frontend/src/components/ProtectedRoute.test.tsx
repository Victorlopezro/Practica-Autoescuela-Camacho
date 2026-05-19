import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ProtectedRoute } from './ProtectedRoute';

const mockPush = vi.fn();

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock useAuth — will be overridden per test
const mockUseAuth = vi.fn();
vi.mock('@/providers/auth-provider', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('ProtectedRoute', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should show loading state when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: true,
      isAuthenticated: false,
    });

    render(<ProtectedRoute><div>content</div></ProtectedRoute>);

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should redirect to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });

    render(<ProtectedRoute><div>content</div></ProtectedRoute>);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should render children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'admin', role: 'admin' },
      isLoading: false,
      isAuthenticated: true,
    });

    render(<ProtectedRoute><div>content</div></ProtectedRoute>);

    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('should render children when role matches allowedRoles', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'teacher', role: 'teacher' },
      isLoading: false,
      isAuthenticated: true,
    });

    render(
      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
        <div>content</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('should redirect when role does not match allowedRoles', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '1', username: 'student', role: 'student' },
      isLoading: false,
      isAuthenticated: true,
    });

    render(
      <ProtectedRoute allowedRoles={['admin']}>
        <div>content</div>
      </ProtectedRoute>,
    );

    expect(mockPush).toHaveBeenCalledWith('/student/dashboard');
  });
});
