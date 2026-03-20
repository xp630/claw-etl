# 低代码平台主题切换系统设计文档

## 1. 概述

**项目：** claw-etl 低代码平台
**功能：** 主题切换系统（换肤）
**日期：** 2026-03-20
**状态：** 已批准

### 1.1 背景

当前平台仅支持深色主题（slate 色系），颜色以 Tailwind 类名硬编码方式分散在 20+ 个组件中。本设计提供一套可持续的主题切换机制，支持深色/浅色两套预设主题，并预留扩展能力。

### 1.2 目标

- 实现深色/浅色两套主题的一键切换
- 主题配置通过 localStorage 持久化
- 全局颜色使用 CSS 变量统一管理
- 最小化对现有组件代码的侵入

---

## 2. 技术方案

### 2.1 核心技术选型

- **CSS 变量** + `data-theme` 属性切换
- **React Context** 管理主题状态
- **Tailwind CSS** 现有类名改造为 CSS 变量引用

### 2.2 架构图

```
┌─────────────────────────────────────────────────────────┐
│  index.css                                              │
│  ├── [data-theme="dark"]  CSS Variables                 │
│  └── [data-theme="light"] CSS Variables                 │
├─────────────────────────────────────────────────────────┤
│  ThemeContext.tsx                                       │
│  ├── theme: 'dark' | 'light'                           │
│  ├── setTheme(theme) → 更新 DOM + localStorage          │
├─────────────────────────────────────────────────────────┤
│  App.tsx                                                │
│  └── <ThemeProvider> → 包裹整个应用                     │
├─────────────────────────────────────────────────────────┤
│  Layout.tsx                                             │
│  └── 主题切换下拉菜单 → 调用 setTheme                   │
└─────────────────────────────────────────────────────────┘
```

---

## 3. CSS 变量设计

### 3.1 暗色主题 (默认)

```css
[data-theme="dark"] {
  --bg-primary: #0f172a;           /* 页面背景 */
  --bg-secondary: #1e293b;        /* 卡片/侧边栏背景 */
  --bg-tertiary: #334155;         /* hover/active 背景 */
  --bg-hover: rgba(51, 65, 85, 0.5); /* hover 悬浮背景 */
  --bg-hover-light: rgba(51, 65, 85, 0.2); /* hover 浅色 */
  --bg-table-header: rgba(30, 41, 59, 0.3); /* 表格表头背景 */
  --bg-table-stripe: rgba(30, 41, 59, 0.5); /* 表格斑马纹 */
  --text-primary: #f1f5f9;        /* 主文字 */
  --text-secondary: #94a3b8;      /* 次要文字 */
  --text-muted: #64748b;         /* 占位符/禁用文字 */
  --text-input: #e2e8f0;         /* 输入框文字 */
  --border: #334155;             /* 边框 */
  --border-light: rgba(51, 65, 85, 0.5); /* 浅色边框 */
  --input-bg: #1e293b;           /* 输入框背景 */
  --input-border: #334155;       /* 输入框边框 */
  --accent: #a855f7;             /* 紫色强调色 */
  --accent-hover: #9333ea;       /* 强调色 hover */
  --accent-light: rgba(168, 85, 247, 0.2); /* 强调色浅色背景 */
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
  --info: #3b82f6;
}
```

### 3.2 浅色主题

```css
[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #e2e8f0;
  --bg-hover: rgba(226, 232, 240, 0.6);
  --bg-hover-light: rgba(226, 232, 240, 0.4);
  --bg-table-header: rgba(241, 245, 249, 0.8);
  --bg-table-stripe: rgba(241, 245, 249, 0.5);
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --text-input: #1e293b;
  --border: #e2e8f0;
  --border-light: rgba(226, 232, 240, 0.8);
  --input-bg: #f1f5f9;
  --input-border: #cbd5e1;
  --accent: #7c3aed;
  --accent-hover: #6d28d9;
  --accent-light: rgba(124, 58, 237, 0.15);
  --success: #16a34a;
  --warning: #d97706;
  --danger: #dc2626;
  --info: #2563eb;
}
```

---

## 4. 组件设计

### 4.1 ThemeContext

```tsx
// src/contexts/ThemeContext.tsx
interface ThemeContextValue {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}
```

**职责：**
- 维护当前主题状态
- 提供 setTheme 方法
- 初始化时从 localStorage 读取主题
- 主题切换时同步更新 DOM 和 localStorage

### 4.2 主题切换入口

**位置：** Layout.tsx 顶栏区域

**UI：** 下拉选择框
- 🌙 深色
- ☀️ 浅色

---

## 5. 颜色映射规则

现有 Tailwind 类名 → CSS 变量映射：

| 现有类名 | CSS 变量 |
|----------|----------|
| `bg-slate-900` | `bg-[var(--bg-primary)]` |
| `bg-slate-800` | `bg-[var(--bg-secondary)]` |
| `bg-slate-800/50` | `bg-[var(--bg-hover-light)]` |
| `bg-slate-800/30` | `bg-[var(--bg-table-header)]` |
| `bg-slate-700/50` | `bg-[var(--bg-hover)]` |
| `bg-slate-700/20` | `bg-[var(--bg-hover-light)]` |
| `hover:bg-slate-700/50` | `hover:bg-[var(--bg-hover)]` |
| `hover:bg-slate-800/50` | `hover:bg-[var(--bg-hover-light)]` |
| `text-slate-100` | `text-[var(--text-primary)]` |
| `text-slate-200` | `text-[var(--text-input)]` |
| `text-slate-300` | `text-[var(--text-secondary)]` |
| `text-slate-400` | `text-[var(--text-muted)]` |
| `placeholder-slate-400` | `placeholder:text-[var(--text-muted)]` |
| `placeholder-slate-600` | `placeholder:text-[var(--text-muted)]` |
| `text-purple-400` | `text-[var(--accent)]` |
| `text-purple-500` | `text-[var(--accent)]` |
| `bg-purple-500` | `bg-[var(--accent)]` |
| `bg-purple-500/20` | `bg-[var(--accent-light)]` |
| `hover:bg-purple-500/10` | `hover:bg-[var(--accent-light)]` |
| `border-slate-700` | `border-[var(--border)]` |
| `border-slate-700/50` | `border-[var(--border-light)]` |
| `focus:ring-purple-500/30` | `focus:ring-[var(--accent-light)]` |
| `focus:border-purple-500/50` | `focus:border-[var(--accent-light)]` |
| `bg-[#0f172a]` (inline style) | `bg-[var(--bg-primary)]` |
| `bg-[#1e293b]` (inline style) | `bg-[var(--bg-secondary)]` |

---

## 6. 改造文件清单

### 6.1 新增文件

| 文件 | 说明 |
|------|------|
| `src/contexts/ThemeContext.tsx` | 主题 Context |
| `src/hooks/useTheme.ts` | 主题 Hook (可选，便携调用) |

### 6.2 改造文件

| 文件 | 改动说明 |
|------|----------|
| `src/index.css` | 新增 CSS 变量定义 |
| `src/App.tsx` | 包裹 ThemeProvider |
| `src/components/Layout.tsx` | 添加主题切换 UI |
| `src/pages/ApiList.tsx` | 全局颜色变量化 |
| `src/pages/ApiForm.tsx` | 全局颜色变量化 |
| `src/pages/DataSourceList.tsx` | 全局颜色变量化 |
| `src/pages/DataSourceForm.tsx` | 全局颜色变量化 |
| `src/pages/TaskList.tsx` | 全局颜色变量化 |
| `src/pages/TaskForm.tsx` | 全局颜色变量化 |
| `src/pages/AppList.tsx` | 全局颜色变量化 |
| `src/pages/AppForm.tsx` | 全局颜色变量化 |
| `src/pages/FeatureList.tsx` | 全局颜色变量化 |
| `src/pages/FeatureForm.tsx` | 全局颜色变量化 |
| `src/pages/DictList.tsx` | 全局颜色变量化 |
| `src/pages/DictForm.tsx` | 全局颜色变量化 |
| `src/pages/SystemConfigList.tsx` | 全局颜色变量化 |
| `src/pages/SystemConfigForm.tsx` | 全局颜色变量化 |
| `src/pages/RoleList.tsx` | 全局颜色变量化 |
| `src/pages/RoleForm.tsx` | 全局颜色变量化 |
| `src/pages/UserList.tsx` | 全局颜色变量化 |
| `src/pages/UserForm.tsx` | 全局颜色变量化 |
| `src/pages/MenuList.tsx` | 全局颜色变量化 |
| `src/pages/MenuForm.tsx` | 全局颜色变量化 |
| `src/pages/Login.tsx` | 全局颜色变量化 |
| `src/components/Toast.tsx` | 全局颜色变量化 |
| `src/pages/DynamicDataGrid.tsx` | 全局颜色变量化 |
| `src/pages/ApiAccessLog.tsx` | 全局颜色变量化 |
| `src/pages/MenuFormModal.tsx` | 全局颜色变量化 |

---

## 7. 实现步骤

### Step 1: CSS 变量基础
- [ ] 在 index.css 中定义 data-theme CSS 变量
- [ ] 确保暗色主题与当前视觉一致

### Step 2: ThemeContext
- [ ] 创建 ThemeContext.tsx
- [ ] 在 App.tsx 中包裹 ThemeProvider
- [ ] 初始化时读取 localStorage 并同步 DOM

### Step 3: Layout 切换入口
- [ ] 在 Layout.tsx 顶栏添加主题切换下拉框
- [ ] 绑定 setTheme 方法

### Step 4: 全局颜色改造
- [ ] 系统性替换所有页面组件中的硬编码颜色类名
- [ ] 验证暗色/浅色主题切换效果

### Step 5: 收尾
- [ ] 测试主题切换后刷新页面保持
- [ ] 测试登录/登出后主题保持

---

## 8. 扩展性说明

本设计预留以下扩展能力：

1. **更多预设主题**：在 index.css 中新增 `[data-theme="green"]` 等块即可
2. **后端主题配置**：将 localStorage 替换为后端接口返回
3. **用户级别主题保存**：在用户表中增加 theme 字段

---

## 9. 风险与注意事项

1. **改造量大**：涉及 20+ 文件的颜色替换，需要细心避免遗漏
2. **硬编码颜色**：代码中存在 `bg-[#0f172a]` 等 inline 样式，需统一改为 CSS 变量
3. **第三方组件**：当前项目仅使用 lucide-react 图标库，不涉及第三方 UI 组件，暂无适配问题
4. **登录页特殊处理**：Login.tsx 作为未登录状态的页面，主题切换不影响其深色风格（保持与 Layout 一致的深色背景）
