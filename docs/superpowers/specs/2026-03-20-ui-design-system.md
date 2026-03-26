# UI 设计规范文档

> 本规范定义了 Claw-ETL 管理系统的视觉设计标准，确保界面的一致性和专业性。

## 1. 概述

- **设计风格**: 现代简洁的深色主题优先，适合长时间使用的管理后台
- **设计原则**: 清晰的视觉层级、舒适的色彩搭配、一致的交互反馈
- **目标用户**: 开发人员、数据工程师

---

## 2. 色彩系统

### 2.1 主色板

| 用途 | 变量名 | 暗色主题 | 亮色主题 | 说明 |
|------|--------|----------|----------|------|
| 主背景 | `--bg-primary` | `#111827` | `#ffffff` | 最底层背景 |
| 次级背景 | `--bg-secondary` | `#1f2937` | `#f9fafb` | 侧边栏、卡片 |
| 三级背景 | `--bg-tertiary` | `#374151` | `#f3f4f6` | 输入框、表格 |
| 悬浮背景 | `--bg-hover` | `rgba(255,255,255,0.05)` | `rgba(0,0,0,0.05)` | 悬停状态 |
| 悬浮亮色 | `--bg-hover-light` | `rgba(255,255,255,0.03)` | `rgba(0,0,0,0.02)` | 表格行悬停 |
| 表格表头 | `--bg-table-header` | `rgba(255,255,255,0.03)` | `rgba(0,0,0,0.02)` | 表格表头 |
| 表格斑马纹 | `--bg-table-stripe` | `rgba(255,255,255,0.02)` | `rgba(0,0,0,0.01)` | 奇偶行区分 |

### 2.2 文字色板

| 用途 | 变量名 | 暗色主题 | 亮色主题 | WCAG 对比度 |
|------|--------|----------|----------|-------------|
| 主要文字 | `--text-primary` | `#f9fafb` | `#111827` | 15.8:1 ✅ |
| 次要文字 | `--text-secondary` | `#9ca3af` | `#4b5563` | 7.2:1 ✅ |
| 辅助文字 | `--text-muted` | `#6b7280` | `#9ca3af` | 4.6:1 ✅ |
| 输入文字 | `--text-input` | `#f3f4f6` | `#1f2937` | 14:1 ✅ |

### 2.3 边框色板

| 用途 | 变量名 | 暗色主题 | 亮色主题 |
|------|--------|----------|----------|
| 默认边框 | `--border` | `#374151` | `#e5e7eb` |
| 浅色边框 | `--border-light` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.06)` |

### 2.4 功能色板

| 用途 | 变量名 | 暗色主题 | 亮色主题 | 使用场景 |
|------|--------|----------|----------|----------|
| 主题色 | `--accent` | `#8b5cf6` | `#7c3aed` | 主要按钮、链接、选中态 |
| 主题色悬停 | `--accent-hover` | `#7c3aed` | `#6d28d9` | 按钮悬停态 |
| 主题色浅色 | `--accent-light` | `rgba(139,92,246,0.15)` | `rgba(124,58,237,0.12)` | 选中背景 |
| 成功色 | `--success` | `#10b981` | `#059669` | 成功提示 |
| 警告色 | `--warning` | `#f59e0b` | `#d97706` | 警告提示 |
| 危险色 | `--danger` | `#ef4444` | `#dc2626` | 错误、删除 |
| 信息色 | `--info` | `#3b82f6` | `#2563eb` | 信息提示 |

### 2.5 输入框色板

| 用途 | 变量名 | 暗色主题 | 亮色主题 |
|------|--------|----------|----------|
| 输入框背景 | `--input-bg` | `#1f2937` | `#ffffff` |
| 输入框边框 | `--input-border` | `#4b5563` | `#d1d5db` |

---

## 3. 字体系统

### 3.1 字体规范

- **主字体**: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- **等宽字体**: `'JetBrains Mono', 'Fira Code', monospace` (代码场景)

### 3.2 字体层级

| 用途 | 样式 | 字号 | 字重 | 行高 |
|------|------|------|------|------|
| 页面标题 | `text-xl font-semibold` | 20px | 600 | 1.3 |
| 卡片标题 | `text-lg font-semibold` | 18px | 600 | 1.3 |
| 表格表头 | `text-sm font-medium` | 14px | 500 | 1.4 |
| 正文 | `text-sm` | 14px | 400 | 1.5 |
| 辅助文字 | `text-xs` | 12px | 400 | 1.4 |
| 按钮文字 | `text-sm font-medium` | 14px | 500 | 1 |

---

## 4. 间距系统

### 4.1 间距单位

基于 4px 网格系统：
- `xs`: 4px
- `sm`: 8px
- `md`: 16px
- `lg`: 24px
- `xl`: 32px
- `2xl`: 48px

### 4.2 布局间距

| 场景 | 间距 |
|------|------|
| 页面内容区内边距 | 24px |
| 卡片内边距 | 16px |
| 表格单元格内边距 | 12px 16px |
| 表单项间距 | 16px |
| 按钮组间距 | 8px |
| 侧边栏展开宽度 | 256px |
| 侧边栏收起宽度 | 72px |
| Tab 栏高度 | 44px |
| 侧边栏 Logo 区域高度 | 64px |

---

## 5. 组件规范

### 5.1 按钮

**主要按钮**
```css
/* 背景 */
bg-[var(--accent)] hover:bg-[var(--accent-hover)]
/* 文字 */
text-white font-medium
/* 内边距 */
px-4 py-2
/* 圆角 */
rounded-lg
/* 过渡 */
transition-colors duration-150
```

**次要按钮**
```css
bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)]
text-[var(--text-primary)]
border border-[var(--border)]
```

**危险按钮**
```css
bg-[var(--danger)] hover:opacity-90
text-white
```

**图标按钮**
```css
p-2 rounded-lg
hover:bg-[var(--bg-hover)]
text-[var(--text-muted)] hover:text-[var(--text-primary)]
```

### 5.2 输入框

**标准输入框**
```css
bg-[var(--input-bg)]
border border-[var(--input-border)]
text-[var(--text-input)]
placeholder:text-[var(--text-muted)]
px-3 py-2
rounded-lg
focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:border-[var(--accent)]
transition-colors duration-150
```

**输入框尺寸**
- 默认: `h-10` (40px)
- 小型: `h-8` (32px)

### 5.3 表格

**表格容器**
```css
w-full
border border-[var(--border)]
rounded-lg
overflow-hidden
```

**表头**
```css
bg-[var(--bg-table-header)]
text-[var(--text-secondary)] text-sm font-medium
px-4 py-3
text-left
border-b border-[var(--border)]
```

**表格行**
```css
border-b border-[var(--border-light)]
last:border-b-0
hover:bg-[var(--bg-hover)]
transition-colors duration-100
```

**斑马纹行（可选）**
```css
odd:bg-[var(--bg-table-stripe)]
```

**表格单元格**
```css
px-4 py-3
text-sm text-[var(--text-primary)]
```

### 5.4 卡片

**基础卡片**
```css
bg-[var(--bg-secondary)]
border border-[var(--border)]
rounded-xl
p-4
```

### 5.5 模态框

**遮罩层**
```css
bg-black/60
backdrop-blur-sm
```

**模态框主体**
```css
bg-[var(--bg-secondary)]
border border-[var(--border)]
rounded-2xl
shadow-2xl
max-w-lg w-full
p-6
```

**标题**
```css
text-lg font-semibold text-[var(--text-primary)]
mb-4
```

### 5.6 Toast 通知

**容器**
```css
fixed top-4 right-4
z-50
flex flex-col gap-2
```

**通知气泡**
```css
px-4 py-3
rounded-lg
shadow-lg
text-white text-sm font-medium
min-w-[280px] max-w-[400px]

/* 类型 */
success: bg-[var(--success)]
error: bg-[var(--danger)]
info: bg-[var(--info)]
warning: bg-[var(--warning)]
```

### 5.7 下拉菜单

**菜单触发器**
```css
px-3 py-2
rounded-lg
hover:bg-[var(--bg-hover)]
cursor-pointer
```

**下拉面板**
```css
absolute right-0 top-full mt-1
bg-[var(--bg-secondary)]
border border-[var(--border)]
rounded-lg
shadow-lg
py-1
min-w-[160px]
z-50
```

**菜单项**
```css
px-4 py-2.5
text-sm text-[var(--text-secondary)]
hover:bg-[var(--bg-hover)]
hover:text-[var(--text-primary)]
cursor-pointer
transition-colors
```

---

## 6. 动效规范

### 6.1 过渡时长

| 场景 | 时长 |
|------|------|
| 微交互 (hover) | 150ms |
| 展开/收起 | 200ms |
| 页面过渡 | 300ms |
| Toast 入场 | 300ms ease-out |

### 6.2 动画类名

```css
/* Toast 入场 */
@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.animate-slide-in { animation: slideIn 0.3s ease-out; }
```

---

## 7. 图标规范

- **图标库**: Lucide React
- **图标尺寸**:* 侧边栏菜单: `w-5 h-5`
  * 按钮内: `w-4 h-4`
  * 装饰性: `w-6 h-6`
- **图标颜色**: 继承文字颜色或使用 `text-[var(--text-muted)]`

---

## 8. 暗色/亮色主题切换

主题通过 `data-theme` 属性切换：

```css
:root, [data-theme="dark"] { /* 暗色变量 */ }
[data-theme="light"] { /* 亮色变量 */ }
```

**注意事项**:
- 所有颜色必须使用 CSS 变量
- 禁止硬编码颜色值 (如 `bg-green-500`)
- 测试两种主题下的对比度是否满足 WCAG AA

---

## 9. 最佳实践

1. **颜色**: 所有颜色必须通过 CSS 变量引用，禁止硬编码
2. **间距**: 统一使用 Tailwind 间距类，基于 4px 网格
3. **圆角**: 统一使用 `rounded-lg` (8px)，模态框用 `rounded-xl` (12px)
4. **阴影**: 谨慎使用，仅在需要浮起元素时使用 `shadow-lg` 或 `shadow-xl`
5. **字体**: 避免自定义字体，优先使用系统字体栈
6. **图标**: 保持图标尺寸和颜色一致

---

## 10. 文件结构

```
src/
├── index.css              # CSS 变量定义
├── components/
│   ├── Layout.tsx         # 主布局
│   ├── Toast.tsx          # Toast 通知
│   └── Button.tsx         # 按钮组件 (可选)
├── pages/
│   └── *.tsx              # 页面组件
```

---

*最后更新: 2026-03-20*
