declare module 'react-grid-layout' {
  import * as React from 'react';

  export interface Layout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    maxW?: number;
    minH?: number;
    maxH?: number;
    static?: boolean;
    isDraggable?: boolean;
    isResizable?: boolean;
  }

  export interface GridLayoutProps {
    layout: Layout[];
    cols: number;
    rowHeight: number;
    width: number;
    onLayoutChange?: (layout: Layout[]) => void;
    onDragStop?: (layout: Layout[], oldItem: Layout, newItem: Layout) => void;
    onResizeStop?: (layout: Layout[], oldItem: Layout, newItem: Layout) => void;
    className?: string;
    style?: React.CSSProperties;
    draggableHandle?: string;
    children?: React.ReactNode;
    isDraggable?: boolean;
    isResizable?: boolean;
    compactType?: 'vertical' | 'horizontal' | null;
    preventCollision?: boolean;
    margin?: [number, number];
    containerPadding?: [number, number] | null;
  }

  export default class ResponsiveGridLayout extends React.Component<GridLayoutProps> {
    constructor(props: GridLayoutProps);
  }

  export { WidthProvider } from 'react-grid-layout';
}
