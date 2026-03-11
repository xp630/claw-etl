export interface MenuItem {
  path: string;
  title: string;
  icon: string;
  children?: MenuItem[];
}

export const menus: MenuItem[] = [
  {
    path: '/datasources',
    title: '数据源管理',
    icon: 'Database',
  },
  {
    path: '/tasks',
    title: '任务管理',
    icon: 'ListTodo',
  }
];
