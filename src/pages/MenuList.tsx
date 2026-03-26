import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Trash2, Menu as MenuIcon, ChevronRight, ChevronDown, X,
  Database, ListTodo, Globe, Key, Layout as LayoutIcon, Users as UsersIcon,
  Settings, Home, FileText, Folder, Bell, Calendar, Clock, User, Lock,
  BarChart, Activity, Anchor, Award, Bookmark, Box, Briefcase, Brush, Bug,
  Code, Command, Compass, Copy, Cpu, Crosshair,
  Delete, Disc, DollarSign, Download, Edit,
  Eye, EyeOff, FastForward, Feather, Filter, Flag,
  Grid, HardDrive, Hash, Headphones, Heart, HelpCircle,
  Image, Inbox, Info, Layers, Library, LifeBuoy, Link, List,
  Loader, Loader2, LogIn, LogOut, Mail, Map, MapPin,
  Maximize, MessageCircle, MessageSquare, Mic, Minimize, Minus,
  Monitor, Moon, MoreHorizontal, MoreVertical, Move, Music, Navigation, Network,
  Octagon, Package, Paperclip, Pause, PauseCircle, Percent, Phone,
  Play, PlayCircle, Power, Printer, Radio, RefreshCw, Repeat,
  RotateCcw, RotateCw, Save, Scissors, Send, Server,
  Share, Share2, Shield, ShieldCheck, ShieldClose, ShoppingBag, ShoppingCart, Shuffle,
  Sidebar, SkipBack, SkipForward, Slash, Sliders, Smile, SortAsc, SortDesc,
  Square, Star, Store, Sun, Table, Tablet, Tag, Target, Terminal,
  Trash, TrendingUp, Truck, Type, Umbrella,
  Underline, Unlock, Upload, UploadCloud, UserCheck, UserMinus,
  UserPlus, UserX, Video, Volume, Volume2,
  VolumeX, Watch, Wifi, WifiOff, Wind, Zap, ZoomIn, ZoomOut
} from 'lucide-react';
import { deleteMenu, getMenuTree, getMenuDetail, saveMenu, getMenuFeatures } from '../lib/api';
import type { SysMenu, Feature } from '../types';
// 图标列表（用于下拉选择）
const iconList = [
  { name: 'database', label: '数据库', Icon: Database },
  { name: 'listtodo', label: '任务列表', Icon: ListTodo },
  { name: 'globe', label: '地球', Icon: Globe },
  { name: 'key', label: '钥匙', Icon: Key },
  { name: 'layout', label: '布局', Icon: LayoutIcon },
  { name: 'users', label: '用户组', Icon: UsersIcon },
  { name: 'menu', label: '菜单', Icon: MenuIcon },
  { name: 'settings', label: '设置', Icon: Settings },
  { name: 'home', label: '首页', Icon: Home },
  { name: 'file-text', label: '文件', Icon: FileText },
  { name: 'folder', label: '文件夹', Icon: Folder },
  { name: 'bell', label: '铃铛', Icon: Bell },
  { name: 'calendar', label: '日历', Icon: Calendar },
  { name: 'clock', label: '时钟', Icon: Clock },
  { name: 'user', label: '用户', Icon: User },
  { name: 'lock', label: '锁', Icon: Lock },
  { name: 'bar-chart', label: '柱状图', Icon: BarChart },
  { name: 'activity', label: '活动', Icon: Activity },
  { name: 'anchor', label: '锚点', Icon: Anchor },
  { name: 'award', label: '奖励', Icon: Award },
  { name: 'bookmark', label: '书签', Icon: Bookmark },
  { name: 'box', label: '盒子', Icon: Box },
  { name: 'briefcase', label: '公文包', Icon: Briefcase },
  { name: 'brush', label: '画笔', Icon: Brush },
  { name: 'bug', label: 'bug', Icon: Bug },
  { name: 'code', label: '代码', Icon: Code },
  { name: 'command', label: '命令', Icon: Command },
  { name: 'compass', label: '指南针', Icon: Compass },
  { name: 'copy', label: '复制', Icon: Copy },
  { name: 'cpu', label: '处理器', Icon: Cpu },
  { name: 'crosshair', label: '十字', Icon: Crosshair },
  { name: 'delete', label: '删除', Icon: Delete },
  { name: 'disc', label: '光盘', Icon: Disc },
  { name: 'dollar-sign', label: '美元', Icon: DollarSign },
  { name: 'download', label: '下载', Icon: Download },
  { name: 'edit', label: '编辑', Icon: Edit },
  { name: 'eye', label: '眼睛', Icon: Eye },
  { name: 'eye-off', label: '眼睛关闭', Icon: EyeOff },
  { name: 'fast-forward', label: '快进', Icon: FastForward },
  { name: 'feather', label: '羽毛', Icon: Feather },
  { name: 'filter', label: '筛选', Icon: Filter },
  { name: 'flag', label: '旗帜', Icon: Flag },
  { name: 'grid', label: '网格', Icon: Grid },
  { name: 'hard-drive', label: '硬盘', Icon: HardDrive },
  { name: 'hash', label: '井号', Icon: Hash },
  { name: 'headphones', label: '耳机', Icon: Headphones },
  { name: 'heart', label: '心形', Icon: Heart },
  { name: 'help-circle', label: '帮助', Icon: HelpCircle },
  { name: 'image', label: '图片', Icon: Image },
  { name: 'inbox', label: '收件箱', Icon: Inbox },
  { name: 'info', label: '信息', Icon: Info },
  { name: 'layers', label: '图层', Icon: Layers },
  { name: 'library', label: '图书馆', Icon: Library },
  { name: 'life-buoy', label: '救生圈', Icon: LifeBuoy },
  { name: 'link', label: '链接', Icon: Link },
  { name: 'list', label: '列表', Icon: List },
  { name: 'loader', label: '加载', Icon: Loader },
  { name: 'loader-2', label: '加载2', Icon: Loader2 },
  { name: 'log-in', label: '登录', Icon: LogIn },
  { name: 'log-out', label: '登出', Icon: LogOut },
  { name: 'mail', label: '邮件', Icon: Mail },
  { name: 'map', label: '地图', Icon: Map },
  { name: 'map-pin', label: '位置', Icon: MapPin },
  { name: 'maximize', label: '最大化', Icon: Maximize },
  { name: 'message-circle', label: '消息', Icon: MessageCircle },
  { name: 'message-square', label: '评论', Icon: MessageSquare },
  { name: 'mic', label: '麦克风', Icon: Mic },
  { name: 'minimize', label: '最小化', Icon: Minimize },
  { name: 'minus', label: '减号', Icon: Minus },
  { name: 'monitor', label: '显示器', Icon: Monitor },
  { name: 'moon', label: '月亮', Icon: Moon },
  { name: 'more-horizontal', label: '更多', Icon: MoreHorizontal },
  { name: 'more-vertical', label: '更多', Icon: MoreVertical },
  { name: 'move', label: '移动', Icon: Move },
  { name: 'music', label: '音乐', Icon: Music },
  { name: 'navigation', label: '导航', Icon: Navigation },
  { name: 'network', label: '网络', Icon: Network },
  { name: 'octagon', label: '八边形', Icon: Octagon },
  { name: 'package', label: '包裹', Icon: Package },
  { name: 'paperclip', label: '附件', Icon: Paperclip },
  { name: 'pause', label: '暂停', Icon: Pause },
  { name: 'pause-circle', label: '暂停圆', Icon: PauseCircle },
  { name: 'percent', label: '百分比', Icon: Percent },
  { name: 'phone', label: '电话', Icon: Phone },
  { name: 'play', label: '播放', Icon: Play },
  { name: 'play-circle', label: '播放圆', Icon: PlayCircle },
  { name: 'power', label: '电源', Icon: Power },
  { name: 'printer', label: '打印机', Icon: Printer },
  { name: 'radio', label: '广播', Icon: Radio },
  { name: 'refresh-cw', label: '刷新', Icon: RefreshCw },
  { name: 'repeat', label: '重复', Icon: Repeat },
  { name: 'rotate-ccw', label: '左旋转', Icon: RotateCcw },
  { name: 'rotate-cw', label: '右旋转', Icon: RotateCw },
  { name: 'save', label: '保存', Icon: Save },
  { name: 'scissors', label: '剪刀', Icon: Scissors },
  { name: 'send', label: '发送', Icon: Send },
  { name: 'server', label: '服务器', Icon: Server },
  { name: 'share', label: '分享', Icon: Share },
  { name: 'share-2', label: '分享2', Icon: Share2 },
  { name: 'shield', label: '盾牌', Icon: Shield },
  { name: 'shield-check', label: '安全', Icon: ShieldCheck },
  { name: 'shield-close', label: '危险', Icon: ShieldClose },
  { name: 'shopping-bag', label: '购物袋', Icon: ShoppingBag },
  { name: 'shopping-cart', label: '购物车', Icon: ShoppingCart },
  { name: 'shuffle', label: '随机', Icon: Shuffle },
  { name: 'sidebar', label: '侧边栏', Icon: Sidebar },
  { name: 'skip-back', label: '后退', Icon: SkipBack },
  { name: 'skip-forward', label: '前进', Icon: SkipForward },
  { name: 'slash', label: '斜线', Icon: Slash },
  { name: 'sliders', label: '调节器', Icon: Sliders },
  { name: 'smile', label: '笑脸', Icon: Smile },
  { name: 'sort-asc', label: '升序', Icon: SortAsc },
  { name: 'sort-desc', label: '降序', Icon: SortDesc },
  { name: 'square', label: '方块', Icon: Square },
  { name: 'star', label: '星星', Icon: Star },
  { name: 'store', label: '商店', Icon: Store },
  { name: 'sun', label: '太阳', Icon: Sun },
  { name: 'table', label: '表格', Icon: Table },
  { name: 'tablet', label: '平板', Icon: Tablet },
  { name: 'tag', label: '标签', Icon: Tag },
  { name: 'target', label: '目标', Icon: Target },
  { name: 'terminal', label: '终端', Icon: Terminal },
  { name: 'trash', label: '垃圾桶', Icon: Trash },
  { name: 'trending-up', label: '上升', Icon: TrendingUp },
  { name: 'truck', label: '卡车', Icon: Truck },
  { name: 'type', label: '文字', Icon: Type },
  { name: 'umbrella', label: '雨伞', Icon: Umbrella },
  { name: 'underline', label: '下划线', Icon: Underline },
  { name: 'unlock', label: '解锁', Icon: Unlock },
  { name: 'upload', label: '上传', Icon: Upload },
  { name: 'upload-cloud', label: '云上传', Icon: UploadCloud },
  { name: 'user-check', label: '已验证', Icon: UserCheck },
  { name: 'user-minus', label: '删除用户', Icon: UserMinus },
  { name: 'user-plus', label: '添加用户', Icon: UserPlus },
  { name: 'user-x', label: '删除用户', Icon: UserX },
  { name: 'video', label: '视频', Icon: Video },
  { name: 'volume', label: '音量', Icon: Volume },
  { name: 'volume-2', label: '音量2', Icon: Volume2 },
  { name: 'volume-x', label: '静音', Icon: VolumeX },
  { name: 'watch', label: '手表', Icon: Watch },
  { name: 'wifi', label: '无线', Icon: Wifi },
  { name: 'wifi-off', label: '断开', Icon: WifiOff },
  { name: 'wind', label: '风', Icon: Wind },
  { name: 'zap', label: '闪电', Icon: Zap },
  { name: 'zoom-in', label: '放大', Icon: ZoomIn },
  { name: 'zoom-out', label: '缩小', Icon: ZoomOut },
];

export default function MenuList() {
  const [menuTree, setMenuTree] = useState<SysMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<number>>(new Set([0]));
  const [selectedKey, setSelectedKey] = useState<number | null>(null);

  // 右侧表单状态
  const [isEditing, setIsEditing] = useState(false);
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<SysMenu>({
    name: '',
    icon: '',
    path: '',
    parentId: 0,
    orderNum: 0,
    type: 'menu',
    menuFrom: 'static',
    status: 1,
  });
  const [parentMenusTree, setParentMenusTree] = useState<SysMenu[]>([]);
  const [featureList, setFeatureList] = useState<Feature[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMenuTree();
  }, [searchKeyword]);

  useEffect(() => {
    if (isEditing) {
      loadParentMenus();
    }
  }, [isEditing]);

  const loadMenuTree = async () => {
    setLoading(true);
    try {
      const tree = await getMenuTree();
      setMenuTree(tree);
    } catch (error) {
      console.error('Failed to load menu tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadParentMenus = async () => {
    try {
      const tree = await getMenuTree();
      setParentMenusTree(tree);
    } catch (error) {
      console.error('Failed to load parent menus:', error);
    }
  };

  const loadMenuFeatures = async () => {
    try {
      const features = await getMenuFeatures();
      setFeatureList(features);
    } catch (error) {
      console.error('Failed to load menu features:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMenu(id);
      setShowDeleteConfirm(false);
      setDeleteId(null);
      if (selectedKey === id) {
        setSelectedKey(null);
        setIsEditing(false);
      }
      loadMenuTree();
    } catch (error) {
      console.error('Failed to delete menu:', error);
    }
  };

  const toggleExpand = (id: number) => {
    const newKeys = new Set(expandedKeys);
    if (newKeys.has(id)) {
      newKeys.delete(id);
    } else {
      newKeys.add(id);
    }
    setExpandedKeys(newKeys);
  };

  // 选择菜单
  const selectMenu = (menu: SysMenu) => {
    setSelectedKey(menu.id!);
    setEditMode('edit');
    setIsEditing(true);
    loadFormData(menu.id!);
    loadMenuFeatures();
  };

  // 加载表单数据
  const loadFormData = async (menuId: number) => {
    setFormLoading(true);
    try {
      const data = await getMenuDetail(menuId);
      if (data) {
        setFormData(data);
      }
    } catch (error) {
      console.error('Failed to load menu:', error);
    } finally {
      setFormLoading(false);
    }
  };

  // 新增菜单
  const handleCreate = (parentId: number | null = null) => {
    setEditMode('create');
    setFormData({
      name: '',
      icon: '',
      path: '',
      parentId: parentId ?? selectedKey ?? 0,
      orderNum: 0,
      type: 'menu',
      menuFrom: 'static',
      status: 1,
    });
    setIsEditing(true);
    loadMenuFeatures();
  };

  // 保存表单
  const handleSave = async () => {
    setSaving(true);
    try {
      await saveMenu(formData);
      loadMenuTree();
      if (editMode === 'create') {
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save menu:', error);
    } finally {
      setSaving(false);
    }
  };

  // 关闭表单
  const closeForm = () => {
    setIsEditing(false);
    setSelectedKey(null);
  };

  // 渲染父菜单选项
  const renderParentOptions = (menus: SysMenu[], level = 0): React.JSX.Element[] => {
    const options: React.JSX.Element[] = [];
    menus.forEach(m => {
      if (editMode === 'edit' && formData.id && (m.id === formData.id || (m.children && m.children.some(c => c.id === formData.id)))) {
        return;
      }
      options.push(
        <option key={m.id} value={m.id} style={{ paddingLeft: `${level * 20}px` }}>
          {'─'.repeat(level)} {m.name}
        </option>
      );
      if (m.children && m.children.length > 0) {
        options.push(...renderParentOptions(m.children, level + 1));
      }
    });
    return options;
  };

  // 渲染菜单树
  const renderMenuTree = (menuList: SysMenu[], level = 0) => {
    return menuList.map(menu => (
      <div key={menu.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 hover:bg-[var(--bg-table-header)] rounded cursor-pointer group transition-colors ${selectedKey === menu.id ? 'bg-[var(--accent)]/20 border border-[var(--accent-light)]' : ''}`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => selectMenu(menu)}
        >
          {menu.children && menu.children.length > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(menu.id!);
              }}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {expandedKeys.has(menu.id!) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <span className="text-[var(--text-primary)] font-medium">{menu.name}</span>
          <span className={`px-2 py-0.5 rounded text-xs ${
            menu.type === 'menu' ? 'bg-[var(--info)]/20 text-[var(--info)]' : 'bg-[var(--warning)]/20 text-[var(--warning)]'
          }`}>
            {menu.type === 'menu' ? '菜单' : '按钮'}
          </span>
          <div className="flex-1" />
          <div className="hidden group-hover:flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCreate(menu.id!);
              }}
              className="p-1.5 hover:bg-[var(--bg-hover)] rounded text-[var(--text-muted)] hover:text-[var(--success)] transition-colors"
              title="添加子节点"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setDeleteId(menu.id!);
                setShowDeleteConfirm(true);
              }}
              className="p-1.5 hover:bg-[var(--bg-hover)] rounded text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        {menu.children && menu.children.length > 0 && expandedKeys.has(menu.id!) && (
          <div>{renderMenuTree(menu.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MenuIcon className="w-6 h-6 text-[var(--accent)]" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">菜单管理</h1>
        </div>
        <button
          onClick={() => handleCreate(null)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增
        </button>
      </div>

      {/* 主体区域：左右分栏 */}
      <div className="flex-1 flex gap-6 min-h-0">
        {/* 左侧：菜单树 */}
        <div className="w-96 flex flex-col bg-[var(--bg-table-header)] rounded-xl border border-[var(--border-light)] overflow-hidden">
          {/* 搜索栏 */}
          <div className="p-3 border-b border-[var(--border-light)]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="搜索菜单..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-light)]"
              />
            </div>
          </div>

          {/* 树形列表 */}
          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="px-4 py-8 text-center text-[var(--text-muted)]">加载中...</div>
            ) : menuTree.length === 0 ? (
              <div className="px-4 py-8 text-center text-[var(--text-muted)]">暂无数据</div>
            ) : (
              renderMenuTree(menuTree)
            )}
          </div>
        </div>

        {/* 右侧：编辑区域 */}
        <div className="flex-1 bg-[var(--bg-table-header)] rounded-xl border border-[var(--border-light)] overflow-hidden">
          {isEditing ? (
            <div className="h-full flex flex-col">
              {/* 表单头部 */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-light)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  {editMode === 'edit' ? '编辑菜单' : '新增菜单'}
                </h2>
                <button
                  onClick={closeForm}
                  className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>

              {/* 表单内容 */}
              <div className="flex-1 overflow-y-auto p-6">
                {formLoading ? (
                  <div className="text-center py-8 text-[var(--text-muted)]">加载中...</div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                          菜单名称 <span className="text-[var(--danger)]">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-light)]"
                          placeholder="请输入菜单名称"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">图标</label>
                        <div className="grid grid-cols-8 gap-1 p-3 bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-lg max-h-48 overflow-y-auto">
                          {iconList.map(icon => {
                            const IconComp = icon.Icon;
                            const isSelected = formData.icon === icon.name;
                            return (
                              <button
                                key={icon.name}
                                type="button"
                                onClick={() => setFormData({ ...formData, icon: icon.name })}
                                className={`p-2 rounded-lg flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? 'bg-[var(--accent)] text-white'
                                    : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                                }`}
                                title={icon.label}
                              >
                                <IconComp className="w-5 h-5" />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">路由路径</label>
                        {formData.menuFrom === 'dynamic' ? (
                          <select
                            value={formData.path || ''}
                            onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                            className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-light)]"
                          >
                            <option value="">请选择功能</option>
                            {featureList.map(f => (
                              <option key={f.id} value={`/dynamic/${f.code}`}>
                                {f.name} (/dynamic/{f.code})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={formData.path || ''}
                            onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                            className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-light)]"
                            placeholder="请输入路由路径"
                          />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">父菜单</label>
                        <select
                          value={formData.parentId || 0}
                          onChange={(e) => setFormData({ ...formData, parentId: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-light)]"
                        >
                          <option value={0}>顶级菜单</option>
                          {renderParentOptions(parentMenusTree)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">排序号</label>
                        <input
                          type="number"
                          value={formData.orderNum || 0}
                          onChange={(e) => setFormData({ ...formData, orderNum: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-light)]"
                          placeholder="数字越小越靠前"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">类型</label>
                        <select
                          value={formData.type || 'menu'}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as 'menu' | 'button' })}
                          className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-light)]"
                        >
                          <option value="menu">菜单</option>
                          <option value="button">按钮</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">菜单来源</label>
                        <select
                          value={formData.menuFrom || 'static'}
                          onChange={(e) => {
                            const val = e.target.value as 'static' | 'dynamic';
                            setFormData({ ...formData, menuFrom: val, path: '' });
                            if (val === 'dynamic' && featureList.length === 0) {
                              loadMenuFeatures();
                            }
                          }}
                          className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-light)]"
                        >
                          <option value="static">静态菜单</option>
                          <option value="dynamic">动态菜单</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">状态</label>
                        <select
                          value={formData.status || 1}
                          onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                          className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-light)]"
                        >
                          <option value={1}>启用</option>
                          <option value={0}>禁用</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 底部按钮 */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--border-light)] bg-[var(--bg-hover-light)]">
                <button
                  onClick={closeForm}
                  className="px-6 py-2.5 bg-[var(--bg-tertiary)]700 hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
              <div className="text-center">
                <MenuIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>选择左侧菜单或点击新增按钮</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">确认删除</h3>
            <p className="text-[var(--text-muted)] mb-6">确定要删除该菜单吗？子菜单也会被删除。此操作不可撤销。</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-[var(--bg-tertiary)]700 hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => deleteId && handleDelete(deleteId)}
                className="px-4 py-2 bg-[var(--danger)] hover:opacity-90 text-white rounded-lg transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
