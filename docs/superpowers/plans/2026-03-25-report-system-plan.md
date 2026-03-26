# 报表系统开发计划

> 日期：2026-03-25
> 角色：Developer
> 状态：Ready for Development

---

## 一、需求概述

基于 brainstorming 文档分析，报表系统 V1 需要实现：
- 图表组件库（折线图、柱状图、饼图、数据表格）
- 数据集配置（SQL 查询绑定）
- 仪表盘（Grid 布局、多图表拼装）
- 基础筛选器（支持联动）

**V1 范围说明**：不考虑实时数据刷新、图表钻取功能（P1 阶段），图表主题使用默认主题。

---

## 二、技术选型

### 2.1 前端技术栈

| 模块 | 选型 | 版本 | 说明 |
|------|------|------|------|
| 图表库 | echarts | ^5.5.0 | 主流可视化库，支持丰富图表 |
| React 封装 | echarts-for-react | ^3.0.2 | ECharts 官方 React 组件 |
| 拖拽布局 | react-grid-layout | ^1.4.2 | 仪表盘拖拽布局 |
| 状态管理 | Zustand | ^5.0.0 | 仪表盘联动状态管理 |
| 图表类型 | @types/echarts | ^5.5.0 | TypeScript 类型支持 |

### 2.2 后端技术栈

| 模块 | 选型 | 说明 |
|------|------|------|
| SQL 执行 | JdbcTemplate | 复用现有数据源连接，参数化查询 |
| 框架 | Spring Boot | 复用现有项目结构 |
| 缓存 | Caffeine | 本地缓存热点数据 |
| 异步任务 | Spring Async + 线程池 | 执行耗时 SQL |

### 2.3 统一数据格式

```typescript
// 图表标准数据格式
interface ChartDataset {
  dimensions: string[];                          // 维度列名
  measures: Record<string, number \| string>[];  // 数据行
  sourceName?: string;                           // 数据集名称
}

// 筛选器配置
interface FilterConfig {
  id: string;
  name: string;
  type: 'select' \| 'date-range';
  datasetId: string;
  field: string;
  defaultValue?: any;
}

// 图表配置
interface ChartConfig {
  id: string;
  type: 'line' \| 'bar' \| 'pie' \| 'table';
  datasetId: string;
  mapping: {
    xAxis?: string;
    yAxis?: string[];
    series?: string;
    value?: string;
  };
}

// 仪表盘配置
interface DashboardConfig {
  id: string;
  name: string;
  layout: GridLayout[];
  charts: ChartConfig[];
  filters: FilterConfig[];
}
```

---

## 三、功能范围（V1）

### 3.1 图表组件

| 图表类型 | 组件文件 | 说明 |
|----------|----------|------|
| 折线图 | `LineChart.tsx` | 支持多系列、区域填充 |
| 柱状图 | `BarChart.tsx` | 支持堆叠、分组 |
| 饼图 | `PieChart.tsx` | 支持标签、玫瑰图模式 |
| 数据表格 | `DataTable.tsx` | 分页、排序支持 |

### 3.2 数据集配置

| 功能 | 说明 |
|------|------|
| SQL 查询绑定 | 支持参数化 SQL，绑定数据源 |
| 数据预览 | 执行 SQL 查看结果 |
| 数据缓存 | 后端缓存热点查询结果 |

### 3.3 仪表盘

| 功能 | 说明 |
|------|------|
| Grid 布局 | 基于 react-grid-layout 的拖拽布局 |
| 多图表拼装 | 支持添加/删除/调整图表 |
| 筛选器 | 日期范围筛选、条件下拉筛选 |
| 图表联动 | 筛选器 → 图表数据刷新 |

### 3.4 权限控制

- **复用已有权限体系**：仪表盘查看/编辑权限复用现有的菜单权限
- **数据集权限**：数据集与现有数据源权限联动

---

## 四、文件路径

### 4.1 前端文件

```
/Users/xp630/work/workspace/openclaw/claw-etl/src/pages/report/
├── Dashboard.tsx                    # 仪表盘主页面
├── DashboardList.tsx                # 仪表盘列表页
├── components/
│   ├── ChartShell.tsx              # 图表统一壳
│   ├── charts/
│   │   ├── LineChart.tsx           # 折线图
│   │   ├── BarChart.tsx            # 柱状图
│   │   ├── PieChart.tsx            # 饼图
│   │   └── DataTable.tsx           # 数据表格
│   ├── FilterBar.tsx               # 筛选器栏
│   ├── FilterItem.tsx              # 单个筛选器
│   └── DatasetConfig.tsx           # 数据集配置面板
├── hooks/
│   ├── useDataset.ts               # 数据集获取 hook
│   ├── useDashboard.ts             # 仪表盘状态管理
│   └── useFilter.ts                # 筛选器状态管理
├── services/
│   └── reportApi.ts                # 报表 API 服务
├── types/
│   └── report.ts                   # 类型定义
└── index.ts                        # 导出入口
```

### 4.2 后端文件

```
/Users/xp630/work/workspace/linkzl/dataEtlFrame/data-admin/src/main/java/com/linkzl/linzhi/report/
├── controller/
│   ├── DatasetController.java       # 数据集管理 API
│   └── DashboardController.java     # 仪表盘管理 API
├── service/
│   ├── DatasetService.java         # 数据集业务逻辑
│   ├── SqlExecutorService.java      # SQL 执行器
│   └── DashboardService.java       # 仪表盘业务逻辑
├── entity/
│   ├── Dataset.java                # 数据集实体
│   └── Dashboard.java              # 仪表盘实体
├── repository/
│   ├── DatasetRepository.java      # 数据集持久化
│   └── DashboardRepository.java    # 仪表盘持久化
├── dto/
│   ├── DatasetCreateDTO.java       # 数据集创建 DTO
│   ├── DatasetDataDTO.java         # 数据集数据 DTO
│   └── DashboardConfigDTO.java     # 仪表盘配置 DTO
└── config/
    └── ReportConfig.java           # 报表模块配置
```

---

## 五、API 设计

### 5.1 数据集 API

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/report/datasets` | POST | 创建数据集 |
| `/api/report/datasets` | GET | 查询数据集列表 |
| `/api/report/datasets/{id}` | GET | 获取数据集详情 |
| `/api/report/datasets/{id}` | PUT | 更新数据集 |
| `/api/report/datasets/{id}` | DELETE | 删除数据集 |
| `/api/report/datasets/{id}/data` | GET | 执行数据集获取数据 |

**数据集数据响应示例**：

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

### 5.2 仪表盘 API

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/report/dashboards` | POST | 创建仪表盘 |
| `/api/report/dashboards` | GET | 查询仪表盘列表 |
| `/api/report/dashboards/{id}` | GET | 获取仪表盘配置 |
| `/api/report/dashboards/{id}` | PUT | 更新仪表盘 |
| `/api/report/dashboards/{id}` | DELETE | 删除仪表盘 |
| `/api/report/dashboards/{id}/data` | POST | 批量获取仪表盘图表数据 |

---

## 六、开发任务分解（TDD 流程）

### Phase 1: 基础设施搭建（Day 1）

#### 前端任务

| 任务 | 测试文件 | 实现文件 | 验收标准 |
|------|----------|----------|----------|
| 创建报表模块目录结构 | - | - | 目录创建完成 |
| 安装依赖包 | - | package.json | echarts、echarts-for-react、react-grid-layout、zustand |
| 创建类型定义 | `types/report.test.ts` | `types/report.ts` | 类型定义完整 |
| 创建 API 服务 | `services/reportApi.test.ts` | `services/reportApi.ts` | API 方法测试通过 |

#### 后端任务

| 任务 | 测试文件 | 实现文件 | 验收标准 |
|------|----------|----------|----------|
| 创建后端包结构 | - | - | 包结构创建完成 |
| 数据集实体 | `entity/DatasetTest.java` | `entity/Dataset.java` | 实体字段测试通过 |
| 仪表盘实体 | `entity/DashboardTest.java` | `entity/Dashboard.java` | 实体字段测试通过 |
| Repository 接口 | `repository/DatasetRepositoryTest.java` | `repository/DatasetRepository.java` | CRUD 测试通过 |

---

### Phase 2: 数据集管理（Day 2-3）

#### 前端任务

| 任务 | 测试文件 | 实现文件 | 验收标准 |
|------|----------|----------|----------|
| useDataset hook | `hooks/useDataset.test.ts` | `hooks/useDataset.ts` | 数据获取逻辑测试通过 |
| DatasetConfig 组件 | `components/DatasetConfig.test.tsx` | `components/DatasetConfig.tsx` | 配置面板渲染测试通过 |

#### 后端任务

| 任务 | 测试文件 | 实现文件 | 验收标准 |
|------|----------|----------|----------|
| DatasetService | `service/DatasetServiceTest.java` | `service/DatasetService.java` | 业务逻辑测试通过 |
| SqlExecutorService | `service/SqlExecutorServiceTest.java` | `service/SqlExecutorService.java` | SQL 执行测试通过 |
| DatasetController | `controller/DatasetControllerTest.java` | `controller/DatasetController.java` | API 接口测试通过 |

---

### Phase 3: 图表组件封装（Day 4-5）

#### 前端任务

| 任务 | 测试文件 | 实现文件 | 验收标准 |
|------|----------|----------|----------|
| ChartShell 组件 | `components/ChartShell.test.tsx` | `components/ChartShell.tsx` | 数据转换、事件测试通过 |
| LineChart 组件 | `components/charts/LineChart.test.tsx` | `components/charts/LineChart.tsx` | 折线图渲染测试通过 |
| BarChart 组件 | `components/charts/BarChart.test.tsx` | `components/charts/BarChart.tsx` | 柱状图渲染测试通过 |
| PieChart 组件 | `components/charts/PieChart.test.tsx` | `components/charts/PieChart.tsx` | 饼图渲染测试通过 |
| DataTable 组件 | `components/charts/DataTable.test.tsx` | `components/charts/DataTable.tsx` | 表格渲染测试通过 |

---

### Phase 4: 仪表盘功能（Day 6-7）

#### 前端任务

| 任务 | 测试文件 | 实现文件 | 验收标准 |
|------|----------|----------|----------|
| useDashboard hook | `hooks/useDashboard.test.ts` | `hooks/useDashboard.ts` | 仪表盘状态管理测试通过 |
| useFilter hook | `hooks/useFilter.test.ts` | `hooks/useFilter.ts` | 筛选器状态测试通过 |
| FilterItem 组件 | `components/FilterItem.test.tsx` | `components/FilterItem.tsx` | 筛选器渲染测试通过 |
| FilterBar 组件 | `components/FilterBar.test.tsx` | `components/FilterBar.tsx` | 筛选器栏测试通过 |
| DashboardList 页面 | `pages/DashboardList.test.tsx` | `pages/DashboardList.tsx` | 列表页测试通过 |
| Dashboard 页面 | `pages/Dashboard.test.tsx` | `pages/Dashboard.tsx` | 仪表盘页面测试通过 |

#### 后端任务

| 任务 | 测试文件 | 实现文件 | 验收标准 |
|------|----------|----------|----------|
| DashboardService | `service/DashboardServiceTest.java` | `service/DashboardService.java` | 业务逻辑测试通过 |
| DashboardController | `controller/DashboardControllerTest.java` | `controller/DashboardController.java` | API 接口测试通过 |

---

### Phase 5: 集成与优化（Day 8）

#### 前端任务

| 任务 | 测试文件 | 实现文件 | 验收标准 |
|------|----------|----------|----------|
| 图表加载状态 | - | ChartShell.tsx | Loading 状态显示 |
| 错误处理 | - | ChartShell.tsx | 错误提示显示 |
| 响应式布局 | - | Dashboard.tsx | 适配不同屏幕 |

#### 后端任务

| 任务 | 测试文件 | 实现文件 | 验收标准 |
|------|----------|----------|----------|
| 数据缓存 | - | SqlExecutorService.java | Caffeine 缓存生效 |
| SQL 注入防护 | - | SqlExecutorService.java | 参数化查询生效 |

---

## 七、任务依赖关系

```
Phase 1 (Day 1)
    ├── 前端目录结构 ──────────────────┐
    ├── 后端包结构 ──────────────────┼── Phase 2 前置
    └── 类型定义 ────────────────────┘
            │
            ▼
Phase 2 (Day 2-3)          Phase 2 (Day 2-3)
    ├── DatasetService  ◄────►  DatasetController
    ├── SqlExecutorService      │
    └── Repository              │
            │                   │
            └─────────┬─────────┘
                      ▼
Phase 3 (Day 4-5)
    ├── ChartShell
    ├── LineChart ──┐
    ├── BarChart   │── 依赖 Phase 2 的 API
    ├── PieChart   │
    └── DataTable ─┘
            │
            ▼
Phase 4 (Day 6-7)
    ├── useDashboard ◄── 依赖 Phase 3 图表组件
    ├── FilterBar
    └── Dashboard ───── 依赖所有前置任务
            │
            ▼
Phase 5 (Day 8)
    └── 集成优化
```

---

## 八、验收标准

### 8.1 功能验收

- [ ] 可创建数据集，绑定 SQL 查询
- [ ] 可预览数据集执行结果
- [ ] 仪表盘支持添加折线图、柱状图、饼图、数据表格
- [ ] 仪表盘支持拖拽调整布局
- [ ] 筛选器可过滤图表数据
- [ ] 图表响应筛选器变化自动刷新

### 8.2 技术验收

- [ ] 所有核心组件有单元测试
- [ ] API 接口有集成测试
- [ ] SQL 执行使用参数化查询（防注入）
- [ ] 图表组件支持响应式

---

## 九、风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| SQL 注入 | 高 | 后端强制参数化查询，禁止拼接 SQL |
| 大数据量图表卡顿 | 中 | ECharts 数据采样、分页加载 |
| 筛选器循环联动 | 中 | 联动关系有向无环图校验 |
| 外部数据源超时 | 中 | 后端添加超时（30s）和重试机制 |

---

## 十、决策点确认

| 决策项 | 结论 | 说明 |
|--------|------|------|
| 实时数据刷新 | 不需要 | V1 版本不考虑，后续可加 |
| 仪表盘权限控制 | 需要 | 复用已有的权限体系 |
| 数据导出功能 | P1 暂不上 | V1 不实现，后续迭代 |
| 图表主题 | 默认主题 | 不做定制，后续统一主题 |

---

*文档版本：v0.1 | Developer | 2026-03-25*
