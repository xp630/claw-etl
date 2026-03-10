import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Edit, Trash2, Plug } from 'lucide-react';
import { getDataSources, deleteDataSource, testDataSource } from '../lib/api';
import type { DataSource } from '../types';

export default function DataSourceList() {
  const navigate = useNavigate();
  const [datasources, setDatasources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');
  const [searchType, setSearchType] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getDataSources();
      setDatasources(data);
    } catch (error) {
      console.error('Failed to load datasources:', error);
    } finally {
      setLoading(false);
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

  const filteredDatasources = datasources.filter(ds => {
    const matchName = !searchName || ds.name.toLowerCase().includes(searchName.toLowerCase());
    const matchType = !searchType || ds.type === searchType;
    return matchName && matchType;
  });

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
      {/* 标题 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/20">
            <Plug className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">数据源管理</h1>
            <p className="text-xs text-slate-500">配置数据库连接</p>
          </div>
        </div>
        <Link
          to="/datasources/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          新增数据源
        </Link>
      </div>

      {/* 搜索筛选 */}
      <div className="bg-[#1e293b]/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="支持数据源名称查询"
              className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm text-slate-200 placeholder-slate-600"
            />
          </div>
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm text-slate-200"
          >
            <option value="">全部类型</option>
            <option value="mysql">MySQL</option>
            <option value="postgresql">PostgreSQL</option>
            <option value="oracle">Oracle</option>
            <option value="sqlserver">SQL Server</option>
          </select>
          <button
            onClick={loadData}
            className="px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 表格 */}
      <div className="bg-[#1e293b]/60 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">数据源名称</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">类型</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">主机地址</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">端口</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">数据库</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">状态</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  加载中...
                </td>
              </tr>
            ) : filteredDatasources.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              filteredDatasources.map((ds) => (
                <tr key={ds.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-slate-400">{ds.id}</td>
                  <td className="px-4 py-3 text-white font-medium">{ds.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                      {getTypeLabel(ds.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300 font-mono text-sm">{ds.host}</td>
                  <td className="px-4 py-3 text-slate-400">{ds.port}</td>
                  <td className="px-4 py-3 text-slate-300">{ds.database_name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${ds.status === 1 ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/20 text-slate-400'}`}>
                      {ds.status === 1 ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleTest(ds.id)}
                        className="p-2 hover:bg-blue-500/10 rounded-lg text-blue-400 transition-colors"
                        title="测试连接"
                      >
                        <Plug className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/datasources/${ds.id}`)}
                        className="p-2 hover:bg-blue-500/10 rounded-lg text-blue-400 transition-colors"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(ds.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors"
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
    </div>
  );
}
