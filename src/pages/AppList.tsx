import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Edit, Trash2, Key, Copy, Search } from 'lucide-react';

// 应用类型
interface ApiApp {
  id?: number;
  appName: string;
  appKey?: string;
  appSecret?: string;
  appType?: string;
  description?: string;
  expireTime?: string;
  status?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 模拟数据
const MOCK_APPS: ApiApp[] = [
  {
    id: 1,
    appName: 'Web应用',
    appKey: 'ak_web_xxxxx',
    appSecret: 'sk_xxxxxxxxxxxxx',
    appType: 'web',
    description: 'Web前端应用',
    status: 1,
    createdAt: '2026-03-01 10:00:00',
  },
  {
    id: 2,
    appName: '移动App',
    appKey: 'ak_app_xxxxx',
    appSecret: 'sk_xxxxxxxxxxxxx',
    appType: 'app',
    description: 'iOS/Android应用',
    status: 1,
    createdAt: '2026-03-02 10:00:00',
  },
];

export default function AppList() {
  const navigate = useNavigate();
  const [apps, setApps] = useState<ApiApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // TODO: 调用后端接口
      setApps(MOCK_APPS);
    } catch (error) {
      console.error('Failed to load apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除该应用吗？')) {
      // TODO: 调用删除接口
      setApps(apps.filter(a => a.id !== id));
    }
  };

  const handleToggle = async (app: ApiApp) => {
    // TODO: 调用切换状态接口
    setApps(apps.map(a => 
      a.id === app.id ? { ...a, status: a.status === 1 ? 0 : 1 } : a
    ));
  };

  const handleRegenerateSecret = async (app: ApiApp) => {
    if (confirm('确定要重新生成Secret吗？旧Secret将失效！')) {
      // TODO: 调用重新生成接口
      const newSecret = 'sk_' + Math.random().toString(36).substring(2, 18);
      setApps(apps.map(a => 
        a.id === app.id ? { ...a, appSecret: newSecret } : a
      ));
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  };

  const filteredApps = apps.filter(app => 
    !searchName || app.appName.toLowerCase().includes(searchName.toLowerCase())
  );

  const getAppTypeLabel = (type?: string) => {
    const map: Record<string, string> = {
      web: 'Web',
      app: 'App',
      other: '其他'
    };
    return map[type || ''] || '其他';
  };

  return (
    <div className="p-6">
      {/* 标题 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center border border-yellow-500/20">
            <Key className="w-5 h-5 text-[var(--warning)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">应用管理</h1>
            <p className="text-xs text-[var(--text-muted)]">管理API调用密钥</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/apps/new')}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增
        </button>
      </div>

      {/* 搜索筛选 */}
      <div className="bg-[var(--bg-secondary)]/60 backdrop-blur-xl rounded-xl border border-[var(--border-light)] p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="搜索应用名称"
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/30 text-sm text-[var(--text-input)] placeholder:text-[var(--text-muted)]"
            />
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2.5 bg-[var(--warning)] text-white rounded-lg hover:bg-[var(--warning)]/80 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 表格 */}
      <div className="bg-[var(--bg-secondary)]/60 backdrop-blur-xl rounded-xl border border-[var(--border-light)] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[var(--bg-table-header)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">应用名称</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">类型</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">AppKey</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">AppSecret</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">创建时间</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[var(--text-muted)] uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-light)]">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[var(--text-muted)]">
                  加载中...
                </td>
              </tr>
            ) : filteredApps.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[var(--text-muted)]">
                  暂无数据
                </td>
              </tr>
            ) : (
              filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-[var(--bg-table-header)] transition-colors">
                  <td className="px-4 py-3 text-[var(--text-muted)] truncate">{app.id}</td>
                  <td className="px-4 py-3 text-[var(--text-primary)] truncate font-medium">{app.appName}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-[var(--warning)]/20 text-[var(--warning)] rounded text-xs">
                      {getAppTypeLabel(app.appType)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-secondary)] font-mono text-sm">{app.appKey}</span>
                      <button
                        onClick={() => handleCopy(app.appKey || '')}
                        className="p-1 hover:bg-[var(--bg-hover)] rounded"
                        title="复制"
                      >
                        <Copy className="w-3 h-3 text-[var(--text-muted)]" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--text-muted)] font-mono text-sm">••••••••••••</span>
                      <button
                        onClick={() => handleCopy(app.appSecret || '')}
                        className="p-1 hover:bg-[var(--bg-hover)] rounded"
                        title="复制"
                      >
                        <Copy className="w-3 h-3 text-[var(--text-muted)]" />
                      </button>
                      <button
                        onClick={() => handleRegenerateSecret(app)}
                        className="p-1 hover:bg-[var(--bg-hover)] rounded"
                        title="重新生成"
                      >
                        <RefreshCw className="w-3 h-3 text-[var(--text-muted)]" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${app.status === 1 ? 'bg-[var(--success)]/20 text-[var(--success)]' : 'bg-[var(--bg-secondary)]/20 text-[var(--text-muted)]'}`}>
                      {app.status === 1 ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] truncate text-sm">{app.createdAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => navigate(`/apps/${app.id}`)}
                        className="p-2 hover:bg-[var(--info)]/10 rounded-lg text-[var(--info)] transition-colors"
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggle(app)}
                        className="p-2 hover:bg-[var(--warning)]/10 rounded-lg text-[var(--warning)] transition-colors"
                        title={app.status === 1 ? '禁用' : '启用'}
                      >
                        {app.status === 1 ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
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
