/**
 * 仪表盘 Hook
 * 提供仪表盘的 CRUD 操作和图表/筛选器布局管理功能
 */

import { useState, useCallback, useRef } from 'react';
import { dashboardApi } from '../services/reportApi';
import type { DashboardConfig, ChartConfig, FilterConfig } from '../types/report';

export interface UseDashboardReturn {
  // 仪表盘列表
  dashboards: DashboardConfig[];
  total: number;
  loading: boolean;
  error: string | null;
  
  // 当前编辑的仪表盘
  currentDashboard: DashboardConfig | null;
  
  // 分页参数
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  
  // 仪表盘操作
  fetchDashboards: (params?: { keyword?: string }) => Promise<void>;
  getDashboard: (id: string) => Promise<DashboardConfig | null>;
  createDashboard: (data: Partial<DashboardConfig>) => Promise<DashboardConfig>;
  updateDashboard: (id: string, data: Partial<DashboardConfig>) => Promise<DashboardConfig>;
  deleteDashboard: (id: string) => Promise<void>;
  
  // 图表布局管理
  addChart: (chart: ChartConfig) => void;
  removeChart: (chartId: string) => void;
  updateChart: (chartId: string, updates: Partial<ChartConfig>) => void;
  updateLayout: (chartId: string, layout: { x: number; y: number; w: number; h: number }) => void;
  
  // 筛选器布局管理
  addFilter: (filter: FilterConfig) => void;
  removeFilter: (filterId: string) => void;
  updateFilter: (filterId: string, updates: Partial<FilterConfig>) => void;
  
  // 设置当前仪表盘
  setCurrentDashboard: (dashboard: DashboardConfig | null | ((prev: DashboardConfig | null) => DashboardConfig | null)) => void;
  
  // 重置
  reset: () => void;
}

export function useDashboard(): UseDashboardReturn {
  // 仪表盘列表状态
  const [dashboards, setDashboards] = useState<DashboardConfig[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 当前编辑的仪表盘
  const [currentDashboard, setCurrentDashboard] = useState<DashboardConfig | null>(null);
  
  // Use ref to avoid stale closure in callbacks
  const currentDashboardRef = useRef<DashboardConfig | null>(null);
  
  // Keep ref in sync with state
  const setCurrentDashboardWithRef = useCallback((dashboard: DashboardConfig | null | ((prev: DashboardConfig | null) => DashboardConfig | null)) => {
    if (typeof dashboard === 'function') {
      const updater = dashboard as (prev: DashboardConfig | null) => DashboardConfig | null;
      setCurrentDashboard(prev => {
        const newValue = updater(prev);
        currentDashboardRef.current = newValue;
        return newValue;
      });
    } else {
      currentDashboardRef.current = dashboard;
      setCurrentDashboard(dashboard ? { ...dashboard, charts: dashboard.charts || [], filters: dashboard.filters || [] } : dashboard);
    }
  }, []);
  
  // 分页状态
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 获取仪表盘列表
  const fetchDashboards = useCallback(async (params?: { keyword?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardApi.list({
        page,
        pageSize,
        keyword: params?.keyword,
      });
      setDashboards(response.list);
      setTotal(response.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取仪表盘列表失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  // 获取单个仪表盘
  const getDashboard = useCallback(async (id: string): Promise<DashboardConfig | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardApi.get(id);
      setCurrentDashboardWithRef(response);
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取仪表盘详情失败';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setCurrentDashboardWithRef]);

  // 创建仪表盘
  const createDashboard = useCallback(async (data: Partial<DashboardConfig>): Promise<DashboardConfig> => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardApi.create(data);
      // 不再调用 fetchDashboards，避免干扰 currentDashboard 状态
      // 列表页下次访问时会自动刷新
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建仪表盘失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 更新仪表盘
  const updateDashboard = useCallback(async (id: string, data: Partial<DashboardConfig>): Promise<DashboardConfig> => {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardApi.update(id, data);
      await fetchDashboards();
      // Use ref to avoid stale closure
      if (currentDashboardRef.current?.id === id) {
        setCurrentDashboardWithRef(response);
      }
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新仪表盘失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchDashboards, setCurrentDashboardWithRef]);

  // 删除仪表盘
  const deleteDashboard = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await dashboardApi.delete(id);
      await fetchDashboards();
      // Use ref to avoid stale closure
      if (currentDashboardRef.current?.id === id) {
        setCurrentDashboardWithRef(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除仪表盘失败';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchDashboards, setCurrentDashboardWithRef]);

  // 添加图表
  const addChart = useCallback((chart: ChartConfig) => {
    setCurrentDashboardWithRef(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        charts: [...(prev.charts || []), chart],
      };
    });
  }, [setCurrentDashboardWithRef]);

  // 删除图表
  const removeChart = useCallback((chartId: string) => {
    setCurrentDashboardWithRef(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        charts: (prev.charts || []).filter(c => c.id !== chartId),
      };
    });
  }, [setCurrentDashboardWithRef]);

  // 更新图表
  const updateChart = useCallback((chartId: string, updates: Partial<ChartConfig>) => {
    setCurrentDashboardWithRef(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        charts: (prev.charts || []).map(c => 
          c.id === chartId ? { ...c, ...updates } : c
        ),
      };
    });
  }, [setCurrentDashboardWithRef]);

  // 更新图表布局
  const updateLayout = useCallback((
    chartId: string, 
    layout: { x: number; y: number; w: number; h: number }
  ) => {
    setCurrentDashboardWithRef(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        charts: (prev.charts || []).map(c => 
          c.id === chartId ? { ...c, gridLayout: layout } : c
        ),
      };
    });
  }, [setCurrentDashboardWithRef]);

  // 添加筛选器
  const addFilter = useCallback((filter: FilterConfig) => {
    setCurrentDashboardWithRef(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        filters: [...(prev.filters || []), filter],
      };
    });
  }, [setCurrentDashboardWithRef]);

  // 删除筛选器
  const removeFilter = useCallback((filterId: string) => {
    setCurrentDashboardWithRef(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        filters: (prev.filters || []).filter(f => f.id !== filterId),
      };
    });
  }, [setCurrentDashboardWithRef]);

  // 更新筛选器
  const updateFilter = useCallback((filterId: string, updates: Partial<FilterConfig>) => {
    setCurrentDashboardWithRef(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        filters: (prev.filters || []).map(f => 
          f.id === filterId ? { ...f, ...updates } : f
        ),
      };
    });
  }, [setCurrentDashboardWithRef]);

  // 重置状态
  const reset = useCallback(() => {
    setDashboards([]);
    setTotal(0);
    setLoading(false);
    setError(null);
    setCurrentDashboardWithRef(null);
    setPage(1);
    setPageSize(10);
  }, [setCurrentDashboardWithRef]);

  return {
    dashboards,
    total,
    loading,
    error,
    currentDashboard,
    page,
    pageSize,
    setPage,
    setPageSize,
    fetchDashboards,
    getDashboard,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    addChart,
    removeChart,
    updateChart,
    updateLayout,
    addFilter,
    removeFilter,
    updateFilter,
    setCurrentDashboard: setCurrentDashboardWithRef,
    reset,
  };
}

export default useDashboard;
