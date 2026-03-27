-- PageConfig 表 - 页面配置主表
CREATE TABLE `page_config` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `name` VARCHAR(100) NOT NULL COMMENT '页面名称',
  `code` VARCHAR(100) NOT NULL COMMENT '页面编码',
  `description` VARCHAR(500) COMMENT '页面描述',
  `status` INT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='页面配置表';

-- PageComponent 表 - 页面组件表
CREATE TABLE `page_component` (
  `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键ID',
  `page_id` BIGINT NOT NULL COMMENT '所属页面ID',
  `parent_id` BIGINT COMMENT '父组件ID（顶级为NULL）',
  `type` VARCHAR(50) NOT NULL COMMENT '组件类型：card/tabs/collapse/grid/table/form/chart/text/button/input/select/divider/image',
  `props` TEXT COMMENT '组件属性JSON（包含位置、样式、数据绑定等）',
  `feature_id` BIGINT COMMENT '绑定的Feature ID（可选）',
  `sort_order` INT DEFAULT 0 COMMENT '排序顺序',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`page_id`) REFERENCES `page_config`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`parent_id`) REFERENCES `page_component`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`feature_id`) REFERENCES `sys_feature`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='页面组件表';

-- 索引
CREATE INDEX idx_page_component_page_id ON page_component(page_id);
CREATE INDEX idx_page_component_parent_id ON page_component(parent_id);
CREATE INDEX idx_page_component_feature_id ON page_component(feature_id);

-- props 字段示例（JSON结构）
-- {
--   "x": 0, "y": 0,           -- 位置坐标
--   "width": 12, "height": "auto",  -- 尺寸
--   "apiId": 123,             -- 数据源API
--   "columns": [...],          -- 表格列配置
--   "options": [...],         -- 下拉选项
--   "style": {},              -- 样式
--   "data": {}                -- 其他数据
-- }
