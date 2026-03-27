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
  text: <File className="w-3 h-3 text-gray-400" />,
  button: <File className="w-3 h-3 text-gray-400" />,
  input: <File className="w-3 h-3 text-gray-400" />,
  default: <File className="w-3 h-3 text-gray-400" />,
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
  depth: number;
  defaultExpanded?: boolean;
  dragState: { dragId: string | null; dropId: string | null; position: 'before' | 'after' | 'inside' } | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDragEnter: (id: string, position: 'before' | 'after' | 'inside') => void;
}

function TreeNode({
  component,
  selectedId,
  onSelect,
  onDelete,
  onMove,
  depth,
  defaultExpanded = true,
  dragState,
  onDragStart,
  onDragEnd,
  onDragEnter,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasChildren = component.children && component.children.length > 0;
  const isContainer = isContainerType(component.type);
  const isSelected = selectedId === component.id;
  const isDragging = dragState?.dragId === component.id;
  const isDropTarget = dragState?.dropId === component.id;

  const handleDragStart = (e: DragEvent) => {
    e.dataTransfer.setData('text/plain', component.id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(component.id);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const h = rect.height;
    let position: 'before' | 'after' | 'inside' = 'inside';
    if (y < h * 0.25) {
      position = 'before';
    } else if (y > h * 0.75) {
      position = 'after';
    }
    onDragEnter(component.id, position);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const dragId = e.dataTransfer.getData('text/plain');
    if (dragId && dragState) {
      onMove(dragId, component.id, dragState.position);
    }
    onDragEnd();
  };

  const handleDragEnd = () => {
    onDragEnd();
  };

  const getDropIndicator = () => {
    if (!isDropTarget || !dragState) return null;
    const { position } = dragState;
    if (position === 'before') {
      return <div className="absolute left-0 top-0 right-0 h-0.5 bg-blue-500 -mt-0.5" />;
    }
    if (position === 'after') {
      return <div className="absolute left-0 bottom-0 right-0 h-0.5 bg-blue-500 -mb-0.5" />;
    }
    if (position === 'inside' && isContainer) {
      return <div className="absolute inset-0 border-2 border-blue-500 rounded bg-blue-50" />;
    }
    return null;
  };

  return (
    <div className="group relative">
      <div
        className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer transition-colors ${
          isSelected ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
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
        <GripVertical className="w-3 h-3 text-gray-300 cursor-grab opacity-0 group-hover:opacity-100" />
        {isContainer && hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5 hover:bg-gray-200 rounded"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        ) : (
          <span className="w-4" />
        )}
        {getIcon(component.type)}
        <span className="text-xs truncate flex-1">{component.label || typeLabels[component.type] || component.type}</span>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(component.id);
            }}
            className="p-0.5 hover:bg-red-100 rounded"
            title="删除"
          >
            <Trash2 className="w-3 h-3 text-red-400" />
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
    <div className="h-full flex flex-col bg-white">
      {showHeader && (
        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
          <h3 className="text-xs font-medium text-gray-600">组件层</h3>
        </div>
      )}
      <div className="flex-1 overflow-auto py-1">
        {components.length === 0 ? (
          <div className="text-xs text-gray-400 px-3 py-2">暂无组件</div>
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
