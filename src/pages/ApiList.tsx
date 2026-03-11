import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Edit, Trash2, Play, Copy, Search, ChevronRight, ChevronDown, Database, Table } from 'lucide-react';
import { getDataSources, getTableList, getApiList, deleteApi, toggleApi, testApi } from '../lib/api';
import type { DataSource, ApiConfig, TableInfo } from '../types';

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

export default function ApiList() {
  const navigate = useNavigate();
  const [datasources, setDatasources] = useState<DataSource[]>([]);
  const [apiList, setApiList] = useState<ApiConfig[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDs, setSelectedDs] = useState<number | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // 树相关状态
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // 初始化加载数据源
  useEffect(() => {
    loadDataSources();
  }, []);

  // 当筛选条件变化时重新加载列表
  useEffect(() => {
    loadApiList();
  }, [selectedDs, selectedTable, searchKeyword]);

  const loadDataSources = async () => {
    try {
      const data = await getDataSources();
      setDatasources(data);
      // 构建树形结构
      const tree = data.map(ds => ({
        id: `ds_${ds.id}`,
        name: ds.name,
        type: 'datasource' as const,
        dataType: ds.dataType,
        databaseName: ds.databaseName,
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
      const params: any = { page: 1, limit: 20 };
      if (selectedDs) params.datasourceId = selectedDs;
      if (selectedTable) params.tableName = selectedTable;
      if (searchKeyword) params.keyword = searchKeyword;
      
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
      const ds = datasources.find(d => d.id === parseInt(node.id.replace('ds_', '')));
      if (ds) {
        setSelectedDs(ds.id);
        setSelectedTable(null);
      }
    } else if (node.type === 'table') {
      // 找到父节点的数据源
      const parentId = node.id.split('_').slice(0, 2).join('_');
      const dsId = parseInt(parentId.replace('ds_', ''));
      setSelectedDs(dsId);
      setSelectedTable(node.tableName || null);
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

  const handleTest = async (id: number) => {
    try {
      const result = await testApi(id, {});
      alert(JSON.stringify(result, null, 2));
    } catch (error: any) {
      alert('测试失败: ' + (error.message || '未知错误'));
    }
  };

  const handleCopy = (api: ApiConfig) => {
    alert('复制功能开发中');
  };

  // 递归渲染树节点
  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedKeys.has(node.id);
    const isSelected = (node.type === 'datasource' && selectedDs === parseInt(node.id.replace('ds_', ''))) ||
                      (node.type === 'table' && selectedTable === node.tableName);
    
    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-700/50 ${
            isSelected ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300'
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
              className="p-0.5 hover:bg-slate-600 rounded"
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
      <div className="w-64 bg-[#1e293b]/60 border-r border-slate-700/50 flex flex-col">
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2 text-slate-400">
            <Database className="w-4 h-4" />
            <span className="text-sm font-medium">数据源与表</span>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-2">
          {treeData.length === 0 ? (
            <div className="text-slate-500 text-sm p-4">暂无数据源</div>
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/20">
              <Table className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">API管理</h1>
              <p className="text-xs text-slate-500">
                {getSelectedNodeInfo() || '全部API'}
              </p>
            </div>
          </div>
          <Link
            to="/apis/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            新增API
          </Link>
        </div>

        {/* 搜索筛选 */}
        <div className="bg-[#1e293b]/60 backdrop-blur-xl rounded-xl border border-slate-700/50 p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索API名称或路径"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-sm text-slate-200 placeholder-slate-600"
              />
            </div>
            <button
              onClick={loadApiList}
              className="px-4 py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
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
        <div className="bg-[#1e293b]/60 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-800/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">API名称</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">路径</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">方法</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">数据源</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">表</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">状态</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    加载中...
                  </td>
                </tr>
              ) : apiList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    暂无数据
                  </td>
                </tr>
              ) : (
                apiList.map((api) => (
                  <tr key={api.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-white font-medium">{api.name}</td>
                    <td className="px-4 py-3 text-slate-300 font-mono text-sm">{api.path}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        api.method === 'GET' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {api.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{api.datasourceName}</td>
                    <td className="px-4 py-3 text-slate-300">{api.tableName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${api.status === 1 ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/20 text-slate-400'}`}>
                        {api.status === 1 ? '启用' : '禁用'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleTest(api.id!)}
                          className="p-2 hover:bg-green-500/10 rounded-lg text-green-400 transition-colors"
                          title="测试"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopy(api)}
                          className="p-2 hover:bg-purple-500/10 rounded-lg text-purple-400 transition-colors"
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
        </div>
      </div>
    </div>
  );
}
