import { useAuth } from './useAuth';

/**
 * 权限 Hook
 * 返回当前用户权限列表和权限检查方法
 */
export function usePermission() {
  const { permissions } = useAuth();

  /**
   * 检查是否有指定权限
   * @param permission 权限码或权限码数组
   * - 字符串：检查单个权限码
   * - 数组：检查是否有任一权限码满足
   */
  const hasPermission = (permission: string | string[]): boolean => {
    if (!permissions || permissions.length === 0) {
      return false;
    }

    if (Array.isArray(permission)) {
      // 任一权限满足即可
      return permission.some(p => permissions.includes(p));
    }

    return permissions.includes(permission);
  };

  return {
    /** 当前用户权限列表 */
    permissions,
    /** 检查是否有指定权限 */
    hasPermission,
  };
}
