import { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import {
  Database, ListTodo, LogOut, Globe, Key, ChevronRight, PanelLeftClose, PanelLeft,
  Layout as LayoutIcon, X, Users, Menu as MenuIcon, Settings, Home, FileText, Folder, Bell,
  Calendar, Clock, User, Lock, BarChart, Activity, Anchor, Award, Bookmark, Box, Briefcase,
  Brush, Bug, Circle, Code, Coffee, Command, Compass, Copy, CreditCard, Cpu, Crosshair,
  Delete, Disc, DollarSign, Download, Edit, Eye, EyeOff, FastForward, Feather, Filter, Flag,
  Grid, HardDrive, Hash, Headphones, Heart, HelpCircle, Image, Inbox, Info, Layers, Library,
  LifeBuoy, Link, List, Loader, Loader2, LogIn, Mail, Map, MapPin,
  Maximize, MessageCircle, MessageSquare, Mic, Minimize, Minus, Monitor, Moon, MoreHorizontal,
  MoreVertical, Move, Music, Navigation, Network, Octagon, Package, Paperclip, Pause, PauseCircle,
  Percent, Phone, Play, PlayCircle, Power, Printer, Radio, RefreshCw, Repeat, RotateCcw, RotateCw,
  Save, Scissors, Send, Server, Share, Share2, Shield, ShieldCheck, ShieldClose, ShoppingBag,
  ShoppingCart, Shuffle, Sidebar, SkipBack, SkipForward, Slash, Sliders, Smile, SortAsc, SortDesc,
  Square, Star, Store, Sun, Table, Tablet, Tag, Target, Terminal, Trash, TrendingUp, Truck,
  Type, Umbrella, Underline, Unlock, Upload, UploadCloud, UserCheck, UserMinus, UserPlus, UserX,
  Video, Volume, Volume2, VolumeX, Watch, Wifi, WifiOff, Wind, Zap, ZoomIn, ZoomOut
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { getMenuTree, getSystemConfigByCode } from '../lib/api';
import type { SysMenu } from '../types';
import ChangePasswordModal from './ChangePasswordModal';
import DataSourceList from '../pages/DataSourceList';
import DataSourceForm from '../pages/DataSourceForm';
import TaskList from '../pages/TaskList';
import TaskForm from '../pages/TaskForm';
import ApiList from '../pages/ApiList';
import ApiForm from '../pages/ApiForm';
import AppList from '../pages/AppList';
import AppForm from '../pages/AppForm';
import FeatureList from '../pages/FeatureList';
import FeatureForm from '../pages/FeatureForm';
import DictList from '../pages/DictList';
import DictForm from '../pages/DictForm';
import SystemConfigList from '../pages/SystemConfigList';
import SystemConfigForm from '../pages/SystemConfigForm';
import DynamicDataGrid from '../pages/DynamicDataGrid';
import RoleList from '../pages/RoleList';
import RoleForm from '../pages/RoleForm';
import MenuList from '../pages/MenuList';
import MenuForm from '../pages/MenuForm';
import PageList from '../pages/PageList';
import PageEditor from '../pages/PageEditor';
import PagePreview from '../pages/PagePreview';
import PageViewer from '../pages/PageViewer';
import HomePage from '../pages/HomePage';
import UserList from '../pages/UserList';
import UserForm from '../pages/UserForm';
import DatasetList from '../pages/report/DatasetList';
import DatasetForm from '../pages/report/DatasetForm';
import DashboardList from '../pages/report/DashboardList';
import Dashboard from '../pages/report/Dashboard';

// 图标映射
const iconMap: Record<string, LucideIcon> = {
  database: Database,
  listtodo: ListTodo,
  globe: Globe,
  key: Key,
  layout: LayoutIcon,
  users: Users,
  menu: MenuIcon,
  settings: Settings,
  home: Home,
  'file-text': FileText,
  folder: Folder,
  bell: Bell,
  calendar: Calendar,
  clock: Clock,
  user: User,
  lock: Lock,
  'bar-chart': BarChart,
  activity: Activity,
  anchor: Anchor,
  award: Award,
  bookmark: Bookmark,
  box: Box,
  briefcase: Briefcase,
  brush: Brush,
  bug: Bug,
  circle: Circle,
  code: Code,
  coffee: Coffee,
  command: Command,
  compass: Compass,
  copy: Copy,
  'credit-card': CreditCard,
  cpu: Cpu,
  crosshair: Crosshair,
  delete: Delete,
  disc: Disc,
  'dollar-sign': DollarSign,
  download: Download,
  edit: Edit,
  eye: Eye,
  'eye-off': EyeOff,
  'fast-forward': FastForward,
  feather: Feather,
  filter: Filter,
  flag: Flag,
  grid: Grid,
  'hard-drive': HardDrive,
  hash: Hash,
  headphones: Headphones,
  heart: Heart,
  'help-circle': HelpCircle,
  image: Image,
  inbox: Inbox,
  info: Info,
  layers: Layers,
  library: Library,
  'life-buoy': LifeBuoy,
  link: Link,
  list: List,
  loader: Loader,
  'loader-2': Loader2,
  'log-in': LogIn,
  'log-out': LogOut,
  mail: Mail,
  map: Map,
  'map-pin': MapPin,
  maximize: Maximize,
  'message-circle': MessageCircle,
  'message-square': MessageSquare,
  mic: Mic,
  minimize: Minimize,
  minus: Minus,
  monitor: Monitor,
  moon: Moon,
  'more-horizontal': MoreHorizontal,
  'more-vertical': MoreVertical,
  move: Move,
  music: Music,
  navigation: Navigation,
  network: Network,
  octagon: Octagon,
  package: Package,
  paperclip: Paperclip,
  pause: Pause,
  'pause-circle': PauseCircle,
  percent: Percent,
  phone: Phone,
  play: Play,
  'play-circle': PlayCircle,
  power: Power,
  printer: Printer,
  radio: Radio,
  'refresh-cw': RefreshCw,
  repeat: Repeat,
  'rotate-ccw': RotateCcw,
  'rotate-cw': RotateCw,
  save: Save,
  scissors: Scissors,
  send: Send,
  server: Server,
  share: Share,
  'share-2': Share2,
  shield: Shield,
  'shield-check': ShieldCheck,
  'shield-close': ShieldClose,
  'shopping-bag': ShoppingBag,
  'shopping-cart': ShoppingCart,
  shuffle: Shuffle,
  sidebar: Sidebar,
  'skip-back': SkipBack,
  'skip-forward': SkipForward,
  slash: Slash,
  sliders: Sliders,
  smile: Smile,
  'sort-asc': SortAsc,
  'sort-desc': SortDesc,
  square: Square,
  star: Star,
  store: Store,
  sun: Sun,
  table: Table,
  tablet: Tablet,
  tag: Tag,
  target: Target,
  terminal: Terminal,
  trash: Trash,
  'trending-up': TrendingUp,
  truck: Truck,
  type: Type,
  umbrella: Umbrella,
  underline: Underline,
  unlock: Unlock,
  upload: Upload,
  'upload-cloud': UploadCloud,
  'user-check': UserCheck,
  'user-minus': UserMinus,
  'user-plus': UserPlus,
  'user-x': UserX,
  video: Video,
  volume: Volume,
  'volume-2': Volume2,
  'volume-x': VolumeX,
  watch: Watch,
  wifi: Wifi,
  'wifi-off': WifiOff,
  wind: Wind,
  zap: Zap,
  'zoom-in': ZoomIn,
  'zoom-out': ZoomOut,
};

interface MenuItem {
  title: string;
  icon?: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

interface Tab {
  id: string;
  title: string;
  path: string;
  resourceId?: string;
}

// 根据path渲染对应的组件
function renderPage(path: string, resourceId?: string) {
  const content = (() => {
    // 动态路由处理
    if (path.match(/^\/apis\/\d+$/)) {
      const id = resourceId || path.split('/')[2];
      return <ApiForm overrideId={id} />;
    }
    if (path.match(/^\/tasks\/\d+$/)) {
      const id = resourceId || path.split('/')[2];
      return <TaskForm overrideId={id} />;
    }
    if (path.match(/^\/apps\/\d+$/)) {
      const id = resourceId || path.split('/')[2];
      return <AppForm overrideId={id} />;
    }
    if (path.match(/^\/features\/\d+$/)) {
      const id = resourceId || path.split('/')[2];
      return <FeatureForm overrideId={id} />;
    }
    if (path.match(/^\/datasources\/\d+$/)) {
      const id = resourceId || path.split('/')[2];
      return <DataSourceForm overrideId={id} />;
    }
    if (path.match(/^\/dict\/\d+$/)) {
      const id = resourceId || path.split('/')[2];
      return <DictForm overrideId={id} />;
    }
    if (path.match(/^\/config\/\d+$/)) {
      const id = resourceId || path.split('/')[2];
      return <SystemConfigForm overrideId={id} />;
    }
    if (path.match(/^\/roles\/\d+$/)) {
      const id = resourceId || path.split('/')[2];
      return <RoleForm overrideId={id} />;
    }
    if (path.match(/^\/menus\/\d+$/)) {
      const id = resourceId || path.split('/')[2];
      return <MenuForm overrideId={id} />;
    }
    if (path.match(/^\/users\/\d+$/)) {
      const id = resourceId || path.split('/')[2];
      return <UserForm overrideId={id} />;
    }
    if (path.match(/^\/report\/datasets\/[^/]+$/) || path.match(/^report\/datasets\/[^/]+$/)) {
      return <DatasetForm />;
    }
    if (path.match(/^\/report\/dashboards\/[^/]+$/) || path.match(/^report\/dashboards\/[^/]+$/)) {
      return <Dashboard />;
    }
    if (path.match(/^\/render\/.+$/)) {
      const code = path.split('/')[2];
      return <PageViewer code={code} />;
    }
    // 处理 /index 快捷路由
    if (path === '/index') {
      return <HomePage />;
    }

    switch (path) {
    case '/datasources':
      return <DataSourceList />;
    case '/datasources/new':
      return <DataSourceForm />;
    case '/tasks':
      return <TaskList />;
    case '/tasks/new':
      return <TaskForm />;
    case '/apis':
      return <ApiList />;
    case '/apis/new':
      return <ApiForm />;
    case '/apps':
      return <AppList />;
    case '/apps/new':
      return <AppForm />;
    case '/features':
      return <FeatureList />;
    case '/features/new':
      return <FeatureForm />;
    case '/dict':
      return <DictList />;
    case '/dict/new':
      return <DictForm />;
    case '/config':
      return <SystemConfigList />;
    case '/config/new':
      return <SystemConfigForm />;
    case '/roles':
      return <RoleList />;
    case '/roles/new':
      return <RoleForm />;
    case '/menus':
      return <MenuList />;
    case '/menus/new':
      return <MenuForm />;
    case '/pages':
      return <PageList />;
    case '/page-editor':
      return <PageEditor />;
    case '/preview':
      return <PagePreview />;
    case '/users':
      return <UserList />;
    case '/users/new':
      return <UserForm />;
    case '/report/datasets':
      return <DatasetList />;
    case '/report/datasets/new':
      return <DatasetForm />;
    case '/report/dashboards':
      return <DashboardList />;
    default:
      if (path.startsWith('/dynamic/')) {
        const code = path.split('/')[2];
        return <DynamicDataGrid code={code} />;
      }
      return <div>页面不存在</div>;
    }
  })();
  return content;
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['api']));
  const [collapsed, setCollapsed] = useState(false);
  const [serverMenus, setServerMenus] = useState<MenuItem[]>([]);
  const [systemName, setSystemName] = useState<string>('CodeMS');
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<{ name: string; employeeNo: string } | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const prevPathRef = useRef<string>('');

  // 当 URL 显著变化时（不是 tab 切换触发的），同步 tab
  useEffect(() => {
    const path = location.pathname;
    // 只有当 path 真正变化（不是由于 tab 更新导致的）时才处理
    if (path !== prevPathRef.current) {
      prevPathRef.current = path;

      // 编辑器页面默认折叠左侧菜单
      if (path === '/page-editor' || path.startsWith('/page-editor?')) {
        setCollapsed(true);
      }

      if (path === '/') {
        return;
      }

      // 检查是否已有 tab 对应当前路径
      const existingTab = tabs.find(t => t.path === path);
      if (existingTab) {
        // 已有 tab，切换到该 tab
        return;
      }

      // 如果新路径是当前 tab 路径的子路径（如从 /features 到 /features/new）
      // 则认为是同一模块的操作，更新当前 tab 的路径
      const currentTab = tabs.find(t => t.id === activeTabId);
      if (currentTab && (
        path.startsWith(currentTab.path + '/') ||
        currentTab.path + '/new' === path
      )) {
        // 更新当前 tab 的路径和标题
        setTabs(prevTabs =>
          prevTabs.map(t =>
            t.id === activeTabId
              ? { ...t, path, title: getTitleFromPath(path) }
              : t
          )
        );
        return;
      }

      // 新路径没有对应 tab，创建新 tab
      const title = getTitleFromPath(path);
      openTab({ id: `tab-${Date.now()}`, title, path });
    }
  }, [location.pathname, tabs, activeTabId]);

  // 根据路径获取标题
  const getTitleFromPath = (path: string): string => {
    const titles: Record<string, string> = {
      '/datasources': '数据源管理',
      '/tasks': '任务管理',
      '/apis': 'API管理',
      '/apps': '应用管理',
      '/features': '功能管理',
      '/dict': '字典管理',
      '/config': '系统配置',
      '/users': '用户管理',
      '/roles': '角色管理',
      '/menus': '菜单管理',
    };
    if (path.startsWith('/datasources/')) return '编辑数据源';
    if (path.startsWith('/tasks/')) return '编辑任务';
    if (path.startsWith('/apis/')) return '编辑API';
    if (path.startsWith('/apps/')) return '编辑应用';
    if (path.startsWith('/features/')) return '编辑功能';
    if (path.startsWith('/dict/')) return '编辑字典';
    if (path.startsWith('/config/')) return '编辑配置';
    if (path.startsWith('/users/')) return '编辑用户';
    if (path.startsWith('/roles/')) return '编辑角色';
    if (path.startsWith('/menus/')) return '编辑菜单';
    if (path.startsWith('/report/dashboards/')) return '编辑仪表盘';
    if (path.startsWith('/report/datasets/')) return '编辑数据集';
    return titles[path] || '新页面';
  };

  // 使用 ref 存储最新的 openTab 函数
  const openTabRef = useRef<((tab: Tab) => void) | null>(null);

  // 点击菜单时打开或切换到已有tab
  const openTab = useCallback((tab: Tab) => {
    // 从path中提取resourceId (如 /apis/28 -> 28)
    const pathParts = tab.path.split('/');
    if (pathParts.length === 3 && !isNaN(parseInt(pathParts[2]))) {
      tab.resourceId = pathParts[2];
    }
    setTabs(currentTabs => {
      const existingTab = currentTabs.find(t => t.path === tab.path);
      if (existingTab) {
        setActiveTabId(existingTab.id);
        return currentTabs;
      } else {
        setActiveTabId(tab.id);
        return [...currentTabs, tab];
      }
    });
  }, []);

  // 同步更新 ref 和 window
  openTabRef.current = openTab;

  // 初始化 window 上的方法（同步执行，确保立即可用）
  (window as any).layoutOpenTab = (tab: Tab) => {
    openTab(tab);
  };

  
  // 关闭tab
  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    if (activeTabId === tabId && newTabs.length > 0) {
      const newIndex = tabIndex >= newTabs.length ? newTabs.length - 1 : tabIndex;
      setActiveTabId(newTabs[newIndex].id);
    }
  };

  const loadServerMenus = async () => {
    const tree = await getMenuTree();
    const convertMenu = (menu: SysMenu): MenuItem => {
      const IconComponent = iconMap[menu.icon || 'layout'] || LayoutIcon;
      return {
        title: menu.name,
        icon: <IconComponent className="w-5 h-5" />,
        path: menu.path || undefined,
        children: menu.children && menu.children.length > 0
          ? menu.children.map(convertMenu)
          : undefined,
      };
    };
    const menus = tree.map(convertMenu).filter(m => m.path || m.children);
    setServerMenus(menus);
  };

  // 初始化加载
  useEffect(() => {
    loadServerMenus();
    loadSystemName();
    loadUserInfo();
  }, []);

  // 加载用户信息
  const loadUserInfo = () => {
    const userStr = localStorage.getItem('user');
    if (userStr && userStr !== 'undefined' && userStr !== 'null') {
      try {
        const user = JSON.parse(userStr);
        // 尝试多个可能的字段名
        const name = user?.name || user?.userName || user?.username || user?.nickname || user?.employeeNo || '未知用户';
        const empNo = user?.employeeNo || user?.empNo || user?.emp_no || '';
        setCurrentUser({ name, employeeNo: empNo });
      } catch (e) {
        console.error('Failed to parse user info:', e);
      }
    }
  };

  const loadSystemName = async () => {
    const config = await getSystemConfigByCode('systemName');
    if (config?.value) {
      setSystemName(config.value);
    }
  };

  const toggleMenu = (key: string) => {
    setExpandedMenus(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // 获取当前活动tab的内容
  const activeTab = tabs.find(t => t.id === activeTabId);

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* 左侧菜单 */}
      <div className={`flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border)] transition-all duration-200 ${collapsed ? 'w-[72px]' : 'w-64'}`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-[var(--border-light)]">
          {!collapsed && <span className="text-lg font-bold">{systemName}</span>}
        </div>

        {/* 菜单 */}
        <div className="flex-1 overflow-y-auto py-4">
          {serverMenus.map((item) => renderMenuItem(item, 0))}
        </div>

        {/* 折叠按钮 */}
        <div className="p-4 border-t border-[var(--border-light)]">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-150"
          >
            {collapsed ? <PanelLeft className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
            {!collapsed && <span>收起菜单</span>}
          </button>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab栏 */}
        <div className="h-11 flex items-center justify-between bg-[var(--bg-primary)] border-b border-[var(--border-light)]">
          <div className="flex items-center overflow-x-auto flex-1 scrollbar-thin">
          {tabs.length === 0 ? (
            <div className="flex items-center px-4 h-full text-[var(--text-muted)] text-sm">
              点击左侧菜单打开页面
            </div>
          ) : tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-2 px-4 h-full cursor-pointer border-r border-[var(--border-light)] shrink-0 group ${
                activeTabId === tab.id
                  ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border-b-2 border-b-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover-light)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span className="text-sm">{tab.title}</span>
              <button
                onClick={(e) => closeTab(tab.id, e)}
                className="p-1 rounded text-[var(--text-muted)] hover:bg-[var(--danger)]/20 hover:text-[var(--danger)] opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
          </div>

          {/* 右侧：用户信息 + 主题切换 */}
          <div className="flex items-center gap-3 px-4 shrink-0">
            {/* 主题切换 */}
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
              className="px-2 py-1 rounded border text-xs cursor-pointer
                bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border)]
                hover:border-[var(--accent)] transition-colors"
            >
              <option value="dark">🌙</option>
              <option value="light">☀️</option>
            </select>

            {/* 用户信息 + 下拉菜单 */}
            <div className="relative group">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] cursor-pointer text-sm text-[var(--text-secondary)]">
                <User className="w-4 h-4" />
                <span>{currentUser?.name || '未登录'}</span>
              </div>
              {/* 下拉菜单 */}
              <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] rounded-lg"
                >
                  <Lock className="w-4 h-4" />
                  <span>修改密码</span>
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('isLoggedIn');
                    window.location.reload();
                  }}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  <span>退出登录</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 页面内容 - 根据活动tab渲染 */}
        <div className="flex-1 overflow-auto bg-[var(--bg-primary)] p-6">
          {activeTab ? renderPage(location.pathname, activeTab.resourceId) : <Outlet />}
        </div>
      </div>

      {/* 修改密码弹窗 */}
      <ChangePasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        employeeNo={currentUser?.employeeNo || ''}
      />
    </div>
  );

  function renderMenuItem(item: MenuItem, level: number) {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.has(item.title);
    const isActive = item.path ? tabs.some(t => t.path === item.path && t.id === activeTabId) : false;

    const handleClick = () => {
      if (hasChildren) {
        toggleMenu(item.title);
      } else if (item.path) {
        openTab({ id: Date.now().toString(), title: item.title, path: item.path });
        navigate(item.path);
      }
    };

    if (collapsed) {
      if (hasChildren) {
        return (
          <div key={item.title} className="relative group">
            <button
              onClick={() => toggleMenu(item.title)}
              className={`w-full flex items-center justify-center p-3 rounded-lg transition-colors ${
                isActive ? 'bg-[var(--accent-light)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover-light)] hover:text-[var(--text-primary)]'
              }`}
              title={item.title}
            >
              {item.icon}
            </button>
            {isExpanded && item.children && (
              <div className="absolute left-full top-0 ml-1 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-lg shadow-lg p-2 space-y-1 min-w-[160px] z-50">
                {item.children.map(child => renderMenuItem(child, 0))}
              </div>
            )}
          </div>
        );
      }

      return (
        <button
          key={item.path}
          onClick={handleClick}
          className={`w-full flex items-center justify-center p-3 rounded-lg transition-colors ${
            isActive ? 'bg-[var(--accent-light)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover-light)] hover:text-[var(--text-primary)]'
          }`}
          title={item.title}
        >
          {item.icon}
        </button>
      );
    }

    if (hasChildren) {
      return (
        <div key={item.title} className="mb-1">
          <button
            onClick={() => toggleMenu(item.title)}
            className="w-full flex items-center gap-2 px-4 py-2 text-[var(--text-muted)] hover:bg-[var(--bg-hover)] rounded-lg transition-colors"
          >
            {item.icon}
            <span className="flex-1 text-left text-sm">{item.title}</span>
            <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>
          {isExpanded && item.children && (
            <div className="ml-6 mt-1 space-y-1">
              {item.children.map(child => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={item.path}
        onClick={handleClick}
        className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg transition-colors mb-1 ${
          isActive ? 'bg-[var(--accent-light)] text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
        }`}
      >
        {item.icon}
        <span className="text-sm">{item.title}</span>
      </button>
    );
  }
}