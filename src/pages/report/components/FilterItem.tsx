/**
 * 筛选器项组件
 * 支持 select、dateRange、input 三种类型的筛选器
 */

import React from 'react';
import { Select, DatePicker, Input } from 'antd';
import type { FilterConfig } from '../types/report';

const { RangePicker } = DatePicker;

export interface FilterItemProps {
  filter: FilterConfig;
  value?: unknown;
  onChange: (filterId: string, value: unknown) => void;
}

export const FilterItem: React.FC<FilterItemProps> = ({
  filter,
  value,
  onChange,
}) => {
  const handleChange = (newValue: unknown) => {
    onChange(filter.id, newValue);
  };

  const renderFilterControl = () => {
    switch (filter.type) {
      case 'select':
        return (
          <Select
            value={value as string}
            onChange={handleChange}
            placeholder={`请选择${filter.label}`}
            options={filter.options}
            style={{ minWidth: 150 }}
            allowClear
          />
        );
      
      case 'dateRange':
        return (
          <RangePicker
            value={value as any}
            onChange={(dates, dateStrings) => {
              handleChange(dateStrings);
            }}
            placeholder={[filter.label || '开始日期', '结束日期']}
          />
        );
      
      case 'input':
        return (
          <Input
            value={value as string}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`请输入${filter.label}`}
            style={{ minWidth: 150 }}
            allowClear
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="filter-item" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      {filter.label && (
        <span style={{ whiteSpace: 'nowrap' }}>{filter.label}:</span>
      )}
      {renderFilterControl()}
    </div>
  );
};

export default FilterItem;
