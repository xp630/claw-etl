import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plug } from 'lucide-react';
import { getDataSource, createDataSource, updateDataSource, testDataSource } from '../lib/api';
import { useToast } from '../components/Toast';
import type { DataSource } from '../types';

const DB_TYPES = [
  { value: 'mysql', label: 'MySQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'oracle', label: 'Oracle' },
  { value: 'sqlserver', label: 'SQL Server' },
];

const DATA_TYPES = [
  { value: 'source', label: '源数据库' },
  { value: 'target', label: '目标数据库' },
];

// 默认JDBC URL模板
const DEFAULT_JDBC_URLS: Record<string, string> = {
  mysql: 'jdbc:mysql://localhost:3306/database',
  postgresql: 'jdbc:postgresql://localhost:5432/database',
  oracle: 'jdbc:oracle:thin:@localhost:1521:ORCL',
  sqlserver: 'jdbc:sqlserver://localhost:1433;databaseName=database',
};

// 默认连接检查SQL
const DEFAULT_DB_CHECK_URLS: Record<string, string> = {
  mysql: 'select 1',
  postgresql: 'select 1',
  oracle: 'select 1 from dual',
  sqlserver: 'select 1',
};

export default function DataSourceForm({ overrideId }: { overrideId?: string }) {
  const navigate = useNavigate();
  const params = useParams();
  const id = overrideId || params.id;
  const isEdit = Boolean(id);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [formData, setFormData] = useState<Partial<DataSource>>({
    name: '',
    type: 'mysql',
    dataType: 'source',
    jdbcUrl: DEFAULT_JDBC_URLS.mysql,
    dbCheckUrl: DEFAULT_DB_CHECK_URLS.mysql,
    username: '',
    password: '',
    database_name: '',
    maxConnections: 10,
    initialConnections: 5,
    maxIdle: 10,
    maxWait: 30000,
    extraParams: '',
    description: '',
  });

  useEffect(() => {
    if (isEdit && id && !dataLoaded) {
      setDataLoaded(true);
      loadDataSource(parseInt(id));
    }
  }, [id, dataLoaded]);

  const loadDataSource = async (dsId: number) => {
    setLoading(true);
    try {
      const data = await getDataSource(dsId);
      if (data) {
        setFormData(data);
      }
    } catch (error) {
      console.error('Failed to load datasource:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (type: string) => {
    setFormData({
      ...formData,
      type: type as DataSource['type'],
      jdbcUrl: DEFAULT_JDBC_URLS[type] || '',
      dbCheckUrl: DEFAULT_DB_CHECK_URLS[type] || '',
    });
  };

  const canSave = () => {
    return formData.name && formData.jdbcUrl && formData.username && formData.database_name && (formData.maxWait !== undefined && formData.maxWait > 0);
  };

  const handleTest = async () => {
    if (!canSave()) {
      showToast('请填写完整信息', 'error');
      return;
    }
    setTesting(true);
    try {
      // 直接传数据测试，不需要先保存
      const result = await testDataSource(formData);
      showToast(result.message, result.success ? 'success' : 'error');
    } catch (error: any) {
      showToast(error?.message || '测试连接失败', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSave()) {
      showToast('请填写必填项', 'error');
      return;
    }

    setSaving(true);
    try {
      let result;
      if (isEdit && id) {
        result = await updateDataSource(parseInt(id), formData);
      } else {
        result = await createDataSource(formData);
      }
      
      const res = result as any;
      if (result === 1 || res?.code === 1 || res?.code === 0 || res?.code === undefined) {
        showToast(isEdit ? '更新成功' : '创建成功', 'success');
      } else {
        showToast(res?.msg || '保存失败', 'error');
      }
      navigate('/datasources');
    } catch (error: any) {
      showToast(error?.message || '保存失败', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 标题 */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/datasources')}
          className="p-2 hover:bg-[var(--bg-hover-light)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{isEdit ? '编辑数据源' : '新增数据源'}</h1>
        </div>
      </div>

      {/* 表单 */}
      <form onSubmit={handleSubmit}>
        {/* 基本信息 - 蓝色主题 */}
        <div className="bg-gradient-to-br from-[var(--bg-secondary)]/80 to-[var(--bg-secondary)]/60 backdrop-blur-xl rounded-xl border border-blue-500/30 p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
            <h3 className="text-base font-medium text-blue-400">基本信息</h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {/* 数据源名称 */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                数据源名称 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入"
                className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            {/* 用途 */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                用途 <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.dataType}
                onChange={(e) => setFormData({ ...formData, dataType: e.target.value as 'source' | 'target' })}
                className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[var(--text-primary)]"
              >
                {DATA_TYPES.map((dt) => (
                  <option key={dt.value} value={dt.value}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 数据源类型 */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                数据源类型 <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[var(--text-primary)]"
              >
                {DB_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 描述 */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                描述
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入描述信息（可选）"
                className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>
        </div>

        {/* 连接信息 - 绿色主题 */}
        <div className="bg-gradient-to-br from-[var(--bg-secondary)]/80 to-[var(--bg-secondary)]/60 backdrop-blur-xl rounded-xl border border-emerald-500/30 p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
            <h3 className="text-base font-medium text-emerald-400">连接信息</h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {/* JDBC连接地址 */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                JDBC连接地址 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.jdbcUrl}
                onChange={(e) => setFormData({ ...formData, jdbcUrl: e.target.value })}
                placeholder="jdbc:mysql://localhost:3306/database"
                className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-mono text-sm"
              />
            </div>

            {/* 连接检查SQL */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                检查SQL <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.dbCheckUrl}
                onChange={(e) => setFormData({ ...formData, dbCheckUrl: e.target.value })}
                placeholder="select 1"
                className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-mono text-sm"
              />
            </div>

            {/* 用户名 */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                用户名 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="请输入"
                className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                密码 <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="请输入"
                className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            {/* 数据库名 */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                数据库名 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.database_name}
                onChange={(e) => setFormData({ ...formData, database_name: e.target.value })}
                placeholder="请输入"
                className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>
        </div>

        {/* 扩展信息 - 紫色主题 */}
        <div className="bg-gradient-to-br from-[var(--bg-secondary)]/80 to-[var(--bg-secondary)]/60 backdrop-blur-xl rounded-xl border border-[var(--accent-light)] p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-[var(--accent)] rounded-full"></div>
            <h3 className="text-base font-medium text-[var(--accent)]">扩展信息</h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {/* 最大连接数 */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                最大连接数
              </label>
              <input
                type="number"
                value={formData.maxConnections || ''}
                onChange={(e) => setFormData({ ...formData, maxConnections: parseInt(e.target.value) || undefined })}
                placeholder="10"
                className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            {/* 初始化连接数 */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                初始化连接数
              </label>
              <input
                type="number"
                value={formData.initialConnections || ''}
                onChange={(e) => setFormData({ ...formData, initialConnections: parseInt(e.target.value) || undefined })}
                placeholder="5"
                className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            {/* 最大空闲数 */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                最大空闲数
              </label>
              <input
                type="number"
                value={formData.maxIdle || ''}
                onChange={(e) => setFormData({ ...formData, maxIdle: parseInt(e.target.value) || undefined })}
                placeholder="10"
                className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            {/* 最大等待时间 */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                最大等待时间(毫秒) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={formData.maxWait || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setFormData({ ...formData, maxWait: isNaN(val) ? undefined : val });
                }}
                placeholder="30000"
                className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            {/* 扩展参数 */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                扩展参数
              </label>
              <input
                type="text"
                value={formData.extraParams || ''}
                onChange={(e) => setFormData({ ...formData, extraParams: e.target.value })}
                placeholder="例如: useSSL=false&serverTimezone=UTC"
                className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 px-6 py-2.5 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
          >
            <Plug className="w-4 h-4" />
            {testing ? '测试中...' : '测试连接'}
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/datasources')}
              className="px-6 py-2.5 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-lg hover:bg-[var(--text-secondary)] transition-colors"
            >
              返回
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-[var(--text-primary)] rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
