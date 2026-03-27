import React, { useState, useEffect } from 'react';
import { Trash2, Box, ChevronDown, ChevronRight } from 'lucide-react';
import { CanvasComponent, ColumnConfig } from './types';
import { propLabels } from './constants';
import { getDataSources, getTableList, getFeatures, getFeatureDetail, getTableColumns } from '../../lib/api';
import type { Feature, FeatureColumn } from '../../types';

interface PropertyPanelProps {
  selectedComponent: CanvasComponent | null;
  components: CanvasComponent[];
  onUpdateProps: (props: Record<string, unknown>) => void;
  onMoveToContainer: (containerId: string, componentId: string, tabIndex?: number) => void;
  onMoveOutOfContainer: (containerId: string, componentId: string) => void;
}

// Container selector modal
function ContainerSelectorModal({
  containers,
  onSelect,
  onClose,
}: {
  containers: Array<{ id: string; label: string; type: string; tabs?: string[] }>;
  onSelect: (containerId: string, tabIndex?: number) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedTabIndex, setSelectedTabIndex] = useState<number>(0);
  
  const selectedContainer = containers.find(c => c.id === selected);
  const isTabsContainer = selectedContainer?.type === 'tabs';
  const tabs = selectedContainer?.tabs || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--bg-primary)] rounded-lg w-[400px] max-h-[60vh] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-medium">选择目标容器</h3>
          <button onClick={onClose} className="text-xl text-[var(--text-muted)] hover:text-[var(--text-secondary)]">×</button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[40vh]">
          {containers.length === 0 ? (
            <div className="text-center text-[var(--text-muted)] py-8">
              暂无可用的容器组件
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {containers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelected(c.id);
                      setSelectedTabIndex(0);
                    }}
                    className={`p-3 border rounded cursor-pointer flex items-center gap-2 ${
                      selected === c.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-[var(--border)] hover:border-blue-300'
                    }`}
                  >
                    <input type="radio" checked={selected === c.id} readOnly className="w-4 h-4" />
                    <span className="text-sm">{c.label}</span>
                    <span className="text-xs text-[var(--text-muted)]">({c.type})</span>
                    {c.type === 'tabs' && c.tabs && (
                      <span className="text-xs text-blue-400 ml-1">({c.tabs.length}个标签)</span>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Tab selection for tabs container */}
              {isTabsContainer && tabs.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-xs text-[var(--text-muted)] mb-2">选择目标标签页：</div>
                  <div className="flex flex-wrap gap-1">
                    {tabs.map((tab, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedTabIndex(i)}
                        className={`px-3 py-1.5 text-xs rounded border ${
                          selectedTabIndex === i
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-[var(--border)] hover:border-blue-300'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t">
          <button onClick={onClose} className="px-4 py-1.5 text-xs border rounded">取消</button>
          <button
            onClick={() => selected && onSelect(selected, isTabsContainer ? selectedTabIndex : undefined)}
            disabled={!selected}
            className="px-4 py-1.5 text-xs bg-blue-500 text-white rounded disabled:bg-[var(--bg-tertiary)] disabled:cursor-not-allowed"
          >
            确认移入
          </button>
        </div>
      </div>
    </div>
  );
}

// Column Config Modal Component
function ColumnConfigModal({
  editingColumn,
  editingColumnIndex,
  columns,
  onSave,
  onClose,
}: {
  editingColumn: ColumnConfig | null;
  editingColumnIndex: number | null;
  columns: ColumnConfig[];
  onSave: (column: ColumnConfig, index: number | null) => void;
  onClose: () => void;
}) {
  const [localColumn, setLocalColumn] = useState<ColumnConfig | null>(editingColumn);

  useEffect(() => {
    setLocalColumn(editingColumn);
  }, [editingColumn]);

  if (!localColumn) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--bg-primary)] rounded-lg w-[600px] max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-medium">{editingColumnIndex !== null ? '编辑列' : '添加列'}</h3>
          <button onClick={onClose} className="text-xl text-[var(--text-muted)] hover:text-[var(--text-secondary)]">×</button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 gap-4">
            {/* 字段名 */}
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">字段名</label>
              <input
                value={localColumn.key || ''}
                onChange={(e) => setLocalColumn({ ...localColumn, key: e.target.value })}
                className="w-full px-2 py-1 border border-[var(--border)] rounded text-xs bg-[var(--input-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                disabled={editingColumnIndex !== null}
              />
            </div>
            {/* 显示名 */}
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">显示名</label>
              <input
                value={localColumn.label || ''}
                onChange={(e) => setLocalColumn({ ...localColumn, label: e.target.value })}
                className="w-full px-2 py-1 border border-[var(--border)] rounded text-xs bg-[var(--input-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            {/* 字段类型 */}
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">字段类型</label>
              <select
                value={localColumn.fieldType || 'text'}
                onChange={(e) => setLocalColumn({ ...localColumn, fieldType: e.target.value })}
                className="w-full px-2 py-1 border border-[var(--border)] rounded text-xs bg-[var(--input-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="text">文本</option>
                <option value="number">数字</option>
                <option value="date">时间</option>
                <option value="image">图片</option>
                <option value="select">数据字典</option>
                <option value="fixed">固定值</option>
                <option value="custom">自定义函数</option>
              </select>
            </div>
            {/* 时间格式 */}
            {localColumn.fieldType === 'date' && (
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">日期格式</label>
                <input
                  value={localColumn.dateFormat || 'YYYY-MM-DD'}
                  onChange={(e) => setLocalColumn({ ...localColumn, dateFormat: e.target.value })}
                  placeholder="YYYY-MM-DD HH:mm:ss"
                  className="w-full px-2 py-1 border border-[var(--border)] rounded text-xs bg-[var(--input-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            )}
            {/* 固定值 */}
            {localColumn.fieldType === 'fixed' && (
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">固定值</label>
                <input
                  value={localColumn.fixedValue || ''}
                  onChange={(e) => setLocalColumn({ ...localColumn, fixedValue: e.target.value })}
                  placeholder="输入固定显示的值"
                  className="w-full px-2 py-1 border border-[var(--border)] rounded text-xs bg-[var(--input-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            )}
            {/* 自定义函数 */}
            {localColumn.fieldType === 'custom' && (
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">自定义函数</label>
                <input
                  value={localColumn.customFunction || ''}
                  onChange={(e) => setLocalColumn({ ...localColumn, customFunction: e.target.value })}
                  placeholder="function(row) { return row.xxx }"
                  className="w-full px-2 py-1 border border-[var(--border)] rounded text-xs font-mono bg-[var(--input-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            )}
            {/* 数据字典 */}
            {localColumn.fieldType === 'select' && (
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">数据字典编码</label>
                <input
                  value={localColumn.dataDictionary || ''}
                  onChange={(e) => setLocalColumn({ ...localColumn, dataDictionary: e.target.value })}
                  placeholder="输入数据字典编码"
                  className="w-full px-2 py-1 border border-[var(--border)] rounded text-xs bg-[var(--input-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            )}
            {/* 宽度 */}
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">宽度</label>
              <input
                type="number"
                value={localColumn.width || 100}
                onChange={(e) => setLocalColumn({ ...localColumn, width: Number(e.target.value) })}
                className="w-full px-2 py-1 border border-[var(--border)] rounded text-xs bg-[var(--input-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            {/* 对齐方式 */}
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">对齐方式</label>
              <select
                value={localColumn.align || 'left'}
                onChange={(e) => setLocalColumn({ ...localColumn, align: e.target.value })}
                className="w-full px-2 py-1 border border-[var(--border)] rounded text-xs bg-[var(--input-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="left">左对齐</option>
                <option value="center">居中</option>
                <option value="right">右对齐</option>
              </select>
            </div>
            {/* 占位符 */}
            <div className="col-span-2">
              <label className="block text-xs text-[var(--text-muted)] mb-1">占位符</label>
              <input
                value={localColumn.placeholder || ''}
                onChange={(e) => setLocalColumn({ ...localColumn, placeholder: e.target.value })}
                className="w-full px-2 py-1 border border-[var(--border)] rounded text-xs bg-[var(--input-bg)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            {/* 布尔选项 */}
            <div className="col-span-2">
              <label className="block text-xs text-[var(--text-muted)] mb-1">选项</label>
              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-1 p-1.5 bg-[var(--bg-secondary)] rounded">
                  <input type="checkbox" checked={localColumn.visible !== false} onChange={(e) => setLocalColumn({ ...localColumn, visible: e.target.checked })} />
                  <span className="text-xs">显示</span>
                </label>
                <label className="flex items-center gap-1 p-1.5 bg-[var(--bg-secondary)] rounded">
                  <input type="checkbox" checked={localColumn.queryCondition !== false} onChange={(e) => setLocalColumn({ ...localColumn, queryCondition: e.target.checked })} />
                  <span className="text-xs">查询条件</span>
                </label>
                <label className="flex items-center gap-1 p-1.5 bg-[var(--bg-secondary)] rounded">
                  <input type="checkbox" checked={localColumn.required || false} onChange={(e) => setLocalColumn({ ...localColumn, required: e.target.checked })} />
                  <span className="text-xs">必填</span>
                </label>
                <label className="flex items-center gap-1 p-1.5 bg-[var(--bg-secondary)] rounded">
                  <input type="checkbox" checked={localColumn.sortable || false} onChange={(e) => setLocalColumn({ ...localColumn, sortable: e.target.checked })} />
                  <span className="text-xs">可排序</span>
                </label>
                <label className="flex items-center gap-1 p-1.5 bg-[var(--bg-secondary)] rounded">
                  <input type="checkbox" checked={localColumn.frozen || false} onChange={(e) => setLocalColumn({ ...localColumn, frozen: e.target.checked })} />
                  <span className="text-xs">冻结列</span>
                </label>
                <label className="flex items-center gap-1 p-1.5 bg-[var(--bg-secondary)] rounded">
                  <input type="checkbox" checked={localColumn.ellipsis !== false} onChange={(e) => setLocalColumn({ ...localColumn, ellipsis: e.target.checked })} />
                  <span className="text-xs">超出省略</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t">
          <button onClick={onClose} className="px-4 py-1.5 text-xs border rounded">取消</button>
          <button
            onClick={() => {
              if (localColumn) {
                onSave(localColumn, editingColumnIndex);
              }
            }}
            className="px-4 py-1.5 text-xs bg-blue-500 text-white rounded"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}

// Property Panel Component
function PropertyPanel({
  selectedComponent,
  components,
  onUpdateProps,
  onMoveToContainer,
  onMoveOutOfContainer,
}: PropertyPanelProps) {
  // Column config modal state
  const [columnConfigOpen, setColumnConfigOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<ColumnConfig | null>(null);
  const [editingColumnIndex, setEditingColumnIndex] = useState<number | null>(null);
  const [columnsCollapsed, setColumnsCollapsed] = useState(false);
  const [propsCollapsed, setPropsCollapsed] = useState(false);

  // Container selector modal state
  const [containerSelectorOpen, setContainerSelectorOpen] = useState(false);

  // Helper to check if a component is a container type
  const isContainerType = (type: string) => ['card', 'tabs', 'collapse'].includes(type);

  // Helper to find if selectedComponent is inside a container
  const findParentContainer = (comps: CanvasComponent[], childId: string, parentId: string | null = null): string | null => {
    for (const comp of comps) {
      if (comp.id === childId) {
        return parentId;
      }
      if (comp.children && comp.children.length > 0) {
        const found = findParentContainer(comp.children, childId, comp.id);
        if (found !== undefined) return found;
      }
    }
    return null;
  };

  const parentContainerId = selectedComponent ? findParentContainer(components, selectedComponent.id) : null;
  const isInsideContainer = parentContainerId !== null;

  // Get all container components (not the selected one, and not nested inside it)
  const getAvailableContainers = (comps: CanvasComponent[]): Array<{ id: string; label: string; type: string; tabs?: string[] }> => {
    const result: Array<{ id: string; label: string; type: string; tabs?: string[] }> = [];
    const selectedId = selectedComponent?.id;

    const traverse = (comps: CanvasComponent[]) => {
      for (const comp of comps) {
        // Skip the selected component itself
        if (comp.id === selectedId) continue;

        if (isContainerType(comp.type)) {
          const containerInfo: { id: string; label: string; type: string; tabs?: string[] } = {
            id: comp.id,
            label: comp.label,
            type: comp.type,
          };
          if (comp.type === 'tabs') {
            containerInfo.tabs = (comp.props.tabs as string[]) || [];
          }
          result.push(containerInfo);
        }

        // Don't traverse into container children if selected component is this container
        // (to avoid suggesting the selected container or its children as targets)
        if (comp.children && comp.children.length > 0) {
          traverse(comp.children);
        }
      }
    };

    traverse(comps);
    return result;
  };

  const availableContainers = selectedComponent ? getAvailableContainers(components) : [];

  // DataSource and Table selection states
  const [dataSources, setDataSources] = useState<{id: number; name: string}[]>([]);
  const [tables, setTables] = useState<{tableName: string; tableComment: string}[]>([]);
  const [selectedDatasource, setSelectedDatasource] = useState<number | null>(null);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  const loadDataSources = async () => {
    try {
      const data = await getDataSources({});
      setDataSources(data.list);
    } catch (error) {
      console.error('Failed to load dataSources:', error);
    }
  };

  const loadFeaturesByTable = async (datasourceId: number, tableName: string) => {
    try {
      const data = await getFeatures({ page: 1, limit: 100 });
      const filtered = (data.list || []).filter((f) =>
        f.datasourceId === datasourceId && f.tableName === tableName
      );
      setFeatures(filtered);
      if (filtered.length > 0) {
        const fullFeature = await getFeatureDetail(filtered[0].id!);
        setSelectedFeature(fullFeature || filtered[0]);
        handlePropChange('queryApiId', filtered[0].queryApiId);
        handlePropChange('createApiId', filtered[0].createApiId);
        handlePropChange('updateApiId', filtered[0].updateApiId);
        handlePropChange('deleteApiId', filtered[0].deleteApiId);
        handlePropChange('detailApiId', filtered[0].detailApiId);
        
        if (fullFeature?.columns && Array.isArray(fullFeature.columns) && fullFeature.columns.length > 0) {
          const isFormComponent = selectedComponent.type === 'form';
          const columns = fullFeature.columns
            .filter((col) => col.visible !== false && col.fieldType !== 'action')
            .map((col) => ({
              key: col.fieldName,
              label: col.fieldLabel,
              fieldType: col.fieldType,
              width: 100,
              visible: col.visible !== false,
              sortable: col.sortable,
              align: col.align || 'left',
              frozen: false,
              ellipsis: true,
              tooltip: false,
              required: false,
              defaultValue: undefined,
              placeholder: '',
              // For form components, default queryCondition to false; for table components, inherit from column config
              queryCondition: isFormComponent ? false : (col.queryCondition !== false),
              dataDictionary: col.dataDictionary || ''
            }));
          handlePropChange('columns', columns);
        }
      } else {
        setSelectedFeature(null);
      }
    } catch (error) {
      console.error('Failed to load features:', error);
    }
  };

  // Load features for a table without auto-selecting (used for restoring state)
  const loadFeaturesForRestore = async (datasourceId: number, tableName: string, featureIdToSelect: number | null) => {
    try {
      const data = await getFeatures({ page: 1, limit: 100 });
      const filtered = (data.list || []).filter((f) =>
        f.datasourceId === datasourceId && f.tableName === tableName
      );
      setFeatures(filtered);

      if (featureIdToSelect) {
        // Find and select the specific feature by ID
        const targetFeature = filtered.find(f => f.id === featureIdToSelect);
        if (targetFeature) {
          const fullFeature = await getFeatureDetail(targetFeature.id!);
          setSelectedFeature(fullFeature || targetFeature);
          handlePropChange('queryApiId', targetFeature.queryApiId);
          handlePropChange('createApiId', targetFeature.createApiId);
          handlePropChange('updateApiId', targetFeature.updateApiId);
          handlePropChange('deleteApiId', targetFeature.deleteApiId);
          handlePropChange('detailApiId', targetFeature.detailApiId);
          
          if (fullFeature?.columns && Array.isArray(fullFeature.columns) && fullFeature.columns.length > 0) {
            const isFormComponent = selectedComponent.type === 'form';
            const columns = fullFeature.columns
              .filter((col) => col.visible !== false && col.fieldType !== 'action')
              .map((col) => ({
                key: col.fieldName,
                label: col.fieldLabel,
                fieldType: col.fieldType,
                width: 100,
                visible: col.visible !== false,
                sortable: col.sortable,
                align: col.align || 'left',
                frozen: false,
                ellipsis: true,
                tooltip: false,
                required: false,
                defaultValue: undefined,
                placeholder: '',
                // For form components, default queryCondition to false; for table components, inherit from column config
                queryCondition: isFormComponent ? false : (col.queryCondition !== false),
                dataDictionary: col.dataDictionary || ''
              }));
            handlePropChange('columns', columns);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load features for restore:', error);
    }
  };

  // Load dataSources on mount
  useEffect(() => {
    loadDataSources();
  }, []);

  // Restore UI state when selectedComponent or dataSources changes (for table/form type)
  useEffect(() => {
    if ((selectedComponent?.type === 'table' || selectedComponent?.type === 'form') && dataSources.length > 0) {
      const { datasourceId, tableName, featureId } = selectedComponent.props;

      if (datasourceId) {
        // Set datasource first
        setSelectedDatasource(datasourceId as number);

        // Find datasource to get dbName for loading tables
        const ds = dataSources.find(d => d.id === datasourceId);
        if (ds) {
          const dbName = (ds as Record<string, unknown>).database_name || (ds as Record<string, unknown>).databaseName || ds.name;
          getTableList(dbName as string).then(tablesData => {
            setTables(tablesData);
          });
        }

        if (tableName) {
          // Load features and optionally select the specific feature
          loadFeaturesForRestore(datasourceId as number, tableName as string, featureId as number | null);
        }
      }
    }
  }, [selectedComponent, dataSources]);

  const handlePropChange = (key: string, value: unknown) => {
    onUpdateProps({ ...selectedComponent!.props, [key]: value });
  };

  const handleOptionsChange = (value: string) => {
    const options = value.split(',').map(s => s.trim()).filter(s => s);
    handlePropChange('options', options);
  };

  const handleColumnSave = (column: ColumnConfig, index: number | null) => {
    const newCols = [...(selectedComponent!.props.columns as ColumnConfig[] || [])];
    if (index !== null) {
      newCols[index] = column;
    } else {
      newCols.push({ ...column, key: column.key || `col_${Date.now()}` });
    }
    handlePropChange('columns', newCols);
    setColumnConfigOpen(false);
  };

  if (!selectedComponent) {
    return (
      <div className="w-72 bg-[var(--bg-primary)] border-l border-[var(--border)] overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">属性配置</h3>
          <div className="flex items-center justify-center h-64 text-[var(--text-muted)]">
            <div className="text-center">
              <Box className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">选择组件以编辑属性</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[var(--bg-primary)] overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setPropsCollapsed(!propsCollapsed)}>
            <h3 className="text-sm font-medium text-[var(--text-secondary)]">属性配置</h3>
            {propsCollapsed ? <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
          </div>

        {/* Quick Actions - Move In/Out of Container */}
        <div className="mb-4 p-2 bg-[var(--info)]/10 rounded border border-[var(--info)]/30">
          <div className="text-xs text-[var(--info)] mb-2">快捷操作</div>
          <div className="flex gap-2">
            <button
              onClick={() => setContainerSelectorOpen(true)}
              disabled={availableContainers.length === 0}
              className="px-2 py-1 bg-[var(--bg-primary)] border border-[var(--info)]/30 rounded text-xs text-[var(--info)] hover:bg-[var(--info)]/10 disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed"
            >
              移入容器
            </button>
            {isInsideContainer && (
              <button
                onClick={() => parentContainerId && onMoveOutOfContainer(parentContainerId, selectedComponent.id)}
                className="px-2 py-1 bg-[var(--bg-primary)] border border-[var(--warning)]/30 rounded text-xs text-[var(--warning)] hover:bg-[var(--warning)]/10"
              >
                移出容器
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-[var(--border)] my-4" />

        <div className="space-y-4">
          <div>            
            <div className="space-y-3">
              <div>
                <input
                  type="hidden"
                  value={selectedComponent.id}
                  disabled
                  className="w-full px-2 py-1.5 border border-[var(--border)] rounded text-xs bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                />
              </div>
              
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">组件类型</label>
                <input
                  type="text"
                  value={selectedComponent.type}
                  disabled
                  className="w-full px-2 py-1.5 border border-[var(--border)] rounded text-xs bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-4">
            <div className="text-xs text-[var(--text-muted)] mb-2">组件配置</div>
            
            <div className="space-y-3">
              {/* 分页和每页条数 - 单独处理 */}
              {selectedComponent.props.pagination !== undefined && (
                <div className="bg-[var(--bg-secondary)] px-2 py-2 rounded space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[var(--text-secondary)]">显示分页</span>
                    <button
                      type="button"
                      onClick={() => handlePropChange('pagination', !selectedComponent.props.pagination)}
                      className={`w-8 h-4 rounded-full transition-colors flex-shrink-0 ${
                        selectedComponent.props.pagination ? 'bg-blue-500' : 'bg-[var(--bg-tertiary)]'
                      }`}
                    >
                      <div
                        className={`w-3 h-3 bg-white rounded-full shadow transition-transform mt-0.5 ${
                          selectedComponent.props.pagination ? 'translate-x-4' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                  {selectedComponent.props.pagination && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-secondary)]">每页条数</span>
                      <select
                        value={Number(selectedComponent.props.pageSize) || 10}
                        onChange={(e) => handlePropChange('pageSize', Number(e.target.value))}
                        className="px-2 py-1 border border-[var(--border)] rounded text-xs focus:outline-none focus:border-[var(--accent)] bg-[var(--input-bg)] text-[var(--text-primary)]"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* 编辑操作按钮 + 显示边框 */}
              {selectedComponent.props.showEdit !== undefined && (
                <div className="flex items-center gap-2 flex-wrap">
                  {(['showDetail', 'showEdit', 'showDelete', 'showAdd', 'showExport'] as const).map(key => {
                    if (selectedComponent.props[key] === undefined) return null;
                    return (
                      <div key={key} className="flex items-center justify-between bg-[var(--bg-secondary)] px-2 py-1.5 rounded min-w-[120px]">
                        <span className="text-xs text-[var(--text-secondary)] truncate" title={propLabels[key] || key}>
                          {propLabels[key] || key}
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePropChange(key, !selectedComponent.props[key])}
                          className={`w-8 h-4 rounded-full transition-colors flex-shrink-0 ml-2 ${
                            selectedComponent.props[key] ? 'bg-blue-500' : 'bg-[var(--bg-tertiary)]'
                          }`}
                        >
                          <div
                            className={`w-3 h-3 bg-white rounded-full shadow transition-transform mt-0.5 ${
                              selectedComponent.props[key] ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 其他布尔属性一排两个 */}
              {(() => {
                const boolProps = Object.entries(selectedComponent.props)
                  .filter(([key, value]) => typeof value === 'boolean' && key !== 'striped' && key !== 'bordered' && key !== 'showSearch' && key !== 'showPagination' && key !== 'showDetail' && key !== 'showEdit' && key !== 'showDelete' && key !== 'showAdd' && key !== 'showExport' && key !== 'pagination');
                
                if (boolProps.length === 0) return null;
                
                return (
                  <div className="grid grid-cols-2 gap-x-2 gap-y-2">
                    {boolProps.map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between bg-[var(--bg-secondary)] px-2 py-1.5 rounded">
                        <span className="text-xs text-[var(--text-secondary)] truncate" title={propLabels[key] || key}>
                          {propLabels[key] || key}
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePropChange(key, !value)}
                          className={`w-8 h-4 rounded-full transition-colors flex-shrink-0 ${
                            value ? 'bg-blue-500' : 'bg-[var(--bg-tertiary)]'
                          }`}
                        >
                          <div
                            className={`w-3 h-3 bg-white rounded-full shadow transition-transform mt-0.5 ${
                              value ? 'translate-x-4' : 'translate-x-0.5'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* 非布尔属性 - 隐藏 API ID 字段，pageSize 已在上方分页区块处理 */}
              {Object.entries(selectedComponent.props)
                .filter(([key, value]) => typeof value !== 'boolean' && key !== 'id' && key !== 'datasourceId' && key !== 'featureId' && key !== 'pageSize' && !key.endsWith('ApiId'))
                .map(([key, value]) => {
                  if (key === 'options' || key === 'columns' || key === 'data') {
                    if (key === 'options' && selectedComponent.type === 'select') {
                      return (
                        <div key={key}>
                          <label className="block text-xs text-[var(--text-muted)] mb-1">选项列表</label>
                          <input
                            type="text"
                            defaultValue={(value as string[]).join(', ')}
                            onBlur={(e) => handleOptionsChange(e.target.value)}
                            placeholder="用逗号分隔选项"
                            className="w-full px-2 py-1.5 border border-[var(--border)] rounded text-xs focus:outline-none focus:border-[var(--accent)] bg-[var(--input-bg)] text-[var(--text-primary)]"
                          />
                        </div>
                      );
                    }
                    return null;
                  }

                  return (
                    <div key={key}>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">
                        {propLabels[key] || key}
                      </label>
                      
                      {typeof value === 'number' ? (
                        <input
                          type="number"
                          value={value}
                          onChange={(e) => handlePropChange(key, Number(e.target.value))}
                          className="w-full px-2 py-1.5 border border-[var(--border)] rounded text-xs focus:outline-none focus:border-[var(--accent)] bg-[var(--input-bg)] text-[var(--text-primary)]"
                        />
                      ) : key === 'buttonType' ? (
                        <select
                          value={String(value)}
                          onChange={(e) => handlePropChange(key, e.target.value)}
                          className="w-full px-2 py-1.5 border border-[var(--border)] rounded text-xs focus:outline-none focus:border-[var(--accent)] bg-[var(--input-bg)] text-[var(--text-primary)]"
                        >
                          <option value="primary">主要按钮</option>
                          <option value="success">成功按钮</option>
                          <option value="warning">警告按钮</option>
                          <option value="danger">危险按钮</option>
                          <option value="default">默认按钮</option>
                          <option value="text">文字按钮</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={String(value)}
                          onChange={(e) => handlePropChange(key, e.target.value)}
                          className="w-full px-2 py-1.5 border border-[var(--border)] rounded text-xs focus:outline-none focus:border-[var(--accent)] bg-[var(--input-bg)] text-[var(--text-primary)]"
                        />
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Grid-specific config */}
          {selectedComponent.type === 'grid' && (
            <div className="border-t border-[var(--border)] pt-4">
              <div className="text-xs text-[var(--text-muted)] mb-2">栅格配置</div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">列数</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={Number(selectedComponent.props.cols) || 3}
                    onChange={(e) => handlePropChange('cols', Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-[var(--border)] rounded text-xs focus:outline-none focus:border-[var(--accent)] bg-[var(--input-bg)] text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">间距</label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={Number(selectedComponent.props.gap) || 10}
                    onChange={(e) => handlePropChange('gap', Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-[var(--border)] rounded text-xs focus:outline-none focus:border-[var(--accent)] bg-[var(--input-bg)] text-[var(--text-primary)]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Container (card/tabs/collapse) specific config */}
          {(selectedComponent.type === 'card' || selectedComponent.type === 'tabs' || selectedComponent.type === 'collapse') && (
            <div className="border-t border-[var(--border)] pt-4">
              <div className="text-xs text-[var(--text-muted)] mb-2">容器尺寸</div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">宽度 (px)</label>
                  <input
                    type="number"
                    min={100}
                    max={2000}
                    value={typeof selectedComponent.props.width === 'number' ? selectedComponent.props.width : (Number(selectedComponent.props.width) || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      handlePropChange('width', val === '' ? undefined : Number(val));
                    }}
                    placeholder="自适应"
                    className="w-full px-2 py-1.5 border border-[var(--border)] rounded text-xs focus:outline-none focus:border-[var(--accent)] bg-[var(--input-bg)] text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">高度 (px)</label>
                  <input
                    type="number"
                    min={60}
                    max={1000}
                    value={typeof selectedComponent.props.height === 'number' ? selectedComponent.props.height : (Number(selectedComponent.props.height) || '')}
                    onChange={(e) => {
                      const val = e.target.value;
                      handlePropChange('height', val === '' ? undefined : Number(val));
                    }}
                    placeholder="自适应"
                    className="w-full px-2 py-1.5 border border-[var(--border)] rounded text-xs focus:outline-none focus:border-[var(--accent)] bg-[var(--input-bg)] text-[var(--text-primary)]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Slider-specific config */}
          {selectedComponent.type === 'slider' && (
            <div className="border-t border-[var(--border)] pt-4">
              <div className="text-xs text-[var(--text-muted)] mb-2">滑动条配置</div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">最小值</label>
                  <input
                    type="number"
                    value={Number(selectedComponent.props.min) || 0}
                    onChange={(e) => handlePropChange('min', Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-[var(--border)] rounded text-xs focus:outline-none focus:border-[var(--accent)] bg-[var(--input-bg)] text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">最大值</label>
                  <input
                    type="number"
                    value={Number(selectedComponent.props.max) || 100}
                    onChange={(e) => handlePropChange('max', Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-[var(--border)] rounded text-xs focus:outline-none focus:border-[var(--accent)] bg-[var(--input-bg)] text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">当前值</label>
                  <input
                    type="number"
                    value={Number(selectedComponent.props.value) || 50}
                    onChange={(e) => handlePropChange('value', Number(e.target.value))}
                    className="w-full px-2 py-1.5 border border-[var(--border)] rounded text-xs focus:outline-none focus:border-[var(--accent)] bg-[var(--input-bg)] text-[var(--text-primary)]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Table-specific config */}
          {(selectedComponent.type === 'table' || selectedComponent.type === 'form') && (
            <div className="border-t border-[var(--border)] pt-4">
              <div className="text-xs text-[var(--text-muted)] mb-2">{selectedComponent.type === 'table' ? '表格配置' : '表单配置'}</div>
              <div className="space-y-3">
                {/* Feature 绑定 - 放在最前面 */}
                <div className="border-t border-[var(--border)] pt-4 mt-4">
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Feature 绑定</label>
                  <div className="space-y-2">
                    {/* 数据源选择 */}
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-0.5">数据源</label>
                      <select
                        value={selectedDatasource || ''}
                        onChange={async (e) => {
                          const dsId = Number(e.target.value);
                          setSelectedDatasource(dsId);
                          handlePropChange('datasourceId', dsId);
                          setFeatures([]);
                          setSelectedFeature(null);
                          if (dsId) {
                            const ds = dataSources.find(d => d.id === dsId);
                            if (ds) {
                              const dbName = (ds as Record<string, unknown>).database_name || (ds as Record<string, unknown>).databaseName || ds.name;
                              const tablesData = await getTableList(dbName as string);
                              setTables(tablesData);
                            }
                          }
                        }}
                        className="w-full px-2 py-1 border border-[var(--border)] rounded text-xs focus:outline-none focus:border-[var(--accent)] bg-[var(--input-bg)] text-[var(--text-primary)]"
                      >
                        <option value="">请选择数据源</option>
                        {dataSources.map(ds => (
                          <option key={ds.id} value={ds.id}>{ds.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* 表选择 */}
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-0.5">表名1</label>
                      <input
                        list="table-list"
                        value={selectedComponent.props.tableName as string || ''}
                        onChange={async (e) => {
                          const tableName = e.target.value;
                          console.log('[TableSelect] tableName:', tableName, 'selectedDatasource:', selectedDatasource);
                          handlePropChange('tableName', tableName);
                          if (selectedDatasource && tableName) {
                            await loadFeaturesByTable(selectedDatasource, tableName);
                          }
                        }}
                        placeholder="搜索或选择表..."
                        className="w-full px-2 py-1 border border-[var(--border)] rounded text-xs focus:outline-none focus:border-[var(--accent)] bg-[var(--input-bg)] text-[var(--text-primary)]"
                      />
                      <datalist id="table-list">
                        {tables.map(t => (
                          <option key={t.tableName} value={t.tableName}>{t.tableName}{t.tableComment ? ` (${t.tableComment})` : ''}</option>
                        ))}
                      </datalist>
                    </div>
                    
                    {/* Feature 列表 */}
                    {selectedComponent.props.tableName && (
                      <div>
                        <label className="block text-xs text-[var(--text-muted)] mb-0.5">已有 Feature</label>
                        {features.length > 0 ? (
                          <div className="space-y-1">
                            {features.map(f => (
                              <div 
                                key={f.id as number}
                                onClick={async () => {
                                  setSelectedFeature(f);
                                  handlePropChange('queryApiId', f.queryApiId);
                                  handlePropChange('createApiId', f.createApiId);
                                  handlePropChange('updateApiId', f.updateApiId);
                                  handlePropChange('deleteApiId', f.deleteApiId);
                                  handlePropChange('detailApiId', f.detailApiId);
                                  
                                  const fullFeature = await getFeatureDetail(f.id as number);
                                  if (fullFeature?.columns && Array.isArray(fullFeature.columns) && fullFeature.columns.length > 0) {
                                    const isFormComponent = selectedComponent.type === 'form';
                                    const columns = fullFeature.columns
                                      .filter((col) => col.visible !== false && col.fieldType !== 'action')
                                      .map((col) => ({
                                        key: col.fieldName,
                                        label: col.fieldLabel,
                                        fieldType: col.fieldType === 'text' ? 'text' : 
                                                  col.fieldType === 'number' ? 'number' :
                                                  col.fieldType === 'date' ? 'date' :
                                                  col.fieldType === 'select' ? 'select' : 'text',
                                        width: 120,
                                        visible: true,
                                        sortable: col.sortable !== false,
                                        align: 'left',
                                        frozen: false,
                                        ellipsis: true,
                                        tooltip: false,
                                        required: false,
                                        defaultValue: undefined,
                                        placeholder: '',
                                        queryCondition: true,
                                        dataDictionary: ''
                                      }));
                                    handlePropChange('columns', columns);
                                  }
                                }}
                                className={`p-2 border rounded cursor-pointer ${
                                  String(selectedFeature?.id) === String(f.id) 
                                    ? 'border-blue-500 bg-blue-50' 
                                    : 'border-[var(--border)] hover:border-blue-400 hover:bg-blue-50'
                                }`}
                              >
                                <div className="text-xs font-medium">{f.name}</div>
                                <div className="text-xs text-[var(--text-muted)]">{f.tableName}</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-[var(--text-muted)] py-2">
                            暂无关联的 Feature
                          </div>
                        )}
                        
                        {/* 创建新 Feature 按钮 */}
                        <button
                          onClick={() => {
                            const datasource = dataSources.find(d => d.id === selectedDatasource);
                            const url = `/#/feature/new?datasourceId=${selectedDatasource}&tableName=${selectedComponent.props.tableName}&datasourceName=${encodeURIComponent(datasource?.name || '')}`;
                            window.open(url, '_blank');
                          }}
                          className="w-full mt-2 px-3 py-1.5 text-xs border-2 border-dashed border-[var(--border)] rounded text-[var(--text-muted)] hover:border-blue-400 hover:text-blue-500"
                        >
                          ➕ 创建新 Feature
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Columns config */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs text-[var(--text-muted)]">列配置</label>
                  </div>
                  {/* 新增列输入框 */}
                  <div className="flex gap-1 mb-2">
                    <input
                      type="text"
                      id="newColumnInput"
                      placeholder="输入列名新增"
                      className="flex-1 px-2 py-1 border border-[var(--border)] rounded text-xs focus:outline-none focus:border-[var(--accent)] bg-[var(--input-bg)] text-[var(--text-primary)]"
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          const input = document.getElementById('newColumnInput') as HTMLInputElement;
                          const columnName = input?.value?.trim();
                          if (!columnName) return;
                          
                          // 从数据源获取表结构
                          const ds = dataSources.find(d => d.id === selectedDatasource);
                          if (!ds) return;
                          const dbName = String((ds as Record<string, unknown>).database_name || (ds as Record<string, unknown>).databaseName || ds.name || '');
                          const tableName = selectedComponent.props.tableName as string;
                          if (!tableName) return;
                          
                          const tableColumns = await getTableColumns(dbName, tableName);
                          const colInfo = tableColumns.find(c => c.columnName === columnName);
                          
                          if (colInfo) {
                            const currentColumns = (selectedComponent.props.columns as ColumnConfig[]) || [];
                            // 检查是否已存在
                            if (currentColumns.some(c => c.key === colInfo.columnName)) {
                              alert('该列已存在');
                              return;
                            }
                            // 根据列类型设置默认值
                            let fieldType = 'text';
                            if (colInfo.columnType?.includes('int') || colInfo.columnType?.includes('decimal')) {
                              fieldType = 'number';
                            } else if (colInfo.columnType?.includes('date')) {
                              fieldType = 'date';
                            }
                            const newCol: ColumnConfig = {
                              key: colInfo.columnName,
                              label: colInfo.columnComment || colInfo.columnName,
                              fieldType,
                              width: 100,
                              visible: true,
                              sortable: true,
                              align: 'left',
                              frozen: false,
                              ellipsis: true,
                              tooltip: false,
                              required: false,
                              defaultValue: undefined,
                              placeholder: '',
                              queryCondition: true, // 默认支持查询
                              dataDictionary: ''
                            };
                            handlePropChange('columns', [...currentColumns, newCol]);
                            input.value = '';
                          } else {
                            alert('未找到该列，请检查列名是否正确');
                          }
                        }
                      }}
                    />
                    <button
                      onClick={async () => {
                        const input = document.getElementById('newColumnInput') as HTMLInputElement;
                        const columnName = input?.value?.trim();
                        if (!columnName) return;
                        
                        const ds = dataSources.find(d => d.id === selectedDatasource);
                        if (!ds) return;
                        const dbName = String((ds as Record<string, unknown>).database_name || (ds as Record<string, unknown>).databaseName || ds.name || '');
                        const tableName = selectedComponent.props.tableName as string;
                        if (!tableName) return;
                        
                        const tableColumns = await getTableColumns(dbName, tableName);
                        const colInfo = tableColumns.find(c => c.columnName === columnName);
                        
                        if (colInfo) {
                          const currentColumns = (selectedComponent.props.columns as ColumnConfig[]) || [];
                          if (currentColumns.some(c => c.key === colInfo.columnName)) {
                            alert('该列已存在');
                            return;
                          }
                          let fieldType = 'text';
                          if (colInfo.columnType?.includes('int') || colInfo.columnType?.includes('decimal')) {
                            fieldType = 'number';
                          } else if (colInfo.columnType?.includes('date')) {
                            fieldType = 'date';
                          }
                          const newCol: ColumnConfig = {
                            key: colInfo.columnName,
                            label: colInfo.columnComment || colInfo.columnName,
                            fieldType,
                            width: 100,
                            visible: true,
                            sortable: true,
                            align: 'left',
                            frozen: false,
                            ellipsis: true,
                            tooltip: false,
                            required: false,
                            defaultValue: undefined,
                            placeholder: '',
                            queryCondition: true,
                            dataDictionary: ''
                          };
                          handlePropChange('columns', [...currentColumns, newCol]);
                          input.value = '';
                        } else {
                          alert('未找到该列，请检查列名是否正确');
                        }
                      }}
                      className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                    >
                      添加
                    </button>
                  </div>
                  <div className="space-y-1">
                    {(() => {
                      const columns = (selectedComponent.props.columns as ColumnConfig[]) || [];
                      const showCollapse = columns.length > 10;
                      const displayColumns = showCollapse && columnsCollapsed ? columns.slice(0, 10) : columns;
                      return (
                        <>
                          {displayColumns.map((col, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-[var(--bg-secondary)] rounded">
                              <span className="flex-1 text-xs truncate">{col.label}</span>
                              <span className="text-xs text-[var(--text-muted)]">{col.fieldType || 'text'}</span>
                              <button
                                onClick={() => {
                                  setEditingColumn(col);
                                  setEditingColumnIndex(idx);
                                  setColumnConfigOpen(true);
                                }}
                                className="text-blue-500 hover:text-blue-600"
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => {
                                  const newCols = [...(selectedComponent.props.columns as ColumnConfig[])];
                                  newCols.splice(idx, 1);
                                  handlePropChange('columns', newCols);
                                }}
                                className="text-red-400 hover:text-red-600"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {showCollapse && (
                            <button
                              onClick={() => setColumnsCollapsed(!columnsCollapsed)}
                              className="w-full mt-1 text-xs text-blue-500 hover:text-blue-600"
                            >
                              {columnsCollapsed ? `展开剩余 ${columns.length - 10} 列` : '收拢'}
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Column Config Modal */}
      {columnConfigOpen && (
        <ColumnConfigModal
          editingColumn={editingColumn}
          editingColumnIndex={editingColumnIndex}
          columns={(selectedComponent.props.columns as ColumnConfig[]) || []}
          onSave={handleColumnSave}
          onClose={() => setColumnConfigOpen(false)}
        />
      )}

      {/* Container Selector Modal */}
      {containerSelectorOpen && (
        <ContainerSelectorModal
          containers={availableContainers}
          onSelect={(containerId, tabIndex) => {
            onMoveToContainer(containerId, selectedComponent.id, tabIndex);
            setContainerSelectorOpen(false);
          }}
          onClose={() => setContainerSelectorOpen(false)}
        />
      )}
    </div>
  );
}

export default PropertyPanel;
