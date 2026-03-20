import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, User as UserIcon } from 'lucide-react';
import { getUsers, deleteUser } from '../lib/api';
import type { SysUser } from '../types';

export default function UserList() {
  const [users, setUsers] = useState<SysUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadUsers();
  }, [page, limit, searchKeyword]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers({ name: searchKeyword, page, limit });
      setUsers(data.list);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id);
      setShowDeleteConfirm(false);
      setDeleteId(null);
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <UserIcon className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl font-bold text-white">用户管理</h1>
        </div>
        <button
          onClick={() => window.layoutOpenTab({ id: `user-new-${Date.now()}`, title: '新增用户', path: '/users/new' })}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增用户
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="搜索用户姓名..."
          value={searchKeyword}
          onChange={(e) => {
            setSearchKeyword(e.target.value);
            setPage(1);
          }}
          onKeyDown={(e) => e.key === 'Enter' && setPage(1)}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50"
        />
      </div>

      {/* 列表 */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">姓名</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">工号</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">手机号</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-400">状态</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-slate-400">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  加载中...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                  <td className="px-4 py-3 text-sm text-white">{user.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{user.employeeNo}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{user.phone}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      user.status === 1 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {user.status === 1 ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => window.layoutOpenTab({ id: `user-${user.id}`, title: '编辑用户', path: `/users/${user.id}` })}
                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setDeleteId(user.id!);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400 transition-colors"
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
          <div className="text-sm text-slate-400">
            共 {total} 条记录
          </div>
          <div className="flex items-center gap-4">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-3 py-1 bg-slate-700 text-white rounded-lg focus:outline-none"
            >
              <option value={10}>10条/页</option>
              <option value={20}>20条/页</option>
              <option value={50}>50条/页</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                上一页
              </button>
              <span className="px-3 py-1 text-white">
                第 {page} / {totalPages} 页
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-white mb-4">确认删除</h3>
            <p className="text-slate-400 mb-6">确定要删除该用户吗？此操作不可撤销。</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => deleteId && handleDelete(deleteId)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
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
