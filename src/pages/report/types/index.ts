export interface SqlExecuteRequest {
  datasourceId: number;
  sql: string;
}

export interface SqlExecuteResult {
  columns: string[];
  rows: any[][];
}

export type { ChartDataset, FilterConfig, ChartConfig, DashboardConfig, ApiResponse, PageResponse } from './report';
