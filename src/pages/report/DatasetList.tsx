/**
 * 数据集列表页面
 * 展示所有数据集，支持创建、删除、编辑、SQL执行
 */

import React, { useEffect } from 'react';
import { Table, Button, Space, Card, Input, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDataset } from './hooks/useDataset';
import type { ChartDataset } from './types/report';

// Content removed

export const DatasetList: React.FC = () => {
  const navigate = useNavigate();
  const {
    datasets,
    total,
    loading,
    page,
    pageSize,
    setPage,
    setPageSize,
    fetchDatasets,
    deleteDataset,
  } = useDataset();

  const [searchKeyword, setSearchKeyword] = React.useState('');

  useEffect(() => {
    fetchDatasets();
  }, [fetchDatasets]);

  const handleSearch = () => {
    setPage(1);
    fetchDatasets({ keyword: searchKeyword });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDataset(id);
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleEdit = (record: ChartDataset) => {
    navigate(`/report/datasets/${record.id}`);
  };

  const columns = [
    {
      title: '序号',
      key: 'index',
      width: 60,
      render: (_: unknown, __: unknown, index: number) => (page - 1) * pageSize + index + 1,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: ChartDataset) => (
        <a onClick={() => handleEdit(record)}>{name}</a>
      ),
    },
    {
      title: '数据源ID',
      dataIndex: 'datasourceId',
      key: 'datasourceId',
      ellipsis: true,
    },
    {
      title: 'SQL',
      dataIndex: 'sql',
      key: 'sql',
      ellipsis: true,
      render: (sql: string) => sql ? <code style={{ fontSize: 12 }}>{sql.substring(0, 50)}...</code> : '-',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text: string) => text ? new Date(text).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: unknown, record: ChartDataset) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该数据集？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={
          <Space>
            <DatabaseOutlined />
            <span>数据集管理</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/report/datasets/new')}
          >
            新建数据集
          </Button>
        }
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <Input
            placeholder="搜索数据集名称"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 250 }}
            prefix={<SearchOutlined />}
            allowClear
          />
          <Button onClick={handleSearch}>搜索</Button>
        </div>

        <Table
          columns={columns}
          dataSource={datasets}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t: number) => `共 ${t} 条`,
            onChange: (newPage, newPageSize) => {
              if (newPageSize !== pageSize) {
                setPageSize(newPageSize);
                setPage(1);
              } else {
                setPage(newPage);
              }
              fetchDatasets({ keyword: searchKeyword });
            },
          }}
        />
      </Card>
    </div>
  );
};

export default DatasetList;
