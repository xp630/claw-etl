# 完善菜单与权限体系 - 开发计划

> **日期**: 2026-03-25
> **状态**: 📋 开发计划
> **基于**: `2026-03-25-menu-permission-brainstorm.md`

---

## 1. 概述

### 1.1 目标
建立完整的菜单与权限体系，实现：
1. **菜单-角色映射**：不同角色看到不同菜单
2. **操作-权限校验**：运行时校验用户操作权限
3. **变更审计**：记录关键操作支持追溯

### 1.2 技术方案
- **前端**：menus.ts 配置 + 动态过滤
- **后端**：权限码校验中间件 + AOP 审计日志装饰器
- **数据库**：角色、权限码、映射表、审计日志表

### 1.3 交付物路径
| 交付物 | 路径 |
|--------|------|
| 数据库迁移脚本 | `/Users/xp630/work/workspace/linkzl/dataEtlFrame/sql/` |
| 后端权限模块 | `/Users/xp630/work/workspace/linkzl/dataEtlFrame/data-admin/src/main/java/com/linkzl/linzhi/permissions/` |
| 后端审计模块 | `/Users/xp630/work/workspace/linkzl/dataEtlFrame/data-admin/src/main/java/com/linkzl/linzhi/audit/` |
| 前端菜单配置 | `/Users/xp630/work/workspace/openclaw/claw-etl/src/config/menu.ts` |
| 前端权限 Hook | `/Users/xp630/work/workspace/openclaw/claw-etl/src/hooks/usePermission.ts` |

### 1.4 前后端代码位置
- **前端**: `/Users/xp630/work/workspace/openclaw/claw-etl/` (React 19 + TypeScript + Vite)
- **后端**: `/Users/xp630/work/workspace/linkzl/dataEtlFrame/` (Java Spring Boot)
  - 主模块: `data-admin`
  - 包路径: `com.linkzl.linzhi`

---

## 2. 数据库设计

### 2.1 任务清单
- [ ] 创建数据库迁移脚本
- [ ] 创建 roles 表
- [ ] 创建 permission_codes 表
- [ ] 创建 role_permissions 表
- [ ] 创建 audit_logs 表
- [ ] 插入初始数据

### 2.2 迁移脚本内容

```sql
-- SQL脚本位置: /Users/xp630/work/workspace/linkzl/dataEtlFrame/sql/xxx_add_permission_tables.sql

-- 角色表
CREATE TABLE roles (
  id            VARCHAR(36) PRIMARY KEY,
  name          VARCHAR(50) NOT NULL UNIQUE COMMENT '角色标识: super_admin, admin, user',
  display_name  VARCHAR(100) NOT NULL COMMENT '显示名称',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 权限码表
CREATE TABLE permission_codes (
  code          VARCHAR(100) PRIMARY KEY COMMENT '权限码: module:action',
  name          VARCHAR(200) NOT NULL COMMENT '权限名称',
  category      VARCHAR(50) COMMENT '所属模块: datasource, task, role, audit',
  description   VARCHAR(500) COMMENT '权限描述',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='权限码表';

-- 角色-权限映射表
CREATE TABLE role_permissions (
  role_id         VARCHAR(36),
  permission_code VARCHAR(100),
  PRIMARY KEY (role_id, permission_code),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_code) REFERENCES permission_codes(code) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色权限映射表';

-- 审计日志表
CREATE TABLE audit_logs (
  id            VARCHAR(36) PRIMARY KEY,
  user_id       VARCHAR(36) NOT NULL COMMENT '操作用户ID',
  user_name     VARCHAR(100) COMMENT '操作用户名',
  action        VARCHAR(20) NOT NULL COMMENT '操作类型: CREATE, UPDATE, DELETE',
  resource      VARCHAR(50) NOT NULL COMMENT '资源类型: datasource, task, role',
  resource_id   VARCHAR(36) COMMENT '资源ID',
  detail        JSON COMMENT '变更详情',
  ip            VARCHAR(50) COMMENT 'IP地址',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at),
  INDEX idx_user_id (user_id),
  INDEX idx_resource (resource, resource_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审计日志表';

-- 初始数据：角色
INSERT INTO roles (id, name, display_name) VALUES
  ('r001', 'super_admin', '超级管理员'),
  ('r002', 'admin', '普通管理员'),
  ('r003', 'user', '普通用户');

-- 初始数据：权限码
INSERT INTO permission_codes (code, name, category, description) VALUES
  ('datasource:read', '查看数据源', 'datasource', '查看数据源列表和详情'),
  ('datasource:write', '管理数据源', 'datasource', '新建和编辑数据源'),
  ('datasource:delete', '删除数据源', 'datasource', '删除数据源'),
  ('task:read', '查看任务', 'task', '查看任务列表和详情'),
  ('task:write', '管理任务', 'task', '新建和编辑任务'),
  ('task:delete', '删除任务', 'task', '删除任务'),
  ('role:manage', '管理角色', 'role', '查看和管理角色'),
  ('audit:read', '查看审计日志', 'audit', '查看审计日志');

-- 初始数据：角色权限映射
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

---

## 3. 后端开发

### 3.1 模块结构

```
data-admin/src/main/java/com/linkzl/linzhi/
├── permissions/
│   ├── PermissionController.java      # 权限API控制器
│   ├── PermissionService.java         # 权限服务
│   ├── PermissionServiceImpl.java     # 权限服务实现
│   ├── RoleController.java            # 角色API控制器
│   ├── RoleService.java               # 角色服务
│   └── interceptor/
│       └── PermissionInterceptor.java  # 权限校验拦截器
├── audit/
│   ├── AuditController.java          # 审计日志API控制器
│   ├── AuditService.java              # 审计服务
│   ├── AuditServiceImpl.java          # 审计服务实现
│   ├── AuditLog.java                  # 审计日志实体
│   └── annotation/
│       └── AuditLogAnnotation.java    # 审计日志注解
└── model/entity/
    ├── Role.java                      # 角色实体
    ├── PermissionCode.java            # 权限码实体
    ├── RolePermission.java            # 角色权限映射实体
    └── User.java                      # 用户实体（含roleId）
```

### 3.2 任务清单

#### 3.2.1 权限模块
- [ ] **Task 1**: 创建 permissions/types.ts
  - 定义 `Role`, `PermissionCode`, `UserPermission` 类型
- [ ] **Task 2**: 创建 permissions/roleRepository.ts
  - `findById(id)`: 根据ID获取角色
  - `findByName(name)`: 根据名称获取角色
  - `findAll()`: 获取所有角色
- [ ] **Task 3**: 创建 permissions/permissionRepository.ts
  - `findByRoleId(roleId)`: 获取角色的所有权限码
  - `findUserPermissions(userId)`: 获取用户的权限列表（含角色继承）
- [ ] **Task 4**: 创建 permissions/permissionService.ts
  - `getUserPermissions(userId)`: 获取用户完整权限列表
  - `hasPermission(userId, code)`: 检查用户是否有指定权限
- [ ] **Task 5**: 创建 permissions/permissionMiddleware.ts
  - `requirePermission(code)`: 创建权限校验中间件函数
  - `requireAnyPermission(...codes)`: 任意一个权限满足即可
  - `requireAllPermissions(...codes)`: 所有权限都必须满足

#### 3.2.2 审计模块
- [ ] **Task 6**: 创建 audit/types.ts
  - 定义 `AuditLog`, `AuditAction`, `AuditResource` 类型
- [ ] **Task 7**: 创建 audit/auditRepository.ts
  - `create(log)`: 创建审计日志
  - `findByTimeRange(start, end)`: 按时间范围查询
  - `findByUser(userId)`: 按用户查询
  - `findByResource(resource, resourceId)`: 按资源查询
  - `deleteOldLogs(retentionDays)`: 清理过期日志
- [ ] **Task 8**: 创建 audit/auditService.ts
  - `log(options)`: 记录审计日志（异步）
  - `cleanup(retentionDays)`: 清理过期日志
- [ ] **Task 9**: 创建 audit/auditDecorator.ts
  - `@AuditLog(action, resource)`: 审计日志装饰器
  - 自动捕获方法参数和返回值

---

## 4. 前端开发

### 4.1 模块结构

```
/Users/xp630/work/workspace/openclaw/claw-etl/src/
├── config/
│   └── menu.ts               # 菜单配置（需补充permissionCode）
├── contexts/
│   └── AuthContext.tsx       # 扩展：增加权限信息
├── hooks/
│   └── usePermission.ts      # 权限 Hook（新建）
├── components/
│   └── PermissionGate.tsx    # 权限门控组件（新建）
└── lib/
    └── api.ts                # 扩展：增加权限相关API
```

### 4.2 任务清单

#### 4.2.1 菜单配置
- [ ] **Task 10**: 更新 configs/menus.ts
  - 添加 permissionCode 字段
  - 添加 isAction 字段标识操作级菜单
  - 完善角色-菜单映射

#### 4.2.2 权限 Hook
- [ ] **Task 11**: 创建 hooks/usePermission.ts
  - `usePermission()`: 获取当前用户权限列表
  - `hasPermission(code)`: 检查是否有指定权限
  - `canAccess(path)`: 检查是否可以访问指定路径

- [ ] **Task 12**: 创建 hooks/useMenuFilter.ts
  - `useMenuFilter()`: 根据权限过滤菜单树

#### 4.2.3 权限门控组件
- [ ] **Task 13**: 创建 components/PermissionGate.tsx
  - Props: `permission?: string`, `anyPermissions?: string[]`, `allPermissions?: string[]`
  - Children 渲染逻辑：无权限时 render null 或 fallback

- [ ] **Task 14**: 更新 PermissionButton 组件
  - 支持 `permissionCode` 属性
  - 无权限时自动禁用/隐藏

#### 4.2.4 权限获取集成
- [ ] **Task 15**: 登录后获取权限并缓存
  - 调用 `/api/auth/permissions` 接口
  - 存入 Redux/Zustand 和 LocalStorage
  - 页面刷新时从缓存恢复

---

## 5. API 设计

### 5.1 新增 API

#### GET /api/auth/permissions
获取当前用户权限信息

**Response**:
```json
{
  "roleId": "r001",
  "roleName": "super_admin",
  "displayName": "超级管理员",
  "permissions": ["datasource:read", "datasource:write", ...],
  "menus": [{ "path": "/datasources", "title": "数据源管理", ... }]
}
```

#### GET /api/audit/logs
查询审计日志

**Query Parameters**:
- `startTime`: ISO8601 时间
- `endTime`: ISO8601 时间
- `userId`: 用户ID（可选）
- `resource`: 资源类型（可选）
- `page`: 页码
- `pageSize`: 每页数量

**Response**:
```json
{
  "items": [
    {
      "id": "a001",
      "userId": "u001",
      "userName": "张三",
      "action": "CREATE",
      "resource": "datasource",
      "resourceId": "d001",
      "detail": { "name": "MySQL数据源" },
      "ip": "192.168.1.1",
      "createdAt": "2026-03-25T10:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 20
}
```

### 5.2 权限拦截点

| 接口 | 权限码 | 说明 |
|------|--------|------|
| GET /api/datasources | datasource:read | |
| POST /api/datasources | datasource:write | |
| PUT /api/datasources/:id | datasource:write | |
| DELETE /api/datasources/:id | datasource:delete | |
| GET /api/tasks | task:read | |
| POST /api/tasks | task:write | |
| PUT /api/tasks/:id | task:write | |
| DELETE /api/tasks/:id | task:delete | |
| GET /api/roles | role:manage | P1 |
| GET /api/audit/logs | audit:read | |

---

## 6. 测试计划

### 6.1 单元测试

#### 权限模块测试
- [ ] `roleRepository.findById()` - 正常查找、不存在返回 null
- [ ] `permissionRepository.findByRoleId()` - 返回权限码数组
- [ ] `permissionService.hasPermission()` - 各种场景

#### 审计模块测试
- [ ] `auditService.log()` - 异步写入成功
- [ ] `auditDecorator` - 方法调用后是否记录日志

### 6.2 集成测试

- [ ] 用户角色变更后权限即时生效
- [ ] 无权限用户访问受保护 API 返回 403
- [ ] 审计日志正确记录 CUD 操作

---

## 7. 实施顺序

### Phase 1: 数据库 & 基础 (Day 1)
```
Task 1  → Task 2  → Task 3  → Task 4  → Task 5
(迁移)    (types)  (repo)   (repo)   (service)
                                         ↓
                                    Task 6  → Task 7  → Task 8  → Task 9
                                    (types)  (repo)   (service)(decorator)
```

### Phase 2: 前端基础 (Day 2)
```
Task 10 → Task 11 → Task 12 → Task 13 → Task 14
(menu)   (hook)   (hook)   (gate)   (button)
```

### Phase 3: 集成 & API (Day 2-3)
```
Task 15 → API 集成 → 中间件配置 → 审计拦截点配置
```

### Phase 4: 测试 & 文档 (Day 3)
```
单元测试 → 集成测试 → 清理过期日志定时任务 → 文档更新
```

---

## 8. 验收标准

### 8.1 功能验收
- [ ] 超级管理员登录后看到全部菜单
- [ ] 普通管理员登录后看到数据源、任务、审计菜单（无角色管理）
- [ ] 普通用户登录后只看到数据源、任务菜单
- [ ] 无权限用户访问 API 返回 403
- [ ] CUD 操作后审计日志正确记录

### 8.2 性能验收
- [ ] 权限校验中间件延迟 < 10ms
- [ ] 审计日志异步写入不影响主流程

### 8.3 安全验收
- [ ] 前端菜单过滤不可绕过（后端必须校验）
- [ ] 审计日志不可伪造（写入时校验用户身份）

---

## 9. 风险与缓解

| 风险 | 等级 | 缓解措施 |
|------|------|----------|
| 前端菜单可被开发者工具修改 | 中 | 后端 API 层必须校验权限码 |
| 审计日志异步写入失败 | 中 | 写入失败重试 + 降级到 console.error |
| 权限变更需要用户重新登录 | 低 | 可后续增加 WebSocket 推送 |

---

## 10. 后续扩展 (P1/P2)

### P1 扩展
- 操作级权限按钮控制
- 审计日志查看页面
- 角色管理页面

### P2 扩展
- 审计日志导出 Excel
- 权限变更推送（WebSocket）
- 细粒度字段级权限

---

**计划制定人**: 开发者  
**计划制定时间**: 2026-03-25
