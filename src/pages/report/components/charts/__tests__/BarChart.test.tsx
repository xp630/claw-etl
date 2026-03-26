import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BarChart } from '../BarChart';

// Mock echarts-for-react
vi.mock('echarts-for-react', () => ({
  __esModule: true,
  default: ({ option, style }: { option: unknown; style?: React.CSSProperties }) => (
    <div data-testid="echarts" style={style}>
      <span data-testid="echarts-option">{JSON.stringify(option)}</span>
    </div>
  ),
}));

const mockBarData = {
  xAxis: ['北京', '上海', '广州', '深圳'],
  series: [
    { name: '销售额', data: [1200, 2000, 1500, 800] },
  ],
};

describe('BarChart 组件', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('应该正确渲染图表', () => {
      render(<BarChart data={mockBarData} title="区域销售" />);
      expect(screen.getByTestId('echarts')).toBeInTheDocument();
    });

    it('应该显示图表标题', () => {
      render(<BarChart data={mockBarData} title="区域销售" />);
      expect(screen.getByText('区域销售')).toBeInTheDocument();
    });
  });

  describe('数据转换', () => {
    it('应该正确转换 xAxis 数据', () => {
      render(<BarChart data={mockBarData} />);
      const option = JSON.parse(screen.getByTestId('echarts-option').textContent || '{}');
      expect(option.xAxis.data).toEqual(['北京', '上海', '广州', '深圳']);
    });

    it('应该正确转换 series 数据', () => {
      render(<BarChart data={mockBarData} />);
      const option = JSON.parse(screen.getByTestId('echarts-option').textContent || '{}');
      expect(option.series).toHaveLength(1);
      expect(option.series[0].name).toBe('销售额');
      expect(option.series[0].data).toEqual([1200, 2000, 1500, 800]);
    });

    it('应该配置为柱状图类型', () => {
      render(<BarChart data={mockBarData} />);
      const option = JSON.parse(screen.getByTestId('echarts-option').textContent || '{}');
      expect(option.series[0].type).toBe('bar');
    });
  });

  describe('loading 状态', () => {
    it('loading=true 时显示加载状态', () => {
      render(<BarChart data={mockBarData} loading={true} />);
      expect(document.querySelector('.ant-spin')).toBeInTheDocument();
    });
  });

  describe('空数据状态', () => {
    it('空数据时显示空状态', () => {
      render(<BarChart data={{ xAxis: [], series: [] }} title="空图表" />);
      expect(screen.getByText(/暂无数据/i)).toBeInTheDocument();
    });
  });

  describe('样式配置', () => {
    it('应该应用正确的默认高度', () => {
      render(<BarChart data={mockBarData} />);
      expect(screen.getByTestId('echarts').style.height).toBe('300px');
    });

    it('应该允许自定义高度', () => {
      render(<BarChart data={mockBarData} height={400} />);
      expect(screen.getByTestId('echarts').style.height).toBe('400px');
    });
  });
});
