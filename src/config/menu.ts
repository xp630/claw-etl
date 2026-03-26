export interface MenuItem {
  path: string;
  title: string;
  icon: string;
  permissionCode: string;
  children?: MenuItem[];
}

export const menus: MenuItem[] = [
  {
    path: '/datasources',
    title: '数据源管理',
    icon: 'Database',
    permissionCode: 'datasource:read',
  },
  {
    path: '/tasks',
    title: '任务管理',
    icon: 'ListTodo',
    permissionCode: 'task:read',
  },
  {
    path: '/apis',
    title: 'API管理',
    icon: 'Globe',
    permissionCode: 'api:read',
  },
  {
    path: '/users',
    title: '用户管理',
    icon: 'Users',
    permissionCode: 'user:read',
  },
  {
    path: '/roles',
    title: '角色管理',
    icon: 'Shield',
    permissionCode: 'role:read',
  },
  {
    path: '/menus',
    title: '菜单管理',
    icon: 'Menu',
    permissionCode: 'menu:read',
  },
  {
    path: '/dicts',
    title: '字典管理',
    icon: 'BookOpen',
    permissionCode: 'dict:read',
  },
  {
    path: '/config',
    title: '系统配置',
    icon: 'Settings',
    permissionCode: 'system:read',
  },
  {
    path: '/api-access-log',
    title: '访问日志',
    icon: 'FileText',
    permissionCode: 'api:read',
  },
  {
    path: '/apps',
    title: '应用管理',
    icon: 'Grid',
    permissionCode: 'app:read',
  },
  {
    path: '/report/datasets',
    title: '数据集管理',
    icon: 'Database',
    permissionCode: 'report:dataset:read',
  },
  {
    path: '/report/dashboards',
    title: '仪表盘',
    icon: 'BarChart',
    permissionCode: 'report:dashboard:read',
  },
];
