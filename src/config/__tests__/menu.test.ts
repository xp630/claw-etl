import { menus, type MenuItem } from '../menu';

describe('菜单配置', () => {
  // 验证所有菜单项都有 permissionCode 字段
  const expectedMenus: Array<{ path: string; title: string; permissionCode: string }> = [
    { path: '/datasources', title: '数据源管理', permissionCode: 'datasource:read' },
    { path: '/tasks', title: '任务管理', permissionCode: 'task:read' },
    { path: '/apis', title: 'API管理', permissionCode: 'api:read' },
    { path: '/users', title: '用户管理', permissionCode: 'user:read' },
    { path: '/roles', title: '角色管理', permissionCode: 'role:read' },
    { path: '/menus', title: '菜单管理', permissionCode: 'menu:read' },
    { path: '/dicts', title: '字典管理', permissionCode: 'dict:read' },
    { path: '/config', title: '系统配置', permissionCode: 'system:read' },
    { path: '/api-access-log', title: '访问日志', permissionCode: 'api:read' },
    { path: '/apps', title: '应用管理', permissionCode: 'app:read' },
  ];

  it('菜单项数量应该为12个', () => {
    expect(menus.length).toBe(12);
  });

  it('所有菜单项都应该有 permissionCode 字段', () => {
    menus.forEach((menu) => {
      expect(menu.permissionCode).toBeDefined();
      expect(typeof menu.permissionCode).toBe('string');
    });
  });

  expectedMenus.forEach((expected) => {
    it(`应该有菜单项: ${expected.title} (${expected.path})，权限码: ${expected.permissionCode}`, () => {
      const menu = menus.find((m) => m.path === expected.path);
      expect(menu).toBeDefined();
      expect(menu?.title).toBe(expected.title);
      expect(menu?.permissionCode).toBe(expected.permissionCode);
    });
  });
});
