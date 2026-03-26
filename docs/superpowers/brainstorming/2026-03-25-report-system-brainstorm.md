# 报表系统技术方案 - Brainstorming

> 日期：2026-03-25
> 角色：Architect
> 状态：Draft

---

## 一、需求本质分析

### 1.1 核心问题

报表系统的本质是**数据可视化 + 交互式探索**，帮助用户在低代码平台上实现"拖拽即报表"的能力。

关键挑战：
1. **灵活性 vs 复杂度的平衡**：支持SQL查询/API绑定，但不能让配置过于复杂
2. **图表与数据的解耦**：图表组件需要一套统一的数据格式抽象
3. **联动状态的传递**：筛选器/图表间联动需要统一的状态管理方案
4. **后端数据抽象**：SQL执行和API调用需要统一的数据集抽象层

### 1.2 需求拆解

| 需求 | 本质 | 优先级 |
|------|------|--------|
| 图表组件库 | 可视化渲染层，支持多种图表类型 | P0 |
| 数据集配置 | 数据获取抽象（SQL / API） | P0 |
| 基础仪表盘 | 多图表布局 + 筛选器联动 | P0 |
| 图表钻取/联动 | 点击事件传递 + 数据过滤 | P1 |

---

## 二、方案对比

### 方案A：自研图表封装 + ECharts

**核心思路**：选择 ECharts 作为底层渲染引擎，上层封装统一的图表组件。

```
┌─────────────────────────────────────────────────────────┐
│                      仪表盘页面                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ 折线图   │  │ 柱状图   │  │  饼图    │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│  ┌──────────────────────────────────────┐              │
│  │           数据表格                      │              │
│  └──────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

**优点**：
- 灵活性高，可深度定制
- ECharts 生态成熟，文档丰富
- 国内社区活跃，中文资料多

**缺点**：
- 需要自行处理响应式、交互事件
- 缺少开箱即用的数据可视化最佳实践

**技术栈**：
- `echarts` + `react-echarts` 封装
- 统一数据格式：`{ dimensions: [], measures: [] }`

---

### 方案B：使用 AntV（阿里）生态

**核心思路**：使用 AntV G2Plot（面向统计图表）和 React 封装。

```
┌─────────────────────────────────────────────────────────┐
│                    @ant-design/charts                   │
│  Line/G2Plot │ Bar/G2Plot │ Pie/G2Plot │ Table         │
└─────────────────────────────────────────────────────────┘
```

**优点**：
- 面向统计图表的设计，开箱即用
- 与 Ant Design 设计体系一致
- 支持 React 19 最新特性

**缺点**：
- G2Plot 更新频率下降，维护状态不确定
- 动画和交互偏向"好看"而非"实用"

---

### 方案C：轻量级集成 + 低耦合设计（推荐）

**核心思路**：前端只做数据层抽象 + 图表壳，后端提供统一的数据集API。

```
┌─────────────────────────────────────────────────────────┐
│  前端：数据适配层                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ChartShell (统一壳) → 渲染层 (ECharts/G2Plot)   │  │
│  │  DatasetAdapter (SQL/API统一格式)                │  │
│  └──────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│  后端：数据集服务                                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ SQL执行器   │  │ API聚合器   │  │ 数据缓存    │       │
│  └────────────┘  └────────────┘  └────────────┘       │
└─────────────────────────────────────────────────────────┘
```

**优点**：
- 前后端职责清晰
- 便于后续替换图表库
- 适合低代码平台的数据流抽象

---

## 三、技术选型建议

### 3.1 图表库选型：ECharts 5.x

| 考量维度 | ECharts | AntV G2Plot |
|----------|---------|-------------|
| 图表类型 | 丰富（折线/柱状/饼图/散点/雷达/热力图等） | 偏统计图表 |
| React 集成 | `echarts-for-react` 成熟 | `@ant-design/charts` 维护放缓 |
| 大数据量 | 支持 WebGL 渲染 | 普通渲染 |
| 社区活跃度 | 非常活跃 | 一般 |
| 文档质量 | 完善 | 完善 |

**结论**：选择 **ECharts 5.x**，使用 `echarts-for-react` 封装组件。

### 3.2 前端技术选型

| 模块 | 选型 | 说明 |
|------|------|------|
| 图表库 | `echarts` 5.x | 主流可视化库 |
| React 封装 | `echarts-for-react` | ECharts 官方 React 组件 |
| 拖拽布局 | `react-grid-layout` | 仪表盘拖拽布局 |
| 状态管理 | Zustand / React Context | 仪表盘联动状态 |
| 筛选器 | 自研 | 配合数据集的筛选器组件 |

### 3.3 后端技术选型

| 模块 | 选型 | 说明 |
|------|------|------|
| SQL 执行 | JdbcTemplate / MyBatis | 复用现有数据源连接 |
| API 代理 | RestTemplate / WebClient | 转发外部 API |
| 数据缓存 | Caffeine | 本地缓存热点数据 |
| 异步任务 | Spring Async + 线程池 | 执行耗时 SQL |

---

## 四、核心组件设计

### 4.1 前端组件结构

```
src/
├── pages/report/
│   ├── Dashboard.tsx           # 仪表盘主页面
│   ├── components/
│   │   ├── ChartShell.tsx      # 图表统一壳（数据转换 + 事件）
│   │   ├── charts/
│   │   │   ├── LineChart.tsx   # 折线图
│   │   │   ├── BarChart.tsx    # 柱状图
│   │   │   ├── PieChart.tsx    # 饼图
│   │   │   ├── ScatterChart.tsx # 散点图
│   │   │   └── DataTable.tsx   # 数据表格
│   │   ├── FilterBar.tsx       # 筛选器栏
│   │   ├── FilterItem.tsx      # 单个筛选器
│   │   └── DatasetConfig.tsx   # 数据集配置面板
│   └── hooks/
│       ├── useDataset.ts       # 数据集获取 hook
│       ├── useDashboard.ts     # 仪表盘状态管理
│       └── useChartDrill.ts    # 图表钻取 hook
```

### 4.2 统一数据格式

```typescript
// 图表标准数据格式（类似 ECharts dataset）
interface ChartDataset {
  dimensions: string[];       // 维度列名
  measures: Record<string, number | string>[];  // 数据行
  sourceName?: string;        // 数据集名称
}

// 筛选器配置
interface FilterConfig {
  id: string;
  name: string;
  type: 'select' | 'date-range' | 'input';
  datasetId: string;
  field: string;
  defaultValue?: any;
}

// 图表配置
interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'table';
  datasetId: string;
  datasetBind?: DatasetBind;  // 数据绑定信息
  mapping: {
    xAxis?: string;          // X轴字段
    yAxis?: string[];        // Y轴字段
    series?: string;         // 系列字段（饼图用）
    value?: string;          // 数值字段
  };
  drillConfig?: DrillConfig; // 钻取配置
}

// 仪表盘配置
interface DashboardConfig {
  id: string;
  name: string;
  layout: GridLayout[];      // react-grid-layout 布局
  charts: ChartConfig[];
  filters: FilterConfig[];
  links: ChartLink[];        // 图表联动关系
}
```

### 4.3 后端 API 设计

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/report/datasets` | POST | 创建数据集（SQL/API） |
| `/api/report/datasets/{id}` | GET | 获取数据集详情 |
| `/api/report/datasets/{id}/data` | GET | 执行数据集获取数据 |
| `/api/report/dashboards` | POST | 创建仪表盘 |
| `/api/report/dashboards/{id}` | GET | 获取仪表盘配置 |
| `/api/report/dashboards/{id}` | PUT | 更新仪表盘 |
| `/api/report/dashboards/{id}/data` | POST | 批量获取仪表盘图表数据（含筛选参数） |

**数据集执行接口响应示例**：

```json
{
  "code": 0,
  "data": {
    "dimensions": ["date", "region"],
    "measures": [
      {"date": "2026-01", "region": "华北", "sales": 1000},
      {"date": "2026-01", "region": "华东", "sales": 1500}
    ],
    "cached": false,
    "costMs": 120
  }
}
```

### 4.4 图表组件实现示例

```typescript
// ChartShell.tsx - 统一图表壳
interface ChartShellProps {
  config: ChartConfig;
  dataset: ChartDataset;
  onDrill?: (data: any) => void;  // 钻取回调
  style?: React.CSSProperties;
}

export const ChartShell: React.FC<ChartShellProps> = ({ config, dataset, onDrill }) => {
  const handleClick = (params: any) => {
    if (config.drillConfig?.enabled && onDrill) {
      onDrill({
        dimension: params.name,
        value: params.value,
        chartId: config.id
      });
    }
  };

  const chartOption = useMemo(() => {
    return transformDatasetToECharts(dataset, config.mapping);
  }, [dataset, config.mapping]);

  return (
    <ReactECharts
      option={chartOption}
      onEvents={{ click: handleClick }}
      style={{ height: '100%', width: '100%' }}
    />
  );
};
```

### 4.5 联动与钻取流程

```
用户点击图表 → ChartShell onClick → useChartDrill hook
                                              ↓
                              检查是否有 linkedCharts
                                              ↓
                              调用 useDataset refresh 
                              带上钻取参数
                                              ↓
                              联动图表自动更新数据
```

---

## 五、开发计划建议

### Phase 1: 基础设施（1-2天）
- [ ] 前端：创建报表模块目录结构
- [ ] 前端：安装 echarts、echarts-for-react、react-grid-layout
- [ ] 后端：创建报表模块包结构
- [ ] 后端：数据集实体和表设计

### Phase 2: 核心组件（3-4天）
- [ ] 前端：实现 ChartShell 组件
- [ ] 前端：实现 LineChart、BarChart、PieChart、ScatterChart、DataTable
- [ ] 前端：实现 DatasetConfig 配置面板
- [ ] 后端：数据集 CRUD API
- [ ] 后端：SQL 执行器和 API 代理

### Phase 3: 仪表盘和联动（2-3天）
- [ ] 前端：实现 Dashboard 页面 + 拖拽布局
- [ ] 前端：实现 FilterBar 筛选器
- [ ] 前端：实现图表联动逻辑
- [ ] 前端：实现图表钻取功能

### Phase 4: 优化和完善（1-2天）
- [ ] 前端：响应式布局适配
- [ ] 后端：数据缓存优化
- [ ] 前端：图表加载状态和错误处理
- [ ] 文档和测试

**预计总工期：7-11 个工作日**

---

## 六、风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| SQL 注入 | 高 | 后端 SQL 参数化查询，禁止自定义 SQL |
| 大数据量图表卡顿 | 中 | ECharts 数据采样、滚动加载 |
| 外部 API 不稳定 | 中 | 后端添加超时、重试、熔断 |
| 图表联动循环依赖 | 中 | 联动关系有向无环图校验 |

---

## 七、决策点（待 PM 确认）

1. **是否需要支持实时数据刷新？**（定时轮询/长连接）
2. **仪表盘是否需要权限控制？**（查看/编辑权限）
3. **数据导出功能是否本次必须？**（Excel/CSV 导出）
4. **图表主题是否需要定制？**（深色模式适配）

---

*文档版本：v0.1 | Architect | 2026-03-25*
