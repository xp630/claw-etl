import { useState, useEffect } from 'react';
import { Search, RefreshCw, Download, Eye, Trash2 } from 'lucide-react';

// 访问日志类型
interface AccessLog {
  id: number;
  apiId: number;
  apiName: string;
  apiPath: string;
  appId?: number;
  appName?: string;
  accessTime: string;
  requestMethod: string;
  requestParams?: string;
  responseStatus?: number;
  responseTime?: number;
  responseData?: string;
  errorMsg?: string;
  clientIp?: string;
  userAgent?: string;
}

// 模拟数据
const MOCK_LOGS: AccessLog[] = [
  {
    id: 1,
    apiId: 1,
    apiName: '用户查询',
    apiPath: '/api/user/list',
    appId: 1,
    appName: 'Web应用',
    accessTime: '2026-03-11 23:15:30',
    requestMethod: 'POST',
    requestParams: '{"page":1,"pageSize":10}',
    responseStatus: 200,
    responseTime: 125,
    responseData: '{"code":1,"data":{"list":[]}}',
    clientIp: '192.168.1.100',
    userAgent: 'Mozilla/5.0...'
  },
  {
    id: 2,
    apiId: 2,
    apiName: '订单查询',
    apiPath: '/api/order/list',
    appId: 2,
    appName: '移动App',
    accessTime: '2026-03-11 23:14:20',
    requestMethod: 'POST',
    requestParams: '{"status":1}',
    responseStatus: 500,
    responseTime: 50,
    errorMsg: 'SQL执行异常',
    clientIp: '192.168.1.101'
  },
  {
    id: 3,
    apiId: 1,
    apiName: '用户查询',
    apiPath: '/api/user/list',
    accessTime: '2026-03-11 23:10:15',
    requestMethod: 'GET',
    responseStatus: 404,
    responseTime: 10,
    errorMsg: 'API不存在',
    clientIp: '192.168.1.102'
  },
];

export default function ApiAccessLog() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AccessLog | null>(null);
  
  // 筛选条件
  const [apiId, setApiId] = useState<number | undefined>();
  const [appId, setAppId] = useState<number | undefined>();
  const [keyword, setKeyword] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [responseStatus, setResponseStatus] = useState<number | undefined>();

  useEffect(() => {
    loadLogs();
  }, [apiId, appId, keyword, startTime, endTime, responseStatus]);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: 调用后端接口
      // 模拟接口返回
      await new Promise(resolve => setTimeout(resolve, 500));
      setLogs(MOCK_LOGS);
    } catch (err) {
      console.error('Failed to load logs:', err);
      setError('加载日志失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    alert('导出功能开发中');
  };

  const formatJson = (str: string | undefined) => {
    if (!str) return '-';
    try {
      return JSON.stringify(JSON.parse(str), null, 2);
    } catch {
      return str;
    }
  };

  const getStatusColor = (status: number | undefined) => {
    if (!status) return 'text-slate-400';
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 400 && status < 500) return 'text-yellow-400';
    if (status >= 500) return 'text-red-400';
    return 'text-slate-400';
  };

  return (
    <div className="p-6">
      {/* 标题 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/20">
            <Eye className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">API访问日志</h1>
            <p className="text-xs text-slate-500">记录API调用详情</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:opacity-90 transition-opacity"
        >
          <Download className="w-4 h-4" />
          导出日志
        </button>
      </div>

      {/* 筛选条件 */}
      <div className="bg-[#1e293b]/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 mb-6">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">API名称</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索API名称"
              className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-600"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">开始时间</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">结束时间</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">响应状态</label>
            <select
              value={responseStatus || ''}
              onChange={(e) => setResponseStatus(e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200"
            >
              <option value="">全部</option>
              <option value="200">成功 (200)</option>
              <option value="400">客户端错误 (400)</option>
              <option value="500">服务端错误 (500)</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={loadLogs}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400">
          {error}
        </div>
      )}

      {/* 日志列表 */}
      <div className="bg-[#1e293b]/60 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800/30">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">时间</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">API</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">应用</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">请求方式</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">状态</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">响应时间</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">客户端IP</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  加载中...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                  暂无日志
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-slate-300 text-sm">{log.accessTime}</td>
                  <td className="px-4 py-3">
                    <div className="text-white">{log.apiName}</div>
                    <div className="text-slate-500 text-xs">{log.apiPath}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{log.appName || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      log.requestMethod === 'GET' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {log.requestMethod}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-medium ${getStatusColor(log.responseStatus)}`}>
                    {log.responseStatus || '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-300 text-sm">
                    {log.responseTime ? `${log.responseTime}ms` : '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{log.clientIp || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-2 hover:bg-cyan-500/10 rounded-lg text-cyan-400 transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 详情弹窗 */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedLog(null)}>
          <div className="bg-[#1e293b] rounded-xl border border-slate50 w-full-700/ max-w-3xl max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <h3 className="text-lg font-bold text-white">访问详情</h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(80vh-60px)]">
              {/* 基本信息 */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-400 mb-3">基本信息</h4>
                <div className="grid grid-cols-2 gap-4 bg-slate-800/30 p-4 rounded-lg">
                  <div>
                    <div className="text-xs text-slate-500">API名称</div>
                    <div className="text-white">{selectedLog.apiName}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">API路径</div>
                    <div className="text-white font-mono text-sm">{selectedLog.apiPath}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">访问时间</div>
                    <div className="text-white">{selectedLog.accessTime}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">响应状态</div>
                    <div className={`font-medium ${getStatusColor(selectedLog.responseStatus)}`}>
                      {selectedLog.responseStatus || '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">响应时间</div>
                    <div className="text-white">{selectedLog.responseTime ? `${selectedLog.responseTime}ms` : '-'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">客户端IP</div>
                    <div className="text-white">{selectedLog.clientIp || '-'}</div>
                  </div>
                </div>
              </div>

              {/* 请求参数 */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-400 mb-3">请求参数</h4>
                <pre className="bg-slate-800/30 p-4 rounded-lg text-sm text-slate-300 overflow-auto max-h-40">
                  {formatJson(selectedLog.requestParams)}
                </pre>
              </div>

              {/* 响应数据 */}
              {selectedLog.responseData && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-slate-400 mb-3">响应数据</h4>
                  <pre className="bg-slate-800/30 p-4 rounded-lg text-sm text-slate-300 overflow-auto max-h-60">
                    {formatJson(selectedLog.responseData)}
                  </pre>
                </div>
              )}

              {/* 错误信息 */}
              {selectedLog.errorMsg && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-red-400 mb-3">错误信息</h4>
                  <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg text-red-300 text-sm">
                    {selectedLog.errorMsg}
                  </div>
                </div>
              )}

              {/* 用户代理 */}
              {selectedLog.userAgent && (
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-3">用户代理</h4>
                  <div className="bg-slate-800/30 p-4 rounded-lg text-xs text-slate-500 break-all">
                    {selectedLog.userAgent}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
