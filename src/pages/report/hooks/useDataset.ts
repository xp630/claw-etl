/**
 * 数据集 Hook
 * 提供数据集的 CRUD 操作和 SQL 执行功能
 */

import { useState, useCallback } from 'react';
import { datasetApi } from '../services/reportApi';
import type { ChartDataset } from '../types/report';
import type { SqlExecuteResult } from '../services/reportApi';

export interface SqlExecuteRequest {
  datasetId?: string;
  sql?: string;
  datasourceId?: string;
  params?: Record<string, unknown>;
}

export interface UseDatasetReturn {
  // 数据集列表
  datasets: ChartDataset[];
  total: number;
  loading: boolean;
  error: string | null;
  
  // 分页参数
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  
  // 数据集操作
  fetchDatasets: (params?: { keyword?: string }) => Promise<void>;
  getDataset: (id: string) => Promise<ChartDataset | null>;
  createDataset: (data: Partial<ChartDataset>) => Promise<ChartDataset>;
  updateDataset: (id: string, data: Partial<ChartDataset>) => Promise<ChartDataset>;
  deleteDataset: (id: string) => Promise<void>;
  
  // SQL 执行
  executeSql: (request: SqlExecuteRequest) => Promise<SqlExecuteResult>;
  previewSql: (request: SqlExecuteRequest) => Promise<SqlExecuteResult>;
  
  // 重置
  reset: () => void;
}

export function useDataset(): UseDatasetReturn {
  // 数据集列表状态
  const [datasets, setDatasets] = useState<ChartDataset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 分页状态
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 获取数据集列表
  const fetchDatasets = useCallback(async (params?: { keyword?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await datasetApi.list({
        page,
        pageSize,
        keyword: params?.keyword,
      });
      setDatasets(response.list || []);
      setTotal(response.total || 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取数据集列表失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  // 获取单个数据集
  const getDataset = useCallback(async (id: string): Promise<ChartDataset | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await datasetApi.get(id);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取数据集详情失败';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // 创建数据集
  const createDataset = useCallback(async (data: Partial<ChartDataset>): Promise<ChartDataset> => {
    setLoading(true);
    setError(null);
    try {
      const response = await datasetApi.create(data);
      await fetchDatasets();
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建数据集失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchDatasets]);

  // 更新数据集
  const updateDataset = useCallback(async (id: string, data: Partial<ChartDataset>): Promise<ChartDataset> => {
    setLoading(true);
    setError(null);
    try {
      const response = await datasetApi.update(id, data);
      await fetchDatasets();
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新数据集失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchDatasets]);

  // 删除数据集
  const deleteDataset = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await datasetApi.delete(id);
      await fetchDatasets();
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除数据集失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchDatasets]);

  // 执行 SQL
  const executeSql = useCallback(async (request: SqlExecuteRequest): Promise<SqlExecuteResult> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/report/datasets/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      const result = await response.json();
      if (result.code !== 0) {
        throw new Error(result.message || 'SQL执行失败');
      }
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'SQL执行失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 预览 SQL
  const previewSql = useCallback(async (request: SqlExecuteRequest): Promise<SqlExecuteResult> => {
    return executeSql(request);
  }, [executeSql]);

  // 重置状态
  const reset = useCallback(() => {
    setDatasets([]);
    setTotal(0);
    setLoading(false);
    setError(null);
    setPage(1);
    setPageSize(10);
  }, []);

  return {
    datasets,
    total,
    loading,
    error,
    page,
    pageSize,
    setPage,
    setPageSize,
    fetchDatasets,
    getDataset,
    createDataset,
    updateDataset,
    deleteDataset,
    executeSql,
    previewSql,
    reset,
  };
}

export default useDataset;
