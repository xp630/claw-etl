/**
 * 仪表盘演示 Mock 数据
 * 深色主题 + 玻璃态设计专用
 */

// ============ KPI 指标数据 ============

export interface KPIData {
  title: string;
  value: string;
  change: number;
  icon: string;
  color: string;
}

export const kpiData: KPIData[] = [
  {
    title: '总 GMV',
    value: '¥12,847,293',
    change: 12.5,
    icon: '💰',
    color: '#00d4ff',
  },
  {
    title: '活跃用户',
    value: '284,521',
    change: 8.2,
    icon: '👥',
    color: '#7b2cbf',
  },
  {
    title: '转化率',
    value: '23.6%',
    change: -2.1,
    icon: '📈',
    color: '#00ff88',
  },
  {
    title: '平均响应',
    value: '128ms',
    change: -15.3,
    icon: '⚡',
    color: '#ff6b6b',
  },
];

// ============ 图表数据 ============

// 折线图 - 销售趋势
export interface LineChartData {
  xAxis: string[];
  series: Array<{
    name: string;
    data: number[];
  }>;
}

export const lineChartData: LineChartData = {
  xAxis: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
  series: [
    {
      name: '销售额 (万)',
      data: [12, 8, 25, 58, 86, 72, 45],
    },
    {
      name: '订单量 (百)',
      data: [3, 2, 8, 18, 28, 22, 12],
    },
  ],
};

// 柱状图 - 部门对比
export interface BarChartData {
  xAxis: string[];
  series: Array<{
    name: string;
    data: number[];
  }>;
}

export const barChartData: BarChartData = {
  xAxis: ['华东区', '华南区', '华北区', '西南区', '西北区', '东北区'],
  series: [
    {
      name: 'Q1 销售额',
      data: [4200, 3800, 2900, 2100, 1800, 1500],
    },
    {
      name: 'Q2 销售额',
      data: [4800, 4200, 3200, 2400, 2000, 1800],
    },
  ],
};

// 饼图 - 流量占比
export interface PieChartData {
  series: Array<{
    name: string;
    value: number;
  }>;
}

export const pieChartData: PieChartData = {
  series: [
    { name: '直接访问', value: 35 },
    { name: '搜索引擎', value: 28 },
    { name: '社交媒体', value: 18 },
    { name: '广告投放', value: 12 },
    { name: '其他', value: 7 },
  ],
};

// 数据表格 - 订单列表
export interface OrderItem {
  id: string;
  product: string;
  customer: string;
  amount: string;
  status: '已完成' | '处理中' | '已取消';
  time: string;
}

export const orderTableData: OrderItem[] = [
  { id: 'ORD-20260326-001', product: 'iPhone 15 Pro Max', customer: '张先生', amount: '¥9,999', status: '已完成', time: '10:23:15' },
  { id: 'ORD-20260326-002', product: 'MacBook Pro 16寸', customer: '李女士', amount: '¥19,999', status: '处理中', time: '10:18:42' },
  { id: 'ORD-20260326-003', product: 'AirPods Pro 2', customer: '王先生', amount: '¥1,999', status: '已完成', time: '10:15:33' },
  { id: 'ORD-20260326-004', product: 'iPad Pro 12.9', customer: '赵女士', amount: '¥8,499', status: '已取消', time: '10:12:08' },
  { id: 'ORD-20260326-005', product: 'Apple Watch Ultra', customer: '钱先生', amount: '¥6,499', status: '已完成', time: '10:08:55' },
  { id: 'ORD-20260326-006', product: 'Tesla Model Y', customer: '孙女士', amount: '¥259,900', status: '处理中', time: '10:05:21' },
  { id: 'ORD-20260326-007', product: 'Dyson V15 吸尘器', customer: '周先生', amount: '¥5,499', status: '已完成', time: '10:02:47' },
  { id: 'ORD-20260326-008', product: 'Sony WH-1000XM5', customer: '吴女士', amount: '¥2,799', status: '已完成', time: '09:58:12' },
];

// ============ 筛选器选项 ============

export const regionOptions = [
  { label: '全部地区', value: 'all' },
  { label: '华东区', value: 'hd' },
  { label: '华南区', value: 'hn' },
  { label: '华北区', value: 'hb' },
  { label: '西南区', value: 'xn' },
  { label: '西北区', value: 'xb' },
];

export const timeRangeOptions = [
  { label: '今日', value: 'today' },
  { label: '近7天', value: 'week' },
  { label: '近30天', value: 'month' },
  { label: '本季度', value: 'quarter' },
  { label: '本年', value: 'year' },
];
