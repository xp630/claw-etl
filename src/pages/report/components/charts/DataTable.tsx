import React from 'react';
import { Table } from 'antd';
import { ChartShell, type ChartShellProps } from '../ChartShell';

export interface DataTableColumn {
  key: string;
  title: string;
  dataIndex?: string;
  render?: (value: unknown, record: unknown, index: number) => React.ReactNode;
}

export interface DataTableData {
  columns: DataTableColumn[];
  dataSource: Array<Record<string, unknown>>;
}

export interface DataTableProps extends Omit<ChartShellProps, 'children'> {
  data: DataTableData;
  pagination?:
    | boolean
    | {
        pageSize?: number;
        current?: number;
        total?: number;
        onChange?: (page: number, pageSize: number) => void;
      };
}

const defaultPagination = {
  pageSize: 10,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
};

/**
 * 数据表格组件
 */
export const DataTable: React.FC<DataTableProps> = ({
  data,
  title,
  loading = false,
  error,
  pagination = defaultPagination,
}) => {
  const isEmpty = !data.dataSource?.length;

  // 构建分页配置
  const getPaginationConfig = () => {
    if (pagination === false) return false;
    if (typeof pagination === 'object') {
      return { ...defaultPagination, ...pagination };
    }
    return defaultPagination;
  };

  // 转换列配置
  const columns = data.columns.map((col) => ({
    ...col,
    dataIndex: col.dataIndex || col.key,
  }));

  if (isEmpty) {
    return <ChartShell title={title} data={[]} loading={loading} error={error} />;
  }

  return (
    <ChartShell title={title} data={data} loading={loading} error={error}>
      <Table
        columns={columns}
        dataSource={data.dataSource}
        rowKey="id"
        pagination={getPaginationConfig()}
        style={{ width: '100%' }}
      />
    </ChartShell>
  );
};
