import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Copy } from 'lucide-react';

interface ApiApp {
  appName: string;
  appKey?: string;
  appSecret?: string;
  appType?: string;
  description?: string;
  expireTime?: string;
  status: number;
}

export default function AppForm({ overrideId }: { overrideId?: string }) {
  const navigate = useNavigate();
  const params = useParams();
  const id = overrideId || params.id;
  const isEdit = !!id;

  const [formData, setFormData] = useState<ApiApp>({
    appName: '',
    appKey: '',
    appSecret: '',
    appType: 'web',
    description: '',
    expireTime: '',
    status: 1,
  });

  const [saving, setSaving] = useState(false);

  const generateAppKey = () => {
    const key = 'ak_' + Math.random().toString(36).substring(2, 10);
    setFormData({ ...formData, appKey: key });
  };

  const generateAppSecret = () => {
    const secret = 'sk_' + Math.random().toString(36).substring(2, 18);
    setFormData({ ...formData, appSecret: secret });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板');
  };

  const handleSave = async () => {
    if (!formData.appName) {
      alert('请输入应用名称');
      return;
    }
    if (!formData.appKey) {
      alert('请生成AppKey');
      return;
    }
    if (!formData.appSecret) {
      alert('请生成AppSecret');
      return;
    }

    setSaving(true);
    try {
      // TODO: 调用保存接口
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/apps');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-light)]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/apps')}
            className="p-2 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">
            {isEdit ? '编辑应用' : '创建应用'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/apps')}
            className="px-4 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--warning)] text-white rounded-lg hover:bg-[var(--warning)]/80 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>

      {/* 内容 */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-6">
          <div className="bg-[var(--bg-secondary)]/60 rounded-xl border border-[var(--border-light)] p-6 space-y-4">
            <h3 className="text-[var(--text-primary)] font-medium">基本信息</h3>

            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">应用名称 *</label>
              <input
                type="text"
                value={formData.appName}
                onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                placeholder="例如：我的Web应用"
                className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">应用类型</label>
              <select
                value={formData.appType}
                onChange={(e) => setFormData({ ...formData, appType: e.target.value })}
                className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)]"
              >
                <option value="web">Web应用</option>
                <option value="app">移动App</option>
                <option value="other">其他</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">过期时间</label>
              <input
                type="datetime-local"
                value={formData.expireTime}
                onChange={(e) => setFormData({ ...formData, expireTime: e.target.value })}
                className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)]"
              />
            </div>
          </div>

          <div className="bg-[var(--bg-secondary)]/60 rounded-xl border border-[var(--border-light)] p-6 space-y-4">
            <h3 className="text-[var(--text-primary)] font-medium">密钥配置</h3>

            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">AppKey</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.appKey}
                  readOnly
                  placeholder="点击生成"
                  className="flex-1 px-4 py-2.5 bg-[var(--bg-table-header)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] font-mono"
                />
                <button
                  onClick={generateAppKey}
                  className="px-4 py-2 bg-[var(--warning)] text-white rounded-lg hover:bg-[var(--warning)]/80"
                >
                  生成
                </button>
                {formData.appKey && (
                  <button
                    onClick={() => handleCopy(formData.appKey || '')}
                    className="p-2 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-hover)]"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-2">AppSecret</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={formData.appSecret}
                  readOnly
                  placeholder="点击生成"
                  className="flex-1 px-4 py-2.5 bg-[var(--bg-table-header)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] font-mono"
                />
                <button
                  onClick={generateAppSecret}
                  className="px-4 py-2 bg-[var(--warning)] text-white rounded-lg hover:bg-[var(--warning)]/80"
                >
                  生成
                </button>
                {formData.appSecret && (
                  <button
                    onClick={() => handleCopy(formData.appSecret || '')}
                    className="p-2 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-hover)]"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                * AppSecret只会显示一次，请妥善保存
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
