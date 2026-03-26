import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Check, Search } from 'lucide-react';
import { getRoleDetail, saveRole, getMenuTree, getRoleMenuIds, bindMenus } from '../lib/api';
import type { SysRole, SysMenu } from '../types';

export default function RoleForm({ overrideId }: { overrideId?: string }) {
  const params = useParams();
  const navigate = useNavigate();
  const id = overrideId || params.id;
  const isEdit = Boolean(id);

  const [role, setRole] = useState<SysRole>({
    role: '',
    description: '',
    remark: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMenuSelect, setShowMenuSelect] = useState(false);
  const [menuTree, setMenuTree] = useState<SysMenu[]>([]);
  const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isEdit && id) {
      loadRoleDetail(parseInt(id));
    }
    loadMenuTree();
  }, [id]);

  const loadRoleDetail = async (roleId: number) => {
    setLoading(true);
    try {
      const data = await getRoleDetail(roleId);
      if (data) {
        setRole(data);
        // 加载角色关联的菜单
        const menuIds = await getRoleMenuIds(roleId);
        setSelectedMenuIds(menuIds);
      }
    } catch (error) {
      console.error('Failed to load role:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMenuTree = async () => {
    try {
      const tree = await getMenuTree();
      setMenuTree(tree);
    } catch (error) {
      console.error('Failed to load menu tree:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await saveRole(role);
      if (saved) {
        // 如果是编辑模式，同时保存菜单关联
        if (isEdit && saved.roleId) {
          await bindMenus(saved.roleId, selectedMenuIds);
        }
        navigate(-1);
      }
    } catch (error) {
      console.error('Failed to save role:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleMenuSelection = (menuId: number) => {
    setSelectedMenuIds(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  // 全选/取消全选
  const toggleExpandAll = () => {
    if (expandedKeys.size === 0) {
      const allKeys = new Set<number>();
      const collectKeys = (menus: SysMenu[]) => {
        menus.forEach(m => {
          if (m.children && m.children.length > 0) {
            allKeys.add(m.id!);
            collectKeys(m.children);
          }
        });
      };
      collectKeys(menuTree);
      setExpandedKeys(allKeys);
    } else {
      setExpandedKeys(new Set());
    }
  };

  // 渲染菜单树
  const renderMenuTree = (menus: SysMenu[], level = 0) => {
    return menus.map(menu => (
      <div key={menu.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 hover:bg-[var(--bg-hover)] rounded cursor-pointer ${
            selectedMenuIds.includes(menu.id!) ? 'bg-[var(--accent)]/20' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
        >
          {menu.children && menu.children.length > 0 && (
            <button
              onClick={() => {
                const newKeys = new Set(expandedKeys);
                if (newKeys.has(menu.id!)) {
                  newKeys.delete(menu.id!);
                } else {
                  newKeys.add(menu.id!);
                }
                setExpandedKeys(newKeys);
              }}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {expandedKeys.has(menu.id!) ? '▼' : '▶'}
            </button>
          )}
          <input
            type="checkbox"
            checked={selectedMenuIds.includes(menu.id!)}
            onChange={() => toggleMenuSelection(menu.id!)}
            className="w-4 h-4 rounded border-[var(--border-light)] text-[var(--accent)] focus:ring-purple-500"
          />
          <span className="text-[var(--text-primary)]">{menu.name}</span>
          <span className="text-[var(--text-muted)] text-sm">({menu.code})</span>
        </div>
        {menu.children && menu.children.length > 0 && expandedKeys.has(menu.id!) && (
          <div>{renderMenuTree(menu.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[var(--text-primary)]" />
        </button>
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-[var(--accent)]" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{isEdit ? '编辑角色' : '新增角色'}</h1>
        </div>
      </div>

      {/* 表单 */}
      <div className="bg-[var(--bg-table-header)] rounded-xl border border-[var(--border-light)] p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                角色标识 <span className="text-[var(--danger)]">*</span>
              </label>
              <input
                type="text"
                value={role.role}
                onChange={(e) => setRole({ ...role, role: e.target.value })}
                required
                disabled={isEdit}
                className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] disabled:opacity-50"
                placeholder="请输入角色标识，如 admin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">描述</label>
              <input
                type="text"
                value={role.description || ''}
                onChange={(e) => setRole({ ...role, description: e.target.value })}
                className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)]"
                placeholder="请输入角色描述"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">备注</label>
              <textarea
                value={role.remark || ''}
                onChange={(e) => setRole({ ...role, remark: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] resize-none"
                placeholder="请输入备注信息"
              />
            </div>

            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-[var(--text-muted)] mb-2">
                  <button
                    type="button"
                    onClick={() => setShowMenuSelect(!showMenuSelect)}
                    className="flex items-center gap-2 hover:text-[var(--accent)] transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    分配菜单
                    <span className="text-[var(--text-muted)]">（已选 {selectedMenuIds.length} 个菜单）</span>
                  </button>
                </label>

                {showMenuSelect && (
                  <div className="mt-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg p-4 max-h-80 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-[var(--text-muted)]">
                        <button type="button" onClick={toggleExpandAll} className="hover:text-[var(--accent)]">
                          {expandedKeys.size === 0 ? '展开全部' : '收起全部'}
                        </button>
                      </span>
                    </div>
                    <div className="space-y-1">
                      {renderMenuTree(menuTree)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 提交按钮 */}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 bg-[var(--bg-tertiary)]700 hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
