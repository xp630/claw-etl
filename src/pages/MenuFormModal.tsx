import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getMenuDetail, saveMenu, getMenuTree } from '../lib/api';
import type { SysMenu } from '../types';

interface MenuFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  menuId?: number | null;
  parentId?: number | null;
  mode: 'create' | 'edit';
}

export default function MenuFormModal({ open, onClose, onSuccess, menuId, parentId, mode }: MenuFormModalProps) {
  const [menu, setMenu] = useState<SysMenu>({
    name: '',
    code: '',
    icon: '',
    path: '',
    parentId: 0,
    orderNum: 0,
    type: 'menu',
    status: 1,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parentMenus, setParentMenus] = useState<SysMenu[]>([]);

  useEffect(() => {
    if (open) {
      loadParentMenus();
      if (mode === 'edit' && menuId) {
        loadMenuDetail(menuId);
      } else {
        // 新增模式
        setMenu({
          name: '',
          code: '',
          icon: '',
          path: '',
          parentId: parentId || 0,
          orderNum: 0,
          type: 'menu',
          status: 1,
        });
      }
    }
  }, [open, menuId, parentId, mode]);

  const loadParentMenus = async () => {
    try {
      const tree = await getMenuTree();
      const flatMenus: SysMenu[] = [];
      const flatten = (menus: SysMenu[], level = 0) => {
        menus.forEach(m => {
          flatMenus.push({ ...m, orderNum: level });
          if (m.children && m.children.length > 0) {
            flatten(m.children, level + 1);
          }
        });
      };
      flatten(tree);
      setParentMenus(flatMenus);
    } catch (error) {
      console.error('Failed to load parent menus:', error);
    }
  };

  const loadMenuDetail = async (id: number) => {
    setLoading(true);
    try {
      const data = await getMenuDetail(id);
      if (data) {
        setMenu(data);
      }
    } catch (error) {
      console.error('Failed to load menu:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveMenu(menu);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save menu:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderParentOptions = (menus: SysMenu[], level = 0): JSX.Element[] => {
    const options: JSX.Element[] = [];
    menus.forEach(m => {
      // 排除自己和自己的子节点
      if (mode === 'edit' && menuId && (m.id === menuId || (m.children && m.children.some(c => c.id === menuId)))) {
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {mode === 'edit' ? '编辑菜单' : parentId ? '新增子菜单' : '新增菜单'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* 表单内容 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
          {loading ? (
            <div className="text-center py-8 text-[var(--text-muted)]">加载中...</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                      菜单名称 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={menu.name}
                      onChange={(e) => setMenu({ ...menu, name: e.target.value })}
                      required
                      className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-light)]"
                      placeholder="请输入菜单名称"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                      菜单编码 <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={menu.code}
                      onChange={(e) => setMenu({ ...menu, code: e.target.value })}
                      required
                      disabled={mode === 'edit'}
                      className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] disabled:opacity-50 focus:outline-none focus:border-[var(--accent-light)]"
                      placeholder="请输入菜单编码"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">图标</label>
                    <input
                      type="text"
                      value={menu.icon || ''}
                      onChange={(e) => setMenu({ ...menu, icon: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-light)]"
                      placeholder="请输入图标名称，如 Settings"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">路由路径</label>
                    <input
                      type="text"
                      value={menu.path || ''}
                      onChange={(e) => setMenu({ ...menu, path: e.target.value })}
                      className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-light)]"
                      placeholder="请输入路由路径，如 /settings"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">父菜单</label>
                    <select
                      value={menu.parentId || 0}
                      onChange={(e) => setMenu({ ...menu, parentId: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-light)]"
                    >
                      <option value={0}>顶级菜单</option>
                      {renderParentOptions(parentMenus)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">排序号</label>
                    <input
                      type="number"
                      value={menu.orderNum || 0}
                      onChange={(e) => setMenu({ ...menu, orderNum: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-light)]"
                      placeholder="数字越小越靠前"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">类型</label>
                    <select
                      value={menu.type || 'menu'}
                      onChange={(e) => setMenu({ ...menu, type: e.target.value as 'menu' | 'button' })}
                      className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-light)]"
                    >
                      <option value="menu">菜单</option>
                      <option value="button">按钮</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">状态</label>
                    <select
                      value={menu.status || 1}
                      onChange={(e) => setMenu({ ...menu, status: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-light)]"
                    >
                      <option value={1}>启用</option>
                      <option value={0}>禁用</option>
                    </select>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700 bg-[var(--bg-hover-light)]">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-700 hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent)] text-[var(--text-primary)] rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
