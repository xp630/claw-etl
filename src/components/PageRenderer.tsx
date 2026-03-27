import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Search, Download, Plus, Edit2, Trash2, Eye, X } from 'lucide-react';
import { dataBridge } from '../lib/DataBridge';
import cn from 'classnames';

// 组件配置类型
interface ComponentConfig {
  id: string;
  type: string;
  label: string;
  props: Record<string, unknown>;
  children?: ComponentConfig[];
}

// PageRenderer：根据配置渲染完整页面
interface PageRendererProps {
  components: ComponentConfig[];
  onEvent?: (componentId: string, event: string, data: any) => void;
}

// 表格组件属性
interface TableProps {
  apiId?: number;
  queryApiId?: number;
  createApiId?: number;
  updateApiId?: number;
  deleteApiId?: number;
  columns: { key: string; label: string; width?: number; sortable?: boolean; fieldType?: string; dateFormat?: string; fixedValue?: string; customFunction?: string; align?: string; ellipsis?: boolean; visible?: boolean; queryCondition?: boolean }[];
  bordered?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  showSearch?: boolean;
  showAdd?: boolean;
  showExport?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
  showPagination?: boolean;
  showDetail?: boolean;
  onEvent?: (componentId: string, event: string, data: any) => void;
}

// 表格组件渲染 - Tailwind 样式，与编辑器保持一致
function TableRenderer({
  apiId,
  queryApiId,
  createApiId,
  updateApiId,
  deleteApiId,
  columns,
  bordered,
  striped,
  hoverable,
  pagination,
  pageSize: initialPageSize,
  showSearch,
  showAdd,
  showExport,
  showEdit,
  showDelete,
  showPagination,
  showDetail,
  onEvent
}: TableProps) {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(initialPageSize || 10);
  const [total, setTotal] = useState(0);
  const [searchParams, setSearchParams] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [editRow, setEditRow] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const effectiveApiId = queryApiId || apiId;

  const loadData = useCallback(async (pageNum: number = 1, params?: Record<string, string>) => {
    if (!effectiveApiId) return;

    setLoading(true);
    try {
      const result = await dataBridge.request(effectiveApiId, {
        page: pageNum,
        pageSize: currentPageSize,
        ...params
      });
      setData(result.list || []);
      setTotal(result.total || 0);
      setPage(pageNum);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [effectiveApiId, currentPageSize]);

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  const handleSearch = () => {
    loadData(1, searchParams);
  };

  const handleAdd = () => {
    setModalType('add');
    setEditRow(null);
    setFormData({});
    setShowModal(true);
  };

  const handleEdit = (row: any) => {
    setModalType('edit');
    setEditRow(row);
    setFormData({ ...row });
    setShowModal(true);
  };

  const handleDelete = async (row: any) => {
    if (!confirm('确定删除？')) return;
    if (!deleteApiId) {
      alert('未配置删除 API');
      return;
    }
    try {
      await dataBridge.request(deleteApiId, { id: row.id });
      alert('删除成功');
      loadData(page);
    } catch (error) {
      alert('删除失败');
    }
  };

  const handleSubmit = async () => {
    const targetApiId = modalType === 'add' ? createApiId : updateApiId;
    if (!targetApiId) {
      alert('未配置 API');
      return;
    }
    try {
      await dataBridge.request(targetApiId, formData);
      alert('操作成功');
      setShowModal(false);
      loadData(page);
    } catch (error) {
      alert('操作失败');
    }
  };

  const handleExport = () => {
    import('xlsx').then(XLSX => {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, 'export.xlsx');
    });
  };

  const handleRowClick = (row: any) => {
    if (onEvent) {
      onEvent('table', 'onRowClick', row);
    }
  };

  const visibleColumns = columns.filter(col => col.visible !== false);
  const queryFields = visibleColumns.filter(col => col.queryCondition);
  const totalPages = Math.ceil(total / currentPageSize) || 1;

  const renderCell = (col: typeof visibleColumns[0], row: Record<string, any>) => {
    const value = row[col.key];
    if (col.fieldType === 'image') {
      return value ? (
        <img src={value} alt="" className="h-8 w-8 object-cover rounded" />
      ) : (
        <span className="text-gray-300">-</span>
      );
    }
    if (col.fieldType === 'date') {
      if (!value) return <span className="text-gray-300">-</span>;
      try {
        const date = new Date(value);
        return col.dateFormat ? date.toLocaleDateString() : String(value);
      } catch {
        return String(value);
      }
    }
    if (col.fieldType === 'fixed') {
      return <span>{col.fixedValue || '-'}</span>;
    }
    if (col.fieldType === 'custom' && col.customFunction) {
      try {
        const fn = new Function('row', col.customFunction);
        const result = fn(row);
        return <span dangerouslySetInnerHTML={{ __html: result || '-' }} />;
      } catch {
        return <span>-</span>;
      }
    }
    return value != null ? String(value) : '-';
  };

  return (
    <div className="border border-gray-200 rounded bg-white flex flex-col h-full">
      {/* 查询和操作按钮区域 - 合并到同一行 */}
      <div className="flex flex-wrap gap-2 p-3 border-b border-gray-200 bg-gray-50 items-center flex-shrink-0">
        {/* 查询条件区域 - 靠左 */}
        <div className="flex flex-wrap gap-2 items-center">
          {queryFields.slice(0, 4).map(col => (
            <div key={col.key} className="flex items-center gap-1.5">
              <label className="text-xs text-gray-500 whitespace-nowrap">{col.label}:</label>
              {col.fieldType === 'select' ? (
                <select
                  value={searchParams[col.key] || ''}
                  onChange={(e) => setSearchParams({ ...searchParams, [col.key]: e.target.value })}
                  className="px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="">请选择</option>
                </select>
              ) : (col.fieldType === 'date' || col.fieldType === 'datetime') ? (
                // 时间字段显示开始和结束两个日期框
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={searchParams[col.key + 'Start'] || ''}
                    onChange={(e) => setSearchParams({ ...searchParams, [col.key + 'Start']: e.target.value })}
                    className="px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-xs text-gray-400">至</span>
                  <input
                    type="date"
                    value={searchParams[col.key + 'End'] || ''}
                    onChange={(e) => setSearchParams({ ...searchParams, [col.key + 'End']: e.target.value })}
                    className="px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              ) : (
                <input
                  type={col.fieldType === 'number' ? 'number' : 'text'}
                  value={searchParams[col.key] || ''}
                  onChange={(e) => setSearchParams({ ...searchParams, [col.key]: e.target.value })}
                  placeholder={`请输入${col.label}`}
                  className="px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-blue-500 w-24"
                />
              )}
            </div>
          ))}
          {queryFields.length > 0 && (
            <button
              onClick={handleSearch}
              className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
            >
              <Search className="w-3 h-3" />
              搜索
            </button>
          )}
        </div>

        {/* 操作按钮区域 - 靠右 */}
        {(showAdd || showExport) && (
          <div className="flex gap-2 ml-auto">
            {showAdd && (
              <button
                onClick={handleAdd}
                className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                新增
              </button>
            )}
            {showExport && (
              <button
                onClick={handleExport}
                className="px-3 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                导出
              </button>
            )}
          </div>
        )}
      </div>

      {/* 表格 */}
      <div className="overflow-auto flex-1 min-h-0">
        <table className="w-full min-w-[600px] h-full">
          <thead className="sticky top-0">
            <tr className="border-b border-gray-200 bg-gray-50">
              {visibleColumns.map(col => (
                <th
                  key={col.key}
                  style={{ width: col.width || 150, minWidth: col.width || 150 }}
                  className={cn(
                    'px-4 py-2.5 text-left text-xs font-medium text-gray-500 truncate',
                    col.sortable ? 'cursor-pointer hover:bg-gray-100' : '',
                    col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
                  )}
                >
                  {col.label}
                </th>
              ))}
              {(showDetail || showEdit || showDelete) && (
                <th
                  style={{ width: 150, minWidth: 150 }}
                  className="px-4 py-2.5 text-left text-xs font-medium text-gray-500"
                >
                  操作
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length + (showDetail || showEdit || showDelete ? 1 : 0)} className="text-center py-12 text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    加载中...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length + (showDetail || showEdit || showDelete ? 1 : 0)} className="text-center py-12 text-gray-400">
                  暂无数据
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={i}
                  className={cn(
                    'border-b border-gray-100 transition-colors',
                    striped && i % 2 === 1 ? 'bg-gray-50' : '',
                    hoverable ? 'hover:bg-gray-50 cursor-pointer' : ''
                  )}
                  onClick={() => handleRowClick(row)}
                >
                  {visibleColumns.map(col => (
                    <td
                      key={col.key}
                      style={{ width: col.width || 150, minWidth: col.width || 150 }}
                      className={cn(
                        'px-4 py-2.5 text-sm text-gray-700 truncate',
                        col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''
                      )}
                      title={String(row[col.key] ?? '-')}
                    >
                      {renderCell(col, row)}
                    </td>
                  ))}
                  {(showDetail || showEdit || showDelete) && (
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1">
                        {showDetail && (
                          <button
                            className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded transition-colors flex items-center gap-0.5"
                            onClick={(e) => { e.stopPropagation(); }}
                          >
                            <Eye className="w-3 h-3" />
                            详情
                          </button>
                        )}
                        {showEdit && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(row); }}
                            className="px-2 py-1 text-xs text-blue-500 hover:bg-blue-50 rounded transition-colors flex items-center gap-0.5"
                          >
                            <Edit2 className="w-3 h-3" />
                            编辑
                          </button>
                        )}
                        {showDelete && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
                            className="px-2 py-1 text-xs text-red-500 hover:bg-red-50 rounded transition-colors flex items-center gap-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                            删除
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
      {showPagination && total > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-200 text-xs text-gray-500 flex-shrink-0">
          <span>共 {total} 条</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span>每页</span>
              <select
                value={currentPageSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value);
                  setCurrentPageSize(newSize);
                  setPage(1);
                }}
                className="px-1 py-0.5 border border-gray-200 rounded text-xs focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>条</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                上一页
              </button>
              <span className="px-2 py-1">{page} / {totalPages}</span>
              <button
                className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                下一页
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div
            className="bg-white rounded-lg w-[500px] max-h-[80vh] overflow-hidden shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="font-medium text-gray-700">
                {modalType === 'add' ? '新增' : '编辑'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              <div className="space-y-3">
                {visibleColumns
                  .filter(col => col.key !== 'id' && col.fieldType !== 'action')
                  .map(col => (
                    <div key={col.key}>
                      <label className="block text-xs text-gray-500 mb-1">{col.label}</label>
                      <input
                        type={col.fieldType === 'number' ? 'number' : 'text'}
                        value={formData[col.key] || ''}
                        onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PageRenderer({ components, onEvent }: PageRendererProps) {
  const handleEvent = (componentId: string, event: string, data: any) => {
    if (onEvent) {
      onEvent(componentId, event, data);
    }
  };

  return (
    <div className="flex flex-col gap-4" style={{ width: '100%' }}>
      {components.map(comp => (
        <ComponentRenderer
          key={comp.id}
          {...comp}
          onEvent={handleEvent}
        />
      ))}
    </div>
  );
}

// Container Renderer - 与编辑器风格一致
function ContainerRenderer({ type, props, children, onEvent }: { type: string; props: Record<string, unknown>; children?: ComponentConfig[] | React.ReactNode; onEvent?: Function }) {
  const renderChildren = (): React.ReactNode => {
    // 优先使用 props.children（ComponentConfig 结构），其次使用 children
    const childComponents = (props.children as ComponentConfig[]) || (children as ComponentConfig[]);
    if (Array.isArray(childComponents) && childComponents.length > 0) {
      return childComponents.map((child: ComponentConfig) => (
        <ComponentRenderer key={child.id} {...child} onEvent={onEvent} />
      ));
    }
    return null;
  };

  const containerStyle: React.CSSProperties = {
    width: (props.width as number | string) ?? '100%',
    minWidth: 0,
    flex: 1,
    borderRadius: 8,
    padding: 16,
  };

  switch (type) {
    case 'card':
      console.log('[Card Debug] props:', props, 'children:', children, 'title value:', props?.title, 'bordered value:', props?.bordered);
      const hasBorder = props.bordered !== false;
      return (
        <div
          className={cn(
            'w-full bg-white rounded-lg p-4 flex flex-col',
            hasBorder ? 'border border-gray-200' : ''
          )}
          style={containerStyle}
        >
          {props.title && <div className="font-medium text-gray-700 mb-3 text-sm flex-shrink-0">{String(props.title)}</div>}
          <div className="flex-1 min-h-0">{renderChildren()}</div>
        </div>
      );
    case 'tabs': {
      const tabs = (props.tabs as string[]) || [];
      const [activeTab, setActiveTab] = useState(Number(props.activeTab) || 0);
      const arr = (children as ComponentConfig[]) || [];
      const activeChild = arr[activeTab];

      return (
        <div className="w-full bg-white border border-gray-200 rounded-lg flex flex-col" style={containerStyle}>
          <div className="flex border-b border-gray-200 -mx-4 px-4 mb-3 flex-shrink-0">
            {tabs.map((tab, i) => (
              <div
                key={i}
                onClick={() => setActiveTab(i)}
                className={cn(
                  'px-4 py-2 text-sm cursor-pointer transition-colors border-b-2 -mb-px',
                  i === activeTab
                    ? 'text-blue-500 border-blue-500 font-medium'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                )}
              >
                {tab}
              </div>
            ))}
          </div>
          <div className="flex-1 min-h-0 overflow-hidden">{activeChild && <ComponentRenderer key={activeChild.id} {...activeChild} onEvent={onEvent} />}</div>
        </div>
      );
    }
    case 'collapse':
      return (
        <div className="w-full bg-white border border-gray-200 rounded-lg flex flex-col" style={containerStyle}>
          {((props.panels as Array<{ title: string; content: string }>) || []).map((panel, i) => (
            <div key={i} className={cn('border border-gray-200 rounded mb-2 last:mb-0 flex flex-col', i > 0 && 'mt-2')}>
              <div className="px-4 py-2.5 bg-gray-50 flex items-center justify-between flex-shrink-0">
                <span className="text-sm font-medium text-gray-700">{panel.title}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
              <div className="p-4 flex-1 min-h-0">
                {i === 0 && renderChildren()}
              </div>
            </div>
          ))}
        </div>
      );
    default:
      return <div>{renderChildren()}</div>;
  }
}

// 组件渲染器 - Tailwind 样式，与编辑器 ComponentRenderer 保持一致
function ComponentRenderer({ type, props, children, onEvent }: { type: string; props: Record<string, unknown>; children?: ComponentConfig[] | React.ReactNode; onEvent?: Function }) {
  // Container components
  if (type === 'card' || type === 'tabs' || type === 'collapse') {
    return <ContainerRenderer type={type} props={props} children={children} onEvent={onEvent} />;
  }

  switch (type) {
    case 'Text':
    case 'text':
      return (
        <div className="text-sm text-gray-700" style={props.style as React.CSSProperties}>
          {String(props.content || '文本')}
        </div>
      );

    case 'Button':
    case 'button': {
      const buttonType = props.buttonType as string;
      const getButtonClass = () => {
        switch (buttonType) {
          case 'primary': return 'bg-blue-500 text-white hover:bg-blue-600';
          case 'success': return 'bg-green-500 text-white hover:bg-green-600';
          case 'warning': return 'bg-yellow-500 text-white hover:bg-yellow-600';
          case 'danger': return 'bg-red-500 text-white hover:bg-red-600';
          case 'default': return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
          case 'text': return 'bg-transparent text-blue-500 hover:bg-blue-50';
          default: return 'bg-blue-500 text-white hover:bg-blue-600';
        }
      };
      return (
        <button className={cn('px-4 py-1.5 text-sm rounded transition-colors', getButtonClass(), props.className as string)}>
          {String(props.text || '按钮')}
        </button>
      );
    }

    case 'Input':
    case 'input':
      return (
        <div className="flex flex-col gap-1">
          {props.label && <label className="text-xs text-gray-500">{String(props.label)}</label>}
          <input
            type="text"
            placeholder={String(props.placeholder || '')}
            className={cn('px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 transition-colors', props.className as string)}
          />
        </div>
      );

    case 'Table':
    case 'table': {
      const apiId = props.apiId as number | undefined;
      const queryApiId = props.queryApiId as number | undefined;
      const createApiId = props.createApiId as number | undefined;
      const updateApiId = props.updateApiId as number | undefined;
      const deleteApiId = props.deleteApiId as number | undefined;
      const cols = (props.columns as Array<{ key: string; label: string; width?: number; sortable?: boolean; fieldType?: string; dateFormat?: string; fixedValue?: string; customFunction?: string; align?: string; ellipsis?: boolean; visible?: boolean; queryCondition?: boolean }>) || [];
      const bordered = props.bordered as boolean;
      const striped = props.striped as boolean;
      const hoverable = props.hoverable as boolean;
      const pagination = props.pagination as boolean;
      const pageSize = (props.pageSize as number) || 10;
      const showSearch = props.showSearch as boolean;
      const showAdd = props.showAdd as boolean | undefined;
      const showExport = props.showExport as boolean | undefined;
      const showEdit = props.showEdit as boolean;
      const showDelete = props.showDelete as boolean;
      const showPagination = props.showPagination as boolean;
      const showDetail = props.showDetail as boolean;

      if (apiId || queryApiId) {
        return (
          <TableRenderer
            apiId={apiId}
            queryApiId={queryApiId}
            createApiId={createApiId}
            updateApiId={updateApiId}
            deleteApiId={deleteApiId}
            columns={cols}
            bordered={bordered}
            striped={striped}
            hoverable={hoverable}
            pagination={pagination}
            pageSize={pageSize}
            showSearch={showSearch}
            showAdd={showAdd}
            showExport={showExport}
            showEdit={showEdit}
            showDelete={showDelete}
            showPagination={showPagination}
            showDetail={showDetail}
            onEvent={onEvent as any}
          />
        );
      }

      // Static data table (simplified)
      const data = (props.data as Record<string, any>[]) || [];
      return (
        <div className="border border-gray-200 rounded bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  {cols.filter(c => c.visible !== false).map(col => (
                    <th key={col.key} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={cols.filter(c => c.visible !== false).length} className="text-center py-8 text-gray-400">暂无数据</td>
                  </tr>
                ) : (
                  data.map((row, i) => (
                    <tr key={i} className={cn('border-b border-gray-100', striped && i % 2 === 1 && 'bg-gray-50', hoverable && 'hover:bg-gray-50')}>
                      {cols.filter(c => c.visible !== false).map(col => (
                        <td key={col.key} className="px-4 py-2 text-sm text-gray-700">{String(row[col.key] ?? '-')}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    case 'lineChart':
    case 'barChart':
    case 'pieChart':
    case 'Chart':
      return (
        <div className="border border-gray-200 rounded p-6 bg-gray-50 text-center">
          <div className="text-sm text-gray-500">{String(props.title || '图表组件')}</div>
        </div>
      );

    case 'select':
      return (
        <div className="flex flex-col gap-1">
          {props.label && <label className="text-xs text-gray-500">{String(props.label)}</label>}
          <select className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500 bg-white">
            <option value="">{String(props.placeholder || '请选择')}</option>
            {((props.options as string[]) || []).map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );

    case 'date':
      return (
        <div className="flex flex-col gap-1">
          {props.label && <label className="text-xs text-gray-500">{String(props.label)}</label>}
          <input
            type="date"
            className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      );

    case 'switch':
      return (
        <div className="flex items-center gap-2">
          {props.label && <label className="text-xs text-gray-500">{String(props.label)}</label>}
          <button
            type="button"
            className={cn('w-10 h-5 rounded-full transition-colors relative', props.value ? 'bg-blue-500' : 'bg-gray-300')}
          >
            <div className={cn('w-4 h-4 bg-white rounded-full shadow absolute top-0.5 transition-transform', props.value ? 'translate-x-5' : 'translate-x-0.5')} />
          </button>
        </div>
      );

    case 'slider':
      return (
        <div className="flex flex-col gap-1 w-full">
          {props.label && <label className="text-xs text-gray-500">{String(props.label)}</label>}
          <input
            type="range"
            min={Number(props.min) || 0}
            max={Number(props.max) || 100}
            value={Number(props.value) || 50}
            className="w-full"
          />
          <div className="text-xs text-gray-400 text-center">{Number(props.value) || 50}</div>
        </div>
      );

    case 'grid':
      return (
        <div
          className="border border-gray-200 rounded p-3 bg-gray-50"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Number(props.cols) || 3}, 1fr)`,
            gap: `${Number(props.gap) || 10}px`,
          }}
        >
          <div className="text-xs text-gray-400 text-center py-4">栅格布局</div>
        </div>
      );

    case 'divider':
      return <hr className="border-gray-300 my-2" />;

    case 'blank':
      return <div className="bg-gradient-to-r from-gray-100 to-gray-50" style={{ height: `${Number(props.height) || 50}px` }} />;

    case 'image':
      return (
        <img
          src={String(props.src || 'https://via.placeholder.com/200x100')}
          alt={String(props.alt || '图片')}
          className="max-w-full h-auto rounded"
        />
      );

    case 'link':
      return (
        <a href={String(props.url || '#')} className="text-blue-500 hover:underline text-sm">
          {String(props.text || '链接')}
        </a>
      );

    case 'Form':
    case 'form':
      // 表单组件 - 简化渲染
      return (
        <div className="border border-gray-200 rounded bg-white p-4">
          <div className="text-sm text-gray-500">表单组件（预览模式）</div>
        </div>
      );

    default:
      return <div className="text-gray-400 text-sm">未知组件: {type}</div>;
  }
}
