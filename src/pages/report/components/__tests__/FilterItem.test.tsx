import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilter } from '../../hooks/useFilter';
import type { FilterConfig } from '../../types/report';

// Test the FilterItem logic through useFilter hook
describe('FilterItem logic via useFilter', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('select type filter', () => {
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

    it('should have correct initial value from defaultValue', () => {
      const { result } = renderHook(() => useFilter());
      
      act(() => {
        result.current.addFilter(filter);
      });

      expect(result.current.filterValues['filter-1']).toBe('1');
    });

    it('should update value when onChange is called', () => {
      const { result } = renderHook(() => useFilter());
      
      act(() => {
        result.current.addFilter(filter);
        result.current.updateFilterValue('filter-1', '0');
      });

      expect(result.current.filterValues['filter-1']).toBe('0');
    });
  });

  describe('dateRange type filter', () => {
    const filter: FilterConfig = {
      id: 'date-1',
      field: 'date',
      label: '日期范围',
      type: 'dateRange',
    };

    it('should update with array value for date range', () => {
      const { result } = renderHook(() => useFilter());
      
      act(() => {
        result.current.addFilter(filter);
        result.current.updateFilterValue('date-1', ['2024-01-01', '2024-01-31']);
      });

      expect(result.current.filterValues['date-1']).toEqual(['2024-01-01', '2024-01-31']);
    });
  });

  describe('input type filter', () => {
    const filter: FilterConfig = {
      id: 'input-1',
      field: 'keyword',
      label: '关键词',
      type: 'input',
    };

    it('should update with string value', () => {
      const { result } = renderHook(() => useFilter());
      
      act(() => {
        result.current.addFilter(filter);
        result.current.updateFilterValue('input-1', 'test');
      });

      expect(result.current.filterValues['input-1']).toBe('test');
    });

    it('should clear value when empty string is set', () => {
      const { result } = renderHook(() => useFilter());
      
      act(() => {
        result.current.addFilter(filter);
        result.current.updateFilterValue('input-1', 'test');
        result.current.updateFilterValue('input-1', '');
      });

      expect(result.current.filterValues['input-1']).toBe('');
    });
  });
});
