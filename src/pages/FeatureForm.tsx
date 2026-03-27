import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Search, X } from 'lucide-react';
import { getFeatureDetail, saveFeature, getApiListSimple, getApiDetail, getDataSources, getTableList, getTableColumns, generateCrudApi, getDictList } from '../lib/api';
import type { Feature, FeatureColumn, ApiConfig, DataSource, Dict } from '../types';

export default function FeatureForm({ overrideId, onSuccess }: { overrideId?: string; onSuccess?: () => void }) {
  const params = useParams();
  const id = overrideId || params.id;
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [apis, setApis] = useState<ApiConfig[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [tables, setTables] = useState<{ tableName: string; tableComment: string }[]>([]);
  const [dicts, setDicts] = useState<Dict[]>([]);
  const [tableSearchOpen, setTableSearchOpen] = useState(false);
  const [tableSearchValue, setTableSearchValue] = useState('');
  const tableSearchRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<Feature>({
    name: '',
    code: '',
    type: 'list',
    description: '',
    datasourceId: undefined,
    tableName: '',
    queryApiId: undefined,
    createApiId: undefined,
    updateApiId: undefined,
    deleteApiId: undefined,
    detailApiId: undefined,
    columns: [],
    showInMenu: 0,
    menuIcon: 'layout',
    menuOrder: 0,
    routePath: '',
    status: 1,
  });

  useEffect(() => {
    const init = async () => {
      setInitialLoading(true);
      try {
        await loadDataSources();
        await loadApis();
        await loadDicts();
        if (isEdit && id) {
          await loadFeature(id);
        }
      } finally {
        setInitialLoading(false);
      }
    };
    init();
  }, [id]);

  // 点击外部关闭搜索下拉
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tableSearchRef.current && !tableSearchRef.current.contains(e.target as Node)) {
        setTableSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadDicts = async () => {
    const data = await getDictList({ page: 1, limit: 100 });
    setDicts(data.list);
  };

  const loadFeature = async (featureId: string) => {
    setLoading(true);
    try {
      const data = await getFeatureDetail(parseInt(featureId));
      if (data) {
        setFormData(data);
        if (data.datasourceId) {
          loadTables(data.datasourceId);
          // 加载表后，如果字段配置为空则加载字段
          if ((!data.columns || data.columns.length === 0) && data.tableName) {
            loadColumnsForTable(data.datasourceId, data.tableName);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load feature:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadApis = async () => {
    const data = await getApiListSimple();
    setApis(data);
  };

  const loadDataSources = async () => {
    const data = await getDataSources({});
    setDataSources(data.list);
  };

  const loadTables = async (dsId: number) => {
    // 从数据源列表中找到对应的数据源
    let ds = dataSources.find(d => d.id === dsId);
    // 如果没找到，重新加载数据源
    if (!ds) {
      const allDatasources = await getDataSources({});
      setDataSources(allDatasources.list);
      ds = allDatasources.list.find((d: DataSource) => d.id === dsId);
    }
    if (ds) {
      const dbName = ds.database_name || ds.dbName || ds.databaseName;
      if (dbName) {
        const tableList = await getTableList(dbName);
        setTables(tableList);
      }
    }
  };

  // 加载表后获取字段配置
  const loadColumnsForTable = async (dsId: number, tableName: string) => {
    // 从数据源列表中找到对应的数据源
    let ds = dataSources.find(d => d.id === dsId);
    // 如果没找到，重新加载数据源
    if (!ds) {
      const allDatasources = await getDataSources({});
      setDataSources(allDatasources.list);
      ds = allDatasources.list.find((d: DataSource) => d.id === dsId);
    }
    if (ds && tableName) {
      const dbName = ds.database_name || ds.dbName || ds.databaseName;
      if (dbName) {
        const columns = await getTableColumns(dbName, tableName);
        const featureColumns: FeatureColumn[] = columns.map(col => ({
          fieldName: col.columnName,
          fieldLabel: col.columnComment || col.columnName,
          fieldType: col.dataType?.includes('int') || col.dataType?.includes('decimal') ? 'number' : 'text',
          span: 1,
          visible: true,
          align: 'left' as const,
          queryCondition: false,
        }));
        setFormData(prev => ({ ...prev, columns: featureColumns }));
      }
    }
  };

  const handleDataSourceChange = (dsId: number) => {
    setFormData(prev => ({ ...prev, datasourceId: dsId, tableName: '' }));
    loadTables(dsId);
  };

  // 选择表后自动加载字段
  const handleTableChange = async (tableName: string) => {
    // 自动从表信息带出名称和编码
    const tableComment = tables.find(t => t.tableName === tableName)?.tableComment || '';
    const autoName = tableComment || tableName;
    const autoCode = tableName.replace(/_([a-z])/g, (_, c) => c.toUpperCase()).replace(/_/g, '');

    setFormData(prev => ({
      ...prev,
      tableName,
      name: prev.name || autoName,
      code: prev.code || autoCode,
    }));
    if (tableName && formData.datasourceId) {
      const ds = dataSources.find(d => d.id === formData.datasourceId);
      const dbName = ds?.database_name || ds?.dbName || ds?.databaseName;
      if (dbName) {
        const columns = await getTableColumns(dbName, tableName);
        // 自动填充字段配置
        const featureColumns: FeatureColumn[] = columns.map(col => ({
          fieldName: col.columnName,
          fieldLabel: col.columnComment || col.columnName,
          fieldType: col.dataType?.includes('int') || col.dataType?.includes('decimal') ? 'number' : 'text',
          span: 1,
          visible: true,
          align: 'left' as const,
          queryCondition: false,
        }));
        setFormData(prev => ({ ...prev, tableName, columns: featureColumns }));
      }
    }
  };

  // 生成CRUD API
  const handleGenerateApi = async () => {
    if (!formData.datasourceId || !formData.tableName || !formData.code) {
      alert('请先选择数据源、表名和填写功能编码');
      return;
    }

    setGenerating(true);
    try {
      console.log('开始生成CRUD API:', formData.datasourceId, formData.tableName, formData.code);
      const result = await generateCrudApi(formData.datasourceId, formData.tableName, formData.code);
      console.log('生成结果:', result);
      if (result) {
        // 自动填充API信息
        setFormData(prev => ({
          ...prev,
          queryApiId: result.queryApi?.id,
          queryApiName: result.queryApi?.name,
          queryApiPath: result.queryApi?.path,
          createApiId: result.createApi?.id,
          createApiName: result.createApi?.name,
          updateApiId: result.updateApi?.id,
          updateApiName: result.updateApi?.name,
          deleteApiId: result.deleteApi?.id,
          deleteApiName: result.deleteApi?.name,
          detailApiId: result.detailApi?.id,
          detailApiName: result.detailApi?.name,
        }));
        // 刷新API列表
        loadApis();
        alert('API生成成功！');
      } else {
        alert('API生成失败，请查看控制台');
      }
    } catch (error) {
      console.error('Failed to generate API:', error);
      alert('API生成失败: ' + error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const success = await saveFeature(formData);
      if (success) {
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/features');
        }
      }
    } catch (error) {
      console.error('Failed to save feature:', error);
    } finally {
      setSaving(false);
    }
  };

  const addColumn = () => {
    const newColumn: FeatureColumn = {
      fieldName: '',
      fieldLabel: '',
      fieldType: 'text',
      span: 1,
      visible: true,
      align: 'left',
      queryCondition: false,
    };
    setFormData(prev => ({
      ...prev,
      columns: [...(prev.columns || []), newColumn],
    }));
  };

  const updateColumn = (index: number, updates: Partial<FeatureColumn>) => {
    setFormData(prev => ({
      ...prev,
      columns: prev.columns?.map((col, i) =>
        i === index ? { ...col, ...updates } : col
      ),
    }));
  };

  const removeColumn = (index: number) => {
    setFormData(prev => ({
      ...prev,
      columns: prev.columns?.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="p-4 h-full overflow-auto">
      {/* Loading overlay */}
      {initialLoading && (
        <div className="fixed inset-0 bg-[var(--bg-primary)] flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[var(--text-muted)] text-sm">加载中...</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 min-w-max">
        {/* 表单配置 */}
        <div className="bg-[var(--bg-table-header)] rounded-lg border border-[var(--border-light)] p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">数据源</label>
              <select
                value={formData.datasourceId || ''}
                onChange={(e) => handleDataSourceChange(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
              >
                <option value="">请选择数据源</option>
                {dataSources.map(ds => (
                  <option key={ds.id} value={ds.id}>
                    {ds.name}{ds.comment ? ` (${ds.comment})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div ref={tableSearchRef} className="relative">
              <label className="block text-sm text-[var(--text-muted)] mb-1">表名2</label>
              <div className="relative">
                <input
                  type="text"
                  value={tableSearchOpen ? tableSearchValue : (formData.tableName || '')}
                  onChange={(e) => {
                    setTableSearchValue(e.target.value);
                    setTableSearchOpen(true);
                  }}
                  onFocus={() => setTableSearchOpen(true)}
                  placeholder={formData.datasourceId ? "搜索表名..." : "请先选择数据源"}
                  disabled={!formData.datasourceId}
                  className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {formData.tableName && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTableChange('');
                        setTableSearchValue('');
                      }}
                      className="p-1 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <Search className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
              </div>
              {tableSearchOpen && formData.datasourceId && (
                <div className="absolute z-50 w-full mt-1 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {tables.filter(t =>
                    t.tableName.toLowerCase().includes(tableSearchValue.toLowerCase()) ||
                    (t.tableComment && t.tableComment.toLowerCase().includes(tableSearchValue.toLowerCase()))
                  ).length > 0 ? (
                    tables.filter(t =>
                      t.tableName.toLowerCase().includes(tableSearchValue.toLowerCase()) ||
                      (t.tableComment && t.tableComment.toLowerCase().includes(tableSearchValue.toLowerCase()))
                    ).map(t => (
                      <button
                        key={t.tableName}
                        type="button"
                        onClick={() => {
                          handleTableChange(t.tableName);
                          setTableSearchOpen(false);
                          setTableSearchValue('');
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-[var(--text-primary)] hover:bg-[var(--bg-hover)] flex justify-between items-center"
                      >
                        <span className="font-mono">{t.tableName}</span>
                        {t.tableComment && <span className="text-[var(--text-muted)] text-xs ml-2">{t.tableComment}</span>}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-[var(--text-muted)] text-center">无匹配结果</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 基本信息 */}
        <div className="bg-[var(--bg-table-header)] rounded-lg border border-[var(--border-light)] p-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">功能名称</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">功能编码</label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm font-mono focus:outline-none focus:border-[var(--accent-light)]"
                placeholder="如: goods"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">功能类型</label>
              <select
                value={formData.type || 'list'}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'list' | 'form' }))}
                className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
              >
                <option value="list">列表页</option>
                <option value="form">表单页</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">状态</label>
              <select
                value={formData.status || 1}
                onChange={(e) => setFormData(prev => ({ ...prev, status: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
              >
                <option value={1}>启用</option>
                <option value={0}>禁用</option>
              </select>
            </div>
          </div>
        </div>

        {/* API配置 */}
        <div className="bg-[var(--bg-table-header)] rounded-lg border border-[var(--border-light)] p-4">
          {formData.queryApiId ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-light)]">
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-[var(--text-muted)]">操作</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-[var(--text-muted)]">API名称</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-[var(--text-muted)]">路径</th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-[var(--text-muted)]">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  <tr className="hover:bg-[var(--bg-hover-light)]">
                    <td className="px-2 py-1.5 text-xs text-[var(--success)]">查询</td>
                    <td className="px-2 py-1.5 text-xs text-[var(--text-primary)]">{formData.queryApiName}</td>
                    <td className="px-2 py-1.5 text-xs text-[var(--text-muted)] font-mono">{formData.queryApiPath}</td>
                    <td className="px-2 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => (window as any).layoutOpenTab?.({ id: `api-${formData.queryApiId}`, title: `编辑API-${formData.queryApiName}`, path: `/apis/${formData.queryApiId}` })}
                        className="text-[var(--accent)] hover:text-purple-300 text-xs"
                      >
                        编辑
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-[var(--bg-hover-light)]">
                    <td className="px-2 py-1.5 text-xs text-[var(--success)]">新增</td>
                    <td className="px-2 py-1.5 text-xs text-[var(--text-primary)]">{formData.createApiName}</td>
                    <td className="px-2 py-1.5 text-xs text-[var(--text-muted)] font-mono">/api/{formData.code}/create</td>
                    <td className="px-2 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => (window as any).layoutOpenTab?.({ id: `api-${formData.createApiId}`, title: `编辑API-${formData.createApiName}`, path: `/apis/${formData.createApiId}` })}
                        className="text-[var(--accent)] hover:text-purple-300 text-xs"
                      >
                        编辑
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-[var(--bg-hover-light)]">
                    <td className="px-2 py-1.5 text-xs text-[var(--success)]">更新</td>
                    <td className="px-2 py-1.5 text-xs text-[var(--text-primary)]">{formData.updateApiName}</td>
                    <td className="px-2 py-1.5 text-xs text-[var(--text-muted)] font-mono">/api/{formData.code}/update</td>
                    <td className="px-2 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => (window as any).layoutOpenTab?.({ id: `api-${formData.updateApiId}`, title: `编辑API-${formData.updateApiName}`, path: `/apis/${formData.updateApiId}` })}
                        className="text-[var(--accent)] hover:text-purple-300 text-xs"
                      >
                        编辑
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-[var(--bg-hover-light)]">
                    <td className="px-2 py-1.5 text-xs text-[var(--success)]">删除</td>
                    <td className="px-2 py-1.5 text-xs text-[var(--text-primary)]">{formData.deleteApiName}</td>
                    <td className="px-2 py-1.5 text-xs text-[var(--text-muted)] font-mono">/api/{formData.code}/delete</td>
                    <td className="px-2 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => (window as any).layoutOpenTab?.({ id: `api-${formData.deleteApiId}`, title: `编辑API-${formData.deleteApiName}`, path: `/apis/${formData.deleteApiId}` })}
                        className="text-[var(--accent)] hover:text-purple-300 text-xs"
                      >
                        编辑
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-[var(--bg-hover-light)]">
                    <td className="px-2 py-1.5 text-xs text-[var(--success)]">详情</td>
                    <td className="px-2 py-1.5 text-xs text-[var(--text-primary)]">{formData.detailApiName}</td>
                    <td className="px-2 py-1.5 text-xs text-[var(--text-muted)] font-mono">/api/{formData.code}/detail</td>
                    <td className="px-2 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => (window as any).layoutOpenTab?.({ id: `api-${formData.detailApiId}`, title: `编辑API-${formData.detailApiName}`, path: `/apis/${formData.detailApiId}` })}
                        className="text-[var(--accent)] hover:text-purple-300 text-xs"
                      >
                        编辑
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-[var(--text-muted)] text-xs">
              请在表单配置中选择数据源和表，保存时将自动创建API
            </div>
          )}
        </div>

        {/* 菜单配置 */}
        <div className="bg-[var(--bg-table-header)] rounded-lg border border-[var(--border-light)] p-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">显示在菜单</label>
              <select
                value={formData.showInMenu || 0}
                onChange={(e) => setFormData(prev => ({ ...prev, showInMenu: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
              >
                <option value={0}>不显示</option>
                <option value={1}>显示</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">菜单图标</label>
              <select
                value={formData.menuIcon || 'layout'}
                onChange={(e) => setFormData(prev => ({ ...prev, menuIcon: e.target.value }))}
                className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
              >
                <option value="layout">布局</option>
                <option value="database">数据库</option>
                <option value="listtodo">任务</option>
                <option value="globe">API</option>
                <option value="key">应用</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">菜单排序</label>
              <input
                type="number"
                value={formData.menuOrder || 0}
                onChange={(e) => setFormData(prev => ({ ...prev, menuOrder: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--accent-light)]"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-muted)] mb-1">路由路径</label>
              <input
                type="text"
                value={formData.routePath || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, routePath: e.target.value }))}
                placeholder="/dynamic/goods"
                className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm font-mono focus:outline-none focus:border-[var(--accent-light)]"
              />
            </div>
          </div>
        </div>

        {/* 字段配置 */}
        <div className="bg-[var(--bg-table-header)] rounded-lg border border-[var(--border-light)] p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">字段配置</h2>
            <button
              type="button"
              onClick={addColumn}
              className="flex items-center gap-1 px-2 py-1 bg-[var(--accent)]/20 hover:bg-[var(--accent)]/30 text-[var(--accent)] rounded transition-colors text-xs"
            >
              <Plus className="w-3 h-3" />
              添加字段
            </button>
          </div>

          {formData.columns && formData.columns.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-light)]">
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-[var(--text-muted)]">字段名</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-[var(--text-muted)]">显示名称</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-[var(--text-muted)]">控件类型</th>
                    <th className="px-2 py-1.5 text-left text-xs font-medium text-[var(--text-muted)]">数据字典</th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-[var(--text-muted)]">长度</th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-[var(--text-muted)]">对齐</th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-[var(--text-muted)]">可见</th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-[var(--text-muted)]">查询</th>
                    <th className="px-2 py-1.5 text-center text-xs font-medium text-[var(--text-muted)]">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.columns.map((col, index) => (
                    <tr key={index} className="border-b border-[var(--border-light)]">
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={col.fieldName}
                          onChange={(e) => updateColumn(index, { fieldName: e.target.value })}
                          className="w-full px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-xs font-mono focus:outline-none focus:border-[var(--accent-light)]"
                          required
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={col.fieldLabel}
                          onChange={(e) => updateColumn(index, { fieldLabel: e.target.value })}
                          className="w-full px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-light)]"
                          required
                        />
                      </td>
                      <td className="px-2 py-1">
                        <select
                          value={col.fieldType}
                          onChange={(e) => updateColumn(index, { fieldType: e.target.value as any })}
                          className="w-full px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-light)]"
                        >
                          <option value="text">文本</option>
                          <option value="number">数字</option>
                          <option value="date">日期</option>
                          <option value="select">下拉</option>
                          <option value="image">图片</option>
                          <option value="action">操作</option>
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <select
                          value={col.dataDictionary || ''}
                          onChange={(e) => updateColumn(index, { dataDictionary: e.target.value })}
                          className="w-full px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-light)]"
                        >
                          <option value="">请选择</option>
                          {dicts.map(dict => (
                            <option key={dict.id} value={dict.code}>{dict.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          value={col.span || 1}
                          onChange={(e) => updateColumn(index, { span: parseInt(e.target.value) })}
                          className="w-14 px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-xs text-center focus:outline-none focus:border-[var(--accent-light)]"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <select
                          value={col.align || 'left'}
                          onChange={(e) => updateColumn(index, { align: e.target.value as any })}
                          className="w-full px-2 py-1 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-xs focus:outline-none focus:border-[var(--accent-light)]"
                        >
                          <option value="left">左</option>
                          <option value="center">中</option>
                          <option value="right">右</option>
                        </select>
                      </td>
                      <td className="px-2 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={col.visible !== false}
                          onChange={(e) => updateColumn(index, { visible: e.target.checked })}
                          className="w-4 h-4 rounded border-[var(--border-light)] bg-[var(--bg-tertiary)] text-[var(--accent)] focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-2 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={col.queryCondition === true}
                          onChange={(e) => updateColumn(index, { queryCondition: e.target.checked })}
                          className="w-4 h-4 rounded border-[var(--border-light)] bg-[var(--bg-tertiary)] text-[var(--accent)] focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-2 py-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeColumn(index)}
                          className="p-1 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-[var(--text-muted)] text-xs">
              暂无字段配置，点击"添加字段"开始配置
            </div>
          )}
        </div>

        {/* 提交按钮 */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/features')}
            className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-colors text-sm"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}
