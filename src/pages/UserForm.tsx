import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, User as UserIcon } from 'lucide-react';
import { getUserDetail, saveUser } from '../lib/api';
import { useToast } from '../components/Toast';
import type { SysUser } from '../types';

export default function UserForm({ overrideId }: { overrideId?: string }) {
  const navigate = useNavigate();
  const params = useParams();
  const id = overrideId || params.id;
  const isEdit = Boolean(id);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [formData, setFormData] = useState<Partial<SysUser>>({
    name: '',
    phone: '',
    employeeNo: '',
    password: '',
    status: 1,
  });

  useEffect(() => {
    if (isEdit && id && !dataLoaded) {
      setDataLoaded(true);
      loadUser(parseInt(id));
    }
  }, [id, dataLoaded]);

  const loadUser = async (userId: number) => {
    setLoading(true);
    try {
      const data = await getUserDetail(userId);
      if (data) {
        // 编辑时不清空密码
        const { password, ...rest } = data;
        setFormData({ ...rest, password: '' });
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  const canSave = () => {
    if (!formData.name || !formData.phone || !formData.employeeNo) {
      return false;
    }
    // 新增时密码必填
    if (!isEdit && !formData.password) {
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSave()) {
      showToast('请填写必填项', 'error');
      return;
    }

    setSaving(true);
    try {
      await saveUser(formData);
      showToast(isEdit ? '更新成功' : '创建成功', 'success');
      navigate('/users');
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
          onClick={() => navigate('/users')}
          className="p-2 hover:bg-slate-800/50 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <UserIcon className="w-6 h-6 text-purple-400" />
          <h1 className="text-xl font-bold text-white">{isEdit ? '编辑用户' : '新增用户'}</h1>
        </div>
      </div>

      {/* 表单 */}
      <form onSubmit={handleSubmit}>
        <div className="bg-gradient-to-br from-slate-800/80 to-[#1e293b]/60 backdrop-blur-xl rounded-xl border border-purple-500/30 p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-5 bg-purple-500 rounded-full"></div>
            <h3 className="text-base font-medium text-purple-400">基本信息</h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {/* 姓名 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                姓名 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入姓名"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-white placeholder-slate-600"
              />
            </div>

            {/* 工号 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                工号 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.employeeNo}
                onChange={(e) => setFormData({ ...formData, employeeNo: e.target.value })}
                placeholder="请输入工号"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-white placeholder-slate-600"
              />
            </div>

            {/* 手机号 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                手机号 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="请输入手机号"
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-white placeholder-slate-600"
              />
            </div>

            {/* 状态 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                状态 <span className="text-red-400">*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-white"
              >
                <option value={1}>启用</option>
                <option value={0}>禁用</option>
              </select>
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                密码 <span className="text-red-400">{isEdit ? '' : '*'}</span>
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={isEdit ? '不修改请留空' : '请输入密码'}
                className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-white placeholder-slate-600"
              />
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end mt-6">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/users')}
              className="px-6 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
            >
              返回
            </button>
            <button
              type="submit"
              disabled={saving || !canSave()}
              className="flex items-center gap-2 px-6 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
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