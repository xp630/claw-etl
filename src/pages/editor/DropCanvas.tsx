import React, { useState, useRef, useCallback } from 'react';
import { View, ArrowUp, ArrowDown, Trash2, GripVertical } from 'lucide-react';
import { CanvasComponent } from './types';
import ComponentRenderer from './ComponentRenderer';

interface DropCanvasProps {
  components: CanvasComponent[];
  allComponents: CanvasComponent[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onDelete: (id: string) => void;
  onDrop: (e: React.DragEvent) => void;
  onAddChildToContainer: (containerId: string, component: CanvasComponent, tabIndex?: number) => void;
  onRemoveChildFromContainer?: (containerId: string, childId: string) => void;
  onMoveChildToRoot?: (containerId: string, childId: string, toIndex: number) => void;
  onResize?: (id: string, width: number, height: number) => void;
  onUpdateProps?: (id: string, props: Record<string, unknown>) => void;
}

// Generate unique ID
export const generateId = () => `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

function DropCanvas({
  components,
  allComponents,
  selectedId,
  onSelect,
  onReorder,
  onDelete,
  onDrop,
  onAddChildToContainer,
  onRemoveChildFromContainer,
  onMoveChildToRoot,
  onResize,
  onUpdateProps,
}: DropCanvasProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragOverContainerId, setDragOverContainerId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Track drag state
  const dragState = useRef<{
    dragType: 'new' | 'reorder' | 'nested';
    sourceId: string | null;
    sourceContainerId: string | null;
    sourceIndex: number;
  }>({
    dragType: 'new',
    sourceId: null,
    sourceContainerId: null,
    sourceIndex: -1,
  });

  const isContainerType = (type: string) => type === 'card' || type === 'tabs' || type === 'collapse';

  // Flatten components for reorder tracking - includes both root and nested
  const flattenComponents = useCallback((comps: CanvasComponent[], parentId: string | null = null): Array<{comp: CanvasComponent, parentId: string | null, index: number}> => {
    const result: Array<{comp: CanvasComponent, parentId: string | null, index: number}> = [];
    comps.forEach((comp, index) => {
      result.push({ comp, parentId, index });
      if (comp.children && comp.children.length > 0) {
        result.push(...flattenComponents(comp.children, comp.id));
      }
    });
    return result;
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const { clientX, clientY } = e;
      if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
        setIsDragOver(false);
        setDragOverContainerId(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    setDragOverContainerId(null);
    onDrop(e);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      onSelect(null);
    }
  };

  // Handle drag start from palette (new component)
  const handlePaletteDragStart = (e: React.DragEvent, compType: string, compLabel: string, defaultProps?: Record<string, unknown>) => {
    dragState.current = {
      dragType: 'new',
      sourceId: null,
      sourceContainerId: null,
      sourceIndex: -1,
    };
    e.dataTransfer.setData('application/json', JSON.stringify({
      fromPalette: true,
      type: compType,
      label: compLabel,
      defaultProps,
    }));
  };

  // Handle drag start from root component (reorder)
  const handleRootDragStart = (e: React.DragEvent, index: number) => {
    dragState.current = {
      dragType: 'reorder',
      sourceId: null,
      sourceContainerId: null,
      sourceIndex: index,
    };
    e.dataTransfer.setData('application/json', JSON.stringify({
      fromRoot: true,
      index,
    }));
  };

  // Handle drag start from nested component (move out of container)
  const handleNestedDragStart = (e: React.DragEvent, containerId: string, index: number) => {
    dragState.current = {
      dragType: 'nested',
      sourceId: null,
      sourceContainerId: containerId,
      sourceIndex: index,
    };
    e.dataTransfer.setData('application/json', JSON.stringify({
      fromNested: true,
      containerId,
      index,
    }));
  };

  const handleContainerDragOver = (e: React.DragEvent, containerId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverContainerId(containerId);
  };

  const handleContainerDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    // Only clear if leaving the container entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      setDragOverContainerId(null);
    }
  };

  const handleContainerDrop = (e: React.DragEvent, containerId: string, tabIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverContainerId(null);
    
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.fromPalette) {
        // New component from palette
        const newComponent: CanvasComponent = {
          id: generateId(),
          componentId: `${parsed.type}_${Date.now()}`,
          type: parsed.type,
          label: parsed.label,
          props: parsed.defaultProps || {},
        };
        onAddChildToContainer(containerId, newComponent, tabIndex);
      } else if (parsed.fromRoot) {
        // Moving from root to container
        onMoveChildToRoot?.(containerId, '', parsed.index);
      } else if (parsed.fromNested) {
        // Moving from one container to another container
        if (parsed.containerId !== containerId) {
          onMoveChildToRoot?.(containerId, '', parsed.index);
        }
      }
    } catch (err) {
      console.error('Failed to parse drop data:', err);
    }
  };

  // Handle drop on canvas (for moving nested component to root)
  const handleRootDrop = (e: React.DragEvent, insertIndex?: number) => {
    const data = e.dataTransfer.getData('application/json');
    if (!data) return;
    
    try {
      const parsed = JSON.parse(data);
      
      if (parsed.fromNested && dragState.current.sourceContainerId) {
        // Moving nested component to root
        e.preventDefault();
        onMoveChildToRoot?.(dragState.current.sourceContainerId, '', insertIndex ?? -1);
      }
    } catch (err) {
      console.error('Failed to parse drop data:', err);
    }
  };

  // Render a single component item (used for both root and nested)
  const renderComponentItem = (
    comp: CanvasComponent, 
    index: number, 
    parentId: string | null,
    isNested: boolean
  ) => {
    const isSelected = selectedId === comp.id;
    const isDragOverContainer = dragOverContainerId === comp.id;
    
    return (
      <div
        key={comp.id}
        data-component-id={comp.id}
        draggable
        onDragStart={(e) => {
          if (parentId) {
            handleNestedDragStart(e, parentId, index);
          } else {
            handleRootDragStart(e, index);
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onClick={(e) => {
          e.stopPropagation();
          console.log('[DropCanvas] Click on component:', comp.id, 'isNested:', isNested);
          // Use setTimeout to ensure the click is not intercepted
          setTimeout(() => {
            onSelect(comp.id);
          }, 0);
        }}
        className={`relative bg-white border-2 rounded-md transition-all cursor-pointer group ${isNested ? 'nested-component' : ''} ${
          isSelected
            ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
            : 'border-transparent hover:border-gray-300'
        }`}
      >
        <div className="flex items-center gap-1 absolute -top-3 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-white rounded shadow">
          {!isNested && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (index > 0) onReorder(index, index - 1);
                }}
                disabled={index === 0}
                className="p-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30"
                title="上移"
              >
                <ArrowUp className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (index < components.length - 1) onReorder(index, index + 1);
                }}
                disabled={index === components.length - 1}
                className="p-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-30"
                title="下移"
              >
                <ArrowDown className="w-3 h-3" />
              </button>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (parentId && onRemoveChildFromContainer) {
                onRemoveChildFromContainer(parentId, comp.id);
              } else {
                onDelete(comp.id);
              }
            }}
            className="p-1 border border-red-200 rounded hover:bg-red-50 text-red-500"
            title={isNested ? "移除" : "删除"}
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <div className="p-1 border border-gray-200 rounded text-gray-400 cursor-grab" title="拖拽">
            <GripVertical className="w-3 h-3" />
          </div>
        </div>
        
        <div className={`p-4 ${isContainerType(comp.type) ? 'pb-2' : ''}`}>
          <ComponentRenderer 
            component={comp} 
            allComponents={allComponents}
            onResize={onResize}
            onUpdateProps={onUpdateProps ? (props) => onUpdateProps(comp.id, props) : undefined}
          >
            {isContainerType(comp.type) && (
              <div 
                className={`min-h-16 border-2 border-dashed rounded m-2 p-2 transition-colors ${
                  isDragOverContainer 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 bg-gray-50 hover:border-blue-300'
                }`}
                onDragOver={(e) => handleContainerDragOver(e, comp.id)}
                onDragLeave={handleContainerDragLeave}
                onDrop={(e) => {
                  // For tabs, use the currently active tab index
                  const tabIndex = comp.type === 'tabs' ? (comp.props.activeTab as number || 0) : undefined;
                  handleContainerDrop(e, comp.id, tabIndex);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(comp.id);
                }}
              >
                {/* Get children for drop zone - for tabs use childrenMap + comp.children, otherwise use children array */}
                {(() => {
                  let dropZoneChildren: CanvasComponent[] = [];
                  if (comp.type === 'tabs') {
                    // For tabs, children are in comp.children, but we filter by childrenMap
                    const childrenMap = comp.props.childrenMap as Record<string, string[]> | undefined;
                    if (childrenMap) {
                      const tabIndex = String(comp.props.activeTab || 0);
                      const childIds = childrenMap[tabIndex] || [];
                      // Filter comp.children by IDs in childrenMap[tabIndex]
                      dropZoneChildren = (comp.children || []).filter(c => childIds.includes(c.id));
                    } else {
                      // Fallback to all children if no childrenMap
                      dropZoneChildren = comp.children || [];
                    }
                  } else {
                    dropZoneChildren = comp.children || [];
                  }
                  
                  return dropZoneChildren.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {dropZoneChildren.map((child, childIndex) => 
                        renderComponentItem(child, childIndex, comp.id, true)
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 text-center py-4">
                      拖拽组件到此处
                    </div>
                  );
                })()}
              </div>
            )}
          </ComponentRenderer>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={canvasRef}
      onClick={handleCanvasClick}
      onDragOver={(e) => {
        handleDragOver(e);
        // Check if it's a nested component being dragged to root
        if (dragState.current.dragType === 'nested') {
          e.preventDefault();
        }
      }}
      onDragLeave={handleDragLeave}
      onDrop={(e) => {
        if (dragState.current.dragType === 'nested') {
          handleRootDrop(e);
        } else {
          handleDrop(e);
        }
      }}
      className={`flex-1 p-5 overflow-y-auto ${
        isDragOver ? 'bg-blue-50 border-2 border-dashed border-blue-400' : 'bg-gray-100'
      }`}
    >
      {components.length === 0 ? (
        <div className="flex items-center justify-center min-h-96 bg-white border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center text-gray-400">
            <View className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>拖拽组件到此处构建页面</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {components.map((comp, index) => 
            renderComponentItem(comp, index, null, false)
          )}
        </div>
      )}
    </div>
  );
}

export default DropCanvas;