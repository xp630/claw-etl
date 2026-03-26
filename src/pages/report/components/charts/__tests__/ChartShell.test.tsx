import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ChartShell } from '../../ChartShell';

const mockData = [
  { name: 'Alice', value: 100 },
  { name: 'Bob', value: 200 },
];

describe('ChartShell 组件', () => {
  describe('加载状态', () => {
    it('loading=true 时应该显示加载指示器', () => {
      render(<ChartShell loading={true} data={mockData} title="测试图表" />);
      expect(document.querySelector('.ant-spin')).toBeInTheDocument();
    });

    it('loading=false 时不应显示加载指示器', () => {
      render(<ChartShell loading={false} data={mockData} title="测试图表" />);
      expect(document.querySelector('.ant-spin')).not.toBeInTheDocument();
    });
  });

  describe('错误状态', () => {
    it('有错误时应显示错误信息', () => {
      const errorMessage = '数据加载失败';
      render(<ChartShell error={errorMessage} title="测试图表" />);
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    it('无错误时不应显示错误信息', () => {
      render(<ChartShell data={mockData} title="测试图表" />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('空数据状态', () => {
    it('数据为空时应显示空状态提示', () => {
      render(<ChartShell data={[]} title="测试图表" />);
      expect(screen.getByText(/暂无数据/i)).toBeInTheDocument();
    });
  });

  describe('标题渲染', () => {
    it('应该正确显示图表标题', () => {
      render(<ChartShell data={mockData} title="销售报表" />);
      expect(screen.getByText('销售报表')).toBeInTheDocument();
    });
  });

  describe('children 渲染', () => {
    it('应该渲染 children', () => {
      render(
        <ChartShell data={mockData} title="测试">
          <div data-testid="child-content">子组件内容</div>
        </ChartShell>
      );
      expect(screen.getByTestId('child-content')).toBeInTheDocument();
    });

    it('应该渲染多个 children', () => {
      render(
        <ChartShell data={mockData} title="测试">
          <div data-testid="child-1">子组件1</div>
          <div data-testid="child-2">子组件2</div>
        </ChartShell>
      );
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });
});
