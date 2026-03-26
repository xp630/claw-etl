import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { PieChart } from '../PieChart';

// Mock echarts-for-react
vi.mock('echarts-for-react', () => ({
  __esModule: true,
  default: ({ option, style }: { option: unknown; style?: React.CSSProperties }) => (
    <div data-testid="echarts" style={style}>
      <span data-testid="echarts-option">{JSON.stringify(option)}</span>
    </div>
  ),
}));

const mockPieData = {
  series: [
    { name: '直接访问', value: 335 },
    { name: '邮件营销', value: 310 },
    { name: '联盟广告', value: 234 },
    { name: '视频广告', value: 135 },
    { name: '搜索引擎', value: 1548 },
  ],
};

describe('PieChart 组件', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('应该正确渲染图表', () => {
      render(<PieChart data={mockPieData} title="流量来源" />);
      expect(screen.getByTestId('echarts')).toBeInTheDocument();
    });

    it('应该显示图表标题', () => {
      render(<PieChart data={mockPieData} title="流量来源" />);
      expect(screen.getByText('流量来源')).toBeInTheDocument();
    });
  });

  describe('数据转换', () => {
    it('应该正确转换 series 数据', () => {
      render(<PieChart data={mockPieData} />);
      const option = JSON.parse(screen.getByTestId('echarts-option').textContent || '{}');
      expect(option.series).toHaveLength(1);
      expect(option.series[0].type).toBe('pie');
      expect(option.series[0].radius).toBe('50%');
    });

    it('应该包含正确的饼图数据', () => {
      render(<PieChart data={mockPieData} />);
      const option = JSON.parse(screen.getByTestId('echarts-option').textContent || '{}');
      expect(option.series[0].data).toEqual([
        { name: '直接访问', value: 335 },
        { name: '邮件营销', value: 310 },
        { name: '联盟广告', value: 234 },
        { name: '视频广告', value: 135 },
        { name: '搜索引擎', value: 1548 },
      ]);
    });
  });

  describe('loading 状态', () => {
    it('loading=true 时显示加载状态', () => {
      render(<PieChart data={mockPieData} loading={true} />);
      expect(document.querySelector('.ant-spin')).toBeInTheDocument();
    });
  });

  describe('空数据状态', () => {
    it('空数据时显示空状态', () => {
      render(<PieChart data={{ series: [] }} title="空图表" />);
      expect(screen.getByText(/暂无数据/i)).toBeInTheDocument();
    });
  });

  describe('样式配置', () => {
    it('应该应用正确的默认高度', () => {
      render(<PieChart data={mockPieData} />);
      expect(screen.getByTestId('echarts').style.height).toBe('300px');
    });

    it('应该允许自定义高度', () => {
      render(<PieChart data={mockPieData} height={400} />);
      expect(screen.getByTestId('echarts').style.height).toBe('400px');
    });
  });

  describe('饼图类型', () => {
    it('默认应该是饼图类型', () => {
      render(<PieChart data={mockPieData} />);
      const option = JSON.parse(screen.getByTestId('echarts-option').textContent || '{}');
      expect(option.series[0].type).toBe('pie');
    });
  });
});
