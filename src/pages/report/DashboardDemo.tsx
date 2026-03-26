/**
 * 仪表盘静态展示版本（深色主题）
 * 预设图表和布局，无需配置即可看到效果
 */

import React, { useState } from 'react';
import { Card, Button, Space, Select, DatePicker, Statistic, Row, Col, Typography } from 'antd';
import GridLayout from 'react-grid-layout';
import { WidthProvider } from 'react-grid-layout';
import {
  LineChartOutlined,
  PieChartOutlined,
  BarChartOutlined,
  TableOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { LineChart, type LineChartData } from './components/charts/LineChart';
import { BarChart, type BarChartData } from './components/charts/BarChart';
import { PieChart, type PieChartData } from './components/charts/PieChart';
import { DataTable, type DataTableData } from './components/charts/DataTable';
import { ChartTypeSelector, type ChartTypeSelectorProps } from './components/ChartTypeSelector';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

const ResponsiveGridLayout = WidthProvider(GridLayout);

// ============ 深色主题配置 ============

const darkTheme = {
  background: '#141414',
  cardBg: '#1f1f1f',
  borderColor: '#303030',
  textPrimary: '#ffffff',
  textSecondary: '#8c8c8c',
  accentColor: '#177ddc',
  successColor: '#49aa19',
  warningColor: '#d87a16',
  dangerColor: '#ff4d4f',
};

// ============ KPI 卡片组件 ============

interface KPICardProps {
  title: string;
  value: string | number;
  prefix?: React.ReactNode;
  suffix?: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  theme: typeof darkTheme;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  prefix,
  suffix,
  trend,
  trendValue,
  theme,
}) => (
  <Card
    size="small"
    style={{
      background: theme.cardBg,
      borderColor: theme.borderColor,
      height: '100%',
    }}
    styles={{ body: { padding: '16px 20px' } }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{title}</Text>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'baseline', gap: 4 }}>
          {prefix && (
            <span style={{ color: theme.textSecondary, fontSize: 16 }}>{prefix}</span>
          )}
          <Statistic
            value={value}
            suffix={suffix}
            valueStyle={{
              color: theme.textPrimary,
              fontSize: 28,
              fontWeight: 600,
            }}
          />
        </div>
        {trend && trendValue && (
          <div style={{ marginTop: 4 }}>
            {trend === 'up' ? (
              <ArrowUpOutlined style={{ color: theme.successColor, marginRight: 4 }} />
            ) : (
              <ArrowDownOutlined style={{ color: theme.dangerColor, marginRight: 4 }} />
            )}
            <Text style={{ color: trend === 'up' ? theme.successColor : theme.dangerColor, fontSize: 12 }}>
              {trendValue}
            </Text>
          </div>
        )}
      </div>
    </div>
  </Card>
);

// ============ 预设模拟数据 ============

const mockLineChartData: LineChartData = {
  xAxis: ['1月', '2月', '3月', '4月', '5月', '6月'],
  series: [
    { name: '销售额', data: [820, 932, 901, 1234, 1290, 1330] },
    { name: '利润', data: [350, 420, 380, 520, 480, 590] },
  ],
};

const mockBarChartData: BarChartData = {
  xAxis: ['北京', '上海', '广州', '深圳', '杭州', '成都'],
  series: [{ name: '销量', data: [1200, 1900, 1500, 1800, 900, 1100] }],
};

const mockPieChartData: PieChartData = {
  series: [
    { name: '电子产品', value: 3500 },
    { name: '服装', value: 2800 },
    { name: '食品', value: 2100 },
    { name: '图书', value: 1500 },
    { name: '其他', value: 1000 },
  ],
};

const mockTableData: DataTableData = {
  columns: [
    { key: 'id', title: 'ID' },
    { key: 'name', title: '商品名称' },
    { key: 'category', title: '分类' },
    { key: 'sales', title: '销售额' },
    { key: 'profit', title: '利润' },
    { key: 'status', title: '状态' },
  ],
  dataSource: [
    { id: 'P001', name: 'iPhone 15', category: '电子产品', sales: 8999, profit: 1200, status: '在售' },
    { id: 'P002', name: 'MacBook Pro', category: '电子产品', sales: 15999, profit: 2500, status: '在售' },
    { id: 'P003', name: 'AirPods Pro', category: '电子产品', sales: 1999, profit: 400, status: '在售' },
    { id: 'P004', name: 'Nike运动鞋', category: '服装', sales: 899, profit: 200, status: '在售' },
    { id: 'P005', name: '特斯拉Model 3', category: '汽车', sales: 249900, profit: 30000, status: '在售' },
    { id: 'P006', name: '戴森吸尘器', category: '家电', sales: 4999, profit: 800, status: '在售' },
  ],
};

// ============ 主组件 ============

export const DashboardDemo: React.FC = () => {
  const [showChartSelector, setShowChartSelector] = useState(false);
  const theme = darkTheme;

  // 布局配置
  const layouts = {
    lg: [
      { i: 'kpi-sales', x: 0, y: 0, w: 3, h: 2 },
      { i: 'kpi-profit', x: 3, y: 0, w: 3, h: 2 },
      { i: 'kpi-orders', x: 6, y: 0, w: 3, h: 2 },
      { i: 'kpi-users', x: 9, y: 0, w: 3, h: 2 },
      { i: 'line-chart', x: 0, y: 2, w: 8, h: 4 },
      { i: 'pie-chart', x: 8, y: 2, w: 4, h: 4 },
      { i: 'bar-chart', x: 0, y: 6, w: 6, h: 4 },
      { i: 'table', x: 6, y: 6, w: 6, h: 5 },
    ],
    md: [
      { i: 'kpi-sales', x: 0, y: 0, w: 2, h: 2 },
      { i: 'kpi-profit', x: 2, y: 0, w: 2, h: 2 },
      { i: 'kpi-orders', x: 4, y: 0, w: 2, h: 2 },
      { i: 'kpi-users', x: 6, y: 0, w: 2, h: 2 },
      { i: 'line-chart', x: 0, y: 2, w: 6, h: 4 },
      { i: 'pie-chart', x: 6, y: 2, w: 4, h: 4 },
      { i: 'bar-chart', x: 0, y: 6, w: 5, h: 4 },
      { i: 'table', x: 0, y: 10, w: 10, h: 5 },
    ],
    sm: [
      { i: 'kpi-sales', x: 0, y: 0, w: 3, h: 2 },
      { i: 'kpi-profit', x: 3, y: 0, w: 3, h: 2 },
      { i: 'kpi-orders', x: 0, y: 2, w: 3, h: 2 },
      { i: 'kpi-users', x: 3, y: 2, w: 3, h: 2 },
      { i: 'line-chart', x: 0, y: 4, w: 6, h: 4 },
      { i: 'pie-chart', x: 0, y: 8, w: 6, h: 4 },
      { i: 'bar-chart', x: 0, y: 12, w: 6, h: 4 },
      { i: 'table', x: 0, y: 16, w: 6, h: 5 },
    ],
  };

  return (
    <div style={{ padding: 16, background: theme.background, minHeight: '100vh' }}>
      {/* 顶部工具栏 */}
      <Card
        size="small"
        style={{
          marginBottom: 16,
          background: theme.cardBg,
          borderColor: theme.borderColor,
        }}
        styles={{ body: { padding: '12px 16px' } }}
      >
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <span style={{ fontSize: 16, fontWeight: 500, color: theme.textPrimary }}>
              📊 销售数据仪表盘（演示版）
            </span>
          </Space>
          <Space>
            <Select placeholder="选择区域" style={{ width: 120 }} allowClear>
              <Option value="bj">北京</Option>
              <Option value="sh">上海</Option>
              <Option value="gz">广州</Option>
              <Option value="sz">深圳</Option>
            </Select>
            <RangePicker style={{ width: 240 }} />
            <Button icon={<ReloadOutlined />}>刷新数据</Button>
            <Button
              type="primary"
              icon={<LineChartOutlined />}
              onClick={() => setShowChartSelector(true)}
            >
              添加图表
            </Button>
          </Space>
        </Space>
      </Card>

      {/* 图表网格 */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={80}
        margin={[12, 12]}
        containerPadding={[0, 0]}
      >
        {/* KPI 卡片 */}
        <div key="kpi-sales">
          <KPICard
            title="总销售额"
            value="¥1,234,567"
            trend="up"
            trendValue="+12.5%"
            theme={theme}
          />
        </div>
        <div key="kpi-profit">
          <KPICard
            title="总利润"
            value="¥456,789"
            trend="up"
            trendValue="+8.3%"
            theme={theme}
          />
        </div>
        <div key="kpi-orders">
          <KPICard
            title="订单数"
            value="8,888"
            trend="up"
            trendValue="+5.2%"
            theme={theme}
          />
        </div>
        <div key="kpi-users">
          <KPICard
            title="活跃用户"
            value="12,456"
            trend="down"
            trendValue="-2.1%"
            theme={theme}
          />
        </div>

        {/* 折线图 */}
        <div key="line-chart">
          <Card
            style={{
              background: theme.cardBg,
              borderColor: theme.borderColor,
              height: '100%',
            }}
            styles={{ body: { padding: 12, height: '100%' } }}
          >
            <LineChart
              data={mockLineChartData}
              title="月度销售趋势"
              height={300}
            />
          </Card>
        </div>

        {/* 饼图 */}
        <div key="pie-chart">
          <Card
            style={{
              background: theme.cardBg,
              borderColor: theme.borderColor,
              height: '100%',
            }}
            styles={{ body: { padding: 12, height: '100%' } }}
          >
            <PieChart
              data={mockPieChartData}
              title="产品分类占比"
              height={300}
            />
          </Card>
        </div>

        {/* 柱状图 */}
        <div key="bar-chart">
          <Card
            style={{
              background: theme.cardBg,
              borderColor: theme.borderColor,
              height: '100%',
            }}
            styles={{ body: { padding: 12, height: '100%' } }}
          >
            <BarChart
              data={mockBarChartData}
              title="各城市销量对比"
              height={300}
            />
          </Card>
        </div>

        {/* 数据表格 */}
        <div key="table">
          <Card
            style={{
              background: theme.cardBg,
              borderColor: theme.borderColor,
              height: '100%',
            }}
            styles={{ body: { padding: 12, height: '100%' } }}
          >
            <DataTable
              data={mockTableData}
              title="商品销售明细"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </div>
      </ResponsiveGridLayout>

      {/* 图表类型选择器 */}
      <ChartTypeSelector
        open={showChartSelector}
        onCancel={() => setShowChartSelector(false)}
        onSelect={(type, title) => {
          console.log('选择了图表类型:', type, title);
          // TODO: 添加图表到仪表盘
        }}
      />
    </div>
  );
};

export default DashboardDemo;
