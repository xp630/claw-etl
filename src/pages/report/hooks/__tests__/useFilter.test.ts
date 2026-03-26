import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilter } from '../useFilter';
import type { FilterConfig } from '../../types/report';

describe('useFilter', () => {
  describe('initial state', () => {
    it('should have empty filters array initially', () => {
      const { result } = renderHook(() => useFilter());
      expect(result.current.filters).toEqual([]);
    });

    it('should have empty filterValues object initially', () => {
      const { result } = renderHook(() => useFilter());
      expect(result.current.filterValues).toEqual({});
    });
  });

  describe('addFilter', () => {
    it('should add a filter to the list', () => {
      const { result } = renderHook(() => useFilter());
      
      const filter: FilterConfig = {
        id: 'filter-1',
        field: 'status',
        label: '状态',
        type: 'select',
        options: [
          { label: '启用', value: '1' },
          { label: '禁用', value: '0' },
        ],
        defaultValue: '1',
      };

      act(() => {
        result.current.addFilter(filter);
      });

      expect(result.current.filters.length).toBe(1);
      expect(result.current.filters[0]).toEqual(filter);
    });

    it('should set default value when adding filter', () => {
      const { result } = renderHook(() => useFilter());
      
      const filter: FilterConfig = {
        id: 'filter-1',
        field: 'status',
        label: '状态',
        type: 'select',
        options: [
          { label: '启用', value: '1' },
          { label: '禁用', value: '0' },
        ],
        defaultValue: '1',
      };

      act(() => {
        result.current.addFilter(filter);
      });

      expect(result.current.filterValues).toEqual({ 'filter-1': '1' });
    });
  });

  describe('removeFilter', () => {
    it('should remove a filter from the list', () => {
      const { result } = renderHook(() => useFilter());
      
      const filter: FilterConfig = {
        id: 'filter-1',
        field: 'status',
        label: '状态',
        type: 'select',
      };

      act(() => {
        result.current.addFilter(filter);
        result.current.removeFilter('filter-1');
      });

      expect(result.current.filters.length).toBe(0);
    });

    it('should remove filter value when removing filter', () => {
      const { result } = renderHook(() => useFilter());
      
      const filter: FilterConfig = {
        id: 'filter-1',
        field: 'status',
        label: '状态',
        type: 'select',
        defaultValue: '1',
      };

      act(() => {
        result.current.addFilter(filter);
        result.current.removeFilter('filter-1');
      });

      expect(result.current.filterValues).not.toHaveProperty('filter-1');
    });
  });

  describe('updateFilterValue', () => {
    it('should update filter value', () => {
      const { result } = renderHook(() => useFilter());
      
      const filter: FilterConfig = {
        id: 'filter-1',
        field: 'status',
        label: '状态',
        type: 'select',
        options: [
          { label: '启用', value: '1' },
          { label: '禁用', value: '0' },
        ],
      };

      act(() => {
        result.current.addFilter(filter);
        result.current.updateFilterValue('filter-1', '0');
      });

      expect(result.current.filterValues['filter-1']).toBe('0');
    });

    it('should update date range filter value', () => {
      const { result } = renderHook(() => useFilter());
      
      const filter: FilterConfig = {
        id: 'date-1',
        field: 'date',
        label: '日期范围',
        type: 'dateRange',
      };

      act(() => {
        result.current.addFilter(filter);
        result.current.updateFilterValue('date-1', ['2024-01-01', '2024-01-31']);
      });

      expect(result.current.filterValues['date-1']).toEqual(['2024-01-01', '2024-01-31']);
    });
  });

  describe('clearFilterValues', () => {
    it('should clear all filter values and reset to defaults', () => {
      const { result } = renderHook(() => useFilter());
      
      act(() => {
        result.current.addFilter({
          id: 'filter-1',
          field: 'status',
          label: '状态',
          type: 'select',
          defaultValue: '1',
        });
        result.current.addFilter({
          id: 'filter-2',
          field: 'date',
          label: '日期',
          type: 'dateRange',
        });
        result.current.updateFilterValue('filter-2', ['2024-01-01', '2024-01-31']);
        result.current.clearFilterValues();
      });

      // filter-1 has defaultValue '1', filter-2 has no defaultValue
      expect(result.current.filterValues).toEqual({ 'filter-1': '1' });
    });

    it('should reset to default values after clearing', () => {
      const { result } = renderHook(() => useFilter());
      
      act(() => {
        result.current.addFilter({
          id: 'filter-1',
          field: 'status',
          label: '状态',
          type: 'select',
          defaultValue: '1',
        });
        result.current.updateFilterValue('filter-1', '0');
        result.current.clearFilterValues();
      });

      expect(result.current.filterValues['filter-1']).toBe('1');
    });
  });

  describe('setFilters', () => {
    it('should replace all filters', () => {
      const { result } = renderHook(() => useFilter());
      
      const filters: FilterConfig[] = [
        {
          id: 'filter-1',
          field: 'status',
          label: '状态',
          type: 'select',
          defaultValue: '1',
        },
        {
          id: 'filter-2',
          field: 'date',
          label: '日期',
          type: 'dateRange',
        },
      ];

      act(() => {
        result.current.setFilters(filters);
      });

      expect(result.current.filters.length).toBe(2);
      expect(result.current.filterValues).toEqual({ 'filter-1': '1' });
    });
  });

  describe('getActiveFilters', () => {
    it('should return only filters with non-empty values', () => {
      const { result } = renderHook(() => useFilter());
      
      act(() => {
        result.current.addFilter({
          id: 'filter-1',
          field: 'status',
          label: '状态',
          type: 'select',
        });
        result.current.addFilter({
          id: 'filter-2',
          field: 'date',
          label: '日期',
          type: 'dateRange',
        });
        result.current.updateFilterValue('filter-1', '1');
      });

      const activeFilters = result.current.getActiveFilters();
      
      expect(activeFilters.length).toBe(1);
      expect(activeFilters[0].filterId).toBe('filter-1');
      expect(activeFilters[0].value).toBe('1');
    });

    it('should return empty array when no filters have values', () => {
      const { result } = renderHook(() => useFilter());
      
      act(() => {
        result.current.addFilter({
          id: 'filter-1',
          field: 'status',
          label: '状态',
          type: 'select',
        });
      });

      const activeFilters = result.current.getActiveFilters();
      
      expect(activeFilters.length).toBe(0);
    });
  });
});
