import { type ReactNode } from 'react';
import { usePermission } from '../hooks/usePermission';

interface PermissionGateProps {
  /** 子组件 */
  children: ReactNode;
  /** 单个权限码 */
  permission?: string;
  /** 权限码数组（任一满足即可） */
  anyPermissions?: string[];
  /** 无权限时显示的组件 */
  fallback?: ReactNode;
}

/**
 * 权限门控组件
 * 根据用户权限显示/隐藏子组件
 */
export function PermissionGate({ children, permission, anyPermissions, fallback = null }: PermissionGateProps) {
  const { hasPermission } = usePermission();

  // 检查权限
  let allowed = false;
  if (permission) {
    allowed = hasPermission(permission);
  } else if (anyPermissions) {
    allowed = hasPermission(anyPermissions);
  } else {
    // 没有指定权限条件，默认显示
    allowed = true;
  }

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
