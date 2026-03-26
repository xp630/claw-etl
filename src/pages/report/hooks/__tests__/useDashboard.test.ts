import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDashboard } from '../useDashboard';

// Mutable mock state
let mockDashboardList = [
  { id: '1', name: 'Dashboard 1', charts: [], filters: [] },
];
let mockCurrentDashboard = { id: '1', name: 'Dashboard 1', charts: [], filters: [] };

vi.mock('../../services/reportApi', () => ({
  dashboardApi: {
    list: vi.fn().mockImplementation(() => Promise.resolve({
      list: [...mockDashboardList],
      total: mockDashboardList.length,
    })),
    get: vi.fn().mockImplementation(() => Promise.resolve({ ...mockCurrentDashboard })),
    create: vi.fn().mockImplementation((data) => {
      const newDashboard = { id: '2', name: data.name || 'New', charts: [], filters: [] };
      mockDashboardList = [...mockDashboardList, newDashboard];
      return Promise.resolve(newDashboard);
    }),
    update: vi.fn().mockImplementation((id, data) => {
      mockCurrentDashboard = { ...mockCurrentDashboard, ...data, id };
      mockDashboardList = mockDashboardList.map(d => d.id === id ? { ...d, ...data } : d);
      return Promise.resolve(mockCurrentDashboard);
    }),
    delete: vi.fn().mockImplementation((id) => {
      mockDashboardList = mockDashboardList.filter(d => d.id !== id);
      return Promise.resolve();
    }),
  },
}));

describe('useDashboard', () => {
  beforeEach(() => {
    mockDashboardList = [
      { id: '1', name: 'Dashboard 1', charts: [], filters: [] },
    ];
    mockCurrentDashboard = { id: '1', name: 'Dashboard 1', charts: [], filters: [] };
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have empty dashboards array initially', () => {
      const { result } = renderHook(() => useDashboard());
      expect(result.current.dashboards).toEqual([]);
    });

    it('should have loading false initially', () => {
      const { result } = renderHook(() => useDashboard());
      expect(result.current.loading).toBe(false);
    });

    it('should have error null initially', () => {
      const { result } = renderHook(() => useDashboard());
      expect(result.current.error).toBeNull();
    });

    it('should have page 1 and pageSize 10 by default', () => {
      const { result } = renderHook(() => useDashboard());
      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(10);
    });
  });

  describe('fetchDashboards', () => {
    it('should fetch dashboards and update state', async () => {
      const { result } = renderHook(() => useDashboard());
      
      await act(async () => {
        await result.current.fetchDashboards();
      });

      expect(result.current.dashboards.length).toBe(1);
      expect(result.current.dashboards[0].name).toBe('Dashboard 1');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('getDashboard', () => {
    it('should get dashboard and set as current', async () => {
      const { result } = renderHook(() => useDashboard());
      
      await act(async () => {
        await result.current.getDashboard('1');
      });

      expect(result.current.currentDashboard).toEqual({
        id: '1',
        name: 'Dashboard 1',
        charts: [],
        filters: [],
      });
    });
  });

  describe('createDashboard', () => {
    it('should create a new dashboard', async () => {
      const { result } = renderHook(() => useDashboard());
      
      await act(async () => {
        await result.current.createDashboard({ name: 'New Dashboard' });
      });

      expect(result.current.dashboards.length).toBe(2);
    });
  });

  describe('updateDashboard', () => {
    it('should update an existing dashboard', async () => {
      const { result } = renderHook(() => useDashboard());
      
      // First set current dashboard
      await act(async () => {
        result.current.setCurrentDashboard({
          id: '1',
          name: 'Dashboard 1',
          charts: [],
          filters: [],
        });
        await result.current.updateDashboard('1', { name: 'Updated Dashboard' });
      });

      expect(result.current.currentDashboard?.name).toBe('Updated Dashboard');
    });
  });

  describe('deleteDashboard', () => {
    it('should delete a dashboard', async () => {
      const { result } = renderHook(() => useDashboard());
      
      await act(async () => {
        await result.current.deleteDashboard('1');
      });

      expect(result.current.dashboards.length).toBe(0);
    });
  });

  describe('addChart', () => {
    it('should add a chart to current dashboard', async () => {
      const { result } = renderHook(() => useDashboard());
      
      await act(async () => {
        result.current.setCurrentDashboard({
          id: '1',
          name: 'Dashboard 1',
          charts: [],
          filters: [],
        });
        result.current.addChart({
          id: 'chart-1',
          type: 'line',
          title: 'Test Chart',
          datasetId: 'ds-1',
        });
      });

      expect(result.current.currentDashboard?.charts.length).toBe(1);
    });
  });

  describe('removeChart', () => {
    it('should remove a chart from current dashboard', async () => {
      const { result } = renderHook(() => useDashboard());
      
      await act(async () => {
        result.current.setCurrentDashboard({
          id: '1',
          name: 'Dashboard 1',
          charts: [{
            id: 'chart-1',
            type: 'line',
            title: 'Test Chart',
            datasetId: 'ds-1',
          }],
          filters: [],
        });
        result.current.removeChart('chart-1');
      });

      expect(result.current.currentDashboard?.charts.length).toBe(0);
    });
  });

  describe('updateLayout', () => {
    it('should update chart layout in current dashboard', async () => {
      const { result } = renderHook(() => useDashboard());
      
      await act(async () => {
        result.current.setCurrentDashboard({
          id: '1',
          name: 'Dashboard 1',
          charts: [{
            id: 'chart-1',
            type: 'line',
            title: 'Test Chart',
            datasetId: 'ds-1',
            gridLayout: { x: 0, y: 0, w: 6, h: 4 },
          }],
          filters: [],
        });
        result.current.updateLayout('chart-1', { x: 2, y: 0, w: 8, h: 6 });
      });

      const chart = result.current.currentDashboard?.charts[0];
      expect(chart?.gridLayout).toEqual({ x: 2, y: 0, w: 8, h: 6 });
    });
  });

  describe('addFilter', () => {
    it('should add a filter to current dashboard', async () => {
      const { result } = renderHook(() => useDashboard());
      
      await act(async () => {
        result.current.setCurrentDashboard({
          id: '1',
          name: 'Dashboard 1',
          charts: [],
          filters: [],
        });
        result.current.addFilter({
          id: 'filter-1',
          field: 'date',
          label: '日期范围',
          type: 'dateRange',
        });
      });

      expect(result.current.currentDashboard?.filters.length).toBe(1);
    });
  });

  describe('removeFilter', () => {
    it('should remove a filter from current dashboard', async () => {
      const { result } = renderHook(() => useDashboard());
      
      await act(async () => {
        result.current.setCurrentDashboard({
          id: '1',
          name: 'Dashboard 1',
          charts: [],
          filters: [{
            id: 'filter-1',
            field: 'date',
            label: '日期范围',
            type: 'dateRange',
          }],
        });
        result.current.removeFilter('filter-1');
      });

      expect(result.current.currentDashboard?.filters.length).toBe(0);
    });
  });

  describe('pagination', () => {
    it('should update page', async () => {
      const { result } = renderHook(() => useDashboard());
      
      await act(async () => {
        result.current.setPage(2);
      });

      expect(result.current.page).toBe(2);
    });

    it('should update pageSize', async () => {
      const { result } = renderHook(() => useDashboard());
      
      await act(async () => {
        result.current.setPageSize(20);
      });

      expect(result.current.pageSize).toBe(20);
    });
  });

  describe('reset', () => {
    it('should reset state to initial values', async () => {
      const { result } = renderHook(() => useDashboard());
      
      await act(async () => {
        await result.current.fetchDashboards();
        result.current.setPage(2);
        result.current.setPageSize(20);
        result.current.reset();
      });

      expect(result.current.dashboards).toEqual([]);
      expect(result.current.page).toBe(1);
      expect(result.current.pageSize).toBe(10);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
