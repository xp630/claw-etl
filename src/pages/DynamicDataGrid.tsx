import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Eye, Columns, X, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { getFeatureByCode, getApiDetail, getAllDictItems, api } from '../lib/api';
import type { Feature, DictItem } from '../types';
import * as XLSX from 'xlsx';

export default function DynamicDataGrid({ code: codeProp }: { code?: string }) {
  const params = useParams();
  const code = codeProp || params.code;
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [feature, setFeature] = useState<Feature | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchParams2, setSearchParams] = useState<Record<string, string>>({});
  const [dictItems, setDictItems] = useState<Record<string, DictItem[]>>({});
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (code) {
      loadFeature(code);
    }
  }, [code]);

  // 初始化选中的列（默认显示所有可见列，支持从 localStorage 恢复）
  useEffect(() => {
    if (feature?.columns) {
      const defaultCols = feature.columns.filter(col => col.visible !== false && col.fieldType !== 'action');
      const defaultSelected = defaultCols.map(col => col.fieldName);

      // 尝试从 localStorage 读取用户的列配置
      const storageKey = `columns_${code}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const savedColumns = JSON.parse(saved);
          const merged = defaultCols
            .map(col => col.fieldName)
            .filter(fieldName => savedColumns.includes(fieldName) || defaultSelected.includes(fieldName));
          setSelectedColumns(merged.length > 0 ? merged : defaultSelected);
        } catch {
          setSelectedColumns(defaultSelected);
        }
      } else {
        setSelectedColumns(defaultSelected);
      }
    }
  }, [feature, code]);

  // 保存列配置到 localStorage
  useEffect(() => {
    if (selectedColumns.length > 0 && code) {
      const storageKey = `columns_${code}`;
      localStorage.setItem(storageKey, JSON.stringify(selectedColumns));
    }
  }, [selectedColumns, code]);

  const loadFeature = async (featureCode: string) => {
    setLoading(true);
    try {
      const featureData = await getFeatureByCode(featureCode);
      if (featureData) {
        setFeature(featureData);
        const allDictItems = await getAllDictItems();
        setDictItems(allDictItems);
        if (featureData.queryApiId) {
          loadData(featureData);
        }
      }
    } catch (error) {
      console.error('Failed to load feature:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadData = async (featureData?: Feature, params?: Record<string, string>) => {
    const currentFeature = featureData || feature;
    if (!currentFeature?.queryApiId) return;

    setDataLoading(true);
    try {
      const apiDetail = await getApiDetail(currentFeature.queryApiId);
      if (!apiDetail) {
        console.error('Failed to load API detail');
        return;
      }

      const queryFields = currentFeature.columns?.filter(col => col.queryCondition) || [];

      const requestParams: Record<string, any> = {};
      queryFields.forEach(field => {
        const value = params?.[field.fieldName] || searchParams2[field.fieldName];
        if (value !== undefined && value !== '') {
          requestParams[field.fieldName] = value;
        }
      });

      requestParams.page = params?.page ? parseInt(params.page as string) : page;
      requestParams.pageSize = params?.pageSize ? parseInt(params.pageSize as string) : pageSize;

      let apiPath = apiDetail.path || '';
      if (apiPath.startsWith('/api/')) {
        apiPath = apiPath.substring(4);
      }
      apiPath = `/api${apiPath}`;

      const fullUrl = `${apiPath}`;
      const curlCmd = `curl -X ${apiDetail.method} '${fullUrl}' -d '${JSON.stringify(requestParams)}' -H 'Content-Type: application/json'`;
      console.log('请求URL:', fullUrl);
      console.log('CURL:', curlCmd);

      let response;
      if (apiDetail.method === 'GET') {
        response = await api.get(apiPath, { params: requestParams });
        response = response.data;
      } else {
        response = await api.post(apiPath, requestParams);
        response = response.data;
      }

      let dataList: any[] = [];
      let totalCount = 0;

      if (response) {
        const responseData = response;
        if (Array.isArray(responseData)) {
          dataList = responseData;
        } else if (responseData.list) {
          dataList = responseData.list;
          totalCount = responseData.total || responseData.count || dataList.length;
        } else if (responseData.data && Array.isArray(responseData.data)) {
          dataList = responseData.data;
          totalCount = responseData.total || responseData.count || dataList.length;
        }
      }

      setData(dataList);
      setTotal(totalCount);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData(undefined, { ...searchParams2, page: '1' });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadData(undefined, { ...searchParams2, page: newPage.toString() });
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    loadData(undefined, { ...searchParams2, pageSize: newSize.toString(), page: '1' });
    // 同步更新 requestParams，因为 setPage/setPageSize 是异步的
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-[var(--text-muted)]">加载中...</div>
      </div>
    );
  }

  if (!feature) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--text-muted)]">功能不存在</div>
      </div>
    );
  }

  const visibleColumns = feature.columns?.filter(col => col.visible !== false) || [];
  const displayColumns = feature.columns?.filter(col =>
    selectedColumns.includes(col.fieldName) && col.visible !== false
  ) || [];

  // 新增数据
  const handleCreate = async () => {
    if (!feature.createApiId) {
      alert('该功能不支持新增');
      return;
    }
    setDataLoading(true);
    try {
      const apiDetail = await getApiDetail(feature.createApiId);
      if (!apiDetail) {
        alert('获取接口信息失败');
        return;
      }

      let apiPath = apiDetail.path || '';
      if (apiPath.startsWith('/api/')) {
        apiPath = apiPath.substring(4);
      }
      apiPath = `/api${apiPath}`;

      const fullUrl = `${apiPath}`;
      console.log('新增请求URL:', fullUrl);
      console.log('新增数据:', createFormData);

      const response = await api.post(apiPath, createFormData);
      const result = response.data;

      if (result.code === 0 || result.success) {
        alert('新增成功');
        setShowCreateModal(false);
        setCreateFormData({});
        loadData();
      } else {
        alert('新增失败: ' + (result.message || '未知错误'));
      }
    } catch (error) {
      console.error('新增失败:', error);
      alert('新增失败，请重试');
    } finally {
      setDataLoading(false);
    }
  };

  // 导出 Excel
  const handleExport = async (type: 'current' | 'all') => {
    let exportDataList: any[] = [];

    if (type === 'current') {
      if (data.length === 0) {
        alert('暂无数据可导出');
        return;
      }
      exportDataList = data;
    } else {
      // 导出全部 - 需请求所有数据
      if (!feature.queryApiId) {
        alert('该功能不支持导出全部');
        return;
      }
      setDataLoading(true);
      try {
        const apiDetail = await getApiDetail(feature.queryApiId);
        if (!apiDetail) {
          alert('获取接口信息失败');
          return;
        }

        const queryFields = feature.columns?.filter(col => col.queryCondition) || [];
        const requestParams: Record<string, any> = {};
        queryFields.forEach(field => {
          const value = searchParams2[field.fieldName];
          if (value !== undefined && value !== '') {
            requestParams[field.fieldName] = value;
          }
        });

        let apiPath = apiDetail.path || '';
        if (apiPath.startsWith('/api/')) {
          apiPath = apiPath.substring(4);
        }
        apiPath = `/api${apiPath}`;

        let response;
        if (apiDetail.method === 'GET') {
          response = await api.get(apiPath, { params: { ...requestParams, page: 1, pageSize: total } });
        } else {
          response = await api.post(apiPath, { ...requestParams, page: 1, pageSize: total });
        }
        response = response.data;

        if (response) {
          if (Array.isArray(response)) {
            exportDataList = response;
          } else if (response.list) {
            exportDataList = response.list;
          } else if (response.data && Array.isArray(response.data)) {
            exportDataList = response.data;
          }
        }
      } catch (error) {
        console.error('导出失败:', error);
        alert('导出失败，请重试');
        return;
      } finally {
        setDataLoading(false);
      }
    }

    if (exportDataList.length === 0) {
      alert('暂无数据可导出');
      return;
    }

    const exportData = exportDataList.map(row => {
      const obj: Record<string, any> = {};
      displayColumns.forEach(col => {
        let value = row[col.fieldName];
        // 数据字典翻译
        if (col.dataDictionary && dictItems[col.dataDictionary]) {
          const dictItem = dictItems[col.dataDictionary].find(item => item.itemValue === value);
          if (dictItem) value = dictItem.itemLabel;
        }
        // 日期格式化
        if (col.fieldType === 'date' && value) {
          value = String(value).substring(0, 10);
        }
        obj[col.fieldLabel] = value ?? '-';
      });
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, feature.name);

    // 设置列宽
    const colWidths = displayColumns.map(col => ({ wch: Math.max(col.fieldLabel.length * 2, 15) }));
    ws['!cols'] = colWidths;

    const suffix = type === 'current' ? '当前页' : '全部';
    XLSX.writeFile(wb, `${feature.name}_${suffix}_${new Date().toLocaleDateString()}.xlsx`);
  };

  if (feature.type === 'list') {
    return (
      <div>
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">{feature.name}</h1>
        </div>

        {/* 搜索条件 */}
        {feature.columns?.filter(col => col.queryCondition && col.fieldType !== 'action').length > 0 && (() => {
          const queryFields = feature.columns!.filter(col => col.queryCondition && col.fieldType !== 'action');
          const showCollapse = queryFields.length > 4;
          const displayFields = showCollapse && !showAdvanced ? queryFields.slice(0, 4) : queryFields;
          return (
            <form onSubmit={handleSearch} className="mb-4 bg-[var(--bg-table-header)] rounded-xl border border-[var(--border-light)] p-4">
              <div className="flex gap-4 flex-wrap items-end">
                <div className="flex gap-4 flex-wrap flex-1">
                  {displayFields.slice(0, 3).map((col) => (
                    <div key={col.fieldName} className="w-[calc(33%-10px)] min-w-[200px] h-16 flex flex-col justify-between">
                      <label className="block text-sm text-[var(--text-muted)] truncate">{col.fieldLabel}</label>
                      {col.fieldType === 'select' ? (
                        <select
                          value={searchParams2[col.fieldName] || ''}
                          onChange={(e) => setSearchParams(prev => ({ ...prev, [col.fieldName]: e.target.value }))}
                          className="px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm w-full"
                        >
                          <option value="">请选择</option>
                          {col.dataDictionary && dictItems[col.dataDictionary]?.map(item => (
                            <option key={item.itemValue} value={item.itemValue}>{item.itemLabel}</option>
                          ))}
                        </select>
                      ) : col.fieldType === 'number' ? (
                        <input
                          type="number"
                          value={searchParams2[col.fieldName] || ''}
                          onChange={(e) => setSearchParams(prev => ({ ...prev, [col.fieldName]: e.target.value }))}
                          className="px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm w-full"
                          placeholder={`请输入${col.fieldLabel}`}
                        />
                      ) : (
                        <input
                          type="text"
                          value={searchParams2[col.fieldName] || ''}
                          onChange={(e) => setSearchParams(prev => ({ ...prev, [col.fieldName]: e.target.value }))}
                          className="px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm w-full"
                          placeholder={`请输入${col.fieldLabel}`}
                        />
                      )}
                    </div>
                  ))}
                  {showAdvanced && displayFields.slice(3).map((col) => (
                    <div key={col.fieldName} className="w-[calc(33%-10px)] min-w-[200px] h-16 flex flex-col justify-between">
                      <label className="block text-sm text-[var(--text-muted)] truncate">{col.fieldLabel}</label>
                      {col.fieldType === 'select' ? (
                        <select
                          value={searchParams2[col.fieldName] || ''}
                          onChange={(e) => setSearchParams(prev => ({ ...prev, [col.fieldName]: e.target.value }))}
                          className="px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm w-full"
                        >
                          <option value="">请选择</option>
                          {col.dataDictionary && dictItems[col.dataDictionary]?.map(item => (
                            <option key={item.itemValue} value={item.itemValue}>{item.itemLabel}</option>
                          ))}
                        </select>
                      ) : col.fieldType === 'number' ? (
                        <input
                          type="number"
                          value={searchParams2[col.fieldName] || ''}
                          onChange={(e) => setSearchParams(prev => ({ ...prev, [col.fieldName]: e.target.value }))}
                          className="px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm w-full"
                          placeholder={`请输入${col.fieldLabel}`}
                        />
                      ) : (
                        <input
                          type="text"
                          value={searchParams2[col.fieldName] || ''}
                          onChange={(e) => setSearchParams(prev => ({ ...prev, [col.fieldName]: e.target.value }))}
                          className="px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm w-full"
                          placeholder={`请输入${col.fieldLabel}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 items-center shrink-0">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    搜索
                  </button>
                  {feature.createApiId && (
                    <button
                      type="button"
                      onClick={() => { setShowCreateModal(true); setCreateFormData({}); }}
                      className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      新增
                    </button>
                  )}
                  <div className="relative group">
                    <button className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-colors flex items-center gap-2">
                      <Download className="w-4 h-4" />
                      导出
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      <button
                        onClick={() => setShowColumnSelector(true)}
                        className="w-full px-4 py-2.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Columns className="w-4 h-4" />
                        列配置
                      </button>
                      <button
                        onClick={() => handleExport('current')}
                        className="w-full px-4 py-2.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        导出当前页
                      </button>
                      <button
                        onClick={() => handleExport('all')}
                        className="w-full px-4 py-2.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] rounded-lg transition-colors flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        导出全部 ({total} 条)
                      </button>
                    </div>
                  </div>
                  {showCollapse && (
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="px-3 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-colors flex items-center"
                      title={showAdvanced ? '收起' : '展开'}
                    >
                      {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>
            </form>
          );
        })()}

        {/* 数据表格 */}
        <div className="bg-[var(--bg-table-header)] rounded-xl border border-[var(--border-light)] overflow-hidden relative">
          {dataLoading && (
            <div className="absolute inset-0 bg-[var(--bg-secondary)]/80 flex items-center justify-center z-10">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <div className="text-[var(--text-muted)] text-sm">加载中...</div>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-[var(--border-light)] bg-[var(--bg-hover-light)]">
                  {displayColumns.map(col => {
                    return (
                      <th
                        key={col.fieldName}
                        style={{ width: '150px', minWidth: '150px' }}
                        className={`px-4 py-2 text-left text-sm font-medium text-[var(--text-muted)] truncate overflow-hidden ${
                          col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
                        }`}
                        title={col.fieldLabel}
                      >
                        <span className="block truncate">{col.fieldLabel}</span>
                      </th>
                    );
                  })}
                  <th className="px-4 py-2 text-center text-sm font-medium text-[var(--text-muted)] whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 && !dataLoading ? (
                  <tr>
                    <td colSpan={displayColumns.length + 1} className="px-4 py-12 text-center text-[var(--text-muted)]">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  data.map((row, index) => (
                    <tr key={index} className="border-b border-[var(--border-light)] hover:bg-[var(--bg-hover-light)]">
                      {displayColumns.map(col => {
                        return (
                          <td
                            key={col.fieldName}
                            style={{ width: '150px', minWidth: '150px' }}
                            className={`px-4 py-3 text-sm text-[var(--text-primary)] truncate overflow-hidden ${
                              col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
                            }`}
                            title={String(row[col.fieldName] ?? '-')}
                          >
                            {renderCellValue(row[col.fieldName], col, dictItems)}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {feature.detailApiId && (
                            <button className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {feature.updateApiId && (
                            <button className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {feature.deleteApiId && (
                            <button className="p-1.5 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 分页 */}
        {total > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-muted)]">每页</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-2 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-light)] rounded text-[var(--text-primary)] text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-[var(--text-muted)]">条，共 {total} 条记录</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-colors disabled:opacity-50"
              >
                上一页
              </button>
              <span className="px-3 py-1 text-[var(--text-primary)]">
                第 {page} / {Math.ceil(total / pageSize)} 页
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= Math.ceil(total / pageSize)}
                className="px-3 py-1 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-colors disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}

        {/* 新增弹窗 */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">新增</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {visibleColumns.filter(col => col.fieldType !== 'action').map(col => (
                  <div key={col.fieldName} className={col.span && col.span > 1 ? 'col-span-2' : ''}>
                    <label className="block text-sm text-[var(--text-muted)] mb-1">{col.fieldLabel}</label>
                    {col.fieldType === 'select' ? (
                      <select
                        value={createFormData[col.fieldName] || ''}
                        onChange={(e) => setCreateFormData(prev => ({ ...prev, [col.fieldName]: e.target.value }))}
                        className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm"
                      >
                        <option value="">请选择</option>
                        {col.dataDictionary && dictItems[col.dataDictionary]?.map(item => (
                          <option key={item.itemValue} value={item.itemValue}>{item.itemLabel}</option>
                        ))}
                      </select>
                    ) : col.fieldType === 'number' ? (
                      <input
                        type="number"
                        value={createFormData[col.fieldName] || ''}
                        onChange={(e) => setCreateFormData(prev => ({ ...prev, [col.fieldName]: e.target.value }))}
                        className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm"
                      />
                    ) : col.fieldType === 'date' ? (
                      <input
                        type="date"
                        value={createFormData[col.fieldName] || ''}
                        onChange={(e) => setCreateFormData(prev => ({ ...prev, [col.fieldName]: e.target.value }))}
                        className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm"
                      />
                    ) : col.fieldType === 'image' ? (
                      <input
                        type="text"
                        value={createFormData[col.fieldName] || ''}
                        onChange={(e) => setCreateFormData(prev => ({ ...prev, [col.fieldName]: e.target.value }))}
                        placeholder="输入图片URL"
                        className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm"
                      />
                    ) : (
                      <input
                        type="text"
                        value={createFormData[col.fieldName] || ''}
                        onChange={(e) => setCreateFormData(prev => ({ ...prev, [col.fieldName]: e.target.value }))}
                        className="w-full px-3 py-2 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)] text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 列选择弹窗 */}
        {showColumnSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border)] p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">选择显示列</h3>
                <button
                  onClick={() => setShowColumnSelector(false)}
                  className="p-1 hover:bg-[var(--bg-tertiary)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {visibleColumns.filter(col => col.fieldType !== 'action').map(col => (
                  <label key={col.fieldName} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(col.fieldName)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedColumns([...selectedColumns, col.fieldName]);
                        } else {
                          setSelectedColumns(selectedColumns.filter(c => c !== col.fieldName));
                        }
                      }}
                      className="w-4 h-4 rounded border-[var(--border-light)] text-[var(--accent)] focus:ring-[var(--accent-light)]"
                    />
                    <span className="text-[var(--text-primary)]">{col.fieldLabel}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowColumnSelector(false)}
                  className="px-4 py-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 渲染表单页
  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">{feature.name}</h1>
      <div className="bg-[var(--bg-table-header)] rounded-xl border border-[var(--border-light)] p-6">
        <div className="grid grid-cols-2 gap-4">
          {visibleColumns.map(col => (
            <div key={col.fieldName}>
              <label className="block text-sm text-[var(--text-muted)] mb-2">{col.fieldLabel}</label>
              {col.fieldType === 'number' ? (
                <input
                  type="number"
                  className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)]"
                />
              ) : col.fieldType === 'date' ? (
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)]"
                />
              ) : col.fieldType === 'select' ? (
                <select className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)]">
                  <option value="">请选择</option>
                </select>
              ) : (
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-[var(--bg-hover-light)] border border-[var(--border-light)] rounded-lg text-[var(--text-primary)]"
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="px-6 py-2.5 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-lg transition-colors">
            取消
          </button>
          <button className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors">
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

// 渲染单元格值（支持数据字典翻译）
function renderCellValue(value: any, col: any, dictItems: Record<string, any[]>): React.ReactNode {
  if (value === null || value === undefined) {
    return '-';
  }

  // 如果有数据字典配置，进行翻译
  if (col.dataDictionary && dictItems[col.dataDictionary]) {
    const dictItem = dictItems[col.dataDictionary].find(item => item.itemValue === value);
    if (dictItem) {
      return dictItem.itemLabel;
    }
  }

  if (col.fieldType === 'date' && value) {
    return String(value).substring(0, 10);
  }
  if (col.fieldType === 'number') {
    return Number(value).toLocaleString();
  }
  if (col.fieldType === 'image' && value) {
    return <AsyncImage value={value} />;
  }
  return String(value);
}

// 异步加载图片组件
function AsyncImage({ value }: { value: any }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    // value 可能是 URL 字符串，也可能是 { url: "..." } 或其他格式
    let imageUrl = '';
    if (typeof value === 'string') {
      imageUrl = value;
    } else if (typeof value === 'object' && value !== null) {
      imageUrl = value.url || value.src || value.path || '';
    } else {
      imageUrl = String(value);
    }

    if (!imageUrl) {
      setLoading(false);
      setError(true);
      return;
    }

    setLoading(true);
    setError(false);

    // 检查是否是完整 URL
    const isFullUrl = imageUrl.startsWith('http://') || imageUrl.startsWith('https://');
    const finalUrl = isFullUrl ? imageUrl : imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;

    const img = new Image();
    img.onload = () => {
      setSrc(finalUrl);
      setLoading(false);
    };
    img.onerror = () => {
      setError(true);
      setLoading(false);
    };
    img.src = finalUrl;
  }, [value]);

  if (loading) {
    return <span className="text-[var(--text-muted)] text-xs">加载中...</span>;
  }
  if (error) {
    return <span className="text-[var(--text-muted)] text-xs">加载失败</span>;
  }
  return <img src={src} alt="" className="w-10 h-10 object-cover rounded" />;
}
