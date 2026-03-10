import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Zap, Database, Table, Download } from 'lucide-react';
import { getTask, createTask, updateTask, getDataSources } from '../lib/api';
import type { Task, DataSource } from '../types';

const WINDOW_UNITS = [
  { value: 'minutes', label: '分钟' },
  { value: 'hours', label: '小时' },
  { value: 'days', label: '天' },
];

export default function TaskForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [datasources, setDatasources] = useState<DataSource[]>([]);

  const [formData, setFormData] = useState<Partial<Task>>({
    name: '',
    source_id: undefined,
    query_sql: '',
    target_id: undefined,
    target_table: '',
    columns: '',
    dynamic_sql: '',
    window_value: 1,
    window_unit: 'hours',
  });

  useEffect(() => {
    loadDatasources();
    if (isEdit && id) {
      loadTask(parseInt(id));
    }
  }, [id]);

  const loadDatasources = async () => {
    try {
      const data = await getDataSources();
      setDatasources(data);
    } catch (error) {
      console.error('Failed to load datasources:', error);
    }
  };

  const loadTask = async (taskId: number) => {
    setLoading(true);
    try {
      const data = await getTask(taskId);
      if (data) {
        setFormData(data);
      }
    } catch (error) {
      console.error('Failed to load task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.source_id || !formData.query_sql || 
        !formData.target_id || !formData.target_table || !formData.columns) {
      alert('请填写必填项');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && id) {
        await updateTask(parseInt(id), formData);
      } else {
        await createTask(formData);
      }
      navigate('/tasks');
    } catch (error) {
      alert('保存失败');
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
          onClick={() => navigate('/tasks')}
          className="p-2 hover:bg-slate-800/50 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">{isEdit ? '编辑任务' : '新增任务'}</h1>
          <p className="text-xs text-slate-500">配置数据同步任务</p>
        </div>
      </div>

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 源数据 */}
        <div className="bg-[#1e293b]/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-medium text-white">源数据</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                源数据库 <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.source_id || ''}
                onChange={(e) => setFormData({ ...formData, source_id: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white"
              >
                <option value="">请选择</option>
                {datasources.map((ds) => (
                  <option key={ds.id} value={ds.id}>{ds.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                任务名称 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                查询语句 <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.query_sql}
                onChange={(e) => setFormData({ ...formData, query_sql: e.target.value })}
                placeholder="请输入"
                rows={4}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600 resize-none font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* 目标数据 */}
        <div className="bg-[#1e293b]/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Table className="w-5 h-5 text-green-400" />
            <h2 className="text-lg font-medium text-white">目标数据</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                目标数据库 <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.target_id || ''}
                onChange={(e) => setFormData({ ...formData, target_id: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white"
              >
                <option value="">请选择</option>
                {datasources.map((ds) => (
                  <option key={ds.id} value={ds.id}>{ds.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                目标表名 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.target_table}
                onChange={(e) => setFormData({ ...formData, target_table: e.target.value })}
                placeholder="请输入"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                列名 <span className="text-red-400">*</span>
                <span className="text-slate-500 font-normal ml-2">用英文,多个时用英文逗号隔开</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.columns}
                  onChange={(e) => setFormData({ ...formData, columns: e.target.value })}
                  placeholder="id,name,price,create_time"
                  className="flex-1 px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600"
                />
                <button
                  type="button"
                  className="px-4 py-2.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  自动获取
                </button>
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                动态参数SQL
                <span className="text-slate-500 font-normal ml-2">请参考:select ifnull({'{timeColumn}'},' default') as dynamicParam from {'{table}'}</span>
              </label>
              <input
                type="text"
                value={formData.dynamic_sql}
                onChange={(e) => setFormData({ ...formData, dynamic_sql: e.target.value })}
                placeholder="请输入"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-600 font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* 执行周期 */}
        <div className="bg-[#1e293b]/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-medium text-white">执行周期</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                执行窗口时长 <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, window_value: Math.max(1, (formData.window_value || 1) - 1) })}
                  className="w-10 h-10 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white hover:bg-slate-700/50"
                >
                  -
                </button>
                <input
                  type="number"
                  value={formData.window_value}
                  onChange={(e) => setFormData({ ...formData, window_value: parseInt(e.target.value) })}
                  className="w-20 px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white text-center"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, window_value: (formData.window_value || 1) + 1 })}
                  className="w-10 h-10 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white hover:bg-slate-700/50"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                执行窗口单位 <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.window_unit}
                onChange={(e) => setFormData({ ...formData, window_unit: e.target.value as Task['window_unit'] })}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white"
              >
                {WINDOW_UNITS.map((unit) => (
                  <option key={unit.value} value={unit.value}>{unit.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/tasks')}
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
      </form>
    </div>
  );
}
