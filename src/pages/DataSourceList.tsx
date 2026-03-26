import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Plug, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { getDataSources, deleteDataSource, testDataSource, toggleDataSourceStatus } from '../lib/api';
import type { DataSource } from '../types';

export default function DataSourceList() {
  const navigate = useNavigate();
  const [datasources, setDatasources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchDataType, setSearchDataType] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadData();
  }, [page, limit, searchName, searchType, searchDataType, searchStatus]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getDataSources({
        page,
        limit,
        name: searchName || undefined,
        dataType: searchDataType || undefined,
        dbState: searchStatus || undefined,
      });
      setDatasources(data.list);
      setTotal(data.total);
    } catch (error) {
      console.error('Failed to load datasources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const handleStatusChange = async (id: number, currentDbState: string) => {
    try {
      const newStatus = currentDbState === '启用' ? '禁用' : '启用';
      await toggleDataSourceStatus(id, newStatus);
      loadData();
    } catch (error) {
      console.error('Failed to change status:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除该数据源吗？')) {
      await deleteDataSource(id);
      loadData();
    }
  };

  const handleTest = async (id: number) => {
    const result = await testDataSource(id);
    alert(result.message);
  };

  const totalPages = Math.ceil(total / limit);

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      mysql: 'MySQL',
      postgresql: 'PostgreSQL',
      oracle: 'Oracle',
      sqlserver: 'SQL Server',
    };
    return map[type] || type;
  };

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">数据源管理</h1>
      </div>

      {/* 搜索条件 */}
      <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="mb-4 bg-[var(--bg-table-header)] rounded-xl border border-[var(--border-light)] p-4">
        <div className="flex gap-4 flex-wrap items-end">
          {/* 字段区域 */}
          <div className="flex gap-4 flex-wrap flex-1">
            <div className="w-[calc(33%-10px)] min-w-[200px] h-16 flex flex-col justify-between">
              <label className="block text-sm text-[var(--text-muted)] truncate">数据源名称</label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="搜索名称"
                className="px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm w-full"
              />
            </div>
            <div className="w-[calc(33%-10px)] min-w-[200px] h-16 flex flex-col justify-between">
              <label className="block text-sm text-[var(--text-muted)] truncate">类型</label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm w-full"
              >
                <option value="">全部</option>
                <option value="mysql">MySQL</option>
                <option value="postgresql">PostgreSQL</option>
                <option value="oracle">Oracle</option>
                <option value="sqlserver">SQL Server</option>
              </select>
            </div>
            <div className="w-[calc(33%-10px)] min-w-[200px] h-16 flex flex-col justify-between">
              <label className="block text-sm text-[var(--text-muted)] truncate">用途</label>
              <select
                value={searchDataType}
                onChange={(e) => setSearchDataType(e.target.value)}
                className="px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm w-full"
              >
                <option value="">全部</option>
                <option value="source">源数据库</option>
                <option value="target">目标数据库</option>
              </select>
            </div>
            {showAdvanced && (
              <div className="w-[calc(33%-10px)] min-w-[200px] h-16 flex flex-col justify-between">
                <label className="block text-sm text-[var(--text-muted)] truncate">状态</label>
                <select
                  value={searchStatus}
                  onChange={(e) => setSearchStatus(e.target.value)}
                  className="px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm w-full"
                >
                  <option value="">全部</option>
                  <option value="启用">启用</option>
                  <option value="禁用">禁用</option>
                </select>
              </div>
            )}
          </div>
          {/* 按钮区域 */}
          <div className="flex gap-2 items-center shrink-0">
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              搜索
            </button>
            <button
              type="button"
              onClick={() => navigate('/datasources/new')}
              className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新增
            </button>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-3 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-colors flex items-center"
              title={showAdvanced ? '收起' : '展开'}
            >
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </form>

      {/* 表格 */}
      <div className="bg-[var(--bg-secondary)]/60 backdrop-blur-xl rounded-xl border border-[var(--border-light)] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[var(--bg-table-header)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">数据源名称</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">用途</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">类型</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">主机地址</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">端口</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">数据库</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">状态</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[var(--text-muted)] uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-light)]">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-[var(--text-muted)]">
                  加载中...
                </td>
              </tr>
            ) : datasources.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-[var(--text-muted)]">
                  暂无数据
                </td>
              </tr>
            ) : (
              datasources.map((ds) => (
                <tr key={ds.id} className="hover:bg-[var(--bg-table-header)] transition-colors">
                  <td className="px-4 py-3 text-[var(--text-muted)] truncate">{ds.id}</td>
                  <td className="px-4 py-3 text-[var(--text-primary)] truncate font-medium">{ds.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${ds.dataType === 'source' ? 'bg-[var(--accent-light)] text-[var(--accent)]' : 'bg-[var(--warning)]/20 text-[var(--warning)]'}`}>
                      {ds.dataType === 'source' ? '源数据库' : '目标数据库'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-[var(--info)]/20 text-[var(--info)] rounded text-xs">
                      {getTypeLabel(ds.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] truncate font-mono text-sm">{ds.host}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)] truncate">{ds.port}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] truncate">{ds.database_name}</td>
                  <td className="px-4 py-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ds.dbState === '启用'}
                        onChange={() => handleStatusChange(ds.id, ds.dbState || '')}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-[var(--bg-secondary)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--success)]"></div>
                    </label>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleTest(ds.id)}
                        className="p-2 hover:bg-[var(--info)]/10 rounded-lg text-[var(--info)] transition-colors"
                        title="测试连接"
                      >
                        <Plug className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/datasources/${ds.id}`)}
                        className="p-2 hover:bg-[var(--info)]/10 rounded-lg text-[var(--info)] transition-colors"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ds.id)}
                        className="p-2 hover:bg-[var(--danger)]/10 rounded-lg text-[var(--danger)] transition-colors"
                        title="删除"
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
              className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-[var(--text-primary)] px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}