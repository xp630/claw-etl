import React, { useState, DragEvent } from 'react';
import { ChevronRight, ChevronDown, File, Folder, Table, Layout, Trash2, GripVertical } from 'lucide-react';
import { CanvasComponent } from './types';

interface ComponentTreeProps {
  components: CanvasComponent[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onMove: (dragId: string, dropId: string, position: 'before' | 'after' | 'inside') => void;
  showHeader?: boolean;
}

const typeIcons: Record<string, React.ReactNode> = {
  card: <Layout className="w-3 h-3 text-blue-500" />,
  tabs: <Folder className="w-3 h-3 text-purple-500" />,
  table: <Table className="w-3 h-3 text-green-500" />,
  form: <File className="w-3 h-3 text-orange-500" />,
  text: <File className="w-3 h-3 text-[var(--text-muted)]" />,
  button: <File className="w-3 h-3 text-[var(--text-muted)]" />,
  input: <File className="w-3 h-3 text-[var(--text-muted)]" />,
  default: <File className="w-3 h-3 text-[var(--text-muted)]" />,
};

function getIcon(type: string) {
  return typeIcons[type] || typeIcons.default;
}

function isContainerType(type: string) {
  return ['card', 'tabs', 'collapse', 'grid'].includes(type);
}

const typeLabels: Record<string, string> = {
  card: '卡片',
  tabs: '标签页',
  table: '表格',
  form: '表单',
  text: '文本',
  button: '按钮',
  input: '输入框',
  select: '下拉框',
  date: '日期',
  switch: '开关',
  slider: '滑块',
  lineChart: '折线图',
  barChart: '柱状图',
  pieChart: '饼图',
  grid: '栅格',
  divider: '分割线',
  blank: '空白',
  image: '图片',
  link: '链接',
  collapse: '折叠面板',
};

interface TreeNodeProps {
  component: CanvasComponent;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (dragId: string, dropId: string, position: 'before' | 'after' | 'inside') => void;
  depth?: number;
  defaultExpanded?: boolean;
  dragState?: { dragId: string | null; dropId: string | null; position: string } | null;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
  onDragEnter?: (id: string, position: 'before' | 'after' | 'inside') => void;
}

function TreeNode({
  component,
  selectedId,
  onSelect,
  onDelete,
  onMove,
  depth = 0,
  defaultExpanded = false,
  dragState,
  onDragStart,
  onDragEnd,
  onDragEnter,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isSelected = selectedId === component.id;
  const isContainer = isContainerType(component.type);
  const hasChildren = component.children && component.children.length > 0;
  const isDragging = dragState?.dragId === component.id;

  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer.setData('text/plain', component.id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(component.id);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (!dragState?.dragId || dragState.dragId === component.id) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const threshold = rect.height / 4;
    let position: 'before' | 'after' | 'inside' = 'inside';
    if (y < threshold) position = 'before';
    else if (y > rect.height - threshold) position = 'after';
    else position = 'inside';
    onDragEnter?.(component.id, position);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const dragId = e.dataTransfer.getData('text/plain');
    if (!dragId || dragId === component.id) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const threshold = rect.height / 4;
    let position: 'before' | 'after' | 'inside' = 'inside';
    if (y < threshold) position = 'before';
    else if (y > rect.height - threshold) position = 'after';
    onMove(dragId, component.id, position);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  const isDropTarget = dragState?.dropId === component.id && dragState?.dragId !== component.id;
  const position = dragState?.position as 'before' | 'after' | 'inside' | undefined;

  const getDropIndicator = () => {
    if (position === 'before') {
      return <div className="absolute left-0 top-0 bottom-0 right-0 h-0.5 bg-[var(--accent)] -mt-0.5" />;
    }
    if (position === 'after') {
      return <div className="absolute left-0 bottom-0 right-0 h-0.5 bg-[var(--accent)] -mb-0.5" />;
    }
    if (position === 'inside' && isContainer) {
      return <div className="absolute inset-0 border-2 border-[var(--accent)] rounded bg-[var(--accent-light)]" />;
    }
    return null;
  };

  return (
    <div className="group relative">
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-colors ${
          isSelected ? 'bg-[var(--accent-light)] text-[var(--accent)]' : 'hover:bg-[var(--bg-hover)]'
        } ${isDragging ? 'opacity-50' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        onClick={() => onSelect(component.id)}
      >
        {isDropTarget && getDropIndicator()}
        <GripVertical className="w-3 h-3 text-[var(--text-muted)] cursor-grab opacity-0 group-hover:opacity-100" />
        {isContainer && hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5 hover:bg-[var(--bg-hover)] rounded"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        ) : (
          <span className="w-4" />
        )}
        {getIcon(component.type)}
        <span className="text-xs truncate flex-1 text-[var(--text-primary)]">{component.label || typeLabels[component.type] || component.type}</span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(component.id);
            }}
            className="p-0.5 hover:bg-red-500/20 rounded"
            title="删除"
          >
            <Trash2 className="w-3 h-3 text-[var(--danger)]" />
          </button>
        </div>
      </div>
      {hasChildren && expanded && (
        <div>
          {component.children!.map(child => (
            <TreeNode
              key={child.id}
              component={child}
              selectedId={selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
              onMove={onMove}
              depth={depth + 1}
              defaultExpanded={defaultExpanded}
              dragState={dragState}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragEnter={onDragEnter}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ComponentTree({
  components,
  selectedId,
  onSelect,
  onDelete,
  onMove,
  showHeader = true,
}: ComponentTreeProps) {
  const [dragState, setDragState] = useState<{
    dragId: string | null;
    dropId: string | null;
    position: 'before' | 'after' | 'inside';
  } | null>(null);

  const handleDragStart = (id: string) => {
    setDragState(prev => prev ? { ...prev, dragId: id } : { dragId: id, dropId: null, position: 'inside' });
  };

  const handleDragEnd = () => {
    setDragState(null);
  };

  const handleDragEnter = (id: string, position: 'before' | 'after' | 'inside') => {
    setDragState(prev => prev ? { ...prev, dropId: id, position } : { dragId: null, dropId: id, position });
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)]">
      {showHeader && (
        <div className="px-3 py-2 border-b border-[var(--border-light)] bg-[var(--bg-secondary)]">
          <h3 className="text-xs font-medium text-[var(--text-primary)]">组件层</h3>
        </div>
      )}
      <div className="flex-1 overflow-auto py-1">
        {components.length === 0 ? (
          <div className="text-xs text-[var(--text-muted)] px-3 py-2">暂无组件</div>
        ) : (
          components.map(comp => (
            <TreeNode
              key={comp.id}
              component={comp}
              selectedId={selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
              onMove={onMove}
              depth={0}
              dragState={dragState}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragEnter={handleDragEnter}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ComponentTree;
