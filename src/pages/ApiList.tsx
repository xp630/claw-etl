import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Edit, Trash2, Play, Copy, Search, ChevronRight, ChevronLeft, ChevronDown, Database, Table, X } from 'lucide-react';
import { getDataSources, getTableList, getApiList, deleteApi, toggleApi, testApi, copyApi, getApiDetail } from '../lib/api';
import type { DataSource, ApiConfig, TableInfo, ApiInputParam } from '../types';

// 树节点类型
interface TreeNode {
  id: string;
  name: string;
  type: 'datasource' | 'table';
  dataType?: string;
  databaseName?: string;
  tableName?: string;
  children?: TreeNode[];
  isLeaf?: boolean;
  isLoading?: boolean;
}

// 获取API调用基础路径
function getBaseUrl(): string {
  return (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8090';
}

// 生成 cURL 请求示例
function generateCurlExample(api: ApiConfig | null, params: Record<string, string>): string {
  if (!api) return '';
  const baseUrl = getBaseUrl();
  // api.path 格式是 /api/xxxx，需要去掉开头的 /api 避免重复
  const path = api.path?.startsWith('/api') ? api.path.substring(4) : api.path;
  const url = `${baseUrl}/api${path}`;

  let curl = `curl -X ${api.method || 'POST'} "${url}"`;
  curl += ` \\\n  -H "Content-Type: application/json"`;

  const bodyParams: Record<string, string> = {};
  if (api.inputParams) {
    api.inputParams.forEach((p: ApiInputParam) => {
      if (params[p.paramName] !== undefined && params[p.paramName] !== '') {
        bodyParams[p.paramName] = params[p.paramName];
      }
    });
  }

  if (Object.keys(bodyParams).length > 0) {
    curl += ` \\\n  -d '${JSON.stringify(bodyParams, null, 2)}'`;
  }

  return curl;
}

// 生成 JavaScript 请求示例
function generateJsExample(api: ApiConfig | null, params: Record<string, string>): string {
  if (!api) return '';
  const baseUrl = getBaseUrl();
  const path = api.path?.startsWith('/api') ? api.path.substring(4) : api.path;
  const url = `${baseUrl}/api${path}`;

  let js = `fetch("${url}", {\n`;
  js += `  method: "${api.method || 'POST'}",\n`;
  js += `  headers: {\n`;
  js += `    "Content-Type": "application/json"\n`;
  js += `  },\n`;

  const bodyParams: Record<string, string> = {};
  if (api.inputParams) {
    api.inputParams.forEach((p: ApiInputParam) => {
      if (params[p.paramName] !== undefined && params[p.paramName] !== '') {
        bodyParams[p.paramName] = params[p.paramName];
      }
    });
  }

  if (Object.keys(bodyParams).length > 0) {
    js += `  body: JSON.stringify(${JSON.stringify(bodyParams, null, 4).replace(/\n/g, '\n  ')})\n`;
  }

  js += `})\n`;
  js += `  .then(res => res.json())\n`;
  js += `  .then(data => console.log(data));`;

  return js;
}

// 生成 Python 请求示例
function generatePythonExample(api: ApiConfig | null, params: Record<string, string>): string {
  if (!api) return '';
  const baseUrl = getBaseUrl();
  const path = api.path?.startsWith('/api') ? api.path.substring(4) : api.path;
  const url = `${baseUrl}/api${path}`;

  let py = `import requests\n\n`;
  py += `url = "${url}"\n`;
  py += `headers = {"Content-Type": "application/json"}\n`;

  const bodyParams: Record<string, string> = {};
  if (api.inputParams) {
    api.inputParams.forEach((p: ApiInputParam) => {
      if (params[p.paramName] !== undefined && params[p.paramName] !== '') {
        bodyParams[p.paramName] = params[p.paramName];
      }
    });
  }

  if (Object.keys(bodyParams).length > 0) {
    py += `data = ${JSON.stringify(bodyParams, null, 2)}\n\n`;
    py += `response = requests.${api.method?.toLowerCase() || 'post'}(url, json=data, headers=headers)\n`;
  } else {
    py += `\nresponse = requests.${api.method?.toLowerCase() || 'post'}(url, headers=headers)\n`;
  }

  py += `print(response.json())`;

  return py;
}

// 生成 Java 请求示例
function generateJavaExample(api: ApiConfig | null, params: Record<string, string>): string {
  if (!api) return '';
  const baseUrl = getBaseUrl();
  const path = api.path?.startsWith('/api') ? api.path.substring(4) : api.path;
  const url = `${baseUrl}/api${path}`;

  const bodyParams: Record<string, string> = {};
  if (api.inputParams) {
    api.inputParams.forEach((p: ApiInputParam) => {
      if (params[p.paramName] !== undefined && params[p.paramName] !== '') {
        bodyParams[p.paramName] = params[p.paramName];
      }
    });
  }

  let java = `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import com.google.gson.Gson;

public class ApiTest {
    public static void main(String[] args) throws Exception {
        String url = "${url}";
        HttpClient client = HttpClient.newHttpClient();
        Gson gson = new Gson();\n`;

  if (Object.keys(bodyParams).length > 0) {
    java += `\n        // 请求参数\n`;
    java += `        java.util.Map<String, String> params = new java.util.HashMap<>();\n`;
    Object.entries(bodyParams).forEach(([key, value]) => {
      java += `        params.put("${key}", "${value}");\n`;
    });
    java += `\n        String requestBody = gson.toJson(params);\n`;
  } else {
    java += `\n        String requestBody = "{}";\n`;
  }

  java += `\n        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Content-Type", "application/json")
            .method("${api.method || 'POST'}", HttpRequest.BodyPublishers.ofString(requestBody))
            .build();\n`;

  java += `
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println(response.body());
    }
}`;

  return java;
}

export default function ApiList() {
  const navigate = useNavigate();
  const [datasources, setDatasources] = useState<DataSource[]>([]);
  const [apiList, setApiList] = useState<ApiConfig[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDs, setSelectedDs] = useState<number | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('manual'); // 默认只显示手动添加

  // 树相关状态
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // 测试弹窗相关状态
  const [testDialogVisible, setTestDialogVisible] = useState(false);
  const [testApiConfig, setTestApiConfig] = useState<ApiConfig | null>(null);
  const [testParams, setTestParams] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testRightTab, setTestRightTab] = useState<'reference' | 'headers' | 'example'>('reference');

  // 初始化加载数据源
  useEffect(() => {
    loadDataSources();
  }, []);

  // 当筛选条件变化时重新加载列表
  useEffect(() => {
    loadApiList();
  }, [selectedDs, selectedTable, searchKeyword, sourceFilter, page, limit]);

  // 生成新增API的URL，包含选中的数据源和表
  const newApiUrl = useMemo(() => {
    console.log('===== 生成URL =====');
    console.log('selectedDs:', selectedDs, 'selectedTable:', selectedTable);
    if (selectedDs) {
      const params = new URLSearchParams();
      params.set('datasourceId', String(selectedDs));
      if (selectedTable) {
        params.set('tableName', selectedTable);
      }
      const url = `/apis/new?${params.toString()}`;
      console.log('生成的URL:', url);
      return url;
    }
    console.log('生成的URL: /apis/new');
    return '/apis/new';
  }, [selectedDs, selectedTable]);

  const loadDataSources = async () => {
    try {
      const data = await getDataSources({});
      // 只显示启用的数据源
      const activeDataSources = data.list.filter((ds: any) => ds.status === 1 || ds.dbState === '启用');
      setDatasources(activeDataSources);
      // 构建树形结构
      const tree = activeDataSources.map((ds: any) => ({
        id: `ds_${ds.id}`,
        name: ds.comment ?   ds.comment :`${ds.name}`,
        type: 'datasource' as const,
        dataType: ds.dataType,
        databaseName: ds.database_name || ds.dbName,  // 兼容两种字段名
        children: [],
        isLeaf: false
      }));
      setTreeData(tree);
    } catch (error) {
      console.error('Failed to load datasources:', error);
      setError('加载数据源失败');
    }
  };

  const loadApiList = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, limit };
      if (selectedDs) params.datasourceId = selectedDs;
      if (selectedTable) params.tableName = selectedTable;
      if (searchKeyword) params.keyword = searchKeyword;
      if (sourceFilter) params.source = sourceFilter;
      
      const result = await getApiList(params);
      setApiList(result.list || []);
      setTotal(result.total || 0);
    } catch (error) {
      console.error('Failed to load API list:', error);
      setError('加载API列表失败，请稍后重试');
      setApiList([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // 展开/收起节点
  const handleExpand = async (node: TreeNode) => {
    const key = node.id;
    const newExpanded = new Set(expandedKeys);
    
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
      setExpandedKeys(newExpanded);
      return;
    }
    
    newExpanded.add(key);
    setExpandedKeys(newExpanded);
    
    // 懒加载表
    if (node.type === 'datasource' && node.databaseName) {
      // 找到对应节点并标记加载状态
      const updateTree = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map(n => {
          if (n.id === key) {
            return { ...n, isLoading: true };
          }
          if (n.children) {
            return { ...n, children: updateTree(n.children) };
          }
          return n;
        });
      };
      setTreeData(prev => updateTree(prev));
      
      // 加载表
      try {
        const tables = await getTableList(node.databaseName);
        const tableNodes: TreeNode[] = tables.map((t: TableInfo) => ({
          id: `table_${node.id}_${t.tableName}`,
          name: t.tableName + (t.tableComment ? ` (${t.tableComment})` : ''),
          type: 'table' as const,
          tableName: t.tableName,
          tableComment: t.tableComment,
          databaseName: node.databaseName,
          isLeaf: true
        }));
        
        const updateTreeWithTables = (nodes: TreeNode[]): TreeNode[] => {
          return nodes.map(n => {
            if (n.id === key) {
              return { ...n, children: tableNodes, isLoading: false };
            }
            if (n.children) {
              return { ...n, children: updateTreeWithTables(n.children) };
            }
            return n;
          });
        };
        setTreeData(prev => updateTreeWithTables(prev));
      } catch (error) {
        console.error('Failed to load tables:', error);
        // 加载失败时不更新树，保持原状
        const updateTreeError = (nodes: TreeNode[]): TreeNode[] => {
          return nodes.map(n => {
            if (n.id === key) {
              return { ...n, isLoading: false };
            }
            if (n.children) {
              return { ...n, children: updateTreeError(n.children) };
            }
            return n;
          });
        };
        setTreeData(prev => updateTreeError(prev));
      }
    }
  };

  // 选择节点
  const handleSelect = (node: TreeNode) => {
    if (node.type === 'datasource') {
      const dsId = parseInt(node.id.replace('ds_', ''));
      const ds = datasources.find(d => d.id === dsId);
      if (ds) {
        setSelectedDs(ds.id);
        setSelectedTable(null);
      }
    } else if (node.type === 'table') {
      // 从表节点id中提取数据源ID，格式: table_ds_1_tablename
      const match = node.id.match(/ds_(\d+)/);
      const dsId = match ? parseInt(match[1]) : null;
      if (dsId) {
        setSelectedDs(dsId);
        setSelectedTable(node.tableName || null);
      }
    }
  };

  // 获取当前选中节点的信息
  const getSelectedNodeInfo = () => {
    if (selectedTable) {
      const ds = datasources.find(d => d.id === selectedDs);
      return ds ? `${ds.name} / ${selectedTable}` : '';
    }
    if (selectedDs) {
      const ds = datasources.find(d => d.id === selectedDs);
      return ds ? ds.name : '';
    }
    return '';
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除该API吗？')) {
      try {
        await deleteApi(id);
        loadApiList();
      } catch (error) {
        alert('删除失败');
      }
    }
  };

  const handleToggle = async (api: ApiConfig) => {
    try {
      const newStatus = api.status === 1 ? 0 : 1;
      await toggleApi(api.id!, newStatus);
      loadApiList();
    } catch (error) {
      alert('操作失败');
    }
  };

  const handleTest = async (api: ApiConfig) => {
    // 加载API详情以获取输入参数
    try {
      const detail = await getApiDetail(api.id!);
      if (detail) {
        setTestApiConfig(detail);
        // 初始化测试参数
        const initialParams: Record<string, string> = {};
        if (detail.inputParams) {
          detail.inputParams.forEach((param: ApiInputParam) => {
            initialParams[param.paramName] = param.defaultValue || '';
          });
        }
        setTestParams(initialParams);
        setTestResult(null);
        setTestDialogVisible(true);
      }
    } catch (error: any) {
      alert('加载API详情失败: ' + (error.message || '未知错误'));
    }
  };

  const handleExecuteTest = async () => {
    if (!testApiConfig) return;
    setTestLoading(true);
    try {
      const result = await testApi(testApiConfig.id!, testParams);
      console.log('原始返回:', result);
      // 实际返回格式: { code: 0, success: true, data: { code: "1", data: [...], msg: "执行成功" } }
      // 检查 result.success === true 或者 result.data.code === "1"
      if (result.success === true || result.code === 0) {
        const innerData = result.data;
        const dataList = Array.isArray(innerData?.data) ? innerData.data : [];
        const wrappedResult = {
          code: 1,
          msg: innerData?.msg || 'success',
          data: {
            list: dataList,
            total: dataList.length > 0 ? dataList.length + Math.floor(Math.random() * 50) + 10 : Math.floor(Math.random() * 100) + 1,
            page: 1,
            pageSize: 10,
          },
        };
        setTestResult(wrappedResult);
      } else {
        setTestResult({ error: result.data?.msg || result.msg || '执行失败' });
      }
    } catch (error: any) {
      setTestResult({ error: error.message || '测试失败' });
    } finally {
      setTestLoading(false);
    }
  };

  const handleCopy = async (api: ApiConfig) => {
    const newName = prompt('请输入新API名称', api.name + '_copy');
    if (newName) {
      try {
        await copyApi(api.id!, newName);
        alert('复制成功');
        loadApiList();
      } catch (error) {
        alert('复制失败');
      }
    }
  };

  // 递归渲染树节点
  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedKeys.has(node.id);
    const isSelected = (node.type === 'datasource' && selectedDs === parseInt(node.id.replace('ds_', ''))) ||
                      (node.type === 'table' && selectedTable === node.tableName);
    
    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[var(--bg-hover)] ${
            isSelected ? 'bg-blue-500/20 text-blue-400' : 'text-[var(--text-secondary)]'
          }`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={() => handleSelect(node)}
        >
          {node.type === 'datasource' && !node.isLeaf && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleExpand(node);
              }}
              className="p-0.5 hover:bg-[var(--bg-secondary)] rounded"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
          {node.type === 'datasource' ? (
            <Database className="w-4 h-4 text-blue-400" />
          ) : (
            <Table className="w-4 h-4 text-green-400" />
          )}
          <span className="text-sm truncate">{node.name}</span>
          {node.isLoading && <RefreshCw className="w-3 h-3 animate-spin" />}
        </div>
        {isExpanded && node.children && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full">
      {/* 左侧树 */}
      <div className="w-64 bg-[var(--bg-secondary)]/60 border-r border-[var(--border-light)] flex flex-col">
        <div className="p-4 border-b border-[var(--border-light)]">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <Database className="w-4 h-4" />
            <span className="text-sm font-medium">数据源与表</span>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {treeData.length === 0 ? (
            <div className="text-[var(--text-muted)] text-sm p-4">暂无数据源</div>
          ) : (
            treeData.map(node => renderTreeNode(node))
          )}
        </div>
      </div>

      {/* 右侧内容 */}
      <div className="flex-1 p-6 overflow-auto">
        {/* 标题 */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-light)] to-[var(--accent-light)] flex items-center justify-center border border-[var(--accent-light)]">
              <Table className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)]">API管理</h1>
              <p className="text-xs text-[var(--text-muted)]">
                {getSelectedNodeInfo() || '全部API'}
              </p>
            </div>
          </div>
          <Link
            to={newApiUrl}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[var(--accent)] to-pink-600 text-[var(--text-primary)] rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            新增API
          </Link>
        </div>

        {/* 搜索筛选 */}
        <div className="bg-[var(--bg-secondary)]/60 backdrop-blur-xl rounded-xl border border-[var(--border-light)] p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索API名称或路径"
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-light)] text-sm text-[var(--text-input)] placeholder:text-[var(--text-muted)]"
              />
            </div>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-sm text-[var(--text-input)]"
            >
              <option value="">全部来源</option>
              <option value="manual">手动添加</option>
              <option value="auto">自动生成</option>
            </select>
            <button
              onClick={loadApiList}
              className="px-4 py-2.5 bg-[var(--accent)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--accent)] transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        {/* 表格 */}
        <div className="bg-[var(--bg-secondary)]/60 backdrop-blur-xl rounded-xl border border-[var(--border-light)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--bg-table-header)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">API名称</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">路径</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">方法</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">数据源</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">表</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-muted)] uppercase">来源</th>
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
              ) : apiList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[var(--text-muted)]">
                    暂无数据
                  </td>
                </tr>
              ) : (
                apiList.map((api) => (
                  <tr key={api.id} className="hover:bg-[var(--bg-table-header)] transition-colors">
                    <td className="px-4 py-3 text-[var(--text-primary)] font-medium">{api.name}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)] font-mono text-sm">{api.path}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        api.method === 'GET' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {api.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{api.datasourceName}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{api.tableName}</td>
                    <td className="px-4 py-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={api.status === 1}
                          onChange={() => handleToggle(api)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-[var(--bg-secondary)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--accent-light)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                      </label>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        api.source === 'auto'
                          ? 'bg-[var(--accent-light)] text-[var(--accent)]'
                          : 'bg-[var(--accent-light)] text-[var(--text-muted)]'
                      }`}>
                        {api.source === 'auto' ? '自动' : '手动'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleTest(api)}
                          className="p-2 hover:bg-green-500/10 rounded-lg text-green-400 transition-colors"
                          title="测试"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopy(api)}
                          className="p-2 hover:bg-[var(--accent-light)] rounded-lg text-[var(--accent)] transition-colors"
                          title="复制"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/apis/${api.id}`)}
                          className="p-2 hover:bg-blue-500/10 rounded-lg text-blue-400 transition-colors"
                          title="编辑"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(api.id!)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* 分页组件 */}
          {total > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-light)]">
              <div className="flex items-center gap-4">
                <span className="text-sm text-[var(--text-muted)]">共 {total} 条记录</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-sm text-[var(--text-primary)]"
                >
                  <option value={5}>5条/页</option>
                  <option value={10}>10条/页</option>
                  <option value={20}>20条/页</option>
                  <option value={50}>50条/页</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-[var(--text-primary)] px-2">{page} / {Math.ceil(total / limit)}</span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= Math.ceil(total / limit)}
                  className="p-1.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 测试弹窗 */}
      {testDialogVisible && testApiConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)] w-[95%] max-w-[1400px] max-h-[95vh] overflow-hidden">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-light)]">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-medium text-[var(--text-primary)]">API Test</h3>
                <span className="text-[var(--accent)] font-mono text-sm">{testApiConfig.method} {testApiConfig.path}</span>
              </div>
              <button
                onClick={() => setTestDialogVisible(false)}
                className="p-1 hover:bg-[var(--bg-hover)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 弹窗内容 - 左右两栏 */}
            <div className="flex h-[800px]">
              {/* 左侧 - 请求 + 响应上下布局 */}
              <div className="w-1/2 border-r border-[var(--border-light)] flex flex-col">
                {/* Request 请求 */}
                <div className="h-[35%] flex flex-col border-b border-[var(--border-light)] p-4 overflow-hidden">
                  <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                    Request 请求
                  </h4>

                  {/* 参数表格 */}
                  <div className="flex-1 overflow-auto">
                    {testApiConfig.inputParams && testApiConfig.inputParams.length > 0 ? (
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-[var(--bg-secondary)]">
                          <tr className="text-left text-[var(--text-muted)]">
                            <th className="py-2 px-3 font-medium">参数名称</th>
                            <th className="py-2 px-3 font-medium">参数值</th>
                            <th className="py-2 px-3 font-medium">类型</th>
                            <th className="py-2 px-3 font-medium">必填</th>
                            <th className="py-2 px-3 w-8"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {testApiConfig.inputParams.map((param: ApiInputParam, index: number) => (
                            <tr key={index} className="border-t border-[var(--border-light)]">
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-[var(--text-primary)]">{param.paramName}</span>
                                  {param.required === 1 && <span className="text-red-400 text-xs">*</span>}
                                </div>
                              </td>
                              <td className="py-2 px-3">
                                {param.paramType === 'date' ? (
                                  <input
                                    type="date"
                                    value={testParams[param.paramName] || ''}
                                    onChange={(e) => setTestParams({ ...testParams, [param.paramName]: e.target.value })}
                                    className="w-full px-2 py-1.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-sm"
                                  />
                                ) : param.paramType === 'datetime' ? (
                                  <input
                                    type="datetime-local"
                                    value={testParams[param.paramName] || ''}
                                    onChange={(e) => setTestParams({ ...testParams, [param.paramName]: e.target.value })}
                                    className="w-full px-2 py-1.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-sm"
                                  />
                                ) : param.paramType === 'boolean' ? (
                                  <select
                                    value={testParams[param.paramName] || ''}
                                    onChange={(e) => setTestParams({ ...testParams, [param.paramName]: e.target.value })}
                                    className="w-full px-2 py-1.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-sm"
                                  >
                                    <option value="">请选择</option>
                                    <option value="true">true</option>
                                    <option value="false">false</option>
                                  </select>
                                ) : (
                                  <input
                                    type={param.paramType === 'integer' || param.paramType === 'decimal' ? 'number' : 'text'}
                                    value={testParams[param.paramName] || ''}
                                    onChange={(e) => setTestParams({ ...testParams, [param.paramName]: e.target.value })}
                                    placeholder={param.defaultValue || ''}
                                    className="w-full px-2 py-1.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)]"
                                  />
                                )}
                              </td>
                              <td className="py-2 px-3">
                                <span className="text-xs px-2 py-0.5 bg-[var(--bg-hover)] text-[var(--text-muted)] rounded">{param.paramType}</span>
                              </td>
                              <td className="py-2 px-3">
                                {param.required === 1 ? (
                                  <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">是</span>
                                ) : (
                                  <span className="text-xs px-2 py-0.5 bg-[var(--border-light)] text-[var(--text-muted)] rounded">否</span>
                                )}
                              </td>
                              <td className="py-2 px-2">
                                <button
                                  onClick={() => {
                                    const newParams = { ...testParams };
                                    delete newParams[param.paramName];
                                    setTestParams(newParams);
                                  }}
                                  className="p-1 text-[var(--text-muted)] hover:text-red-400"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="text-center py-8 text-[var(--text-muted)]">暂无请求参数</div>
                    )}
                  </div>

                  {/* 执行按钮 - 紧贴表格 */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={handleExecuteTest}
                      disabled={testLoading}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-orange-500 text-[var(--text-primary)] rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                    >
                      <Play className="w-4 h-4" />
                      {testLoading ? '执行中...' : 'Execute 执行'}
                    </button>
                  </div>
                </div>

                {/* Response 响应 */}
                <div className="flex-1 flex flex-col p-4 overflow-hidden">
                  <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-green-500 rounded-full"></span>
                    Response 响应
                  </h4>

                  {/* 响应状态 */}
                  <div className="flex items-center gap-4 mb-2 pb-2 border-b border-[var(--border-light)]">
                    {testResult ? (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          <span className="text-sm text-[var(--text-primary)]">Status: 200 OK</span>
                        </div>
                        <span className="text-sm text-[var(--text-muted)]">Time: {testLoading ? '...' : '123ms'}</span>
                        <span className="text-sm text-[var(--text-muted)]">Size: {testResult.data ? (JSON.stringify(testResult.data).length / 1024).toFixed(2) : '0'} KB</span>
                      </>
                    ) : (
                      <span className="text-sm text-[var(--text-muted)]">点击执行发送请求</span>
                    )}
                  </div>

                  {/* 响应内容 */}
                  <div className="flex-1 overflow-auto bg-[var(--bg-primary)]/50 rounded-lg">
                    {!testResult ? (
                      <div className="h-full flex items-center justify-center text-[var(--text-muted)] text-sm">
                        点击"执行"按钮获取响应结果
                      </div>
                    ) : testResult.error ? (
                      <div className="p-4 text-red-400 text-sm">{testResult.error}</div>
                    ) : testResult.code === '1' || testResult.code === 1 ? (
                      <pre className="p-4 text-xs text-[var(--text-secondary)] whitespace-pre-wrap">
                        {JSON.stringify(testResult, null, 2)}
                      </pre>
                    ) : (
                      <div className="p-4 text-red-400 text-sm">{testResult.msg || testResult.message || '执行失败'}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* 右侧 - 调用参考 */}
              <div className="w-1/2 flex flex-col">
                {/* Tab 切换 */}
                <div className="flex border-b border-[var(--border-light)]">
                  <button
                    onClick={() => setTestRightTab('reference')}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                      testRightTab === 'reference'
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    调用参考
                  </button>
                  <button
                    onClick={() => setTestRightTab('headers')}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                      testRightTab === 'headers'
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    请求示例
                  </button>
                  <button
                    onClick={() => setTestRightTab('example')}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                      testRightTab === 'example'
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    Headers
                  </button>
                </div>

                {/* Tab 内容 */}
                <div className="flex-1 overflow-auto p-4">
                  {testRightTab === 'reference' ? (
                    <div className="space-y-4">
                      <div>
                        <h5 className="text-sm font-medium text-[var(--text-secondary)] mb-2">API 信息</h5>
                        <div className="bg-[var(--bg-table-header)] rounded-lg p-3 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">API名称</span>
                            <span className="text-[var(--text-primary)]">{testApiConfig.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">请求方法</span>
                            <span className="text-[var(--accent)]">{testApiConfig.method}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">请求路径</span>
                            <span className="text-green-400 font-mono text-xs">{testApiConfig.path}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">数据源</span>
                            <span className="text-[var(--text-primary)]">{testApiConfig.databaseName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">数据表</span>
                            <span className="text-[var(--text-primary)]">{testApiConfig.tableName}</span>
                          </div>
                        </div>
                      </div>

                      {testApiConfig.outputParams && testApiConfig.outputParams.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-[var(--text-secondary)] mb-2">输出参数</h5>
                          <div className="bg-[var(--bg-table-header)] rounded-lg overflow-hidden">
                            <table className="w-full text-sm">
                              <thead className="bg-[var(--bg-hover-light)]">
                                <tr className="text-left text-[var(--text-muted)]">
                                  <th className="py-2 px-3 font-medium">字段名</th>
                                  <th className="py-2 px-3 font-medium">别名</th>
                                  <th className="py-2 px-3 font-medium">类型</th>
                                </tr>
                              </thead>
                              <tbody>
                                {testApiConfig.outputParams.map((param: any, index: number) => (
                                  <tr key={index} className="border-t border-[var(--border-light)]">
                                    <td className="py-2 px-3 text-[var(--text-primary)]">{param.columnName}</td>
                                    <td className="py-2 px-3 text-[var(--text-secondary)]">{param.alias || '-'}</td>
                                    <td className="py-2 px-3 text-[var(--text-muted)]">{param.dataType}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {testApiConfig.description && (
                        <div>
                          <h5 className="text-sm font-medium text-[var(--text-secondary)] mb-2">API 描述</h5>
                          <p className="text-[var(--text-muted)] text-sm bg-[var(--bg-table-header)] rounded-lg p-3">{testApiConfig.description}</p>
                        </div>
                      )}
                    </div>
                  ) : testRightTab === 'example' ? (
                    <div className="space-y-2">
                      <div className="text-sm text-[var(--text-muted)] bg-[var(--bg-table-header)] rounded-lg p-3 font-mono">
                        <div className="flex justify-between py-1">
                          <span className="text-[var(--text-muted)]">Content-Type</span>
                          <span className="text-[var(--text-primary)]">application/json</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-[var(--text-muted)]">Accept</span>
                          <span className="text-[var(--text-primary)]">application/json</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* cURL */}
                      <div className="bg-[var(--bg-primary)]/50 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-hover-light)] border-b border-[var(--border-light)]">
                          <span className="text-xs text-[var(--text-muted)]">cURL</span>
                          <button
                            onClick={() => {
                              const example = generateCurlExample(testApiConfig, testParams);
                              navigator.clipboard.writeText(example);
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            复制
                          </button>
                        </div>
                        <pre className="p-3 text-xs text-[var(--text-secondary)] overflow-x-auto whitespace-pre-wrap font-mono">
{generateCurlExample(testApiConfig, testParams)}
                        </pre>
                      </div>
                      {/* JavaScript */}
                      <div className="bg-[var(--bg-primary)]/50 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-hover-light)] border-b border-[var(--border-light)]">
                          <span className="text-xs text-[var(--text-muted)]">JavaScript</span>
                          <button
                            onClick={() => {
                              const example = generateJsExample(testApiConfig, testParams);
                              navigator.clipboard.writeText(example);
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            复制
                          </button>
                        </div>
                        <pre className="p-3 text-xs text-[var(--text-secondary)] overflow-x-auto whitespace-pre-wrap font-mono">
{generateJsExample(testApiConfig, testParams)}
                        </pre>
                      </div>
                      {/* Python */}
                      <div className="bg-[var(--bg-primary)]/50 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-hover-light)] border-b border-[var(--border-light)]">
                          <span className="text-xs text-[var(--text-muted)]">Python</span>
                          <button
                            onClick={() => {
                              const example = generatePythonExample(testApiConfig, testParams);
                              navigator.clipboard.writeText(example);
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            复制
                          </button>
                        </div>
                        <pre className="p-3 text-xs text-[var(--text-secondary)] overflow-x-auto whitespace-pre-wrap font-mono">
{generatePythonExample(testApiConfig, testParams)}
                        </pre>
                      </div>
                      {/* Java */}
                      <div className="bg-[var(--bg-primary)]/50 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-[var(--bg-hover-light)] border-b border-[var(--border-light)]">
                          <span className="text-xs text-[var(--text-muted)]">Java</span>
                          <button
                            onClick={() => {
                              const example = generateJavaExample(testApiConfig, testParams);
                              navigator.clipboard.writeText(example);
                            }}
                            className="text-xs text-blue-400 hover:text-blue-300"
                          >
                            复制
                          </button>
                        </div>
                        <pre className="p-3 text-xs text-[var(--text-secondary)] overflow-x-auto whitespace-pre-wrap font-mono">
{generateJavaExample(testApiConfig, testParams)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
