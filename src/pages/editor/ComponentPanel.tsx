import React from 'react';
import { Box } from 'lucide-react';
import { ComponentItem } from './types';
import { componentCategories, iconMap } from './constants';

interface ComponentPanelProps {
  onDragStart: (comp: ComponentItem) => void;
  onQuickAdd?: (comp: ComponentItem) => void;
}

// Component Panel - Left Side
function ComponentPanel({ onDragStart, onQuickAdd }: ComponentPanelProps) {
  const handleDragStart = (e: React.DragEvent, comp: ComponentItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: comp.type,
      label: comp.label,
      fromPalette: true,
      defaultProps: comp.defaultProps || {},
    }));
    e.dataTransfer.effectAllowed = 'copy';
    onDragStart(comp);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[var(--bg-primary)]">
      <div className="p-4">
        <h3 className="text-sm font-medium text-[var(--text-primary)] mb-4">组件库</h3>
        
        {componentCategories.map((category) => (
          <div key={category.name} className="mb-6">
            <div className="text-xs text-[var(--text-muted)] mb-2 px-1">{category.name}</div>
            <div className="grid grid-cols-2 gap-2">
              {category.components.map((comp) => {
                const IconComp = iconMap[comp.icon] || Box;
                return (
                  <div
                    key={comp.type}
                    className="flex items-center justify-between px-2 py-1.5 bg-[var(--bg-tertiary)] rounded text-xs group transition-colors text-[var(--text-primary)]"
                  >
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, comp)}
                      className="flex-1 flex items-center gap-1.5 cursor-grab hover:bg-[var(--bg-hover)] active:cursor-grabbing rounded p-1 -m-1 truncate"
                    >
                      <IconComp className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                      <span className="truncate">{comp.label}</span>
                    </div>
                    {onQuickAdd && (
                      <button
                        onClick={() => onQuickAdd(comp)}
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center text-blue-500 hover:bg-blue-100 rounded transition-all shrink-0"
                        title="快速添加"
                      >
                        +
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ComponentPanel;
