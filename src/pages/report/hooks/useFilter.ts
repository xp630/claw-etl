/**
 * 筛选器 Hook
 * 提供筛选器的状态管理和值操作功能
 */

import { useState, useCallback, useRef } from 'react';
import type { FilterConfig } from '../types/report';

export interface ActiveFilter {
  filterId: string;
  field: string;
  value: unknown;
}

export interface UseFilterReturn {
  // 筛选器列表
  filters: FilterConfig[];
  
  // 筛选器值
  filterValues: Record<string, unknown>;
  
  // 设置筛选器列表
  setFilters: (filters: FilterConfig[]) => void;
  
  // 添加筛选器
  addFilter: (filter: FilterConfig) => void;
  
  // 删除筛选器
  removeFilter: (filterId: string) => void;
  
  // 更新筛选器
  updateFilter: (filterId: string, updates: Partial<FilterConfig>) => void;
  
  // 更新筛选器值
  updateFilterValue: (filterId: string, value: unknown) => void;
  
  // 清空所有筛选器值
  clearFilterValues: () => void;
  
  // 获取有值的筛选器
  getActiveFilters: () => ActiveFilter[];
  
  // 重置
  reset: () => void;
}

export function useFilter(): UseFilterReturn {
  // 筛选器列表
  const [filters, setFiltersList] = useState<FilterConfig[]>([]);
  
  // 筛选器值
  const [filterValues, setFilterValues] = useState<Record<string, unknown>>({});
  
  // Use ref to avoid stale closure
  const filtersRef = useRef<FilterConfig[]>([]);
  
  // Keep ref in sync
  const setFiltersListWithRef = useCallback((filters: FilterConfig[] | ((prev: FilterConfig[]) => FilterConfig[])) => {
    if (typeof filters === 'function') {
      setFiltersList(prev => {
        const newFilters = filters(prev);
        filtersRef.current = newFilters;
        return newFilters;
      });
    } else {
      filtersRef.current = filters;
      setFiltersList(filters);
    }
  }, []);

  // 设置筛选器列表
  const setFilters = useCallback((newFilters: FilterConfig[]) => {
    const filters = newFilters || [];
    setFiltersListWithRef(filters);
    // 设置默认值
    const defaultValues: Record<string, unknown> = {};
    filters.forEach(filter => {
      if (filter.defaultValue !== undefined) {
        defaultValues[filter.id] = filter.defaultValue;
      }
    });
    setFilterValues(defaultValues);
  }, [setFiltersListWithRef]);

  // 添加筛选器
  const addFilter = useCallback((filter: FilterConfig) => {
    setFiltersListWithRef(prev => [...prev, filter]);
    // 如果有默认值，设置它
    if (filter.defaultValue !== undefined) {
      setFilterValues(prev => ({
        ...prev,
        [filter.id]: filter.defaultValue,
      }));
    }
  }, [setFiltersListWithRef]);

  // 删除筛选器
  const removeFilter = useCallback((filterId: string) => {
    setFiltersListWithRef(prev => prev.filter(f => f.id !== filterId));
    setFilterValues(prev => {
      const newValues = { ...prev };
      delete newValues[filterId];
      return newValues;
    });
  }, [setFiltersListWithRef]);

  // 更新筛选器
  const updateFilter = useCallback((filterId: string, updates: Partial<FilterConfig>) => {
    setFiltersListWithRef(prev => prev.map(f => 
      f.id === filterId ? { ...f, ...updates } : f
    ));
  }, [setFiltersListWithRef]);

  // 更新筛选器值
  const updateFilterValue = useCallback((filterId: string, value: unknown) => {
    setFilterValues(prev => ({
      ...prev,
      [filterId]: value,
    }));
  }, []);

  // 清空所有筛选器值 - use ref to get current filters
  const clearFilterValues = useCallback(() => {
    setFilterValues(() => {
      const defaultValues: Record<string, unknown> = {};
      filtersRef.current.forEach(filter => {
        if (filter.defaultValue !== undefined) {
          defaultValues[filter.id] = filter.defaultValue;
        }
      });
      return defaultValues;
    });
  }, []);

  // 获取有值的筛选器
  const getActiveFilters = useCallback((): ActiveFilter[] => {
    const activeFilters: ActiveFilter[] = [];
    
    filtersRef.current.forEach(filter => {
      const value = filterValues[filter.id];
      // 判断是否有值
      const hasValue = value !== undefined && 
        value !== '' && 
        value !== null &&
        (Array.isArray(value) ? value.length > 0 : true);
      
      if (hasValue) {
        activeFilters.push({
          filterId: filter.id,
          field: filter.field,
          value,
        });
      }
    });
    
    return activeFilters;
  }, [filterValues]);

  // 重置
  const reset = useCallback(() => {
    setFiltersListWithRef([]);
    setFilterValues({});
  }, [setFiltersListWithRef]);

  return {
    filters,
    filterValues,
    setFilters,
    addFilter,
    removeFilter,
    updateFilter,
    updateFilterValue,
    clearFilterValues,
    getActiveFilters,
    reset,
  };
}

export default useFilter;
