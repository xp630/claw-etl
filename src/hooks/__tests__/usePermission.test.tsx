import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

// Mock localStorage
const mockPermissions = ['datasource:read', 'datasource:write', 'task:read'];
const localStorageMock = {
  getItem: vi.fn((key) => {
    if (key === 'permissions') return JSON.stringify(mockPermissions);
    if (key === 'user') return JSON.stringify({ id: 1, name: 'Test User' });
    return null;
  }),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock useAuth hook
vi.mock('../useAuth', () => ({
  useAuth: () => ({
    permissions: mockPermissions,
  }),
}));

// Import after setting up mocks
import { usePermission } from '../usePermission';

describe('usePermission Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('usePermission()', () => {
    it('should return permissions from useAuth', () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.permissions).toEqual(mockPermissions);
    });

    it('hasPermission should check single permission correctly', () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.hasPermission('datasource:read')).toBe(true);
      expect(result.current.hasPermission('datasource:write')).toBe(true);
      expect(result.current.hasPermission('task:read')).toBe(true);
    });

    it('hasPermission should return false for non-existent permissions', () => {
      const { result } = renderHook(() => usePermission());
      expect(result.current.hasPermission('admin:write')).toBe(false);
      expect(result.current.hasPermission('unknown:permission')).toBe(false);
    });

    it('hasPermission should support array of permissions (any match)', () => {
      const { result } = renderHook(() => usePermission());
      // One match is enough
      expect(result.current.hasPermission(['datasource:read', 'admin:write'])).toBe(true);
      expect(result.current.hasPermission(['admin:write', 'unknown:read'])).toBe(false);
    });
  });
});
