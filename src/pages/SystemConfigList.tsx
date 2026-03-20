import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getSystemConfigList, deleteSystemConfig } from '../lib/api';
import type { SystemConfig } from '../types';

export default function SystemConfigList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [searchName, setSearchName] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [searchGroup, setSearchGroup] = useState('');
  const [groups, setGroups] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadConfigs();
  }, [page, limit]);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const data = await getSystemConfigList({ page, limit, name: searchName, code: searchCode, groupName: searchGroup });
      setConfigs(data.list);
      setTotal(data.total);
      // 从列表中提取分组
      const groupSet = new Set<string>();
      data.list.forEach(c => c.groupName && groupSet.add(c.groupName));
      setGroups(Array.from(groupSet));
    } catch (error) {
      console.error('Failed to load configs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除吗？')) return;
    try {
      await deleteSystemConfig(id);
      // 如果当前页只有一条数据且不是第一页，则回到上一页
      if (configs.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        loadConfigs();
      }
    } catch (error) {
      console.error('Failed to delete config:', error);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadConfigs();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">系统参数管理</h1>
        <button
          onClick={() => navigate('/config/new')}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent)] text-[var(--text-primary)] rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增参数
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="搜索参数名称"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
        />
        <input
          type="text"
          placeholder="搜索参数编码"
          value={searchCode}
          onChange={(e) => setSearchCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
        />
        <select
          value={searchGroup}
          onChange={(e) => setSearchGroup(e.target.value)}
          className="px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
        >
          <option value="">全部分组</option>
          {groups.map(group => (
            <option key={group} value={group}>{group}</option>
          ))}
        </select>
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
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">参数编码</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">参数名称</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-[var(--text-muted)]">参数值</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-[var(--text-muted)]">类型</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-[var(--text-muted)]">分组</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-[var(--text-muted)]">状态</th>
              <th className="px-4 py-3 text-center text-sm font-medium text-[var(--text-muted)]">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[var(--text-muted)]">加载中...</td>
              </tr>
            ) : configs.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[var(--text-muted)]">暂无数据</td>
              </tr>
            ) : (
              configs.map(config => (
                <tr key={config.id} className="border-b border-[var(--border-light)] hover:bg-[var(--bg-hover-light)]">
                  <td className="px-4 py-3 text-sm text-[var(--text-primary)] font-mono">{config.code}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-primary)]">{config.name}</td>
                  <td className="px-4 py-3 text-sm text-[var(--text-muted)] font-mono max-w-xs truncate">{config.value}</td>
                  <td className="px-4 py-3 text-center text-sm text-[var(--text-muted)]">
                    {config.type === 'string' ? '字符串' : config.type === 'number' ? '数字' : '布尔'}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-[var(--text-muted)]">{config.groupName || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs ${config.status === 1 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {config.status === 1 ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => navigate(`/config/${config.id}`)}
                        className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(config.id!)}
                        className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)] hover:text-red-400 transition-colors"
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