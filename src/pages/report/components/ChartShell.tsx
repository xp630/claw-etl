import React from 'react';
import { Spin, Alert } from 'antd';
import './charts/ChartShell.css';

export interface ChartShellProps {
  /** 图表数据 */
  data?: unknown;
  /** 加载状态 */
  loading?: boolean;
  /** 错误信息 */
  error?: string;
  /** 图表标题 */
  title?: string;
  /** 子组件（图表） */
  children?: React.ReactNode;
  /** 图表配置（兼容旧用法） */
  chart?: unknown;
  /** 筛选器配置（兼容旧用法） */
  filters?: unknown[];
}

/**
 * 统一图表壳组件
 * 处理数据转换、加载状态、错误处理
 */
export const ChartShell: React.FC<ChartShellProps> = ({
  data,
  loading = false,
  error,
  title,
  children,
}) => {
  const isEmpty = !loading && !error && (!data || (Array.isArray(data) && data.length === 0));

  return (
    <div className="chart-shell">
      {title && <h3 className="chart-shell-title">{title}</h3>}
      
      <div className="chart-shell-content">
        {loading ? (
          <div className="chart-shell-loading">
            <Spin size="large" />
          </div>
        ) : error ? (
          <Alert
            message="加载失败"
            description={error}
            type="error"
            showIcon
          />
        ) : isEmpty ? (
          <div className="chart-shell-empty">
            <Alert message="暂无数据" type="info" showIcon />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};
