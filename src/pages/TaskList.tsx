import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import { getTasks, toggleTask } from '../lib/api';
import type { Task } from '../types';

export default function TaskList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTable, setSearchTable] = useState('');
  const [searchName, setSearchName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: number) => {
    await toggleTask(id);
    loadData();
  };

  const filteredTasks = tasks.filter(task => {
    const matchTable = !searchTable || task.target_table.toLowerCase().includes(searchTable.toLowerCase());
    const matchName = !searchName || task.name.toLowerCase().includes(searchName.toLowerCase());
    return matchTable && matchName;
  });

  const getIntervalText = (task: Task) => {
    return `${task.window_value} ${task.window_unit === 'minutes' ? 'MINUTES' : task.window_unit === 'hours' ? 'HOURS' : 'DAYS'}`;
  };

  return (
    <div className="p-6">
      {/* 标题 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-light)] to-pink-500/20 flex items-center justify-center border border-[var(--accent-light)]">
            <RefreshCw className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">任务管理</h1>
            <p className="text-xs text-[var(--text-muted)]">配置ETL同步任务</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/tasks/new')}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增
        </button>
      </div>

      {/* 搜索筛选 */}
      <div className="bg-[var(--bg-secondary)]/60 backdrop-blur-xl rounded-xl border border-[var(--border-light)] p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              placeholder="支持表名称查询"
              className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm text-[var(--text-input)] placeholder:text-[var(--text-muted)]"
            />
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="支持任务名称模糊查询"
              className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-sm text-[var(--text-input)] placeholder:text-[var(--text-muted)]"
            />
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors"
          >
            查询
          </button>
          <button
            onClick={() => { setSearchTable(''); setSearchName(''); }}
            className="px-4 py-2.5 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          >
            重置
          </button>
        </div>
      </div>

      {/* 表格 */}
      <div className="bg-[var(--bg-secondary)]/60 backdrop-blur-xl rounded-xl border border-[var(--border-light)] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[var(--bg-table-header)]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">任务名称</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">源库</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">目标库</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">目标表</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[var(--text-muted)] uppercase">状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">执行间隔</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">上次执行时间</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[var(--text-muted)] uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-light)]">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[var(--text-muted)]">
                  加载中...
                </td>
              </tr>
            ) : filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[var(--text-muted)]">
                  暂无数据
                </td>
              </tr>
            ) : (
              filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-[var(--bg-table-header)] transition-colors">
                  <td className="px-4 py-3 text-[var(--text-primary)] truncate font-medium">{task.name}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)] truncate">{task.source_name}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] truncate">{task.target_name || 'nr_data'}</td>
                  <td className="px-4 py-3 text-cyan-400 font-mono text-sm truncate max-w-[200px]">
                    {task.target_table}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(task.id)}
                      className={`transition-colors ${task.status === 1 ? 'text-[var(--info)]' : 'text-[var(--text-muted)]'}`}
                    >
                      {task.status === 1 ? (
                        <ToggleRight className="w-8 h-6" />
                      ) : (
                        <ToggleLeft className="w-8 h-6" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-[var(--accent-light)] text-[var(--accent)] rounded text-xs">
                      {getIntervalText(task)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)] truncate text-sm">
                    {task.last_run_time || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => navigate(`/tasks/${task.id}`)}
                        className="px-3 py-1.5 bg-[var(--info)]/10 text-[var(--info)] rounded hover:bg-[var(--info)]/20 transition-colors text-sm"
                      >
                        编辑
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
