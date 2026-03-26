/**
 * 仪表盘编辑/查看页面
 * 支持拖拽布局，使用 react-grid-layout
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GridLayout from 'react-grid-layout';
import { WidthProvider } from 'react-grid-layout';
import { Card, Button, Space, Modal, Form, Input, message, Spin, Empty, Dropdown } from 'antd';
import { 
  SaveOutlined, 
  ArrowLeftOutlined, 
  PlusOutlined, 
  DeleteOutlined,
  SettingOutlined,
  FullscreenOutlined,
  EditOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { useDashboard } from './hooks/useDashboard';
import { useFilter } from './hooks/useFilter';
import { FilterBar } from './components/FilterBar';
import { ChartShell } from './components/ChartShell';
import type { ChartConfig, FilterConfig } from './types/report';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(GridLayout);

// 默认布局配置
const DEFAULT_LAYOUT = {
  lg: { cols: 12, rowHeight: 80 },
  md: { cols: 10, rowHeight: 80 },
  sm: { cols: 6, rowHeight: 80 },
  xs: { cols: 4, rowHeight: 80 },
  xxs: { cols: 2, rowHeight: 80 },
};

export const Dashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentDashboard,
    loading,
    fetchDashboards,
    getDashboard,
    updateDashboard,
    addChart,
    removeChart,
    updateLayout,
    addFilter,
    removeFilter,
    setCurrentDashboard,
  } = useDashboard();

  const {
    filters,
    filterValues,
    setFilters,
    updateFilterValue,
    clearFilterValues,
    getActiveFilters,
  } = useFilter();

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addingChart, setAddingChart] = useState(false);
  const [addingFilter, setAddingFilter] = useState(false);
  const [selectedChart, setSelectedChart] = useState<ChartConfig | null>(null);
  const [chartForm] = Form.useForm();
  const [filterForm] = Form.useForm();

  // 加载仪表盘数据
  useEffect(() => {
    if (id) {
      getDashboard(id).then(dashboard => {
        if (dashboard) {
          setFilters(dashboard.filters);
        } else {
          // 仪表盘不存在，自动跳转列表页 + 提示
          message.error('仪表盘不存在');
          navigate('/report/dashboards');
        }
      });
    }
    return () => {
      setCurrentDashboard(null);
    };
  }, [id, getDashboard, setFilters, setCurrentDashboard, navigate]);

  // 保存仪表盘
  const handleSave = useCallback(async () => {
    if (!currentDashboard) return;
    
    setSaving(true);
    try {
      await updateDashboard(currentDashboard.id, {
        ...currentDashboard,
        filters,
      });
      message.success('保存成功');
      setEditMode(false);
    } catch (error) {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  }, [currentDashboard, updateDashboard, filters]);

  // 布局变化
  const handleLayoutChange = useCallback((layout: Array<{ i: string; x: number; y: number; w: number; h: number }>) => {
    if (!editMode) return;
    
    layout.forEach(item => {
      updateLayout(item.i, { x: item.x, y: item.y, w: item.w, h: item.h });
    });
  }, [editMode, updateLayout]);

  // 添加图表
  const handleAddChart = useCallback((type: ChartConfig['type']) => {
    if (!currentDashboard) return;
    
    // 计算实际最大 Y 值，避免 Infinity 导致布局异常
    const maxY = (currentDashboard.charts || []).reduce((max, chart) => {
      const chartY = chart.gridLayout?.y ?? 0;
      return Math.max(max, chartY + (chart.gridLayout?.h ?? 4));
    }, 0);
    
    const newChart: ChartConfig = {
      id: `chart-${Date.now()}`,
      type,
      title: `新图表-${type}`,
      datasetId: '',
      gridLayout: { x: 0, y: maxY, w: 6, h: 4 },
    };
    
    addChart(newChart);
    setAddingChart(false);
    chartForm.resetFields();
  }, [currentDashboard, addChart, chartForm]);

  // 删除图表
  const handleDeleteChart = useCallback((chartId: string) => {
    removeChart(chartId);
    setSelectedChart(null);
  }, [removeChart]);

  // 打开图表设置
  const handleChartSettings = useCallback((chart: ChartConfig) => {
    setSelectedChart(chart);
    chartForm.setFieldsValue(chart);
    setAddingChart(true);
  }, [chartForm]);

  // 更新图表配置
  const handleChartUpdate = useCallback((values: Partial<ChartConfig>) => {
    if (!selectedChart) return;
    
    setCurrentDashboard(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        charts: prev.charts.map(c => 
          c.id === selectedChart.id ? { ...c, ...values } : c
        ),
      };
    });
    
    setSelectedChart(prev => prev ? { ...prev, ...values } : null);
    setAddingChart(false);
    chartForm.resetFields();
  }, [selectedChart, setCurrentDashboard, chartForm]);

  // 添加筛选器
  const handleAddFilter = useCallback((values: Partial<FilterConfig>) => {
    if (!currentDashboard) return;
    
    const newFilter: FilterConfig = {
      id: `filter-${Date.now()}`,
      field: values.field || '',
      label: values.label || '',
      type: values.type || 'select',
      options: values.options,
      defaultValue: values.defaultValue,
    };
    
    addFilter(newFilter);
    setAddingFilter(false);
    filterForm.resetFields();
  }, [currentDashboard, addFilter, filterForm]);

  // 删除筛选器
  const handleDeleteFilter = useCallback((filterId: string) => {
    removeFilter(filterId);
  }, [removeFilter]);

  // 图表类型菜单
  const chartTypeMenu = {
    items: [
      { key: 'line', icon: <LineChartOutlined />, label: '折线图' },
      { key: 'bar', icon: <BarChartOutlined />, label: '柱状图' },
      { key: 'pie', icon: <PieChartOutlined />, label: '饼图' },
      { key: 'table', icon: <TableOutlined />, label: '数据表' },
    ],
    onClick: ({ key }: { key: string }) => handleAddChart(key as ChartConfig['type']),
  };

  if (loading && !currentDashboard) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!currentDashboard) {
    return (
      <Empty description="仪表盘不存在" style={{ marginTop: 100 }}>
        <Button type="primary" onClick={() => navigate('/report/dashboards')}>
          返回列表
        </Button>
      </Empty>
    );
  }

  // 生成布局
  const layouts = {
    lg: (currentDashboard.charts || []).map(chart => ({
      i: chart.id,
      x: chart.gridLayout?.x ?? 0,
      y: chart.gridLayout?.y ?? 0,
      w: chart.gridLayout?.w ?? 6,
      h: chart.gridLayout?.h ?? 4,
    })),
  };

  return (
    <div style={{ padding: 16, background: '#f0f2f5', minHeight: '100vh' }}>
      {/* 顶部工具栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/report/dashboards')}>
              返回
            </Button>
            <span style={{ fontSize: 16, fontWeight: 500 }}>
              {currentDashboard.name || '未命名仪表盘'}
            </span>
          </Space>
          <Space>
            {editMode && (
              <>
                <Dropdown menu={chartTypeMenu} trigger={['click']}>
                  <Button icon={<PlusOutlined />}>添加图表</Button>
                </Dropdown>
                <Button icon={<SettingOutlined />} onClick={() => setAddingFilter(true)}>
                  添加筛选器
                </Button>
              </>
            )}
            <Button 
              type={editMode ? 'primary' : 'default'} 
              icon={<EditOutlined />}
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? '退出编辑' : '编辑'}
            </Button>
            {editMode && (
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                loading={saving}
                onClick={handleSave}
              >
                保存
              </Button>
            )}
          </Space>
        </Space>
      </Card>

      {/* 筛选器栏 */}
      {filters.length > 0 && (
        <FilterBar
          filters={filters}
          values={filterValues}
          onFilterChange={updateFilterValue}
          onClear={clearFilterValues}
          showClearButton={editMode}
        />
      )}

      {/* 编辑模式下的筛选器删除按钮 */}
      {editMode && filters.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <Space size="small">
            {filters.map(filter => (
              <Button 
                key={filter.id}
                size="small" 
                danger 
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteFilter(filter.id)}
              >
                删除筛选器: {filter.label}
              </Button>
            ))}
          </Space>
        </div>
      )}

      {/* 图表网格 */}
      {(currentDashboard.charts || []).length === 0 ? (
        <Card>
          <Empty description="暂无图表">
            {editMode && (
              <Dropdown menu={chartTypeMenu} trigger={['click']}>
                <Button type="primary" icon={<PlusOutlined />}>添加图表</Button>
              </Dropdown>
            )}
          </Empty>
        </Card>
      ) : (
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={80}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          isDraggable={editMode}
          isResizable={editMode}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".chart-drag-handle"
        >
          {(currentDashboard.charts || []).map(chart => (
            <div key={chart.id} style={{ background: '#fff', borderRadius: 8 }}>
              {editMode && (
                <div 
                  className="chart-drag-handle" 
                  style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    right: 0,
                    height: 32,
                    background: 'rgba(0,0,0,0.5)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 8px',
                    borderRadius: '8px 8px 0 0',
                    cursor: 'move',
                    zIndex: 10,
                  }}
                >
                  <span>{chart.title}</span>
                  <Space size="small">
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<SettingOutlined />} 
                      style={{ color: '#fff' }}
                      onClick={() => handleChartSettings(chart)}
                    />
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<DeleteOutlined />} 
                      style={{ color: '#ff4d4f' }}
                      onClick={() => handleDeleteChart(chart.id)}
                    />
                  </Space>
                </div>
              )}
              <ChartShell chart={chart} filters={getActiveFilters()} />
            </div>
          ))}
        </ResponsiveGridLayout>
      )}

      {/* 添加/编辑图表弹窗 */}
      <Modal
        title={selectedChart ? '编辑图表' : '添加图表'}
        open={addingChart}
        onCancel={() => { setAddingChart(false); setSelectedChart(null); chartForm.resetFields(); }}
        footer={null}
      >
        <Form
          form={chartForm}
          layout="vertical"
          initialValues={selectedChart || {}}
          onFinish={handleChartUpdate}
        >
          <Form.Item name="title" label="图表标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="datasetId" label="数据集ID" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="图表类型" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="xAxis" label="X轴字段">
            <Input />
          </Form.Item>
          <Form.Item name="yAxis" label="Y轴字段">
            <Input />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确定</Button>
              <Button onClick={() => { setAddingChart(false); setSelectedChart(null); }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加筛选器弹窗 */}
      <Modal
        title="添加筛选器"
        open={addingFilter}
        onCancel={() => { setAddingFilter(false); filterForm.resetFields(); }}
        footer={null}
      >
        <Form
          form={filterForm}
          layout="vertical"
          onFinish={handleAddFilter}
        >
          <Form.Item name="label" label="筛选器名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="field" label="字段名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="筛选器类型" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确定</Button>
              <Button onClick={() => { setAddingFilter(false); }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Dashboard;
