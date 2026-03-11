import { useState } from 'react';
import { Database, Lock, User } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

// 写死的账号密码
const VALID_USERNAME = 'admin';
const VALID_PASSWORD = 'admin123';

// 保存登录状态到localStorage
const saveLoginState = () => {
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('loginTime', new Date().toISOString());
};

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      saveLoginState();
      onLogin();
    } else {
      setError('用户名或密码错误');
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
            {/* 用户名 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-white placeholder-slate-500"
                  placeholder="请输入用户名"
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
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              登录
            </button>
          </form>

          {/* 提示 */}
          <div className="mt-6 text-center text-sm text-slate-500">
            演示账号: admin / admin123
          </div>
        </div>
      </div>
    </div>
  );
}
