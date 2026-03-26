import { useState, useEffect, useCallback } from 'react';

export interface User {
  id: number;
  name: string;
  employeeNo: string;
  [key: string]: any;
}

export interface AuthContextValue {
  user: User | null;
  permissions: string[];
  loading: boolean;
  setUser: (user: User | null) => void;
  setPermissions: (permissions: string[]) => void;
  logout: () => void;
}

import { createContext, useContext } from 'react';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 从 localStorage 恢复用户信息
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== 'undefined' && userStr !== 'null') {
      try {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
      } catch (e) {
        console.error('Failed to parse user:', e);
      }
    }

    // 从 localStorage 恢复权限
    const permsStr = localStorage.getItem('permissions');
    if (permsStr) {
      try {
        setPermissions(JSON.parse(permsStr));
      } catch (e) {
        console.error('Failed to parse permissions:', e);
      }
    }

    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    setUser(null);
    setPermissions([]);
    window.location.reload();
  }, []);

  return (
    <AuthContext.Provider value={{ user, permissions, loading, setUser, setPermissions, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Fallback for backwards compatibility
    const userStr = localStorage.getItem('user');
    const permsStr = localStorage.getItem('permissions');
    let user: User | null = null;
    let permissions: string[] = [];
    
    if (userStr) {
      try {
        user = JSON.parse(userStr);
      } catch (e) {}
    }
    if (permsStr) {
      try {
        permissions = JSON.parse(permsStr);
      } catch (e) {}
    }
    
    return {
      user,
      permissions,
      loading: false,
      setUser: (u: User | null) => {
        if (u) localStorage.setItem('user', JSON.stringify(u));
        else localStorage.removeItem('user');
      },
      setPermissions: (p: string[]) => {
        localStorage.setItem('permissions', JSON.stringify(p));
      },
      logout: () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('user');
        localStorage.removeItem('permissions');
        window.location.reload();
      },
    };
  }
  return context;
}
