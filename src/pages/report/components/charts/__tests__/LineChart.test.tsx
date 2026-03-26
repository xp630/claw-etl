import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { LineChart } from '../LineChart';

// Mock echarts-for-react
vi.mock('echarts-for-react', () => ({
  __esModule: true,
  default: ({ option, style }: { option: unknown; style?: React.CSSProperties }) => (
    <div data-testid="echarts" style={style}>
      <span data-testid="echarts-option">{JSON.stringify(option)}</span>
    </div>
  ),
}));

const mockLineData = {
  xAxis: ['1月', '2月', '3月', '4月'],
  series: [
    { name: '销售额', data: [120, 200, 150, 80] },
    { name: '利润', data: [50, 100, 70, 40] },
  ],
};

describe('LineChart 组件', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('应该正确渲染图表', () => {
      render(<LineChart data={mockLineData} title="销售趋势" />);
      expect(screen.getByTestId('echarts')).toBeInTheDocument();
    });

    it('应该显示图表标题', () => {
      render(<LineChart data={mockLineData} title="销售趋势" />);
      expect(screen.getByText('销售趋势')).toBeInTheDocument();
    });
  });

  describe('数据转换', () => {
    it('应该正确转换 xAxis 数据', () => {
      render(<LineChart data={mockLineData} />);
      const option = JSON.parse(screen.getByTestId('echarts-option').textContent || '{}');
      expect(option.xAxis.data).toEqual(['1月', '2月', '3月', '4月']);
    });

    it('应该正确转换 series 数据', () => {
      render(<LineChart data={mockLineData} />);
      const option = JSON.parse(screen.getByTestId('echarts-option').textContent || '{}');
      expect(option.series).toHaveLength(2);
      expect(option.series[0].name).toBe('销售额');
      expect(option.series[0].data).toEqual([120, 200, 150, 80]);
    });
  });

  describe('loading 状态', () => {
    it('loading=true 时显示加载状态', () => {
      render(<LineChart data={mockLineData} loading={true} />);
      expect(document.querySelector('.ant-spin')).toBeInTheDocument();
    });
  });

  describe('空数据状态', () => {
    it('空数据时显示空状态', () => {
      render(<LineChart data={{ xAxis: [], series: [] }} title="空图表" />);
      expect(screen.getByText(/暂无数据/i)).toBeInTheDocument();
    });
  });

  describe('样式配置', () => {
    it('应该应用正确的默认高度', () => {
      render(<LineChart data={mockLineData} />);
      expect(screen.getByTestId('echarts').style.height).toBe('300px');
    });

    it('应该允许自定义高度', () => {
      render(<LineChart data={mockLineData} height={400} />);
      expect(screen.getByTestId('echarts').style.height).toBe('400px');
    });
  });
});
