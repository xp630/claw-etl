import { useState } from 'react';
import { Database, Lock, User } from 'lucide-react';
import { userLogin } from '../lib/api';

interface LoginProps {
  onLogin: () => void;
}

// 保存登录状态到localStorage
const saveLoginState = (user: any) => {
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('loginTime', new Date().toISOString());
  localStorage.setItem('user', JSON.stringify(user));
};

export default function Login({ onLogin }: LoginProps) {
  const [employeeNo, setEmployeeNo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeNo || !password) {
      setError('请输入工号和密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await userLogin(employeeNo, password);
      if (result.success) {
        saveLoginState(result.user);
        onLogin();
      } else {
        setError(result.message || '工号或密码错误');
      }
    } catch (err: any) {
      setError(err?.message || '登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4">
            <Database className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Claw-ETL</h1>
          <p className="text-slate-400 mt-2">数据同步配置管理系统</p>
        </div>

        {/* 登录表单 */}
        <div className="bg-[#1e293b]/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 工号 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">工号</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={employeeNo}
                  onChange={(e) => setEmployeeNo(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-500"
                  placeholder="请输入工号"
                />
              </div>
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-500"
                  placeholder="请输入密码"
                />
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="text-red-400 text-sm text-center">{error}</div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
