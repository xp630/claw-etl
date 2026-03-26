import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

// Mock localStorage for jsdom
const localStorageMock = {
  getItem: vi.fn().mockReturnValue(null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// 测试组件用于访问 AuthContext
function TestComponent() {
  const { isAuthenticated, user, permissions, hasPermission, login, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="isAuthenticated">{isAuthenticated.toString()}</div>
      <div data-testid="user">{user ? JSON.stringify(user) : 'null'}</div>
      <div data-testid="permissions">{JSON.stringify(permissions)}</div>
      <div data-testid="hasPermission-admin">{hasPermission('admin').toString()}</div>
      <button onClick={() => login({ name: 'test' }, [{ code: 'admin', name: '管理员' }])}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should provide initial unauthenticated state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('permissions').textContent).toBe('[]');
  });

  it('should login and set user and permissions', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    act(() => {
      screen.getByText('Login').click();
    });
    
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
    expect(screen.getByTestId('user').textContent).toContain('test');
    expect(screen.getByTestId('permissions').textContent).toContain('admin');
  });

  it('should logout and clear state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    act(() => {
      screen.getByText('Login').click();
    });
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('true');
    
    act(() => {
      screen.getByText('Logout').click();
    });
    expect(screen.getByTestId('isAuthenticated').textContent).toBe('false');
  });

  it('should check permission correctly', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(screen.getByTestId('hasPermission-admin').textContent).toBe('false');
    
    act(() => {
      screen.getByText('Login').click();
    });
    
    expect(screen.getByTestId('hasPermission-admin').textContent).toBe('true');
  });

  it('should persist state to localStorage', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    act(() => {
      screen.getByText('Login').click();
    });
    
    expect(localStorage.setItem).toHaveBeenCalledWith('isLoggedIn', 'true');
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'permissions',
      expect.stringContaining('admin')
    );
  });
});
