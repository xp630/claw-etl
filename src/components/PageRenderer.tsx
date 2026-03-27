import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Search, Download, Plus, Edit2, Trash2, Eye, X } from 'lucide-react';
import { dataBridge } from '../lib/DataBridge';
import cn from 'classnames';
import DataTable from './DataTable';
import type { ColumnDef } from './DataTable';

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
  columns: { key: string; label: string; width?: number; sortable?: boolean; fieldType?: string; dateFormat?: string; fixedValue?: string; customFunction?: string; align?: string; ellipsis?: boolean; visible?: boolean; queryCondition?: boolean; dataDictionary?: string }[];
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
  dictData?: Record<string, { label: string; value: string }[]>;
  onEvent?: (componentId: string, event: string, data: any) => void;
}

// 表格组件渲染 - Tailwind 样式，与编辑器保持一致

// 表格组件渲染 - 使用 DataTable 组件
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
  dictData,
  onEvent
}: TableProps) {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(initialPageSize || 10);
  const [total, setTotal] = useState(0);
  const [searchParams, setSearchParams] = useState<Record<string, string>>({});

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

  // 转换列格式
  const tableColumns: ColumnDef[] = columns
    .filter(col => col.visible !== false)
    .map(col => ({
      key: col.key,
      label: col.label,
      width: col.width,
      visible: col.visible,
      sortable: col.sortable,
      fieldType: col.fieldType as any,
      align: col.align as any,
      ellipsis: col.ellipsis,
      dateFormat: col.dateFormat,
      fixedValue: col.fixedValue,
      customFunction: col.customFunction,
      dataDictionary: col.dataDictionary,
    }));

  // 查询字段
  const queryFields = columns.filter(col => col.queryCondition);

  // 加载完成后的回调
  const handleLoad = (params: Record<string, any>) => {
    loadData(1, params);
  };

  // 导出
  const handleExport = () => {
    import('xlsx').then(XLSX => {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
      XLSX.writeFile(wb, 'export.xlsx');
    });
  };

  return (
    <DataTable
      columns={tableColumns}
      data={data}
      loading={loading}
      pagination={showPagination ? { page, pageSize: currentPageSize, total } : false}
      queryFields={queryFields.map(q => ({
        key: q.key,
        label: q.label,
        fieldType: q.fieldType as any,
        dataDictionary: q.dataDictionary,
      }))}
      showSearchBar={true}
      showSearch={showSearch}
      showAdd={showAdd}
      showExport={showExport}
      showEdit={showEdit}
      showDelete={showDelete}
      showDetail={showDetail}
      bordered={bordered}
      striped={striped}
      hoverable={hoverable}
      dictData={dictData}
      onSearch={handleLoad}
      onPageChange={(p) => loadData(p)}
      onPageSizeChange={(size) => { setCurrentPageSize(size); loadData(1); }}
      onSubmit={async (type, formData, done) => {
        const targetApiId = type === 'add' ? createApiId : updateApiId;
        if (!targetApiId) { alert('未配置 API'); done(); return; }
        try {
          await dataBridge.request(targetApiId, formData);
          alert('操作成功');
          loadData(page);
        } catch (error) {
          alert('操作失败');
        } finally {
          done();
        }
      }}
      onDelete={async (row) => {
        if (!deleteApiId) { alert('未配置删除 API'); return; }
        try {
          await dataBridge.request(deleteApiId, { id: row.id });
          alert('删除成功');
          loadData(page);
        } catch (error) {
          alert('删除失败');
        }
      }}
    />
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
            'w-full bg-[var(--bg-primary)] rounded-lg p-4 flex flex-col',
            hasBorder ? 'border border-[var(--border)]' : ''
          )}
          style={containerStyle}
        >
          {props.title && <div className="font-medium text-[var(--text-primary)] mb-3 text-sm flex-shrink-0">{String(props.title)}</div>}
          <div className="flex-1 min-h-0">{renderChildren()}</div>
        </div>
      );
    case 'tabs': {
      const tabs = (props.tabs as string[]) || [];
      const [activeTab, setActiveTab] = useState(Number(props.activeTab) || 0);
      const arr = (children as ComponentConfig[]) || [];
      const activeChild = arr[activeTab];

      return (
        <div className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg flex flex-col" style={containerStyle}>
          <div className="flex border-b border-[var(--border)] -mx-4 px-4 mb-3 flex-shrink-0">
            {tabs.map((tab, i) => (
              <div
                key={i}
                onClick={() => setActiveTab(i)}
                className={cn(
                  'px-4 py-2 text-sm cursor-pointer transition-colors border-b-2 -mb-px',
                  i === activeTab
                    ? 'text-blue-500 border-blue-500 font-medium'
                    : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-primary)]'
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
        <div className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-lg flex flex-col" style={containerStyle}>
          {((props.panels as Array<{ title: string; content: string }>) || []).map((panel, i) => (
            <div key={i} className={cn('border border-[var(--border)] rounded mb-2 last:mb-0 flex flex-col', i > 0 && 'mt-2')}>
              <div className="px-4 py-2.5 bg-[var(--bg-secondary)] flex items-center justify-between flex-shrink-0">
                <span className="text-sm font-medium text-[var(--text-primary)]">{panel.title}</span>
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
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
        <div className="text-sm text-[var(--text-primary)]" style={props.style as React.CSSProperties}>
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
          case 'default': return 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]';
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
          {props.label && <label className="text-xs text-[var(--text-muted)]">{String(props.label)}</label>}
          <input
            type="text"
            placeholder={String(props.placeholder || '')}
            className={cn('px-3 py-1.5 border border-[var(--border)] rounded text-sm focus:outline-none focus:border-[var(--accent)] bg-[var(--input-bg)] text-[var(--text-primary)] transition-colors', props.className as string)}
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
      const cols = (props.columns as Array<{ key: string; label: string; width?: number; sortable?: boolean; fieldType?: string; dateFormat?: string; fixedValue?: string; customFunction?: string; align?: string; ellipsis?: boolean; visible?: boolean; queryCondition?: boolean; dataDictionary?: string }>) || [];
      const dictData = props.dictData as Record<string, { label: string; value: string }[]> | undefined;
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
            dictData={dictData}
            onEvent={onEvent as any}
          />
        );
      }

      // Static data table (simplified)
      const data = (props.data as Record<string, any>[]) || [];
      return (
        <div className="border border-[var(--border)] rounded bg-[var(--bg-primary)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
                  {cols.filter(c => c.visible !== false).map(col => (
                    <th key={col.key} className="px-4 py-2.5 text-left text-xs font-medium text-[var(--text-muted)]">{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={cols.filter(c => c.visible !== false).length} className="text-center py-8 text-[var(--text-muted)]">暂无数据</td>
                  </tr>
                ) : (
                  data.map((row, i) => (
                    <tr key={i} className={cn('border-b border-[var(--border-light)]', striped && i % 2 === 1 && 'bg-[var(--bg-secondary)]', hoverable && 'hover:bg-[var(--bg-secondary)]')}>
                      {cols.filter(c => c.visible !== false).map(col => (
                        <td key={col.key} className="px-4 py-2 text-sm text-[var(--text-primary)]">{String(row[col.key] ?? '-')}</td>
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
        <div className="border border-[var(--border)] rounded p-6 bg-[var(--bg-secondary)] text-center">
          <div className="text-sm text-[var(--text-muted)]">{String(props.title || '图表组件')}</div>
        </div>
      );

    case 'select':
      return (
        <div className="flex flex-col gap-1">
          {props.label && <label className="text-xs text-[var(--text-muted)]">{String(props.label)}</label>}
          <select className="px-3 py-1.5 border border-[var(--border)] rounded text-sm focus:outline-none focus:border-[var(--accent)] bg-[var(--input-bg)] text-[var(--text-primary)]">
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
          {props.label && <label className="text-xs text-[var(--text-muted)]">{String(props.label)}</label>}
          <input
            type="date"
            className="px-3 py-1.5 border border-[var(--border)] rounded text-sm focus:outline-none focus:border-[var(--accent)] bg-[var(--input-bg)] text-[var(--text-primary)]"
          />
        </div>
      );

    case 'switch':
      return (
        <div className="flex items-center gap-2">
          {props.label && <label className="text-xs text-[var(--text-muted)]">{String(props.label)}</label>}
          <button
            type="button"
            className={cn('w-10 h-5 rounded-full transition-colors relative', props.value ? 'bg-[var(--accent)]' : 'bg-[var(--bg-tertiary)]')}
          >
            <div className={cn('w-4 h-4 bg-[var(--bg-primary)] rounded-full shadow absolute top-0.5 transition-transform', props.value ? 'translate-x-5' : 'translate-x-0.5')} />
          </button>
        </div>
      );

    case 'slider':
      return (
        <div className="flex flex-col gap-1 w-full">
          {props.label && <label className="text-xs text-[var(--text-muted)]">{String(props.label)}</label>}
          <input
            type="range"
            min={Number(props.min) || 0}
            max={Number(props.max) || 100}
            value={Number(props.value) || 50}
            className="w-full"
          />
          <div className="text-xs text-[var(--text-muted)] text-center">{Number(props.value) || 50}</div>
        </div>
      );

    case 'grid':
      return (
        <div
          className="border border-[var(--border)] rounded p-3 bg-[var(--bg-secondary)]"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Number(props.cols) || 3}, 1fr)`,
            gap: `${Number(props.gap) || 10}px`,
          }}
        >
          <div className="text-xs text-[var(--text-muted)] text-center py-4">栅格布局</div>
        </div>
      );

    case 'divider':
      return <hr className="border-[var(--border)] my-2" />;

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
        <div className="border border-[var(--border)] rounded bg-[var(--bg-primary)] p-4">
          <div className="text-sm text-[var(--text-muted)]">表单组件（预览模式）</div>
        </div>
      );

    default:
      return <div className="text-[var(--text-muted)] text-sm">未知组件: {type}</div>;
  }
}
