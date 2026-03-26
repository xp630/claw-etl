import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Users } from 'lucide-react';
import { getRoles, deleteRole } from '../lib/api';
import type { SysRole } from '../types';

export default function RoleList() {
  const [roles, setRoles] = useState<SysRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadRoles();
  }, [page, limit, searchKeyword]);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = await getRoles({ role: searchKeyword, page, limit });
      setRoles(data.list);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteRole(id);
      setShowDeleteConfirm(false);
      setDeleteId(null);
      loadRoles();
    } catch (error) {
      console.error('Failed to delete role:', error);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-[var(--accent)]" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">角色管理</h1>
        </div>
        <button
          onClick={() => window.layoutOpenTab({ id: `role-new-${Date.now()}`, title: '新增角色', path: '/roles/new' })}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="搜索角色名称..."
          value={searchKeyword}
          onChange={(e) => {
            setSearchKeyword(e.target.value);
            setPage(1);
          }}
          onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-light)]"
        />
      </div>

      {/* 列表 */}
      <div className="bg-[var(--bg-table-header)] rounded-xl border border-[var(--border-light)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-light)]">
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">角色标识</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">描述</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">备注</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-[var(--text-muted)]">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-[var(--text-muted)]">
                  加载中...
                </td>
              </tr>
            ) : roles.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-[var(--text-muted)]">
                  暂无数据
                </td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr key={role.roleId} className="border-b border-[var(--border-light)] hover:bg-[var(--bg-hover-light)]">
                  <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{role.role}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{role.description || '-'}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{role.remark || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => window.layoutOpenTab({ id: `role-${role.roleId}`, title: '编辑角色', path: `/roles/${role.roleId}` })}
                        className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(role.roleId!);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {total > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-[var(--text-muted)]">
            共 {total} 条记录
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-colors disabled:opacity-50"
            >
              上一页
            </button>
            <span className="px-3 py-1 text-[var(--text-primary)]">
              第 {page} / {totalPages} 页
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-colors disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">确认删除</h3>
            <p className="text-[var(--text-muted)] mb-6">确定要删除该角色吗？此操作不可撤销。</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-colors"
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
