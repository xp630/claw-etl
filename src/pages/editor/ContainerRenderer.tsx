import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronDown, Maximize2, X, Plus } from 'lucide-react';
import { CanvasComponent } from './types';

interface ContainerRendererProps {
  type: string;
  props: Record<string, unknown>;
  children?: React.ReactNode;
  componentId?: string;
  childComponents?: CanvasComponent[];  // Direct children for rendering (for tabs, this is filtered by tabIndex)
  allComponents?: CanvasComponent[];
  onUpdateProps?: (props: Record<string, unknown>) => void;
  onResize?: (width: number, height: number) => void;
  renderChild?: (component: CanvasComponent) => React.ReactNode;  // Recursive render callback for child components
}

// Helper to find component by ID
function findComponentById(components: CanvasComponent[], id: string): CanvasComponent | null {
  for (const comp of components) {
    if (comp.id === id) return comp;
    if (comp.children && comp.children.length > 0) {
      const found = findComponentById(comp.children, id);
      if (found) return found;
    }
  }
  return null;
}

// ResizeHandle component for dragging to resize
function ResizeHandle({ onResize }: { onResize: (deltaW: number, deltaH: number) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;
      startPos.current = { x: e.clientX, y: e.clientY };
      onResize(deltaX, deltaY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onResize]);

  return (
    <div
      className={`absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center ${isDragging ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--accent)]'}`}
      style={{ pointerEvents: isDragging ? 'auto' : 'none' }}
      onMouseDown={handleMouseDown}
      title="拖动调整尺寸"
    >
      <Maximize2 className="w-3 h-3" />
    </div>
  );
}

// Container Renderer - handles container components with children
function ContainerRenderer({ type, props, children, componentId, childComponents, allComponents, onUpdateProps, onResize, renderChild }: ContainerRendererProps) {
  const [addingTab, setAddingTab] = useState(false);
  const [newTabName, setNewTabName] = useState('');

  const handleTabClick = useCallback((index: number) => {
    if (!onUpdateProps || !componentId) return;
    onUpdateProps({ activeTab: index });
  }, [onUpdateProps, componentId]);

  const handleDeleteTab = useCallback((index: number) => {
    if (!onUpdateProps || !componentId) return;
    const tabs = [...((props.tabs as string[]) || [])];
    tabs.splice(index, 1);
    // Adjust activeTab if necessary
    let newActiveTab = props.activeTab as number;
    if (index <= newActiveTab && newActiveTab > 0) {
      newActiveTab = Math.max(0, newActiveTab - 1);
    }
    if (newActiveTab >= tabs.length) {
      newActiveTab = Math.max(0, tabs.length - 1);
    }
    onUpdateProps({ tabs, activeTab: newActiveTab });
  }, [onUpdateProps, componentId, props.tabs, props.activeTab]);

  const handleAddTab = useCallback(() => {
    if (!onUpdateProps || !componentId) return;
    if (!newTabName.trim()) {
      setAddingTab(false);
      setNewTabName('');
      return;
    }
    const tabs = [...((props.tabs as string[]) || []), newTabName.trim()];
    setNewTabName('');
    setAddingTab(false);
    onUpdateProps({ tabs });
  }, [onUpdateProps, componentId, newTabName, props.tabs]);

  const containerStyle: React.CSSProperties = {
    width: (props.width as number | string) ?? 'auto',
    height: (props.height as number | string) ?? 'auto',
    minWidth: props.width !== undefined ? undefined : 'auto',
    minHeight: props.height !== undefined ? undefined : 'auto',
    border: props.bordered ? '1px solid #ddd' : 'none',
    borderRadius: 8,
    padding: 16,
    position: 'relative',
    overflow: type === 'tabs' ? 'visible' : 'hidden',
    pointerEvents: type === 'tabs' ? 'auto' : undefined,
    zIndex: type === 'tabs' ? 1 : undefined,
  };

  const handleResize = useCallback((deltaW: number, deltaH: number) => {
    if (onResize) {
      const currentWidth = typeof props.width === 'number' ? props.width : 0;
      const currentHeight = typeof props.height === 'number' ? props.height : 0;
      const newWidth = Math.max(100, currentWidth + deltaW);
      const newHeight = Math.max(60, currentHeight + deltaH);
      onResize(newWidth, newHeight);
    }
  }, [onResize, props.width, props.height]);

  switch (type) {
    case 'card': {
      // Card container with flex layout to properly expand children (e.g., tabs)
      const cardContainerStyle: React.CSSProperties = {
        ...containerStyle,
        display: 'flex',
        flexDirection: 'column',
      };
      return (
        <div className="card" style={cardContainerStyle}>
          {props.title && <div className="card-title font-medium text-[var(--text-primary)] mb-2 flex-shrink-0">{String(props.title)}</div>}
          <div className="card-content flex-1 min-h-0">
            {childComponents && childComponents.length > 0 && renderChild ? (
              childComponents.map(child => renderChild(child))
            ) : (
              children
            )}
          </div>
          {onResize && <ResizeHandle onResize={handleResize} />}
        </div>
      );
    }
    case 'tabs': {
      const tabs = (props.tabs as string[]) || [];
      const canModify = onUpdateProps && componentId;
      const containerHeight = props.height;
      const activeTab = props.activeTab as number;
      
      // Debug logging for tabs rendering
      console.log('[Tabs] Rendering tabs container:', {
        tabsCount: tabs.length,
        activeTab,
        containerHeight,
        childComponentsCount: childComponents?.length,
        hasRenderChild: !!renderChild,
        childrenMap: props.childrenMap,
      });
      
      // Tabs container with flex layout to properly expand children
      // Key fixes for height expansion:
      // 1. Use min-height instead of height when height is auto to allow content-driven expansion
      // 2. Use minHeight: 300px as fallback to ensure tabs have minimum height
      // 3. Ensure the container can grow beyond minHeight based on content
      const tabsContainerStyle: React.CSSProperties = {
        ...containerStyle,
        display: 'flex',
        flexDirection: 'column',
        height: containerHeight !== undefined ? (containerHeight as number | string) : 'auto',
        minHeight: containerHeight !== undefined ? undefined : 300,
      };
      
      return (
        <div className="tabs" style={tabsContainerStyle}>
          <div className="tab-header flex border-b border-[var(--border-light)] mb-3 flex-shrink-0">
            {tabs.map((tab, i) => (
              <div 
                key={i} 
                onClick={() => handleTabClick(i)}
                className={`tab-item px-4 py-2 text-sm cursor-pointer transition-colors flex items-center gap-1 group ${
                  i === activeTab 
                    ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] -mb-px font-medium' 
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>{tab}</span>
                {canModify && tabs.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteTab(i); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 rounded transition-opacity"
                    title="删除标签"
                  >
                    <X className="w-3 h-3 text-red-500" />
                  </button>
                )}
              </div>
            ))}
            {canModify && (
              addingTab ? (
                <div className="flex items-center gap-1 px-2">
                  <input
                    type="text"
                    value={newTabName}
                    onChange={(e) => setNewTabName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddTab(); if (e.key === 'Escape') { setAddingTab(false); setNewTabName(''); } }}
                    onBlur={handleAddTab}
                    autoFocus
                    placeholder="标签名"
                    className="w-20 px-1 py-0.5 text-sm border border-[var(--border)] rounded focus:outline-none focus:border-[var(--accent)] bg-[var(--input-bg)] text-[var(--text-primary)]"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setAddingTab(true)}
                  className="px-2 py-1 text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-light)] rounded transition-colors"
                  title="添加标签"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )
            )}
          </div>
          {/* Tab content area - MUST have min-height to display content properly */}
          {/* Using inline flex styles instead of flex-1 to ensure proper expansion */}
          <div 
            className="tab-content overflow-auto" 
            style={{ 
              pointerEvents: 'auto',
              minHeight: '200px',
              flex: '1 1 auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* childComponents is already filtered by activeTab in ComponentRenderer, so render all */}
            {childComponents && childComponents.length > 0 && renderChild ? (
              childComponents.map(child => (
                <div key={child.id} style={{ minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
                  {renderChild(child)}
                </div>
              ))
            ) : (
              <div style={{ minHeight: '200px' }}>
                {children}
              </div>
            )}
          </div>
          {onResize && <ResizeHandle onResize={handleResize} />}
        </div>
      );
    }
    case 'collapse': {
      // Collapse container with flex layout to properly expand children
      const collapseContainerStyle: React.CSSProperties = {
        ...containerStyle,
        display: 'flex',
        flexDirection: 'column',
      };
      return (
        <div className="collapse" style={collapseContainerStyle}>
          {((props.panels as Array<{ title: string; content: string }>) || []).map((panel, i) => (
            <div key={i} className="collapse-item border border-[var(--border)] rounded mb-2 last:mb-0 flex-shrink-0">
              <div className="collapse-header px-4 py-3 bg-[var(--bg-secondary)] flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--text-primary)]">{panel.title}</span>
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
              </div>
              <div className="collapse-content p-4">
                {i === 0 ? (
                  childComponents && childComponents.length > 0 && renderChild ? (
                    childComponents.map(child => renderChild(child))
                  ) : (
                    children
                  )
                ) : null}
              </div>
            </div>
          ))}
          {onResize && <ResizeHandle onResize={handleResize} />}
        </div>
      );
    }
    default:
      return <div>{children}</div>;
  }
}

export default ContainerRenderer;
