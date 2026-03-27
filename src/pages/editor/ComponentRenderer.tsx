import React, { useState, useCallback, useEffect } from 'react';
import { CanvasComponent, ColumnConfig } from './types';
import ContainerRenderer from './ContainerRenderer';
import FormRenderer from './FormRenderer';
import { dataBridge } from '../../lib/DataBridge';

interface ComponentRendererProps {
  component: CanvasComponent;
  children?: React.ReactNode;
  allComponents?: CanvasComponent[];
  onResize?: (id: string, width: number, height: number) => void;
  onUpdateProps?: (props: Record<string, unknown>) => void;
}

// Component Renderer
function ComponentRenderer({ component, children, allComponents, onResize, onUpdateProps }: ComponentRendererProps) {
  const { type, props, id } = component;

  // Helper to find component by ID in allComponents
  const findById = (compId: string): CanvasComponent | null => {
    if (!allComponents) return null;
    for (const c of allComponents) {
      if (c.id === compId) return c;
      if (c.children) {
        const found = findByIdInTree(c.children, compId);
        if (found) return found;
      }
    }
    return null;
  };

  const findByIdInTree = (comps: CanvasComponent[], compId: string): CanvasComponent | null => {
    for (const c of comps) {
      if (c.id === compId) return c;
      if (c.children) {
        const found = findByIdInTree(c.children, compId);
        if (found) return found;
      }
    }
    return null;
  };

  // Container components
  if (type === 'card' || type === 'tabs' || type === 'collapse') {
    const handleResize = useCallback((w: number, h: number) => {
      if (onResize) {
        onResize(component.id, w, h);
      }
    }, [onResize, component.id]);

    // For tabs, compute childComponents based on childrenMap and activeTab
    // For card/collapse, also compute childComponents from childrenMap, fallback to component.children
    let childComponents: CanvasComponent[] | undefined;
    
    if (type === 'tabs') {
      const tabIndex = String(props.activeTab || 0);
      const childrenMap = props.childrenMap as Record<string, string[]> | undefined;
      const childIds = (childrenMap && childrenMap[tabIndex]) || [];
      
      // First try to get children from childrenMap
      if (childIds.length > 0) {
        childComponents = childIds.map(cid => findById(cid)).filter(Boolean) as CanvasComponent[];
        console.log('[Tabs] childComponents from childrenMap:', childComponents?.length, 'for tabIndex:', tabIndex, 'childIds:', childIds);
      }
      
      // If childrenMap is empty or didn't find children, try component.children as fallback
      if (!childComponents || childComponents.length === 0) {
        if (component.children && component.children.length > 0) {
          childComponents = component.children;
          console.log('[Tabs] childComponents from component.children fallback:', childComponents.length);
        }
      }
      
      // Debug: log warning if we still have no children but should have
      if (childIds.length > 0 && (!childComponents || childComponents.length === 0)) {
        console.warn('[Tabs] childComponents empty but childIds exist:', { childIds, allComponentsIds: allComponents?.map(c => c.id) });
      }
      
      // Additional debug: log the structure
      console.log('[Tabs] Final childComponents:', childComponents?.length, 'for tab:', tabIndex);
    } else if ((type === 'card' || type === 'collapse') && allComponents) {
      // For card and collapse, try childrenMap first, fallback to component.children
      const childrenMap = props.childrenMap as Record<string, string[]> | undefined;
      const childIds = (childrenMap && childrenMap['0']) || [];
      
      if (childIds.length > 0) {
        // Use childrenMap if available
        childComponents = childIds.map(cid => findById(cid)).filter(Boolean) as CanvasComponent[];
        console.log(`[${type}] childComponents from childrenMap:`, childComponents?.length, 'childIds:', childIds);
      } else if (component.children && component.children.length > 0) {
        // Fallback to component.children
        childComponents = component.children;
        console.log(`[${type}] childComponents from component.children:`, childComponents?.length);
      }
    } else if ((type === 'card' || type === 'collapse') && component.children && component.children.length > 0) {
      // Fallback when allComponents is not available
      childComponents = component.children;
      console.log(`[${type}] childComponents from component.children (no allComponents):`, childComponents?.length);
    }

    // renderChild callback to recursively render child components
    const renderChild = useCallback((child: CanvasComponent) => {
      return (
        <ComponentRenderer
          key={child.id}
          component={child}
          allComponents={allComponents}
          onResize={onResize}
          onUpdateProps={onUpdateProps ? onUpdateProps.bind(null, child.id) : undefined}
        />
      );
    }, [allComponents, onResize, onUpdateProps]);

    return (
      <ContainerRenderer 
        type={type} 
        props={props} 
        children={children} 
        childComponents={childComponents}
        componentId={id} 
        allComponents={allComponents} 
        onUpdateProps={onUpdateProps} 
        onResize={handleResize}
        renderChild={renderChild}
      />
    );
  }

  switch (type) {
    case 'text':
      return <div className="text-sm text-gray-800">{String(props.content || '文本')}</div>;
    
    case 'button':
      return (
        <button
          type="button"
          className={`px-4 py-1.5 text-sm rounded ${
            props.buttonType === 'primary' ? 'bg-blue-500 text-white' :
            props.buttonType === 'success' ? 'bg-green-500 text-white' :
            props.buttonType === 'warning' ? 'bg-yellow-500 text-white' :
            props.buttonType === 'danger' ? 'bg-red-500 text-white' :
            props.buttonType === 'default' ? 'bg-gray-100 text-gray-700' :
            'bg-blue-500 text-white'
          }`}
        >
          {String(props.text || '按钮')}
        </button>
      );
    
    case 'input':
      return (
        <div className="flex flex-col gap-1">
          {props.label && <label className="text-xs text-gray-500">{String(props.label)}</label>}
          <input
            type="text"
            placeholder={String(props.placeholder || '')}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      );
    
    case 'select':
      return (
        <div className="flex flex-col gap-1">
          {props.label && <label className="text-xs text-gray-500">{String(props.label)}</label>}
          <select className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500">
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
          <input type="date" className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-blue-500" />
        </div>
      );
    
    case 'switch':
      return (
        <div className="flex items-center gap-2">
          {props.label && <label className="text-xs text-gray-500">{String(props.label)}</label>}
          <button
            type="button"
            className={`w-10 h-5 rounded-full transition-colors ${props.value ? 'bg-blue-500' : 'bg-gray-300'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${props.value ? 'translate-x-5' : 'translate-x-0.5'}`} />
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
    
    case 'table': {
      const apiId = props.queryApiId || props.apiId;
      const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
      const [tableLoading, setTableLoading] = useState(false);
      const [currentPage, setCurrentPage] = useState(1);
      const [currentPageSize, setCurrentPageSize] = useState((props.pageSize as number) || 10);

      const loadTableData = useCallback(async () => {
        if (!apiId) return;
        setTableLoading(true);
        try {
          const result = await dataBridge.request(Number(apiId), { page: 1, pageSize: 2 });
          setTableData(result.list || []);
        } catch (error) {
          console.error('Failed to load table data:', error);
        } finally {
          setTableLoading(false);
        }
      }, [apiId]);

      useEffect(() => {
        if (apiId) {
          loadTableData();
        }
      }, [apiId, loadTableData]);

      const columns = (props.columns as ColumnConfig[]) || [];
      const data = apiId ? tableData : ((props.data as Record<string, unknown>[]) || []);
      const bordered = props.bordered as boolean;
      const striped = props.striped as boolean;
      const hoverable = props.hoverable as boolean;
      const pagination = props.pagination as boolean;
      const showAdd = props.showAdd as boolean;
      const showExport = props.showExport as boolean;
      const showDetail = props.showDetail as boolean;
      const showEdit = props.showEdit as boolean;
      const showDelete = props.showDelete as boolean;

      const queryFields = columns.filter(col => col.queryCondition);
      const [searchParams, setSearchParams] = useState<Record<string, string>>({});

      const page = currentPage;
      const total = data.length;
      const totalPages = Math.ceil(total / currentPageSize) || 1;
      const paginatedData = pagination
        ? data.slice((page - 1) * currentPageSize, page * currentPageSize)
        : data;

      return (
        <div className="border border-gray-200 rounded bg-white">
          {/* 查询条件 + 操作按钮 - 同一行 */}
          <div className="flex gap-2 p-3 border-b border-gray-200 bg-gray-50 items-center flex-wrap">
            {/* 查询条件区域 - 靠左 */}
            <div className="flex gap-2 items-center flex-wrap">
              {queryFields.slice(0, 4).map(col => (
                <div key={col.key} className="flex items-center gap-1">
                  <label className="text-xs text-gray-500 whitespace-nowrap">{col.label}:</label>
                  {col.fieldType === 'select' ? (
                    <select
                      value={searchParams[col.key] || ''}
                      onChange={(e) => setSearchParams({ ...searchParams, [col.key]: e.target.value })}
                      className="px-2 py-1 border border-gray-300 rounded text-xs"
                    >
                      <option value="">请选择</option>
                    </select>
                  ) : (col.fieldType === 'date' || col.fieldType === 'datetime') ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="date"
                        value={searchParams[col.key + 'Start'] || ''}
                        onChange={(e) => setSearchParams({ ...searchParams, [col.key + 'Start']: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                      <span className="text-xs text-gray-400">至</span>
                      <input
                        type="date"
                        value={searchParams[col.key + 'End'] || ''}
                        onChange={(e) => setSearchParams({ ...searchParams, [col.key + 'End']: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded text-xs"
                      />
                    </div>
                  ) : (
                    <input
                      type={col.fieldType === 'number' ? 'number' : 'text'}
                      value={searchParams[col.key] || ''}
                      onChange={(e) => setSearchParams({ ...searchParams, [col.key]: e.target.value })}
                      placeholder={`请输入${col.label}`}
                      className="px-2 py-1 border border-gray-300 rounded text-xs w-24"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* 操作按钮区域 - 靠右 */}
            <div className="flex gap-2 ml-auto items-center">
              {queryFields.length > 0 && (
                <button className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">查询</button>
              )}
              {showAdd && <button className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">新增</button>}
              {showExport && <button className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600">导出</button>}
            </div>
          </div>

          {/* 表格 */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-[var(--border-light)] bg-[var(--bg-hover-light)]">
                  {columns.filter(col => col.visible !== false).map(col => (
                    <th key={col.key}
                        style={{ width: '150px', minWidth: '150px' }}
                        className={`px-4 py-2 text-left text-sm font-medium text-[var(--text-muted)] truncate overflow-hidden border-b border-[var(--border-light)] ${col.sortable ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                        title={col.label}>
                      <span className="block truncate">{col.label}</span>
                    </th>
                  ))}
                  {(showDetail || showEdit || showDelete) && (
                    <th className="px-4 py-2 text-left text-sm font-medium text-[var(--text-muted)] truncate overflow-hidden border-b border-[var(--border-light)]" style={{ width: '150px', minWidth: '150px' }}>操作</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {tableLoading ? (
                  <tr>
                    <td colSpan={columns.filter(col => col.visible !== false).length + (showDetail || showEdit || showDelete ? 1 : 0)} className="text-center py-8 text-gray-400">
                      加载中...
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={columns.filter(col => col.visible !== false).length + (showDetail || showEdit || showDelete ? 1 : 0)} className="text-center py-8 text-gray-400">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, i) => (
                    <tr key={i} className={`${striped && i % 2 === 1 ? 'bg-gray-50' : ''} ${hoverable ? 'hover:bg-gray-100' : ''}`}>
                      {columns.filter(col => col.visible !== false).map(col => (
                        <td key={col.key}
                            style={{ width: '150px', minWidth: '150px' }}
                            className={`px-4 py-3 text-sm text-[var(--text-primary)] truncate overflow-hidden border-b border-[var(--border-light)] ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''}`}
                            title={String(row[col.key] ?? '-')}>
                          {col.fieldType === 'image' ? (
                            row[col.key] ? <img src={row[col.key] as string} className="h-8 w-8 object-cover rounded" /> : <span className="text-gray-300">-</span>
                          ) : col.fieldType === 'date' ? (
                            row[col.key] ? (col.dateFormat ? new Date(row[col.key] as string).toLocaleDateString() : String(row[col.key])) : <span className="text-gray-300">-</span>
                          ) : col.fieldType === 'fixed' ? (
                            <span>{col.fixedValue || '-'}</span>
                          ) : col.fieldType === 'custom' && col.customFunction ? (
                            <span dangerouslySetInnerHTML={{ __html: (() => { try { const fn = new Function('row', col.customFunction); return fn(row) || '-'; } catch { return '-'; } })() }} />
                          ) : (
                            String(row[col.key] ?? '-')
                          )}
                        </td>
                      ))}
                      {(showDetail || showEdit || showDelete) && (
                        <td className="px-4 py-3 border-b border-[var(--border-light)]">
                          <div className="flex gap-1">
                            {showDetail && <button className="px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-50 rounded">详情</button>}
                            {showEdit && <button className="px-2 py-0.5 text-xs text-blue-500 hover:bg-blue-50 rounded">编辑</button>}
                            {showDelete && <button className="px-2 py-0.5 text-xs text-red-500 hover:bg-red-50 rounded">删除</button>}
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
          {pagination && total > 0 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 text-xs text-gray-500">
              <span>共 {total} 条</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span>每页</span>
                  <select
                    value={currentPageSize}
                    onChange={(e) => {
                      const newSize = Number(e.target.value);
                      setCurrentPageSize(newSize);
                      setCurrentPage(1);
                    }}
                    className="px-1 py-0.5 border border-gray-200 rounded text-xs focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span>条</span>
                </div>
                <div className="flex gap-1">
                  <button
                    className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                    disabled={page <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    上一页
                  </button>
                  <span className="px-2 py-1">{page} / {totalPages}</span>
                  <button
                    className="px-2 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                    disabled={page >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    case 'form':
      return (
        <FormRenderer
          datasourceId={props.datasourceId as number | undefined}
          tableName={props.tableName as string | undefined}
          featureId={props.featureId as number | undefined}
          columns={props.columns as ColumnConfig[] | undefined}
          showAdd={props.showAdd as boolean | undefined}
          showEdit={props.showEdit as boolean | undefined}
        />
      );
    
    case 'lineChart':
    case 'barChart':
    case 'pieChart':
      return (
        <div className="border border-gray-200 rounded p-4 bg-gray-50 text-center">
          <div className="text-sm text-gray-600">{String(props.title || type)}</div>
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
      return (
        <div
          className="bg-gradient-to-r from-gray-100 to-gray-50"
          style={{ height: `${Number(props.height) || 50}px` }}
        />
      );
    
    case 'image':
      return (
        <img
          src={String(props.src || 'https://via.placeholder.com/200x100')}
          alt={String(props.alt || '图片')}
          className="max-w-full h-auto"
        />
      );
    
    case 'link':
      return (
        <a href={String(props.url || '#')} className="text-blue-500 hover:underline text-sm">
          {String(props.text || '链接')}
        </a>
      );
    
    default:
      return <div className="text-gray-400 text-sm">未知组件: {type}</div>;
  }
}

export default ComponentRenderer;
