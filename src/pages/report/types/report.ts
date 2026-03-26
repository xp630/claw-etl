/**
 * 报表系统类型定义
 */

// 数据集类型
export interface ChartDataset {
  id: string;
  name: string;
  datasourceId: string;
  sql: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// 过滤器配置
export interface FilterConfig {
  id: string;
  field: string;
  label: string;
  type: 'select' | 'dateRange' | 'input';
  options?: { label: string; value: string }[];
  defaultValue?: string | string[];
}

// 图表配置
export interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'table' | 'area';
  title: string;
  datasetId: string;
  xAxis?: string;
  yAxis?: string | string[];
  filters?: FilterConfig[];
  gridLayout?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

// 仪表盘配置
export interface DashboardConfig {
  id: string;
  name: string;
  description?: string;
  charts: ChartConfig[];
  filters: FilterConfig[];
  createdAt?: string;
  updatedAt?: string;
}

// API 响应类型
export interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
}

export interface PageResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
