/**
 * 筛选器栏组件
 * 展示多个筛选器，支持日期范围、下拉选择等类型
 */

import React from 'react';
import { Button, Space, Card } from 'antd';
import { FilterOutlined, ClearOutlined } from '@ant-design/icons';
import { FilterItem } from './FilterItem';
import type { FilterConfig } from '../types/report';

export interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, unknown>;
  onFilterChange: (filterId: string, value: unknown) => void;
  onClear: () => void;
  showClearButton?: boolean;
  layout?: 'horizontal' | 'vertical';
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  values,
  onFilterChange,
  onClear,
  showClearButton = true,
  layout = 'horizontal',
}) => {
  const hasActiveFilters = filters.some(filter => {
    const value = values[filter.id];
    return value !== undefined && value !== '' && 
      (Array.isArray(value) ? value.length > 0 : true);
  });

  const isHorizontal = layout === 'horizontal';

  return (
    <Card 
      size="small" 
      title={
        <span>
          <FilterOutlined /> 筛选器
        </span>
      }
      extra={
        showClearButton && hasActiveFilters && (
          <Button 
            type="link" 
            size="small" 
            icon={<ClearOutlined />}
            onClick={onClear}
          >
            清空筛选
          </Button>
        )
      }
      style={{ marginBottom: 16 }}
    >
      {filters.length === 0 ? (
        <div style={{ color: '#999', textAlign: 'center', padding: '8px 0' }}>
          暂无筛选器
        </div>
      ) : isHorizontal ? (
        <Space wrap size="middle">
          {filters.map(filter => (
            <FilterItem
              key={filter.id}
              filter={filter}
              value={values[filter.id]}
              onChange={onFilterChange}
            />
          ))}
        </Space>
      ) : (
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {filters.map(filter => (
            <div key={filter.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ minWidth: 80 }}>{filter.label}:</span>
              <FilterItem
                filter={filter}
                value={values[filter.id]}
                onChange={onFilterChange}
              />
            </div>
          ))}
        </Space>
      )}
    </Card>
  );
};

export default FilterBar;
