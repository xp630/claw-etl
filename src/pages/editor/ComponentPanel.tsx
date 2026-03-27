import React from 'react';
import { Box } from 'lucide-react';
import { ComponentItem } from './types';
import { componentCategories, iconMap } from './constants';

interface ComponentPanelProps {
  onDragStart: (comp: ComponentItem) => void;
}

// Component Panel - Left Side
function ComponentPanel({ onDragStart }: ComponentPanelProps) {
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
    <div className="w-56 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-600 mb-4">组件库</h3>
        
        {componentCategories.map((category) => (
          <div key={category.name} className="mb-6">
            <div className="text-xs text-gray-400 mb-2 px-1">{category.name}</div>
            <div className="flex flex-col gap-1.5">
              {category.components.map((comp) => {
                const IconComp = iconMap[comp.icon] || Box;
                return (
                  <div
                    key={comp.type}
                    draggable
                    onDragStart={(e) => handleDragStart(e, comp)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md text-sm cursor-grab hover:bg-gray-100 active:cursor-grabbing transition-colors select-none"
                  >
                    <IconComp className="w-4 h-4 text-gray-500" />
                    <span>{comp.label}</span>
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
