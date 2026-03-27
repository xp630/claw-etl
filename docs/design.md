# 低代码平台 MVP - 功能设计稿 v2

## 项目概述

内部研发团队使用的低代码平台，支持页面/表单/看板的快速搭建。

## 技术栈

| 层级 | 技术选型 |
|------|---------|
| 前端框架 | Vue 3 + Vite 5 + TypeScript |
| UI 组件库 | Element Plus |
| 路由 | Vue Router |
| 数据请求 | Axios + Vite Proxy |
| 拖拽库 | @dnd-kit |
| 状态管理 | Pinia |
| 后端 API | http://localhost:8090/etl-admin/* |

### 跨域解决方案

开发环境：Vite Proxy 配置
```js
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8090',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '/etl-admin')
    }
  }
}
```

生产环境：Nginx 反向代理

## 核心功能

### 1. 生成表格
- 选择数据源 → 选择表 → 自动生成增删改查表格
- 支持列配置、筛选、排序、分页
- 一键发布

### 2. 生成表单
- 拖拽组件到画布
- 组件：输入框、下拉框、日期选择、文件上传...
- 绑定数据源字段
- 表单校验规则

### 3. 拖拽生成看板
- 拖拽图表组件：折线图、柱状图、饼图、指标卡...
- 绑定数据集/SQL 查询结果
- 仪表盘布局自由调整

## 设计原则

**操作越简便越好**
- 减少点击步骤
- 合理默认值
- 智能填充（自动生成标识、名称）
- 一键操作

## 页面清单

| 页面 | 功能 |
|------|------|
| /login | 登录页 |
| /dashboard | 首页/仪表盘 |
| /editor | 页面编辑器 |
| /preview | 页面预览 |
| /datasource | 数据源管理 |
| /users | 用户权限管理 |
| /settings | 系统设置 |

## API 对接

后端接口前缀：`http://localhost:8090/etl-admin/controller-context/`

主要接口模块：
- DataSourceManagerController - 数据源管理
- SourceDataManageController - 源数据管理
- SimpleDataExtractController - 数据抽取
- SqlManagerController - SQL 管理
- ApiManagerController - API 管理
- TaskController - 任务管理
- SysUserController - 用户管理

## 下一步

- [ ] 确认设计稿
- [ ] L3 PM 拆解任务
- [ ] L4 开发执行
