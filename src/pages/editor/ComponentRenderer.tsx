import React, { useState, useCallback, useEffect } from 'react';
import { CanvasComponent, ColumnConfig } from './types';
import ContainerRenderer from './ContainerRenderer';
import FormRenderer from './FormRenderer';
import { dataBridge } from '../../lib/DataBridge';
import DataTable from '../../components/DataTable';
import type { ColumnDef } from '../../components/DataTable';

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
      const [tableData, setTableData] = useState<Record<string, any>[]>([]);
      const [tableLoading, setTableLoading] = useState(false);
      const [currentPage, setCurrentPage] = useState(1);
      const [currentPageSize, setCurrentPageSize] = useState((props.pageSize as number) || 10);
      const [tableTotal, setTableTotal] = useState(0);

      const loadTableData = useCallback(async (pageNum: number = 1, pageSz: number = currentPageSize, params?: Record<string, any>) => {
        if (!apiId) return;
        setTableLoading(true);
        try {
          const result = await dataBridge.request(Number(apiId), { page: pageNum, pageSize: pageSz, ...params });
          setTableData(result.list || []);
          setTableTotal(result.total || 0);
        } catch (error) {
          console.error('Failed to load table data:', error);
        } finally {
          setTableLoading(false);
        }
      }, [apiId, currentPageSize]);

      useEffect(() => {
        if (apiId) {
          loadTableData(1, currentPageSize);
        }
      }, [apiId]);

      const columns = (props.columns as ColumnConfig[]) || [];
      const data = apiId ? tableData : ((props.data as Record<string, any>[]) || []);
      const bordered = props.bordered !== false;
      const striped = props.striped !== false;
      const hoverable = props.hoverable !== false;
      const pagination = props.pagination !== false;
      const showAdd = props.showAdd as boolean;
      const showExport = props.showExport as boolean;
      const showDetail = props.showDetail as boolean;
      const showEdit = props.showEdit as boolean;
      const showDelete = props.showDelete as boolean;

      const queryFields = columns.filter(col => col.queryCondition);

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
          dataDictionary: col.dataDictionary,
          dateFormat: col.dateFormat,
        }));

      return (
        <DataTable
          columns={tableColumns}
          data={data}
          loading={tableLoading}
          pagination={pagination ? { page: currentPage, pageSize: currentPageSize, total: tableTotal } : false}
          queryFields={queryFields.map(q => ({
            key: q.key,
            label: q.label,
            fieldType: q.fieldType as any,
            dataDictionary: q.dataDictionary,
          }))}
          showSearch
          showAdd={showAdd}
          showExport={showExport}
          showEdit={showEdit}
          showDelete={showDelete}
          showDetail={showDetail}
          bordered={bordered}
          striped={striped}
          compact
          onPageChange={(page) => {
            setCurrentPage(page);
            loadTableData(page, currentPageSize);
          }}
          onPageSizeChange={(size) => {
            setCurrentPageSize(size);
            setCurrentPage(1);
            loadTableData(1, size);
          }}
          onSearch={(params) => {
            setCurrentPage(1);
            loadTableData(1, currentPageSize, params);
          }}
        />
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
