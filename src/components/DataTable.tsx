import { useState, useEffect, useRef, ReactNode } from 'react';
import { Search, Plus, Download, ChevronDown, ChevronUp, Edit2, Trash2, Eye, RefreshCw, X } from 'lucide-react';

export interface ColumnDef {
  key: string;
  label: string;
  width?: number;
  minWidth?: number;
  visible?: boolean;
  sortable?: boolean;
  fieldType?: 'text' | 'number' | 'select' | 'date' | 'datetime' | 'switch' | 'image' | 'currency' | 'action' | 'fixed' | 'custom';
  align?: 'left' | 'center' | 'right';
  ellipsis?: boolean;
  frozen?: boolean;
  dataDictionary?: string;
  dateFormat?: string;
  options?: { label: string; value: string }[];
  defaultValue?: any;
  placeholder?: string;
  required?: boolean;
  span?: number;  // 表单中占的列宽
  // 自定义渲染
  render?: (value: any, row: Record<string, any>, index: number) => ReactNode;
  // 自定义查询控件类型
  queryType?: 'input' | 'select' | 'date' | 'daterange' | 'number';
  queryOperator?: 'eq' | 'like' | 'gt' | 'lt' | 'between';
  // 固定值和自定义函数
  fixedValue?: any;
  customFunction?: string;
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
  // CRUD 回调（弹窗需要）
  onSubmit?: (type: 'add' | 'edit', data: Record<string, any>, done: () => void) => void;
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
  // 弹窗配置
  modalTitle?: { add?: string; edit?: string; detail?: string };
  // 弹窗宽度
  modalWidth?: number | string;
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
  onSubmit,
  dictData = {},
  bordered = true,
  striped = true,
  hoverable = true,
  compact = false,
  maxHeight,
  rowKey = 'id',
  extraActions,
  customToolbar,
  modalTitle = { add: '新增', edit: '编辑', detail: '详情' },
  modalWidth = 600,
}: DataTableProps) {
  const [searchParams, setSearchParams] = useState<Record<string, any>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(columns.filter(c => c.fieldType !== 'action').map(c => c.key));
  const [showColSelector, setShowColSelector] = useState(false);

  // 弹窗状态
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'detail'>('add');
  const [editRow, setEditRow] = useState<Record<string, any> | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  // 初始化查询参数（仅在组件挂载时执行一次）
  const initRef = useRef(false);
  useEffect(() => {
    if (!initRef.current && Object.keys(defaultQueryParams).length > 0) {
      initRef.current = true;
      setSearchParams(defaultQueryParams);
    }
  }, []);

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

  // 弹窗操作
  const openAddModal = () => {
    setModalType('add');
    setEditRow(null);
    setFormData({});
    setShowModal(true);
    onAdd?.();
  };

  const openEditModal = (row: Record<string, any>) => {
    // 如果有 onEdit 回调（外部处理），则不显示内部弹窗
    if (onEdit) {
      onEdit(row);
      return;
    }
    setModalType('edit');
    setEditRow(row);
    setFormData({ ...row });
    setShowModal(true);
  };

  const openDetailModal = (row: Record<string, any>) => {
    setModalType('detail');
    setEditRow(row);
    setFormData({ ...row });
    setShowModal(true);
    onDetail?.(row);
  };

  const handleDelete = (row: Record<string, any>) => {
    if (confirm('确定删除？')) {
      onDelete?.(row);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      if (onSubmit) {
        await new Promise<void>((resolve) => {
          onSubmit(modalType as 'add' | 'edit', formData, () => resolve());
        });
      }
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const renderCellValue = (value: any, col: ColumnDef, row: Record<string, any>, index: number) => {
    if (col.render) {
      return col.render(value, row, index);
    }
    
    if (value === null || value === undefined) return '-';
    
    if (col.dataDictionary && dictData[col.dataDictionary]) {
      const item = dictData[col.dataDictionary].find(d => String(d.value) === String(value));
      if (item) return item.label;
    }
    
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
      case 'fixed':
        return col.fixedValue ?? '-';
      case 'custom':
        if (col.customFunction) {
          try {
            const fn = new Function('row', 'index', col.customFunction);
            return <span dangerouslySetInnerHTML={{ __html: fn(row, index) || '-' }} />;
          } catch {
            return '-';
          }
        }
        return String(value);
      default:
        return String(value);
    }
  };

  const paddingClass = compact ? 'px-2 py-1.5' : 'px-4 py-3';
  const textSizeClass = compact ? 'text-xs' : 'text-sm';

  const tableStyle = maxHeight ? { maxHeight } : {};

  // 表单字段（排除 action 和 queryCondition）
  const formColumns = columns.filter(col => 
    col.visible !== false && 
    col.fieldType !== 'action' &&
    col.queryCondition !== true
  );

  return (
    <div className={`bg-[var(--bg-primary)] rounded ${bordered ? 'border border-[var(--border)]' : ''} flex flex-col`}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2">
          {customToolbar}
        </div>
        <div className="flex items-center gap-2">
          {extraActions}
          {showRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 hover:bg-[var(--bg-hover)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="刷新"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {showColumnSelector && (
            <button
              onClick={() => setShowColSelector(!showColSelector)}
              className="p-1.5 hover:bg-[var(--bg-hover)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              title="列配置"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 列选择器 */}
      {showColSelector && (
        <div className="px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border)] flex flex-wrap gap-2">
          {columns.filter(c => c.fieldType !== 'action').map(col => (
            <label key={col.key} className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={selectedColumns.includes(col.key)}
                onChange={() => handleColumnToggle(col.key)}
                className="w-3.5 h-3.5 rounded border-[var(--border)]"
              />
              <span className="text-[var(--text-secondary)]">{col.label}</span>
            </label>
          ))}
        </div>
      )}

      {/* 查询和按钮区域 */}
      {showSearchBar && effectiveQueryFields.length > 0 && (
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {displayQueryFields.slice(0, 3).map(col => (
                <div key={col.key} className="flex items-center gap-1.5">
                  <label className={`text-xs text-[var(--text-muted)] whitespace-nowrap ${compact ? 'text-[10px]' : ''}`}>
                    {col.label}:
                  </label>
                  {col.queryType === 'select' || col.fieldType === 'select' ? (
                    <select
                      value={searchParams[col.key] || ''}
                      onChange={(e) => setSearchParams({ ...searchParams, [col.key]: e.target.value })}
                      className={`px-2 ${compact ? 'py-1' : 'py-1.5'} border border-[var(--border)] rounded text-xs w-24 bg-[var(--input-bg)] text-[var(--text-primary)]`}
                    >
                      <option value="">请选择</option>
                      {col.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                      {col.dataDictionary && dictData[col.dataDictionary]?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={col.queryType === 'number' || col.fieldType === 'number' ? 'number' : 'text'}
                      value={searchParams[col.key] || ''}
                      onChange={(e) => setSearchParams({ ...searchParams, [col.key]: e.target.value })}
                      placeholder={`请输入`}
                      className={`px-2 ${compact ? 'py-1' : 'py-1.5'} border border-[var(--border)] rounded text-xs w-24 bg-[var(--input-bg)] text-[var(--text-primary)]`}
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
                    className={`px-3 ${compact ? 'py-1' : 'py-1.5'} text-xs bg-[var(--accent-light)]0 text-white rounded hover:bg-[var(--accent-hover)] flex items-center gap-1`}
                  >
                    <Search className="w-3 h-3" />
                    查询
                  </button>
                  <button
                    onClick={handleReset}
                    className={`px-3 ${compact ? 'py-1' : 'py-1.5'} text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded hover:bg-[var(--bg-hover)]`}
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
                  onClick={openAddModal}
                  className={`px-3 ${compact ? 'py-1' : 'py-1.5'} text-xs bg-[var(--accent-light)]0 text-white rounded hover:bg-[var(--accent-hover)] flex items-center gap-1`}
                >
                  <Plus className="w-3 h-3" />
                  新增
                </button>
              )}
              {showExport && (
                <button
                  onClick={() => onExport?.('current')}
                  className={`px-3 ${compact ? 'py-1' : 'py-1.5'} text-xs bg-[var(--success)] text-white rounded hover:bg-[var(--success)] flex items-center gap-1`}
                >
                  <Download className="w-3 h-3" />
                  导出
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 表格 */}
      <div className="overflow-auto flex-1" style={tableStyle}>
        <table className="w-full min-w-[600px]">
          <thead className="sticky top-0 bg-[var(--bg-tertiary)] z-10">
            <tr className="border-b border-[var(--border)]">
              {visibleColumns.map(col => (
                <th
                  key={col.key}
                  style={{ 
                    width: col.width || 150, 
                    minWidth: col.minWidth || col.width || 150,
                    textAlign: col.align || 'left'
                  }}
                  className={`${paddingClass} text-left ${textSizeClass} font-medium text-[var(--text-secondary)] truncate`}
                >
                  <div className="flex items-center gap-1">
                    <span className="truncate">{col.label}</span>
                    {col.sortable && (
                      <button 
                        onClick={() => onSort?.(col.key, 'asc')}
                        className="p-0.5 hover:bg-[var(--bg-hover)] rounded"
                      >
                        ↕
                      </button>
                    )}
                  </div>
                </th>
              ))}
              {(showEdit || showDelete || showDetail) && (
                <th className={`${paddingClass} text-left ${textSizeClass} font-medium text-[var(--text-secondary)]`} style={{ width: 120 }}>
                  操作
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length + (showEdit || showDelete || showDetail ? 1 : 0)} className={`${paddingClass} text-center text-[var(--text-muted)]`}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    加载中...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + (showEdit || showDelete || showDetail ? 1 : 0)} className={`${paddingClass} text-center text-[var(--text-muted)]`}>
                  暂无数据
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={row[rowKey] || idx}
                  className={`border-b border-[var(--border-light)] ${hoverable ? 'hover:bg-[var(--bg-secondary)]' : ''} ${striped && idx % 2 === 1 ? 'bg-[var(--bg-secondary)]/50' : ''}`}
                >
                  {visibleColumns.map(col => (
                    <td
                      key={col.key}
                      className={`${paddingClass} ${textSizeClass} text-[var(--text-primary)]`}
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
                            onClick={() => openDetailModal(row)}
                            className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-muted)] hover:text-blue-500"
                            title="查看"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        {showEdit && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditModal(row); }}
                            className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-muted)] hover:text-blue-500"
                            title="编辑"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {showDelete && (
                          <button
                            onClick={() => handleDelete(row)}
                            className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-muted)] hover:text-red-500"
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
        <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="text-xs text-[var(--text-muted)]">
            共 {total} 条
          </div>
          <div className="flex items-center gap-2">
            <select
              value={currentPageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
              className="px-2 py-1 border border-[var(--border)] rounded text-xs bg-[var(--input-bg)] text-[var(--text-primary)]"
            >
              <option value={10}>10条/页</option>
              <option value={20}>20条/页</option>
              <option value={50}>50条/页</option>
              <option value={100}>100条/页</option>
            </select>
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1 text-xs bg-[var(--bg-primary)] border border-[var(--border)] rounded hover:bg-[var(--bg-secondary)] disabled:opacity-50"
            >
              上一页
            </button>
            <span className="px-3 py-1 text-xs">
              第 {currentPage} / {totalPages} 页
            </span>
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1 text-xs bg-[var(--bg-primary)] border border-[var(--border)] rounded hover:bg-[var(--bg-secondary)] disabled:opacity-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {/* 弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div 
            className="bg-[var(--bg-primary)] rounded-lg shadow-xl max-h-[80vh] overflow-hidden flex flex-col"
            style={{ width: typeof modalWidth === 'number' ? `${modalWidth}px` : modalWidth }}
          >
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
              <h3 className="text-lg font-medium text-[var(--text-primary)]">
                {modalTitle[modalType] || (modalType === 'add' ? '新增' : modalType === 'edit' ? '编辑' : '详情')}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-[var(--bg-hover)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 弹窗内容 - 表单 */}
            <div className="flex-1 overflow-y-auto p-6">
              {modalType !== 'detail' ? (
                <div className="grid grid-cols-2 gap-4">
                  {formColumns.map(col => (
                    <div 
                      key={col.key} 
                      className={col.span && col.span > 1 ? 'col-span-2' : ''}
                    >
                      <label className="block text-sm text-[var(--text-secondary)] mb-1">
                        {col.label}
                        {col.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {col.fieldType === 'select' || col.queryType === 'select' ? (
                        <select
                          value={formData[col.key] ?? ''}
                          onChange={(e) => handleFormChange(col.key, e.target.value)}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm focus:outline-none focus:border-[var(--accent)]"
                          disabled={modalType === 'detail'}
                        >
                          <option value="">请选择</option>
                          {col.options?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                          {col.dataDictionary && dictData[col.dataDictionary]?.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : col.fieldType === 'date' ? (
                        <input
                          type="date"
                          value={formData[col.key] ?? ''}
                          onChange={(e) => handleFormChange(col.key, e.target.value)}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm focus:outline-none focus:border-[var(--accent)]"
                          disabled={modalType === 'detail'}
                        />
                      ) : col.fieldType === 'datetime' ? (
                        <input
                          type="datetime-local"
                          value={formData[col.key] ? String(formData[col.key]).substring(0, 16) : ''}
                          onChange={(e) => handleFormChange(col.key, e.target.value)}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm focus:outline-none focus:border-[var(--accent)]"
                          disabled={modalType === 'detail'}
                        />
                      ) : col.fieldType === 'number' ? (
                        <input
                          type="number"
                          value={formData[col.key] ?? ''}
                          onChange={(e) => handleFormChange(col.key, e.target.value)}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm focus:outline-none focus:border-[var(--accent)]"
                          disabled={modalType === 'detail'}
                        />
                      ) : col.fieldType === 'switch' ? (
                        <select
                          value={formData[col.key] ?? ''}
                          onChange={(e) => handleFormChange(col.key, e.target.value)}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm focus:outline-none focus:border-[var(--accent)]"
                          disabled={modalType === 'detail'}
                        >
                          <option value="">请选择</option>
                          <option value="1">是</option>
                          <option value="0">否</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={formData[col.key] ?? ''}
                          onChange={(e) => handleFormChange(col.key, e.target.value)}
                          placeholder={col.placeholder || `请输入${col.label}`}
                          className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm focus:outline-none focus:border-[var(--accent)]"
                          disabled={modalType === 'detail'}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                /* 详情模式 */
                <div className="grid grid-cols-2 gap-4">
                  {formColumns.map(col => (
                    <div 
                      key={col.key} 
                      className={`${col.span && col.span > 1 ? 'col-span-2' : ''}`}
                    >
                      <label className="block text-sm text-[var(--text-muted)] mb-1">{col.label}</label>
                      <div className="text-sm text-gray-800 px-3 py-2 bg-[var(--bg-secondary)] rounded">
                        {renderCellValue(formData[col.key], col, formData, 0)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 弹窗底部 */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-[var(--text-secondary)] bg-[var(--bg-primary)] border border-[var(--border)] rounded hover:bg-[var(--bg-secondary)]"
              >
                取消
              </button>
              {modalType !== 'detail' && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-2 text-sm text-white bg-[var(--accent-light)]0 rounded hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                  {submitting ? '提交中...' : '确定'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
