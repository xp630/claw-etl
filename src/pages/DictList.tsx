import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getDictList, deleteDict } from '../lib/api';
import type { Dict } from '../types';

export default function DictList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dicts, setDicts] = useState<Dict[]>([]);
  const [searchName, setSearchName] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadDicts();
  }, [page, limit]);

  const loadDicts = async () => {
    setLoading(true);
    try {
      const data = await getDictList({ page, limit, name: searchName, code: searchCode });
      setDicts(data.list);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load dicts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadDicts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除吗？')) return;
    try {
      await deleteDict(id);
      // 如果当前页只有一条数据且不是第一页，则回到上一页
      if (dicts.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        loadDicts();
      }
    } catch (error) {
      console.error('Failed to delete dict:', error);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">数据字典管理</h1>
        <button
          onClick={() => navigate('/dict/new')}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="搜索字典名称"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
        />
        <input
          type="text"
          placeholder="搜索字典编码"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-[var(--accent)]/20 hover:bg-[var(--accent)]/30 text-[var(--accent)] rounded-lg transition-colors text-sm"
        >
          搜索
        </button>
      </div>

      <div className="bg-[var(--bg-table-header)] rounded-lg border border-[var(--border-light)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border-light)] bg-[var(--bg-hover-light)]">
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">字典编码</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">字典名称</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-[var(--text-muted)]">类型</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-[var(--text-muted)]">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">备注</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-[var(--text-muted)]">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[var(--text-muted)]">加载中...</td>
              </tr>
            ) : dicts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[var(--text-muted)]">暂无数据</td>
              </tr>
            ) : (
              dicts.map(dict => (
                <tr key={dict.id} className="border-b border-[var(--border-light)] hover:bg-[var(--bg-hover-light)]">
                  <td className="px-4 py-3 text-sm text-[var(--text-primary)] font-mono">{dict.code}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{dict.name}</td>
                  <td className="px-4 py-3 text-center text-sm text-[var(--text-muted)]">
                    {dict.type === 'number' ? '数字' : '字符串'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs ${dict.status === 1 ? 'bg-[var(--success)]/20 text-[var(--success)]' : 'bg-[var(--danger)]/20 text-[var(--danger)]'}`}>
                      {dict.status === 1 ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{dict.remark || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => navigate(`/dict/${dict.id}`)}
                        className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(dict.id!)}
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

      {/* 分页组件 */}
      {total > 0 && (
        <div className="flex items-center justify-between mt-4 px-2">
          <div className="flex items-center gap-4">
            <span className="text-sm text-[var(--text-muted)]">共 {total} 条记录</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-sm text-[var(--text-primary)]"
            >
              <option value={5}>5条/页</option>
              <option value={10}>10条/页</option>
              <option value={20}>20条/页</option>
              <option value={50}>50条/页</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-[var(--text-primary)] px-2">{page} / {totalPages}</span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
