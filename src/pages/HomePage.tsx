import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const navigate = useNavigate();

  const cards = [
    { title: '欢迎使用', desc: '系统首页', color: '#e3f2fd', icon: '🏠' },
    { title: '快捷入口', desc: '常用功能', color: '#f3e5f5', icon: '⚡' },
    { title: '数据统计', desc: '运营概览', color: '#e8f5e9', icon: '📊' },
    { title: '最近更新', desc: '最新动态', color: '#fff3e0', icon: '🕐' },
  ];

  const shortcuts = [
    { name: '数据源管理', path: '/datasources', icon: '🗄️' },
    { name: '任务管理', path: '/tasks', icon: '📋' },
    { name: '页面管理', path: '/pages', icon: '📄' },
    { name: '系统设置', path: '/config', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* 顶部标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">欢迎回来</h1>
        <p className="text-gray-500 mt-1">美好的一天，从这里开始</p>
      </div>

      {/* 彩色卡片区域 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {cards.map((card, i) => (
          <div
            key={i}
            className="rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            style={{ backgroundColor: card.color }}
            onClick={() => navigate(`/${card.title.includes('欢迎') ? 'datasources' : card.title.includes('快捷') ? 'tasks' : card.title.includes('数据') ? 'pages' : 'config'}`)}
          >
            <div className="text-2xl mb-2">{card.icon}</div>
            <h3 className="font-medium text-gray-800">{card.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* 快捷入口 */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <h2 className="text-lg font-medium text-gray-700 mb-4">快捷入口</h2>
        <div className="grid grid-cols-4 gap-4">
          {shortcuts.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors"
              onClick={() => navigate(s.path)}
            >
              <span className="text-xl">{s.icon}</span>
              <span className="text-sm text-gray-700">{s.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
