/**
 * 报表系统 API 服务
 */

import axios from 'axios';
import type {
  ChartDataset,
  DashboardConfig,
  ApiResponse,
  PageResponse,
} from '../types/report';

const BASE_URL = '/etl-admin/report';

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// SQL 执行请求类型
export interface SqlExecuteRequest {
  datasetId?: string;
  sql?: string;
  datasourceId?: string;
  params?: Record<string, unknown>;
}

// SQL 执行结果类型
export interface SqlExecuteResult {
  columns: string[];
  data: Record<string, unknown>[];
  total: number;
}

// 数据集 API
export const datasetApi = {
  /**
   * 获取数据集列表
   */
  list: async (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
  }): Promise<PageResponse<ChartDataset>> => {
    const response = await apiClient.post('/datasets/list', params);
    return { list: response.data.list || [], total: response.data.count || 0, page: response.data.page || 1, pageSize: response.data.limit || 10 };
  },

  /**
   * 获取数据集详情
   */
  get: async (id: string): Promise<ChartDataset> => {
    const response = await apiClient.get(`/datasets/${id}`);
    return response.data.data || response.data;
  },

  /**
   * 创建数据集
   */
  create: async (data: Partial<ChartDataset>): Promise<ChartDataset> => {
    const response = await apiClient.post('/datasets', data);
    return response.data.data || response.data;
  },

  /**
   * 更新数据集
   */
  update: async (id: string, data: Partial<ChartDataset>): Promise<ChartDataset> => {
    const response = await apiClient.put(`/datasets/${id}`, data);
    return response.data.data || response.data;
  },

  /**
   * 删除数据集
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/datasets/${id}`);
  },

  /**
   * 执行 SQL 查询
   */
  execute: async (request: SqlExecuteRequest): Promise<SqlExecuteResult> => {
    const response = await apiClient.post('/datasets/execute', request);
    return response.data.data || response.data;
  },

  /**
   * 预览 SQL 查询结果
   */
  preview: async (request: SqlExecuteRequest): Promise<SqlExecuteResult> => {
    const response = await apiClient.post('/datasets/preview', request);
    return response.data.data || response.data;
  },
};

// 仪表盘 API
export const dashboardApi = {
  /**
   * 获取仪表盘列表
   */
  list: async (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
  }): Promise<PageResponse<DashboardConfig>> => {
    const response = await apiClient.post('/dashboards/list', params);
    return { list: response.data.list || [], total: response.data.count || 0, page: response.data.page || 1, pageSize: response.data.limit || 10 };
  },

  /**
   * 获取仪表盘详情
   */
  get: async (id: string): Promise<DashboardConfig> => {
    const response = await apiClient.get(`/dashboards/${id}`);
    if (response.data.code !== 0) throw new Error(response.data.msg || '获取仪表盘失败');
    return response.data.data || response.data;
  },

  /**
   * 创建仪表盘
   */
  create: async (data: Partial<DashboardConfig>): Promise<DashboardConfig> => {
    const response = await apiClient.post('/dashboards', data);
    return response.data.data || response.data;
  },

  /**
   * 更新仪表盘
   */
  update: async (id: string, data: Partial<DashboardConfig>): Promise<DashboardConfig> => {
    const response = await apiClient.put(`/dashboards/${id}`, data);
    return response.data.data || response.data;
  },

  /**
   * 删除仪表盘
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/dashboards/${id}`);
  },
};

export default {
  dataset: datasetApi,
  dashboard: dashboardApi,
};
