import { useState } from 'react';
import { X, Lock, Eye, EyeOff } from 'lucide-react';
import { changePassword } from '../lib/api';
import { encryptPassword } from '../lib/crypto';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  employeeNo: string;
  onSuccess?: () => void;
}

export default function ChangePasswordModal({
  visible,
  onClose,
  employeeNo,
  onSuccess,
}: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!visible) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证
    if (!oldPassword) {
      setError('请输入旧密码');
      return;
    }
    if (!newPassword) {
      setError('请输入新密码');
      return;
    }
    if (newPassword.length < 6) {
      setError('新密码长度不能少于6位');
      return;
    }
    if (oldPassword === newPassword) {
      setError('新密码不能与旧密码相同');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }

    setLoading(true);
    try {
      // 使用 MD5 加密传输
      const encryptedOld = encryptPassword(oldPassword);
      const encryptedNew = encryptPassword(newPassword);

      const result = await changePassword(employeeNo, encryptedOld, encryptedNew);
      if (result.success) {
        onSuccess?.();
        onClose();
        // 清空表单
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        alert('密码修改成功，请重新登录');
        // 退出登录
        localStorage.removeItem('isLoggedIn');
        window.location.reload();
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err?.message || '修改密码失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] w-full max-w-md overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h3 className="text-lg font-medium text-[var(--text-primary)]">修改密码</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 旧密码 */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              旧密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-light)]"
                placeholder="请输入旧密码"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* 新密码 */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              新密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-light)]"
                placeholder="请输入新密码（至少6位）"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* 确认新密码 */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
              确认新密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-light)]"
                placeholder="请再次输入新密码"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}

          {/* 按钮 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
            >
              {loading ? '提交中...' : '确认修改'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
