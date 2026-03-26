import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { DataTable } from '../DataTable';

const mockTableData = {
  columns: [
    { key: 'name', title: '姓名' },
    { key: 'age', title: '年龄' },
    { key: 'address', title: '地址' },
  ],
  dataSource: [
    { id: '1', name: '张三', age: 25, address: '北京' },
    { id: '2', name: '李四', age: 30, address: '上海' },
    { id: '3', name: '王五', age: 28, address: '广州' },
  ],
};

describe('DataTable 组件', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('应该正确渲染表格', () => {
      render(<DataTable data={mockTableData} />);
      expect(document.querySelector('.ant-table')).toBeInTheDocument();
    });

    it('应该显示图表标题', () => {
      render(<DataTable data={mockTableData} title="用户列表" />);
      expect(screen.getByText('用户列表')).toBeInTheDocument();
    });
  });

  describe('列渲染', () => {
    it('应该正确渲染表头', () => {
      render(<DataTable data={mockTableData} />);
      expect(screen.getByText('姓名')).toBeInTheDocument();
      expect(screen.getByText('年龄')).toBeInTheDocument();
      expect(screen.getByText('地址')).toBeInTheDocument();
    });

    it('应该正确渲染数据行', () => {
      render(<DataTable data={mockTableData} />);
      expect(screen.getByText('张三')).toBeInTheDocument();
      expect(screen.getByText('李四')).toBeInTheDocument();
      expect(screen.getByText('王五')).toBeInTheDocument();
    });
  });

  describe('loading 状态', () => {
    it('loading=true 时显示加载状态', () => {
      render(<DataTable data={mockTableData} loading={true} />);
      expect(document.querySelector('.ant-spin')).toBeInTheDocument();
    });
  });

  describe('空数据状态', () => {
    it('空数据时显示空状态', () => {
      const emptyData = { columns: [], dataSource: [] };
      render(<DataTable data={emptyData} title="空表格" />);
      expect(screen.getByText(/暂无数据/i)).toBeInTheDocument();
    });
  });

  describe('分页配置', () => {
    it('默认应该显示分页', () => {
      render(<DataTable data={mockTableData} />);
      expect(document.querySelector('.ant-pagination')).toBeInTheDocument();
    });

    it('pagination=false 时不显示分页', () => {
      render(<DataTable data={mockTableData} pagination={false} />);
      expect(document.querySelector('.ant-pagination')).not.toBeInTheDocument();
    });
  });
});
