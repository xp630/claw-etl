import { Outlet, NavLink } from 'react-router-dom';
import { Database, ListTodo, LogOut } from 'lucide-react';

export default function Layout() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex">
      {/* 左侧导航 */}
      <aside className="w-60 bg-[#1e293b]/80 backdrop-blur-xl border-r border-slate-700/50 flex flex-col">
        {/* Logo */}
        <div className="p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg text-white">Claw-ETL</span>
              <div className="text-xs text-slate-500">数据同步系统</div>
            </div>
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 p-4 space-y-2">
          <NavLink
            to="/datasources"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`
            }
          >
            <Database className="w-5 h-5" />
            <span>数据源管理</span>
          </NavLink>

          <NavLink
            to="/tasks"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`
            }
          >
            <ListTodo className="w-5 h-5" />
            <span>任务管理</span>
          </NavLink>
        </nav>

        {/* 底部 */}
        <div className="p-4 border-t border-slate-700/50">
          <button
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-red-400 transition-colors w-full"
            onClick={() => window.location.href = '/login'}
          >
            <LogOut className="w-5 h-5" />
            <span>退出登录</span>
          </button>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
