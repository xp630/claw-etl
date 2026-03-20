# 主题切换系统实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现深色/浅色两套主题的一键切换系统，通过 CSS 变量 + React Context 管理

**Architecture:** 使用 CSS 变量定义两套主题色，通过 `data-theme` 属性切换。ThemeContext 统一管理主题状态，localStorage 持久化主题配置。

**Tech Stack:** React 19, TypeScript, Tailwind CSS, localStorage

---

## 文件结构

```
src/
├── contexts/
│   └── ThemeContext.tsx    # 新增：主题 Context
├── index.css               # 修改：添加 CSS 变量定义
├── App.tsx                 # 修改：包裹 ThemeProvider
└── components/
    └── Layout.tsx         # 修改：添加主题切换 UI

改造页面组件（26个）：所有页面组件的颜色类名改造为 CSS 变量引用
```

---

## Task 1: CSS 变量基础

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: 备份并替换 index.css 中的 base 样式**

将当前的硬编码 body 样式替换为 CSS 变量定义：

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-[var(--bg-primary)] text-[var(--text-primary)];
  }
}

/* 暗色主题 (默认) */
:root,
[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --bg-hover: rgba(51, 65, 85, 0.5);
  --bg-hover-light: rgba(51, 65, 85, 0.2);
  --bg-table-header: rgba(30, 41, 59, 0.3);
  --bg-table-stripe: rgba(30, 41, 59, 0.5);
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --text-input: #e2e8f0;
  --border: #334155;
  --border-light: rgba(51, 65, 85, 0.5);
  --input-bg: #1e293b;
  --input-border: #334155;
  --accent: #a855f7;
  --accent-hover: #9333ea;
  --accent-light: rgba(168, 85, 247, 0.2);
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;
  --info: #3b82f6;
}

/* 浅色主题 */
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

- [ ] **Step 2: 验证 CSS 变量定义正确**

运行: `npm run dev`
检查: 页面应正常显示深色主题（与改造前一致）

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: 添加主题切换 CSS 变量基础"
```

---

## Task 2: ThemeContext

**Files:**
- Create: `src/contexts/ThemeContext.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: 创建 ThemeContext.tsx**

```tsx
// src/contexts/ThemeContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'dark';
  });

  const setTheme = (newTheme: Theme) => {
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    setThemeState(newTheme);
  };

  // 初始化时同步 DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export type { Theme, ThemeContextValue };
```

- [ ] **Step 2: 在 App.tsx 中包裹 ThemeProvider**

在 `src/App.tsx` 的 App 函数开头添加 ThemeProvider 包裹：

```tsx
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  // ... 现有代码 ...

  return (
    <ThemeProvider>
      <HashRouter>
        {/* 现有 Routes */}
      </HashRouter>
    </ThemeProvider>
  );
}
```

- [ ] **Step 3: 验证 ThemeContext 工作**

运行: `npm run dev`
检查: 控制台无错误，刷新页面主题保持深色

- [ ] **Step 4: Commit**

```bash
git add src/contexts/ThemeContext.tsx src/App.tsx
git commit -m "feat: 添加 ThemeContext 并在 App 中包裹"
```

---

## Task 3: Layout 切换入口

**Files:**
- Modify: `src/components/Layout.tsx`

- [ ] **Step 1: 在 Layout.tsx 顶栏添加主题切换下拉菜单**

在 Layout.tsx 中：

1. 导入 useTheme：
```tsx
import { useTheme } from '../contexts/ThemeContext';
```

2. 在 Layout 组件中使用：
```tsx
export default function Layout() {
  const { theme, setTheme } = useTheme();
  // ... 现有代码 ...
```

3. 在顶栏 Logo 旁边添加主题切换：

在 `h-16 flex items-center justify-center border-b` 的 div 中，找到 `systemName` 显示位置，在其后添加：

```tsx
<select
  value={theme}
  onChange={(e) => setTheme(e.target.value as 'dark' | 'light')}
  className="ml-3 px-2 py-1 rounded border text-xs cursor-pointer
    bg-[var(--bg-secondary)] text-[var(--text-primary)] border-[var(--border)]
    hover:border-[var(--accent)] transition-colors"
>
  <option value="dark">🌙 深色</option>
  <option value="light">☀️ 浅色</option>
</select>
```

- [ ] **Step 2: 验证主题切换**

运行: `npm run dev`
1. 点击主题切换下拉框，选择"浅色"
2. 页面应立即变为浅色主题
3. 刷新页面，主题应保持浅色
4. 切换回深色，刷新应保持深色

- [ ] **Step 3: Commit**

```bash
git add src/components/Layout.tsx
git commit -m "feat: 在 Layout 顶栏添加主题切换下拉框"
```

---

## Task 4: 全局颜色改造

这是工作量最大的任务，需要系统性替换所有页面组件中的硬编码颜色类名。

### 4.1 改造原则

每处替换规则：
- `bg-slate-900` → `bg-[var(--bg-primary)]`
- `bg-slate-800` → `bg-[var(--bg-secondary)]`
- `bg-slate-800/50` → `bg-[var(--bg-hover-light)]`
- `bg-slate-800/30` → `bg-[var(--bg-table-header)]`
- `bg-slate-700/50` → `bg-[var(--bg-hover)]`
- `hover:bg-slate-700/50` → `hover:bg-[var(--bg-hover)]`
- `hover:bg-slate-800/50` → `hover:bg-[var(--bg-hover-light)]`
- `text-slate-100` → `text-[var(--text-primary)]`
- `text-slate-200` → `text-[var(--text-input)]`
- `text-slate-300` → `text-[var(--text-secondary)]`
- `text-slate-400` → `text-[var(--text-muted)]`
- `placeholder-slate-400` → `placeholder:text-[var(--text-muted)]`
- `text-purple-400` → `text-[var(--accent)]`
- `text-purple-500` → `text-[var(--accent)]`
- `bg-purple-500` → `bg-[var(--accent)]`
- `bg-purple-500/20` → `bg-[var(--accent-light)]`
- `hover:bg-purple-500/10` → `hover:bg-[var(--accent-light)]`
- `border-slate-700` → `border-[var(--border)]`
- `border-slate-700/50` → `border-[var(--border-light)]`
- `focus:ring-purple-500/30` → `focus:ring-[var(--accent-light)]`
- `focus:border-purple-500/50` → `focus:border-[var(--accent-light)]`
- `bg-[#0f172a]` → `bg-[var(--bg-primary)]`
- `bg-[#1e293b]` → `bg-[var(--bg-secondary)]`
- `bg-[#0f172a]/60` → `bg-[var(--bg-primary)]/60`（保留透明度）

### 4.2 改造文件顺序

按依赖顺序改造：

**Files:**
- Modify: `src/pages/ApiList.tsx`
- Modify: `src/pages/ApiForm.tsx`
- Modify: `src/pages/DataSourceList.tsx`
- Modify: `src/pages/DataSourceForm.tsx`
- Modify: `src/pages/TaskList.tsx`
- Modify: `src/pages/TaskForm.tsx`
- Modify: `src/pages/AppList.tsx`
- Modify: `src/pages/AppForm.tsx`
- Modify: `src/pages/FeatureList.tsx`
- Modify: `src/pages/FeatureForm.tsx`
- Modify: `src/pages/DictList.tsx`
- Modify: `src/pages/DictForm.tsx`
- Modify: `src/pages/SystemConfigList.tsx`
- Modify: `src/pages/SystemConfigForm.tsx`
- Modify: `src/pages/RoleList.tsx`
- Modify: `src/pages/RoleForm.tsx`
- Modify: `src/pages/UserList.tsx`
- Modify: `src/pages/UserForm.tsx`
- Modify: `src/pages/MenuList.tsx`
- Modify: `src/pages/MenuForm.tsx`
- Modify: `src/pages/MenuFormModal.tsx`
- Modify: `src/pages/ApiAccessLog.tsx`
- Modify: `src/pages/Login.tsx`
- Modify: `src/components/Toast.tsx`
- Modify: `src/pages/DynamicDataGrid.tsx`

**改造示例（以 ApiList.tsx 为例）：**

旧代码：
```tsx
className="bg-[#1e293b]/60 border-r border-slate-700/50"
```

新代码：
```tsx
className="bg-[var(--bg-secondary)] border-r border-[var(--border-light)]"
```

- [ ] **Step 1: 逐个改造 ApiList.tsx**

读取文件，使用 replace_all 或逐处替换颜色类名

- [ ] **Step 2: 验证 ApiList.tsx**

运行: `npm run dev`
检查: ApiList 页面在深色/浅色主题下均正常显示

- [ ] **Step 3: 提交 ApiList.tsx**

```bash
git add src/pages/ApiList.tsx
git commit -m "refactor: ApiList 颜色变量化"
```

- [ ] **Step 4-24: 重复上述步骤，改造剩余 24 个文件**

每个文件单独 commit，便于追踪和回滚

- [ ] **Step 25: Commit 所有剩余改造**

```bash
git add -A
git commit -m "refactor: 全局颜色变量化改造完成"
```

---

## Task 5: 收尾测试

**Files:**
- 无文件修改，仅测试验证

- [ ] **Step 1: 测试主题持久化**

1. 切换到浅色主题
2. 刷新页面
3. 确认仍为浅色主题

- [ ] **Step 2: 测试登录/登出后主题保持**

1. 切换到浅色主题
2. 退出登录
3. 重新登录
4. 确认仍为浅色主题

- [ ] **Step 3: 测试深色/浅色切换效果**

1. 确认两套主题的颜色对比明显
2. 边框、hover 状态、focus 状态均正确应用
3. 无颜色突兀或显示错误

- [ ] **Step 4: 运行构建检查**

```bash
npm run build
```

确认无 TypeScript 错误和构建错误

- [ ] **Step 5: 最终 Commit**

```bash
git add -A
git commit -m "feat: 完成主题切换系统实现"
```

---

## 验收标准

1. ✅ 深色/浅色主题可一键切换
2. ✅ 切换后页面颜色立即变化
3. ✅ 刷新页面主题保持
4. ✅ 登录/登出后主题保持
5. ✅ 所有页面组件颜色正确应用
6. ✅ `npm run build` 无错误
