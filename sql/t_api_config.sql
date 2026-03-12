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
  `apiType` varchar(20) NOT NULL DEFAULT 'private' COMMENT '权限类型：public-公有(无需授权) private-私有(需授权)',
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

-- ================================
-- API访问日志表
-- ================================
CREATE TABLE IF NOT EXISTS `t_api_access_log` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `apiId` bigint NOT NULL COMMENT 'API配置ID',
  `apiName` varchar(100) DEFAULT NULL COMMENT 'API名称',
  `apiPath` varchar(200) DEFAULT NULL COMMENT 'API路径',
  `appId` bigint DEFAULT NULL COMMENT '调用应用ID',
  `appName` varchar(100) DEFAULT NULL COMMENT '调用应用名称',
  `accessTime` datetime DEFAULT NULL COMMENT '访问时间',
  `requestMethod` varchar(10) DEFAULT NULL COMMENT '请求方法',
  `requestParams` text COMMENT '请求参数',
  `responseStatus` int DEFAULT NULL COMMENT '响应状态码',
  `responseTime` int DEFAULT NULL COMMENT '响应时间(毫秒)',
  `responseData` longtext COMMENT '响应数据',
  `errorMsg` text COMMENT '错误信息',
  `clientIp` varchar(50) DEFAULT NULL COMMENT '客户端IP',
  `userAgent` varchar(500) DEFAULT NULL COMMENT '用户代理',
  PRIMARY KEY (`id`),
  KEY `idx_apiId` (`apiId`),
  KEY `idx_accessTime` (`accessTime`),
  KEY `idx_appId` (`appId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='API访问日志表';
