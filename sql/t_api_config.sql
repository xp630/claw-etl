-- ================================
-- API配置表
-- ================================
CREATE TABLE IF NOT EXISTS `t_api_config` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'API配置ID',
  `name` varchar(100) NOT NULL COMMENT 'API名称',
  `path` varchar(200) NOT NULL COMMENT 'API路径',
  `method` varchar(10) NOT NULL DEFAULT 'POST' COMMENT '请求方式：GET/POST',
  `datasource_id` bigint NOT NULL COMMENT '数据源ID',
  `datasource_name` varchar(100) DEFAULT NULL COMMENT '数据源名称',
  `database_name` varchar(100) NOT NULL COMMENT '数据库名',
  `table_name` varchar(100) NOT NULL COMMENT '表名',
  `description` varchar(500) DEFAULT NULL COMMENT '描述',
  
  -- SQL配置
  `query_fields` text COMMENT '查询字段，逗号分隔',
  `pagination_enabled` tinyint DEFAULT 1 COMMENT '是否支持分页：0-否 1-是',
  
  -- Mock配置
  `mock_enabled` tinyint DEFAULT 0 COMMENT '是否启用Mock：0-否 1-是',
  `mock_data` text COMMENT 'Mock数据JSON字符串',
  
  -- 状态
  `status` tinyint DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  
  -- 时间
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_path` (`path`),
  KEY `idx_datasource_id` (`datasource_id`),
  KEY `idx_table_name` (`table_name`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='API配置表';

-- ================================
-- API输入参数表
-- ================================
CREATE TABLE IF NOT EXISTS `t_api_input_param` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '参数ID',
  `api_id` bigint NOT NULL COMMENT 'API配置ID',
  `param_name` varchar(50) NOT NULL COMMENT '参数名',
  `column_name` varchar(50) DEFAULT NULL COMMENT '对应数据库字段',
  `param_type` varchar(20) NOT NULL DEFAULT 'string' COMMENT '参数类型：string/integer/decimal/date/datetime/boolean',
  `required` tinyint DEFAULT 0 COMMENT '是否必填：0-否 1-是',
  `default_value` varchar(100) DEFAULT NULL COMMENT '默认值',
  `description` varchar(200) DEFAULT NULL COMMENT '参数说明',
  
  PRIMARY KEY (`id`),
  KEY `idx_api_id` (`api_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='API输入参数表';

-- ================================
-- API输出参数表
-- ================================
CREATE TABLE IF NOT EXISTS `t_api_output_param` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '参数ID',
  `api_id` bigint NOT NULL COMMENT 'API配置ID',
  `column_name` varchar(50) NOT NULL COMMENT '数据库字段名',
  `alias` varchar(50) DEFAULT NULL COMMENT '响应别名',
  `data_type` varchar(20) DEFAULT NULL COMMENT '数据类型',
  `description` varchar(200) DEFAULT NULL COMMENT '字段说明',
  
  PRIMARY KEY (`id`),
  KEY `idx_api_id` (`api_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='API输出参数表';

-- ================================
-- 应用表（调用方）
-- ================================
CREATE TABLE IF NOT EXISTS `t_api_app` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '应用ID',
  `app_name` varchar(100) NOT NULL COMMENT '应用名称',
  `app_key` varchar(100) NOT NULL COMMENT 'App Key',
  `app_secret` varchar(200) NOT NULL COMMENT 'App Secret（加密存储）',
  `app_type` varchar(20) DEFAULT NULL COMMENT '应用类型：web/app/other',
  `description` varchar(500) DEFAULT NULL COMMENT '描述',
  `expire_time` datetime DEFAULT NULL COMMENT '过期时间',
  `status` tinyint DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_app_key` (`app_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='API应用表';

-- ================================
-- API授权关系表（API与应用的关系）
-- ================================
CREATE TABLE IF NOT EXISTS `t_api_grant` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '授权ID',
  `api_id` bigint NOT NULL COMMENT 'API配置ID',
  `app_id` bigint NOT NULL COMMENT '应用ID',
  `allow_ips` text COMMENT '允许访问的IP，逗号分隔',
  `rate_limit` int DEFAULT NULL COMMENT '限流：次/分钟',
  `status` tinyint DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_api_app` (`api_id`, `app_id`),
  KEY `idx_api_id` (`api_id`),
  KEY `idx_app_id` (`app_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='API授权关系表';
