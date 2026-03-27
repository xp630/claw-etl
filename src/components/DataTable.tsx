import { useState, useEffect, ReactNode } from 'react';
import { Search, Plus, Download, ChevronDown, ChevronUp, Edit2, Trash2, Eye, RefreshCw } from 'lucide-react';

export interface ColumnDef {
  key: string;
  label: string;
  width?: number;
  minWidth?: number;
  visible?: boolean;
  sortable?: boolean;
  fieldType?: 'text' | 'number' | 'select' | 'date' | 'datetime' | 'switch' | 'image' | 'currency' | 'action' | 'custom';
  align?: 'left' | 'center' | 'right';
  ellipsis?: boolean;
  frozen?: boolean;  // 冻结列
  dataDictionary?: string;  // 字典编码
  dateFormat?: string;
  options?: { label: string; value: string }[];
  defaultValue?: any;
  placeholder?: string;
  required?: boolean;
  // 自定义渲染
  render?: (value: any, row: Record<string, any>, index: number) => ReactNode;
  // 自定义查询控件类型
  queryType?: 'input' | 'select' | 'date' | 'daterange' | 'number';
  queryOperator?: 'eq' | 'like' | 'gt' | 'lt' | 'between';  // 查询操作符
}

export interface PaginationConfig {
  page?: number;
  pageSize?: number;
  total?: number;
  pageSizes?: number[];
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
}

export interface DataTableProps {
  // 数据相关
  columns: ColumnDef[];
  data?: Record<string, any>[];
  loading?: boolean;
  // 分页
  pagination?: PaginationConfig | boolean;
  // 查询配置
  showSearchBar?: boolean;
  queryFields?: ColumnDef[];
  defaultQueryParams?: Record<string, any>;
  // 工具栏按钮
  showSearch?: boolean;
  showAdd?: boolean;
  showExport?: boolean;
  showRefresh?: boolean;
  showColumnSelector?: boolean;
  // 行操作按钮
  showEdit?: boolean;
  showDelete?: boolean;
  showDetail?: boolean;
  // 事件回调
  onSearch?: (params: Record<string, any>) => void;
  onReset?: () => void;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onSort?: (key: string, order: 'asc' | 'desc') => void;
  onAdd?: () => void;
  onExport?: (type: 'current' | 'all') => void;
  onRefresh?: () => void;
  onEdit?: (row: Record<string, any>) => void;
  onDelete?: (row: Record<string, any>) => void;
  onDetail?: (row: Record<string, any>) => void;
  onColumnChange?: (columns: string[]) => void;
  // 数据字典
  dictData?: Record<string, { label: string; value: string }[]>;
  // 样式配置
  bordered?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  maxHeight?: string | number;
  // 高级配置
  rowKey?: string;
  rowSelection?: boolean;
  expandable?: boolean;
  expandableContent?: (row: Record<string, any>) => ReactNode;
  // 额外操作按钮
  extraActions?: ReactNode;
  // 自定义工具栏
  customToolbar?: ReactNode;
}

export default function DataTable({
  columns,
  data = [],
  loading = false,
  pagination = true,
  showSearchBar = true,
  queryFields = [],
  defaultQueryParams = {},
  showSearch = true,
  showAdd = false,
  showExport = false,
  showRefresh = false,
  showColumnSelector = false,
  showEdit = false,
  showDelete = false,
  showDetail = false,
  onSearch,
  onReset,
  onPageChange,
  onPageSizeChange,
  onSort,
  onAdd,
  onExport,
  onRefresh,
  onEdit,
  onDelete,
  onDetail,
  onColumnChange,
  dictData = {},
  bordered = true,
  striped = true,
  hoverable = true,
  compact = false,
  maxHeight,
  rowKey = 'id',
  extraActions,
  customToolbar,
}: DataTableProps) {
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(columns.map(c => c.key));
  const [showColSelector, setShowColSelector] = useState(false);

  // 初始化查询参数
  useEffect(() => {
    setSearchParams(defaultQueryParams);
  }, [defaultQueryParams]);

  // 过滤可见列
  const visibleColumns = columns.filter(col => 
    col.visible !== false && 
    col.fieldType !== 'action' &&
    selectedColumns.includes(col.key)
  );

  // 有效查询字段
  const effectiveQueryFields = queryFields.filter(col => col.visible !== false);
  const showCollapse = effectiveQueryFields.length > 4;
  const displayQueryFields = showCollapse && !showAdvanced 
    ? effectiveQueryFields.slice(0, 4) 
    : effectiveQueryFields;

  // 分页配置
  const paginationConfig = pagination === false 
    ? null 
    : typeof pagination === 'boolean' 
      ? { page: 1, pageSize: 10, total: 0 }
      : pagination;
  const currentPage = paginationConfig?.page || 1;
  const currentPageSize = paginationConfig?.pageSize || 10;
  const total = paginationConfig?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / currentPageSize));

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSearch?.(searchParams);
  };

  const handleReset = () => {
    setSearchParams({});
    onReset?.();
    onSearch?.({});
  };

  const handleColumnToggle = (key: string) => {
    const newSelected = selectedColumns.includes(key)
      ? selectedColumns.filter(k => k !== key)
      : [...selectedColumns, key];
    setSelectedColumns(newSelected);
    onColumnChange?.(newSelected);
  };

  const renderCellValue = (value: any, col: ColumnDef, row: Record<string, any>, index: number) => {
    // 自定义渲染优先
    if (col.render) {
      return col.render(value, row, index);
    }
    
    if (value === null || value === undefined) return '-';
    
    // 数据字典翻译
    if (col.dataDictionary && dictData[col.dataDictionary]) {
      const item = dictData[col.dataDictionary].find(d => String(d.value) === String(value));
      if (item) return item.label;
    }
    
    // 字段类型渲染
    switch (col.fieldType) {
      case 'date':
        return String(value).substring(0, 10);
      case 'datetime':
        return String(value).substring(0, 19);
      case 'currency':
        return `¥${Number(value).toFixed(2)}`;
      case 'number':
        return Number(value).toLocaleString();
      case 'switch':
        return value ? '是' : '否';
      case 'image':
        return value ? <img src={value} alt="" className="w-8 h-8 object-cover rounded" /> : '-';
      default:
        return String(value);
    }
  };

  const paddingClass = compact ? 'px-2 py-1.5' : 'px-4 py-3';
  const textSizeClass = compact ? 'text-xs' : 'text-sm';

  const tableStyle = maxHeight ? { maxHeight } : {};

  return (
    <div className={`bg-white rounded ${bordered ? 'border border-gray-200' : ''} flex flex-col`}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          {customToolbar}
        </div>
        <div className="flex items-center gap-2">
          {extraActions}
          {showRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
              title="刷新"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {showColumnSelector && (
            <button
              onClick={() => setShowColSelector(!showColSelector)}
              className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
              title="列配置"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 列选择器 */}
      {showColSelector && (
        <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-2">
          {columns.filter(c => c.fieldType !== 'action').map(col => (
            <label key={col.key} className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={selectedColumns.includes(col.key)}
                onChange={() => handleColumnToggle(col.key)}
                className="w-3.5 h-3.5 rounded border-gray-300"
              />
              <span className="text-gray-600">{col.label}</span>
            </label>
          ))}
        </div>
      )}

      {/* 查询和按钮区域 */}
      {showSearchBar && effectiveQueryFields.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2 flex-wrap">
            {/* 查询条件 */}
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {displayQueryFields.slice(0, 3).map(col => (
                <div key={col.key} className="flex items-center gap-1.5">
                  <label className={`text-xs text-gray-500 whitespace-nowrap ${compact ? 'text-[10px]' : ''}`}>
                    {col.label}:
                  </label>
                  {col.queryType === 'select' || col.fieldType === 'select' ? (
                    <select
                      value={searchParams[col.key] || ''}
                      onChange={(e) => setSearchParams({ ...searchParams, [col.key]: e.target.value })}
                      className={`px-2 ${compact ? 'py-1' : 'py-1.5'} border border-gray-300 rounded text-xs w-24`}
                    >
                      <option value="">请选择</option>
                      {col.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                      {col.dataDictionary && dictData[col.dataDictionary]?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : col.queryType === 'date' || col.fieldType === 'date' || col.fieldType === 'datetime' ? (
                    <input
                      type="date"
                      value={searchParams[col.key] || ''}
                      onChange={(e) => setSearchParams({ ...searchParams, [col.key]: e.target.value })}
                      className={`px-2 ${compact ? 'py-1' : 'py-1.5'} border border-gray-300 rounded text-xs w-32`}
                    />
                  ) : (
                    <input
                      type={col.queryType === 'number' || col.fieldType === 'number' ? 'number' : 'text'}
                      value={searchParams[col.key] || ''}
                      onChange={(e) => setSearchParams({ ...searchParams, [col.key]: e.target.value })}
                      placeholder={`请输入`}
                      className={`px-2 ${compact ? 'py-1' : 'py-1.5'} border border-gray-300 rounded text-xs w-24`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* 按钮组 - 靠右 */}
            <div className="flex items-center gap-2">
              {showSearch && effectiveQueryFields.length > 0 && (
                <>
                  <button
                    onClick={handleSearch}
                    className={`px-3 ${compact ? 'py-1' : 'py-1.5'} text-xs bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1`}
                  >
                    <Search className="w-3 h-3" />
                    查询
                  </button>
                  <button
                    onClick={handleReset}
                    className={`px-3 ${compact ? 'py-1' : 'py-1.5'} text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200`}
                  >
                    重置
                  </button>
                  {showCollapse && (
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className={`px-2 ${compact ? 'py-1' : 'py-1.5'} text-xs text-blue-500 hover:text-blue-600 flex items-center gap-0.5`}
                    >
                      {showAdvanced ? <><ChevronUp className="w-3 h-3" />收起</> : <><ChevronDown className="w-3 h-3" />展开</>}
                    </button>
                  )}
                </>
              )}
              {showAdd && (
                <button
                  onClick={onAdd}
                  className={`px-3 ${compact ? 'py-1' : 'py-1.5'} text-xs bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1`}
                >
                  <Plus className="w-3 h-3" />
                  新增
                </button>
              )}
              {showExport && (
                <button
                  onClick={() => onExport?.('current')}
                  className={`px-3 ${compact ? 'py-1' : 'py-1.5'} text-xs bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-1`}
                >
                  <Download className="w-3 h-3" />
                  导出
                </button>
              )}
            </div>
          </div>

          {/* 高级查询条件 */}
          {showAdvanced && displayQueryFields.length > 3 && (
            <div className="flex items-center gap-2 flex-wrap mt-2 pt-2 border-t border-gray-200">
              {displayQueryFields.slice(3).map(col => (
                <div key={col.key} className="flex items-center gap-1.5">
                  <label className={`text-xs text-gray-500 whitespace-nowrap ${compact ? 'text-[10px]' : ''}`}>
                    {col.label}:
                  </label>
                  {col.queryType === 'select' || col.fieldType === 'select' ? (
                    <select
                      value={searchParams[col.key] || ''}
                      onChange={(e) => setSearchParams({ ...searchParams, [col.key]: e.target.value })}
                      className={`px-2 ${compact ? 'py-1' : 'py-1.5'} border border-gray-300 rounded text-xs w-24`}
                    >
                      <option value="">请选择</option>
                      {col.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={searchParams[col.key] || ''}
                      onChange={(e) => setSearchParams({ ...searchParams, [col.key]: e.target.value })}
                      className={`px-2 ${compact ? 'py-1' : 'py-1.5'} border border-gray-300 rounded text-xs w-24`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 表格 */}
      <div className="overflow-auto flex-1" style={tableStyle}>
        <table className="w-full min-w-[600px]">
          <thead className="sticky top-0 bg-gray-100 z-10">
            <tr className="border-b border-gray-200">
              {visibleColumns.map(col => (
                <th
                  key={col.key}
                  style={{ 
                    width: col.width || 150, 
                    minWidth: col.minWidth || col.width || 150,
                    textAlign: col.align || 'left'
                  }}
                  className={`${paddingClass} text-left ${textSizeClass} font-medium text-gray-600 truncate`}
                >
                  <div className="flex items-center gap-1">
                    <span className="truncate">{col.label}</span>
                    {col.sortable && (
                      <button 
                        onClick={() => onSort?.(col.key, 'asc')}
                        className="p-0.5 hover:bg-gray-200 rounded"
                      >
                        ↕
                      </button>
                    )}
                  </div>
                </th>
              ))}
              {(showEdit || showDelete || showDetail) && (
                <th className={`${paddingClass} text-left ${textSizeClass} font-medium text-gray-600`} style={{ width: 120 }}>
                  操作
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length + (showEdit || showDelete || showDetail ? 1 : 0)} className={`${paddingClass} text-center text-gray-400`}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    加载中...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + (showEdit || showDelete || showDetail ? 1 : 0)} className={`${paddingClass} text-center text-gray-400`}>
                  暂无数据
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={row[rowKey] || idx}
                  className={`border-b border-gray-100 ${hoverable ? 'hover:bg-gray-50' : ''} ${striped && idx % 2 === 1 ? 'bg-gray-50/50' : ''}`}
                >
                  {visibleColumns.map(col => (
                    <td
                      key={col.key}
                      className={`${paddingClass} ${textSizeClass} text-gray-700`}
                      style={{ 
                        textAlign: col.align || 'left',
                        maxWidth: col.ellipsis !== false ? (col.width || 150) : undefined,
                        overflow: col.ellipsis !== false ? 'hidden' : undefined,
                        textOverflow: col.ellipsis !== false ? 'ellipsis' : undefined,
                        whiteSpace: col.ellipsis !== false ? 'nowrap' : undefined,
                      }}
                      title={col.ellipsis !== false ? String(row[col.key] ?? '-') : undefined}
                    >
                      {renderCellValue(row[col.key], col, row, idx)}
                    </td>
                  ))}
                  {(showEdit || showDelete || showDetail) && (
                    <td className={`${paddingClass}`}>
                      <div className="flex items-center gap-1">
                        {showDetail && (
                          <button
                            onClick={() => onDetail?.(row)}
                            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-blue-500"
                            title="查看"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {showEdit && (
                          <button
                            onClick={() => onEdit?.(row)}
                            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-blue-500"
                            title="编辑"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {showDelete && (
                          <button
                            onClick={() => onDelete?.(row)}
                            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-500"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {paginationConfig && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500">
            共 {total} 条
          </div>
          <div className="flex items-center gap-2">
            <select
              value={currentPageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-xs"
            >
              <option value={10}>10条/页</option>
              <option value={20}>20条/页</option>
              <option value={50}>50条/页</option>
              <option value={100}>100条/页</option>
            </select>
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              上一页
            </button>
            <span className="px-3 py-1 text-xs">
              第 {currentPage} / {totalPages} 页
            </span>
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
