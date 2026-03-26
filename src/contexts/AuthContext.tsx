import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface Permission {
  code: string;
  name: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  permissions: Permission[];
  hasPermission: (code: string) => boolean;
  login: (user: any, permissions?: Permission[]) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PERMISSIONS_KEY = 'permissions';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [permissions, setPermissions] = useState<Permission[]>(() => {
    const saved = localStorage.getItem(PERMISSIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const hasPermission = (code: string): boolean => {
    return permissions.some(p => p.code === code);
  };

  const login = (userData: any, perms?: Permission[]) => {
    setIsAuthenticated(true);
    setUser(userData);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('user', JSON.stringify(userData));
    
    if (perms) {
      setPermissions(perms);
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(perms));
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setPermissions([]);
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    localStorage.removeItem(PERMISSIONS_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, permissions, hasPermission, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
