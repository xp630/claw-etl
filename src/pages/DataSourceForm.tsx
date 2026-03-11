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

const DEFAULT_PORTS: Record<string, number> = {
  mysql: 3306,
  postgresql: 5432,
  oracle: 1521,
  sqlserver: 1433,
};

export default function DataSourceForm() {
  const navigate = useNavigate();
  const { id } = useParams();
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
    host: '',
    port: 3306,
    username: '',
    password: '',
    database_name: '',
    maxConnections: 10,
    minIdle: 5,
    initialConnections: 5,
    maxIdle: 10,
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
      port: DEFAULT_PORTS[type] || 3306,
    });
  };

  const handleTest = async () => {
    if (!formData.name) {
      alert('请先填写数据源名称');
      return;
    }
    setTesting(true);
    try {
      // 先保存再测试
      let dsId: number;
      if (isEdit && id) {
        await updateDataSource(parseInt(id), formData);
        dsId = parseInt(id);
      } else {
        const newDS = await createDataSource(formData);
        dsId = newDS.id;
      }
      const result = await testDataSource(dsId);
      showToast(result.message, result.success ? 'success' : 'error');
    } catch (error: any) {
      showToast(error?.message || '测试连接失败', 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.host || !formData.username || !formData.database_name) {
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
      
      if (result === 1 || result?.code === 1 || result?.code === undefined) {
        showToast(isEdit ? '更新成功' : '创建成功', 'success');
      } else {
        showToast(result?.msg || '保存失败', 'error');
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
          className="p-2 hover:bg-slate-800/50 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">{isEdit ? '编辑数据源' : '新增数据源'}</h1>
          <p className="text-xs text-slate-500">配置数据库连接信息</p>
        </div>
      </div>

      {/* 表单 */}
      <form onSubmit={handleSubmit}>
        <div className="bg-[#1e293b]/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
          <div className="grid grid-cols-2 gap-6">
            {/* 数据源名称 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                数据源名称 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600"
              />
            </div>

            {/* 用途 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                用途 <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.dataType}
                onChange={(e) => setFormData({ ...formData, dataType: e.target.value as 'source' | 'target' })}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white"
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
              <label className="block text-sm font-medium text-slate-300 mb-2">
                数据源类型 <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white"
              >
                {DB_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 主机地址 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                主机地址 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                placeholder="请输入IP地址或域名"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600"
              />
            </div>

            {/* 端口 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                端口 <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600"
              />
            </div>

            {/* 用户名 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                用户名 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="请输入"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600"
              />
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                密码 <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="请输入"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600"
              />
            </div>

            {/* 数据库名 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                数据库名 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.database_name}
                onChange={(e) => setFormData({ ...formData, database_name: e.target.value })}
                placeholder="请输入"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600"
              />
            </div>

            {/* 最大连接数 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                最大连接数
              </label>
              <input
                type="number"
                value={formData.maxConnections || ''}
                onChange={(e) => setFormData({ ...formData, maxConnections: parseInt(e.target.value) || undefined })}
                placeholder="10"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600"
              />
            </div>

            {/* 初始化连接数 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                初始化连接数
              </label>
              <input
                type="number"
                value={formData.initialConnections || ''}
                onChange={(e) => setFormData({ ...formData, initialConnections: parseInt(e.target.value) || undefined })}
                placeholder="5"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600"
              />
            </div>

            {/* 最小空闲连接数 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                最小空闲连接数
              </label>
              <input
                type="number"
                value={formData.minIdle || ''}
                onChange={(e) => setFormData({ ...formData, minIdle: parseInt(e.target.value) || undefined })}
                placeholder="5"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600"
              />
            </div>

            {/* 最大空闲数 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                最大空闲数
              </label>
              <input
                type="number"
                value={formData.maxIdle || ''}
                onChange={(e) => setFormData({ ...formData, maxIdle: parseInt(e.target.value) || undefined })}
                placeholder="10"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600"
              />
            </div>

            {/* 扩展参数 */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                扩展参数
              </label>
              <input
                type="text"
                value={formData.extraParams || ''}
                onChange={(e) => setFormData({ ...formData, extraParams: e.target.value })}
                placeholder="例如: useSSL=false&serverTimezone=UTC"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600"
              />
            </div>

            {/* 描述 */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请输入描述信息（可选）"
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600 resize-none"
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
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            <Plug className="w-4 h-4" />
            {testing ? '测试中...' : '测试连接'}
          </button>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/datasources')}
              className="px-6 py-2.5 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
            >
              返回
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
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
