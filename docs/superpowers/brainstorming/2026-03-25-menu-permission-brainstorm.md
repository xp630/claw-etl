# 完善菜单与权限体系 - Brainstorming 文档

> **日期**: 2026-03-25  
> **参与者**: PM、架构师  
> **状态**: ✅ 已确认方案

---

## 1. 需求本质

```
"完善菜单与权限体系" 本质是解决三个问题：

1. 菜单-角色映射：哪个角色能看到哪个菜单（静态可见性）
2. 操作-权限校验：用户是否有权执行某个操作（运行时校验）
3. 变更审计：记录关键操作以支持追溯
```

---

## 2. 需求确认

### 2.1 需求边界

- 系统已有角色管理模块（RoleList/RoleForm）
- 菜单权限支持以下预设角色：
  - **超级管理员** (super_admin)：全部菜单 + 全部操作
  - **普通管理员** (admin)：大部分管理菜单
  - **普通用户** (user)：基础菜单（数据源、任务）
- 暂不需要自定义角色创建（角色体系已固定）

### 2.2 权限粒度

| 粒度 | 范围 | 优先级 |
|------|------|--------|
| 页面级 | 不同角色看到不同菜单 | P0（本次必须） |
| 操作级 | 编辑/删除/新建按钮的权限控制 | P1（扩展点预留） |
| API级 | API 访问权限 | 不在此范围（API管理模块独立控制）|

### 2.3 审计范围

- **记录内容**：增删改操作（谁、什么时候、做了什么）
- **保留策略**：30天（可配置）
- **查询操作**：暂不记录

---

## 3. 方案选择

### 3.1 方案对比

| 方案 | 架构思路 | 复杂度 | 实时性 | 安全性 | 审计实现 |
|------|----------|--------|--------|--------|----------|
| **A** 前端路由守卫 + 后端审计中间件 | 菜单配置增加 roles 字段，前端动态渲染，后端统一校验 | ⭐⭐ | 中 | ⚠️ 前端可绕过 | 后端中间件 |
| **B** 后端驱动（菜单/权限 DB 化） | 菜单、权限码、角色映射全部存数据库，动态下发 | ⭐⭐⭐ | 高 | ✅ 完全后端驱动 | 需额外同步 |
| **C** 前端配置 + 后端校验码 | 菜单放前端 menus.ts，权限码存数据库，后端校验 + AOP审计 | ⭐⭐ | 中 | ✅ 前后双重校验 | 装饰器侵入性低 |

### 3.2 选定方案

**方案 C：前端配置 + 后端校验码**

**理由**：
1. 菜单配置在前端 menus.ts，维护成本低（不需要后台管理菜单）
2. 权限码机制灵活，支持页面级 + 操作级（P1 扩展）
3. 审计日志用装饰器实现，侵入性低
4. 符合"低代码平台"快速迭代的特点

---

## 4. 选定方案详细设计

### 4.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                      前端 (React)                        │
├─────────────────────────────────────────────────────────┤
│  menus.ts                                               │
│  - path, title, icon, permissionCode                    │
│  - 菜单配置化，支持 roles 过滤                          │
│                                                         │
│  权限获取流程：                                          │
│  登录 → 获取用户角色 → 获取角色权限码 → 过滤菜单       │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                     后端 (API)                          │
├─────────────────────────────────────────────────────────┤
│  1. 角色权限表 (role_permissions)                       │
│     - role_id, permission_code                          │
│                                                         │
│  2. 权限校验中间件                                      │
│     - 检查请求携带的 permission_code                    │
│     - 与用户角色权限比对                                │
│                                                         │
│  3. 审计日志装饰器                                      │
│     - @AuditLog 记录 CUD 操作                          │
│     - 异步写入审计表                                    │
└─────────────────────────────────────────────────────────┘
```

### 4.2 数据模型

#### 4.2.1 菜单配置 (menus.ts)

```typescript
export interface MenuItem {
  path: string;
  title: string;
  icon: string;
  permissionCode: string;  // 权限码，如 'datasource:read'
  children?: MenuItem[];
}

export const menus: MenuItem[] = [
  {
    path: '/datasources',
    title: '数据源管理',
    icon: 'Database',
    permissionCode: 'datasource:read',
    children: [
      { path: '/datasources', title: '列表', icon: 'List', permissionCode: 'datasource:read' },
      { path: '/datasources/new', title: '新建', icon: 'Plus', permissionCode: 'datasource:write', isAction: true },
      { path: '/datasources/:id/edit', title: '编辑', icon: 'Edit', permissionCode: 'datasource:write', isAction: true },
      { path: '/datasources/:id/delete', title: '删除', icon: 'Trash', permissionCode: 'datasource:delete', isAction: true },
    ]
  },
  {
    path: '/tasks',
    title: '任务管理',
    icon: 'ListTodo',
    permissionCode: 'task:read',
    children: [
      { path: '/tasks', title: '列表', icon: 'List', permissionCode: 'task:read' },
      { path: '/tasks/new', title: '新建', icon: 'Plus', permissionCode: 'task:write', isAction: true },
    ]
  },
  // P1 扩展预留
  {
    path: '/roles',
    title: '角色管理',
    icon: 'Users',
    permissionCode: 'role:manage',
  },
  {
    path: '/audit',
    title: '审计日志',
    icon: 'FileText',
    permissionCode: 'audit:read',
  },
];
```

#### 4.2.2 角色权限表 (SQL)

```sql
-- 角色表
CREATE TABLE roles (
  id          VARCHAR(36) PRIMARY KEY,
  name        VARCHAR(50) NOT NULL UNIQUE,  -- super_admin, admin, user
  display_name VARCHAR(100),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 权限码表
CREATE TABLE permission_codes (
  code        VARCHAR(100) PRIMARY KEY,
  name        VARCHAR(200),
  category    VARCHAR(50),  -- datasource, task, role, audit
  description VARCHAR(500)
);

-- 角色-权限映射表
CREATE TABLE role_permissions (
  role_id          VARCHAR(36),
  permission_code  VARCHAR(100),
  PRIMARY KEY (role_id, permission_code),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (permission_code) REFERENCES permission_codes(code)
);

-- 审计日志表
CREATE TABLE audit_logs (
  id            VARCHAR(36) PRIMARY KEY,
  user_id      VARCHAR(36) NOT NULL,
  user_name    VARCHAR(100),
  action       VARCHAR(20) NOT NULL,   -- CREATE, UPDATE, DELETE
  resource     VARCHAR(50) NOT NULL,  -- datasource, task, role
  resource_id  VARCHAR(36),
  detail       JSON,                   -- 变更详情
  ip           VARCHAR(50),
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 审计日志保留策略（MySQL Event 或定时任务）
-- DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

#### 4.2.3 初始数据

```sql
-- 角色
INSERT INTO roles (id, name, display_name) VALUES
  ('r001', 'super_admin', '超级管理员'),
  ('r002', 'admin', '普通管理员'),
  ('r003', 'user', '普通用户');

-- 权限码
INSERT INTO permission_codes (code, name, category, description) VALUES
  -- 数据源权限
  ('datasource:read', '查看数据源', 'datasource', '查看数据源列表和详情'),
  ('datasource:write', '管理数据源', 'datasource', '新建和编辑数据源'),
  ('datasource:delete', '删除数据源', 'datasource', '删除数据源'),
  -- 任务权限
  ('task:read', '查看任务', 'task', '查看任务列表和详情'),
  ('task:write', '管理任务', 'task', '新建和编辑任务'),
  ('task:delete', '删除任务', 'task', '删除任务'),
  -- 角色权限（P1）
  ('role:manage', '管理角色', 'role', '查看和管理角色'),
  -- 审计权限
  ('audit:read', '查看审计日志', 'audit', '查看审计日志');

-- 角色-权限映射
-- 超级管理员：全部权限
INSERT INTO role_permissions (role_id, permission_code) VALUES
  ('r001', 'datasource:read'), ('r001', 'datasource:write'), ('r001', 'datasource:delete'),
  ('r001', 'task:read'), ('r001', 'task:write'), ('r001', 'task:delete'),
  ('r001', 'role:manage'), ('r001', 'audit:read');

-- 普通管理员：数据源+任务全权限，无角色管理
INSERT INTO role_permissions (role_id, permission_code) VALUES
  ('r002', 'datasource:read'), ('r002', 'datasource:write'), ('r002', 'datasource:delete'),
  ('r002', 'task:read'), ('r002', 'task:write'), ('r002', 'task:delete'),
  ('r002', 'audit:read');

-- 普通用户：只读权限
INSERT INTO role_permissions (role_id, permission_code) VALUES
  ('r003', 'datasource:read'),
  ('r003', 'task:read');
```

### 4.3 核心组件设计

#### 4.3.1 前端菜单过滤

```typescript
// 获取用户可见菜单
function filterMenusByRole(menus: MenuItem[], userPermissions: string[]): MenuItem[] {
  return menus
    .map(menu => {
      // 如果用户没有此菜单的查看权限，整个菜单过滤掉
      if (!userPermissions.includes(menu.permissionCode)) {
        return null;
      }
      // 递归过滤子菜单
      if (menu.children) {
        const filteredChildren = filterMenusByRole(menu.children, userPermissions);
        if (filteredChildren.length === 0) {
          return null;
        }
        return { ...menu, children: filteredChildren };
      }
      return menu;
    })
    .filter(Boolean) as MenuItem[];
}
```

#### 4.3.2 前端操作级权限（预留 P1）

```typescript
// hooks/usePermission.ts
export function usePermission(requiredCode: string): boolean {
  const { permissions } = useUser();
  return permissions.includes(requiredCode);
}

// 使用示例
function DeleteButton({ id }) {
  const canDelete = usePermission('datasource:delete');
  if (!canDelete) return null;
  return <button onClick={() => handleDelete(id)}>删除</button>;
}
```

#### 4.3.3 后端权限校验中间件

```typescript
// middleware/permission.ts
interface PermissionContext {
  userId: string;
  roleId: string;
  permissions: string[];
}

function createPermissionMiddleware(requiredCode: string) {
  return async (ctx, next) => {
    const userPermissions = ctx.state.user?.permissions || [];
    if (!userPermissions.includes(requiredCode)) {
      ctx.status = 403;
      ctx.body = { error: '无权限执行此操作' };
      return;
    }
    await next();
  };
}
```

#### 4.3.4 后端审计日志装饰器

```typescript
// decorator/audit.ts
function AuditLog(action: string, resource: string) {
  return function(target, propertyKey, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function(...args) {
      const result = await originalMethod.apply(this, args);
      // 异步写入审计日志
      const userId = this.ctx.state.user?.id;
      const resourceId = result?.id;
      await auditService.log({
        userId,
        action,
        resource,
        resourceId,
        detail: { args, result },
        ip: this.ctx.ip
      });
      return result;
    };
    return descriptor;
  };
}

// 使用示例
class DatasourceService {
  @AuditLog('CREATE', 'datasource')
  async create(data) { /* ... */ }

  @AuditLog('UPDATE', 'datasource')
  async update(id, data) { /* ... */ }

  @AuditLog('DELETE', 'datasource')
  async delete(id) { /* ... */ }
}
```

### 4.4 API 设计

#### 4.4.1 获取用户权限

```
GET /api/auth/permissions
Response: {
  roleId: string,
  permissions: string[],  // ['datasource:read', 'datasource:write', ...]
  menus: MenuItem[]       // 已过滤的菜单树
}
```

### 4.5 审计日志保留

```sql
-- 定时清理任务（每天凌晨2点执行）
DELETE FROM audit_logs
WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 可配置保留天数通过系统配置表管理
-- INSERT INTO system_config (key, value) VALUES ('audit_retention_days', '30');
```

---

## 5. 实现计划（简略）

| 阶段 | 任务 | 优先级 |
|------|------|--------|
| P0 | 数据库表创建（roles, permission_codes, role_permissions, audit_logs） | 必须 |
| P0 | 后端权限校验中间件 | 必须 |
| P0 | 前端菜单配置完善 + 过滤逻辑 | 必须 |
| P0 | 前端登录后获取权限并缓存 | 必须 |
| P0 | 后端审计日志装饰器 | 必须 |
| P1 | 操作级权限按钮控制 | 扩展点 |
| P1 | 审计日志页面 | 扩展点 |
| P2 | 审计日志导出 | 后续 |

---

## 6. 技术风险

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 前端菜单过滤可被绕过 | ⚠️ 中 | 后端 API 层必须校验权限码 |
| 审计日志异步写入可能丢失 | ⚠️ 中 | 写入失败重试 + 降级日志 |
| 权限变更需要用户重新登录 | 低 | 权限变更推送（可选 P2） |

---

## 7. 结论

✅ **方案 C 已确认**：前端 menus.ts 配置 + 数据库存储角色权限映射 + 后端校验码 + AOP 审计

下一步进入 **Writing Plans** 阶段，输出详细实现计划。
