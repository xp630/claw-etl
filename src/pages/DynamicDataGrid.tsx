import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Search, Edit2, Trash2, Eye, Columns, X } from 'lucide-react';
import { getFeatureByCode, getApiDetail, getAllDictItems, api } from '../lib/api';
import type { Feature, DictItem } from '../types';

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

      const fullUrl = `http://localhost:8090/etl-admin${apiPath}`;
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
        <div className="text-slate-400">加载中...</div>
      </div>
    );
  }

  if (!feature) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">功能不存在</div>
      </div>
    );
  }

  const visibleColumns = feature.columns?.filter(col => col.visible !== false) || [];

  if (feature.type === 'list') {
    const displayColumns = feature.columns?.filter(col =>
      selectedColumns.includes(col.fieldName) && col.visible !== false
    ) || [];

    // 计算总宽度
    const totalSpan = displayColumns.reduce((sum, c) => sum + (c.span || 1), 0);

    return (
      <div className="p-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">{feature.name}</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowColumnSelector(true)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Columns className="w-4 h-4" />
              列配置
            </button>
            <button
              onClick={() => loadData()}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              刷新
            </button>
            {feature.createApiId && (
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
                新增
              </button>
            )}
          </div>
        </div>

        {/* 搜索条件 */}
        {feature.columns?.filter(col => col.queryCondition && col.fieldType !== 'action').length > 0 && (
          <form onSubmit={handleSearch} className="mb-4 bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
            <div className="flex gap-4 items-end flex-wrap">
              {feature.columns
                .filter(col => col.queryCondition && col.fieldType !== 'action')
                .map(col => (
                  <div key={col.fieldName} className="min-w-[150px]">
                    <label className="block text-sm text-slate-400 mb-1">{col.fieldLabel}</label>
                    {col.fieldType === 'select' ? (
                      <select
                        value={searchParams2[col.fieldName] || ''}
                        onChange={(e) => setSearchParams(prev => ({ ...prev, [col.fieldName]: e.target.value }))}
                        className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm w-full"
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
                        className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm w-full"
                        placeholder={`请输入${col.fieldLabel}`}
                      />
                    ) : (
                      <input
                        type="text"
                        value={searchParams2[col.fieldName] || ''}
                        onChange={(e) => setSearchParams(prev => ({ ...prev, [col.fieldName]: e.target.value }))}
                        className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm w-full"
                        placeholder={`请输入${col.fieldLabel}`}
                      />
                    )}
                  </div>
                ))}
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                搜索
              </button>
            </div>
          </form>
        )}

        {/* 数据表格 */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden relative">
          {dataLoading && (
            <div className="absolute inset-0 bg-slate-800/80 flex items-center justify-center z-10">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <div className="text-slate-400 text-sm">加载中...</div>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/50">
                  {displayColumns.map(col => {
                    const colSpan = col.span || 1;
                    const widthPercent = `${(colSpan / totalSpan) * 100}%`;
                    return (
                      <th
                        key={col.fieldName}
                        style={{ width: widthPercent, minWidth: '80px' }}
                        className={`px-4 py-3 text-left text-sm font-medium text-slate-400 ${
                          col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
                        }`}
                      >
                        {col.fieldLabel}
                      </th>
                    );
                  })}
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-400 whitespace-nowrap">操作</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 && !dataLoading ? (
                  <tr>
                    <td colSpan={displayColumns.length + 1} className="px-4 py-12 text-center text-slate-400">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  data.map((row, index) => (
                    <tr key={index} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                      {displayColumns.map(col => {
                        const colSpan = col.span || 1;
                        const widthPercent = `${(colSpan / totalSpan) * 100}%`;
                        return (
                          <td
                            key={col.fieldName}
                            style={{ width: widthPercent, minWidth: '80px' }}
                            className={`px-4 py-3 text-sm text-white ${
                              col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
                            }`}
                          >
                            {renderCellValue(row[col.fieldName], col, dictItems)}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {feature.detailApiId && (
                            <button className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {feature.updateApiId && (
                            <button className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {feature.deleteApiId && (
                            <button className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-red-400 transition-colors">
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
              <span className="text-sm text-slate-400">每页</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-slate-400">条，共 {total} 条记录</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                上一页
              </button>
              <span className="px-3 py-1 text-white">
                第 {page} / {Math.ceil(total / pageSize)} 页
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= Math.ceil(total / pageSize)}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}

        {/* 列选择弹窗 */}
        {showColumnSelector && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">选择显示列</h3>
                <button
                  onClick={() => setShowColumnSelector(false)}
                  className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
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
                      className="w-4 h-4 rounded border-slate-600 text-purple-500 focus:ring-purple-500"
                    />
                    <span className="text-white">{col.fieldLabel}</span>
                  </label>
                ))}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowColumnSelector(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
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
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">{feature.name}</h1>
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
        <div className="grid grid-cols-2 gap-4">
          {visibleColumns.map(col => (
            <div key={col.fieldName}>
              <label className="block text-sm text-slate-400 mb-2">{col.fieldLabel}</label>
              {col.fieldType === 'number' ? (
                <input
                  type="number"
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white"
                />
              ) : col.fieldType === 'date' ? (
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white"
                />
              ) : col.fieldType === 'select' ? (
                <select className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white">
                  <option value="">请选择</option>
                </select>
              ) : (
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white"
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
            取消
          </button>
          <button className="px-6 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors">
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
  return String(value);
}
