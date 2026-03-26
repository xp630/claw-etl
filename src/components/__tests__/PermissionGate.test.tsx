import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock localStorage
const mockPermissions = ['datasource:read', 'task:read', 'api:write'];
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

// Import after mock setup
import { PermissionGate } from '../PermissionGate';

describe('PermissionGate 组件', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('permission 属性（单个权限码）', () => {
    it('有权限时应该渲染子组件', () => {
      render(
        <PermissionGate permission="datasource:read">
          <span data-testid="content">有权限可见</span>
        </PermissionGate>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('无权限时不应该渲染子组件', () => {
      render(
        <PermissionGate permission="admin:write">
          <span data-testid="content">无权限不可见</span>
        </PermissionGate>
      );
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });
  });

  describe('anyPermissions 属性（任一满足即可）', () => {
    it('任一权限满足时应该渲染子组件', () => {
      render(
        <PermissionGate anyPermissions={['datasource:read', 'admin:write']}>
          <span data-testid="content">任一权限满足</span>
        </PermissionGate>
      );
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });

    it('所有权限都不满足时不应该渲染子组件', () => {
      render(
        <PermissionGate anyPermissions={['admin:read', 'admin:write']}>
          <span data-testid="content">无权限不可见</span>
        </PermissionGate>
      );
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
    });
  });

  describe('fallback 属性', () => {
    it('无权限时可以渲染 fallback', () => {
      render(
        <PermissionGate permission="admin:write" fallback={<span data-testid="fallback">无权限</span>}>
          <span data-testid="content">有权限</span>
        </PermissionGate>
      );
      expect(screen.queryByTestId('content')).not.toBeInTheDocument();
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });
  });
});
