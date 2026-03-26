import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { getSystemConfigDetail, saveSystemConfig } from '../lib/api';
import type { SystemConfig } from '../types';

export default function SystemConfigForm({ overrideId }: { overrideId?: string }) {
  const params = useParams();
  const id = overrideId || params.id;
  const navigate = useNavigate();
  const isEdit = id && id !== 'new';

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<SystemConfig>>({
    code: '',
    name: '',
    value: '',
    type: 'string',
    groupName: '',
    description: '',
    status: 1,
  });

  useEffect(() => {
    if (isEdit && id) {
      loadConfig(parseInt(id));
    }
  }, [id]);

  const loadConfig = async (configId: number) => {
    setLoading(true);
    try {
      const config = await getSystemConfigDetail(configId);
      if (config) {
        setFormData(config);
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const saved = await saveSystemConfig(formData);
      if (saved) {
        navigate('/config');
      }
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--text-muted)]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => navigate('/config')}
          className="p-2 hover:bg-[var(--bg-tertiary)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">
          {isEdit ? '编辑参数' : '新增参数'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
        <div className="bg-[var(--bg-table-header)] rounded-lg border border-[var(--border-light)] p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">参数编码</label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm font-mono focus:outline-none focus:border-[var(--accent-light)]"
                placeholder="如: system.name"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">参数名称</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">参数值</label>
              <input
                type="text"
                value={formData.value || ''}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm font-mono focus:outline-none focus:border-[var(--accent-light)]"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">类型</label>
              <select
                value={formData.type || 'string'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'string' | 'number' | 'boolean' })}
                className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
              >
                <option value="string">字符串</option>
                <option value="number">数字</option>
                <option value="boolean">布尔</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">参数分组</label>
              <input
                type="text"
                value={formData.groupName || ''}
                onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
                placeholder="如: 系统配置"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">状态</label>
              <select
                value={formData.status || 1}
                onChange={(e) => setFormData({ ...formData, status: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
              >
                <option value={1}>启用</option>
                <option value={0}>禁用</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-[var(--text-muted)] mb-1">描述</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/config')}
            className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-colors text-sm"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}
