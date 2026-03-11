# API管理模块设计文档

## 一、概述

API管理模块用于配置动态SQL查询接口，用户通过界面配置数据源、表、字段等参数，系统自动生成MyBatis XML格式的SQL，支持Mock数据测试。

## 二、功能清单

### 1. 左侧数据源树
- 数据源树展示：按「源数据库/目标数据库」分组
- 库节点：显示库名称，展开显示表
- 表节点：显示表名，点击显示该表下的API
- 搜索数据源：关键字筛选
- 刷新表列表：重新加载表

### 2. API列表页面
- API表格：名称/路径/方法/表名/状态/操作
- 筛选API：按数据源/表筛选
- 搜索API：按名称/路径搜索
- 新建/编辑/删除/启用/禁用/复制/测试

### 3. API详情页面
- 基本信息展示
- 请求参数表格
- 响应字段表格
- 请求示例（cURL + JSON）
- Mock数据展示/编辑
- SQL预览（MyBatis XML）

### 4. 创建API向导（4步）
- 步骤1：基本信息（数据源/表/名称/路径）
- 步骤2：字段配置（选择字段、排序）
- 步骤3：参数配置（自动生成请求参数、批量操作）
- 步骤4：Mock配置与预览

## 三、页面按钮汇总

### 左侧数据源树
| 按钮 | 功能 |
|------|------|
| 🔍 搜索框 | 搜索过滤数据源/表 |
| ▶ 展开 | 展开加载表列表 |
| 🔄 刷新 | 刷新表列表 |
| ➕ 创建API | 跳转创建页面 |

### API列表
| 按钮 | 功能 |
|------|------|
| ➕ 创建API | 跳转创建页面 |
| ✏️ 编辑 | 跳转编辑页面 |
| 🗑️ 删除 | 删除API |
| ▶/⏸ 启用禁用 | 切换状态 |
| 📋 复制 | 复制创建 |
| 🧪 测试 | 弹窗测试 |

### API详情
| 按钮 | 功能 |
|------|------|
| ✏️ 编辑 | 跳转编辑页面 |
| 🗑️ 删除 | 删除API |
| ☑ 启用Mock | 开关Mock |
| 📋 复制 | 复制到剪贴板 |
| 🧪 测试API | 弹窗测试 |

### 创建API向导
| 步骤 | 按钮 |
|------|------|
| 通用 | 上一步/下一步 |
| 通用 | 取消/保存 |
| 步骤2 | 全选/取消全选/反选 |
| 步骤3 | 添加参数/批量删除/批量设置 |
| 步骤4 | 生成Mock/格式化JSON |

## 四、接口规范

### 1. 数据源与表结构接口

#### 1.1 获取数据源列表
- **接口路径**: `/etl-admin/dataSourceManager/dataSourceList`
- **请求方法**: POST
- **输入参数**:
  | 参数名 | 类型 | 必填 | 说明 |
  |--------|------|------|------|
  | page | integer | 否 | 页码，默认1 |
  | limit | integer | 否 | 每页条数，默认100 |
  | dataType | string | 否 | 数据源类型：source/target |

#### 1.2 获取表列表
- **接口路径**: `/etl-admin/sqlManager/findTable`
- **请求方法**: GET
- **Query参数**:
  | 参数名 | 类型 | 必填 | 说明 |
  |--------|------|------|------|
  | database | string | 是 | 数据库名 |

#### 1.3 获取表字段信息
- **接口路径**: `/etl-admin/sqlManager/findTableFieldDetail`
- **请求方法**: POST
- **输入参数**:
  | 参数名 | 类型 | 必填 | 说明 |
  |--------|------|------|------|
  | dbName | string | 是 | 数据库名 |
  | tableName | string | 是 | 表名 |

### 2. API配置管理接口

#### 2.1 获取API列表
- **接口路径**: `/etl-admin/apiManager/list`
- **请求方法**: POST
- **输入参数**:
  | 参数名 | 类型 | 必填 | 说明 |
  |--------|------|------|------|
  | page | integer | 否 | 页码 |
  | limit | integer | 否 | 每页条数 |
  | datasourceId | integer | 否 | 数据源ID筛选 |
  | tableName | string | 否 | 表名筛选 |
  | keyword | string | 否 | 关键字搜索 |

#### 2.2 获取API详情
- **接口路径**: `/etl-admin/apiManager/detail`
- **请求方法**: POST
- **输入参数**:
  | 参数名 | 类型 | 必填 | 说明 |
  |--------|------|------|------|
  | id | integer | 是 | API配置ID |

#### 2.3 保存API
- **接口路径**: `/etl-admin/apiManager/save`
- **请求方法**: POST
- **输入参数**: ApiConfig完整对象

#### 2.4 删除API
- **接口路径**: `/etl-admin/apiManager/delete`
- **请求方法**: POST
- **输入参数**:
  | 参数名 | 类型 | 必填 | 说明 |
  |--------|------|------|------|
  | id | integer | 是 | API配置ID |

#### 2.5 启用/禁用API
- **接口路径**: `/etl-admin/apiManager/toggle`
- **请求方法**: POST
- **输入参数**:
  | 参数名 | 类型 | 必填 | 说明 |
  |--------|------|------|------|
  | id | integer | 是 | API配置ID |
  | status | integer | 是 | 状态：1-启用，0-禁用 |

#### 2.6 测试API
- **接口路径**: `/etl-admin/apiManager/test`
- **请求方法**: POST
- **输入参数**:
  | 参数名 | 类型 | 必填 | 说明 |
  |--------|------|------|------|
  | id | integer | 是 | API配置ID |
  | testParams | object | 否 | 测试参数 |

#### 2.7 复制API
- **接口路径**: `/etl-admin/apiManager/copy`
- **请求方法**: POST
- **输入参数**:
  | 参数名 | 类型 | 必填 | 说明 |
  |--------|------|------|------|
  | id | integer | 是 | 被复制的API ID |
  | newName | string | 是 | 新API名称 |

## 五、数据库表结构

### 5.1 建表SQL

```sql
-- ================================
-- API配置表
-- ================================
CREATE TABLE IF NOT EXISTS `t_api_config` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'API配置ID',
  `name` varchar(100) NOT NULL COMMENT 'API名称',
  `path` varchar(200) NOT NULL COMMENT 'API路径',
  `method` varchar(10) NOT NULL DEFAULT 'POST' COMMENT '请求方式：GET/POST',
  `datasourceId` bigint NOT NULL COMMENT '数据源ID',
  `datasourceName` varchar(100) DEFAULT NULL COMMENT '数据源名称',
  `databaseName` varchar(100) NOT NULL COMMENT '数据库名',
  `tableName` varchar(100) NOT NULL COMMENT '表名',
  `description` varchar(500) DEFAULT NULL COMMENT '描述',
  
  -- SQL配置
  `queryFields` text COMMENT '查询字段，逗号分隔',
  `paginationEnabled` tinyint DEFAULT 1 COMMENT '是否支持分页：0-否 1-是',
  
  -- Mock配置
  `mockEnabled` tinyint DEFAULT 0 COMMENT '是否启用Mock：0-否 1-是',
  `mockData` text COMMENT 'Mock数据JSON字符串',
  
  -- 状态
  `status` tinyint DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  
  -- 时间
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_path` (`path`),
  KEY `idx_datasourceId` (`datasourceId`),
  KEY `idx_tableName` (`tableName`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='API配置表';

-- ================================
-- API输入参数表
-- ================================
CREATE TABLE IF NOT EXISTS `t_api_input_param` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '参数ID',
  `apiId` bigint NOT NULL COMMENT 'API配置ID',
  `paramName` varchar(50) NOT NULL COMMENT '参数名',
  `columnName` varchar(50) DEFAULT NULL COMMENT '对应数据库字段',
  `paramType` varchar(20) NOT NULL DEFAULT 'string' COMMENT '参数类型：string/integer/decimal/date/datetime/boolean',
  `required` tinyint DEFAULT 0 COMMENT '是否必填：0-否 1-是',
  `defaultValue` varchar(100) DEFAULT NULL COMMENT '默认值',
  `description` varchar(200) DEFAULT NULL COMMENT '参数说明',
  
  PRIMARY KEY (`id`),
  KEY `idx_apiId` (`apiId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='API输入参数表';

-- ================================
-- API输出参数表
-- ================================
CREATE TABLE IF NOT EXISTS `t_api_output_param` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '参数ID',
  `apiId` bigint NOT NULL COMMENT 'API配置ID',
  `columnName` varchar(50) NOT NULL COMMENT '数据库字段名',
  `alias` varchar(50) DEFAULT NULL COMMENT '响应别名',
  `dataType` varchar(20) DEFAULT NULL COMMENT '数据类型',
  `description` varchar(200) DEFAULT NULL COMMENT '字段说明',
  
  PRIMARY KEY (`id`),
  KEY `idx_apiId` (`apiId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='API输出参数表';

-- ================================
-- 应用表（调用方）
-- ================================
CREATE TABLE IF NOT EXISTS `t_api_app` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '应用ID',
  `appName` varchar(100) NOT NULL COMMENT '应用名称',
  `appKey` varchar(100) NOT NULL COMMENT 'App Key',
  `appSecret` varchar(200) NOT NULL COMMENT 'App Secret（加密存储）',
  `appType` varchar(20) DEFAULT NULL COMMENT '应用类型：web/app/other',
  `description` varchar(500) DEFAULT NULL COMMENT '描述',
  `expireTime` datetime DEFAULT NULL COMMENT '过期时间',
  `status` tinyint DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_appKey` (`appKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='API应用表';

-- ================================
-- API授权关系表（API与应用的关系）
-- ================================
CREATE TABLE IF NOT EXISTS `t_api_grant` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '授权ID',
  `apiId` bigint NOT NULL COMMENT 'API配置ID',
  `appId` bigint NOT NULL COMMENT '应用ID',
  `allowIps` text COMMENT '允许访问的IP，逗号分隔',
  `rateLimit` int DEFAULT NULL COMMENT '限流：次/分钟',
  `status` tinyint DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_api_app` (`apiId`, `appId`),
  KEY `idx_apiId` (`apiId`),
  KEY `idx_appId` (`appId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='API授权关系表';
```

### 5.2 表关系

```
t_api_config (API配置)
    │
    ├─ t_api_input_param (输入参数)
    ├─ t_api_output_param (输出参数)
    │
    └─ t_api_grant (授权关系 N:N)
            │
            └─ t_api_app (应用/调用方)
```

### 5.3 字段汇总

| 表名 | 字段名 | 类型 | 说明 |
|------|--------|------|------|
| t_api_config | id | bigint | 主键 |
| t_api_config | name | varchar(100) | API名称 |
| t_api_config | path | varchar(200) | API路径 |
| t_api_config | method | varchar(10) | 请求方式 |
| t_api_config | datasourceId | bigint | 数据源ID |
| t_api_config | datasourceName | varchar(100) | 数据源名称 |
| t_api_config | databaseName | varchar(100) | 数据库名 |
| t_api_config | tableName | varchar(100) | 表名 |
| t_api_config | description | varchar(500) | 描述 |
| t_api_config | queryFields | text | 查询字段 |
| t_api_config | paginationEnabled | tinyint | 是否支持分页 |
| t_api_config | mockEnabled | tinyint | Mock启用状态 |
| t_api_config | mockData | text | Mock数据 |
| t_api_config | status | tinyint | 状态 |
| t_api_config | createdAt | datetime | 创建时间 |
| t_api_config | updatedAt | datetime | 更新时间 |
| t_api_input_param | id | bigint | 主键 |
| t_api_input_param | apiId | bigint | 外键 |
| t_api_input_param | paramName | varchar(50) | 参数名 |
| t_api_input_param | columnName | varchar(50) | 对应字段 |
| t_api_input_param | paramType | varchar(20) | 参数类型 |
| t_api_input_param | required | tinyint | 必填 |
| t_api_input_param | defaultValue | varchar(100) | 默认值 |
| t_api_input_param | description | varchar(200) | 说明 |
| t_api_output_param | id | bigint | 主键 |
| t_api_output_param | apiId | bigint | 外键 |
| t_api_output_param | columnName | varchar(50) | 字段名 |
| t_api_output_param | alias | varchar(50) | 别名 |
| t_api_output_param | dataType | varchar(20) | 类型 |
| t_api_output_param | description | varchar(200) | 说明 |
| t_api_app | id | bigint | 主键 |
| t_api_app | appName | varchar(100) | 应用名称 |
| t_api_app | appKey | varchar(100) | App Key |
| t_api_app | appSecret | varchar(200) | App Secret |
| t_api_app | appType | varchar(20) | 应用类型 |
| t_api_app | description | varchar(500) | 描述 |
| t_api_app | expireTime | datetime | 过期时间 |
| t_api_app | status | tinyint | 状态 |
| t_api_app | createdAt | datetime | 创建时间 |
| t_api_app | updatedAt | datetime | 更新时间 |
| t_api_grant | id | bigint | 主键 |
| t_api_grant | apiId | bigint | API ID |
| t_api_grant | appId | bigint | 应用ID |
| t_api_grant | allowIps | text | 允许IP |
| t_api_grant | rateLimit | int | 限流 |
| t_api_grant | status | tinyint | 状态 |
| t_api_grant | createdAt | datetime | 创建时间 |
| t_api_grant | updatedAt | datetime | 更新时间 |

## 六、接口汇总

| 序号 | 接口路径 | 方法 | 功能 | 关键输入 |
|------|---------|------|------|---------|
| 1 | `/etl-admin/dataSourceManager/dataSourceList` | POST | 获取数据源列表 | page, limit, dataType |
| 2 | `/etl-admin/sqlManager/findTable` | GET | 获取表列表 | database |
| 3 | `/etl-admin/sqlManager/findTableFieldDetail` | POST | 获取表字段 | dbName, tableName |
| 4 | `/etl-admin/apiManager/list` | POST | API列表 | page, limit, 筛选条件 |
| 5 | `/etl-admin/apiManager/detail` | POST | API详情 | id |
| 6 | `/etl-admin/apiManager/save` | POST | 保存API | 完整配置 |
| 7 | `/etl-admin/apiManager/delete` | POST | 删除API | id |
| 8 | `/etl-admin/apiManager/toggle` | POST | 启用/禁用 | id, status |
| 9 | `/etl-admin/apiManager/test` | POST | 测试API | id, testParams |
| 10 | `/etl-admin/apiManager/copy` | POST | 复制API | id, newName |

## 七、应用管理

### 7.1 功能清单
- 应用列表展示
- 新建/编辑/删除应用
- 生成/重新生成AppKey和AppSecret
- 启用/禁用应用
- API授权管理

### 7.2 接口汇总（应用管理）

| 序号 | 接口路径 | 方法 | 功能 | 关键输入 |
|------|---------|------|------|---------|
| 1 | `/etl-admin/apiManager/appList` | POST | 应用列表 | page, limit, keyword |
| 2 | `/etl-admin/apiManager/saveApp` | POST | 保存应用 | 完整应用对象 |
| 3 | `/etl-admin/apiManager/deleteApp` | POST | 删除应用 | id |
| 4 | `/etl-admin/apiManager/regenerateSecret` | POST | 重新生成Secret | id |
| 5 | `/etl-admin/apiManager/grantApi` | POST | API授权 | apiId, appId, allowIps, rateLimit |
| 6 | `/etl-admin/apiManager/apiGrants` | POST | 获取API授权列表 | apiId |

