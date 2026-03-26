/**
 * 仪表盘列表页面
 * 展示所有仪表盘，支持创建、删除、跳转详情
 */

import React, { useEffect } from 'react';
import { Table, Button, Space, Card, Input, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, LayoutOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from './hooks/useDashboard';
import type { DashboardConfig } from './types/report';

// Content removed

export const DashboardList: React.FC = () => {
  const navigate = useNavigate();
  const {
    dashboards,
    total,
    loading,
    page,
    pageSize,
    setPage,
    setPageSize,
    fetchDashboards,
    createDashboard,
    deleteDashboard,
  } = useDashboard();

  const [searchKeyword, setSearchKeyword] = React.useState('');
  const [creating, setCreating] = React.useState(false);

  useEffect(() => {
    fetchDashboards();
  }, [fetchDashboards]);

  const handleSearch = () => {
    setPage(1);
    fetchDashboards({ keyword: searchKeyword });
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const newDashboard = await createDashboard({
        name: '新建仪表盘',
        charts: [],
        filters: [],
      });
      message.success('仪表盘创建成功');
      navigate(`/report/dashboards/${newDashboard.id}`);
    } catch (error) {
      message.error('创建失败');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDashboard(id);
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleEdit = (record: DashboardConfig) => {
    navigate(`/report/dashboards/${record.id}`);
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
      render: (name: string, record: DashboardConfig) => (
        <a onClick={() => handleEdit(record)}>{name}</a>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '图表数量',
      key: 'chartCount',
      width: 100,
      render: (_: unknown, record: DashboardConfig) => record.charts?.length || 0,
    },
    {
      title: '筛选器数量',
      key: 'filterCount',
      width: 100,
      render: (_: unknown, record: DashboardConfig) => record.filters?.length || 0,
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
      render: (_: unknown, record: DashboardConfig) => (
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
            title="确定删除该仪表盘？"
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
            <LayoutOutlined />
            <span>仪表盘管理</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<PlayCircleOutlined />} onClick={() => navigate('/report/demo')}>
              预览演示版
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} loading={creating}>
              新建仪表盘
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
          <Input
            placeholder="搜索仪表盘名称"
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
          dataSource={dashboards}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (newPage, newPageSize) => {
              if (newPageSize !== pageSize) {
                setPageSize(newPageSize);
                setPage(1);
              } else {
                setPage(newPage);
              }
              fetchDashboards({ keyword: searchKeyword });
            },
          }}
        />
      </Card>
    </div>
  );
};

export default DashboardList;
