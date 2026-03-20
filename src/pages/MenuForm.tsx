import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Menu as MenuIcon } from 'lucide-react';
import { getMenuDetail, saveMenu, getMenuTree } from '../lib/api';
import type { SysMenu } from '../types';

export default function MenuForm() {
  const params = useParams();
  const navigate = useNavigate();
  const id = params.id;
  const isEdit = Boolean(id);

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
    loadParentMenus();
    if (isEdit && id) {
      loadMenuDetail(parseInt(id));
    }
  }, [id]);

  const loadParentMenus = async () => {
    try {
      const tree = await getMenuTree();
      // 将树形结构扁平化，用于下拉选择
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

  const loadMenuDetail = async (menuId: number) => {
    setLoading(true);
    try {
      const data = await getMenuDetail(menuId);
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
      navigate(-1);
    } catch (error) {
      console.error('Failed to save menu:', error);
    } finally {
      setSaving(false);
    }
  };

  const renderParentOptions = (menus: SysMenu[], level = 0): JSX.Element[] => {
    const options: JSX.Element[] = [];
    menus.forEach(m => {
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

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center gap-3">
          <MenuIcon className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">{isEdit ? '编辑菜单' : '新增菜单'}</h1>
        </div>
      </div>

      {/* 表单 */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  菜单名称 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={menu.name}
                  onChange={(e) => setMenu({ ...menu, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white"
                  placeholder="请输入菜单名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  菜单编码 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={menu.code}
                  onChange={(e) => setMenu({ ...menu, code: e.target.value })}
                  required
                  disabled={isEdit}
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white disabled:opacity-50"
                  placeholder="请输入菜单编码"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">图标</label>
                <input
                  type="text"
                  value={menu.icon || ''}
                  onChange={(e) => setMenu({ ...menu, icon: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white"
                  placeholder="请输入图标名称，如 Settings"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">路由路径</label>
                <input
                  type="text"
                  value={menu.path || ''}
                  onChange={(e) => setMenu({ ...menu, path: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white"
                  placeholder="请输入路由路径，如 /settings"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">父菜单</label>
                <select
                  value={menu.parentId || 0}
                  onChange={(e) => setMenu({ ...menu, parentId: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white"
                >
                  <option value={0}>顶级菜单</option>
                  {renderParentOptions(parentMenus.filter(m => isEdit && m.id !== menu.id || !isEdit))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">排序号</label>
                <input
                  type="number"
                  value={menu.orderNum || 0}
                  onChange={(e) => setMenu({ ...menu, orderNum: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white"
                  placeholder="数字越小越靠前"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">类型</label>
                <select
                  value={menu.type || 'menu'}
                  onChange={(e) => setMenu({ ...menu, type: e.target.value as 'menu' | 'button' })}
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white"
                >
                  <option value="menu">菜单</option>
                  <option value="button">按钮</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">状态</label>
                <select
                  value={menu.status || 1}
                  onChange={(e) => setMenu({ ...menu, status: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white"
                >
                  <option value={1}>启用</option>
                  <option value={0}>禁用</option>
                </select>
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
