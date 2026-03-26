export interface DataSource {
  id: number;
  name: string;
  type: 'mysql' | 'postgresql' | 'oracle' | 'sqlserver';
  dataType?: 'source' | 'target';
  host?: string;
  port?: number;
  jdbcUrl?: string;
  dbCheckUrl?: string;
  username: string;
  password: string;
  databaseName?: string;
  database_name?: string;
  dbName?: string;
  maxConnections?: number;
  maxActive?: number;
  minIdle?: number;
  initialConnections?: number;
  initialSize?: number;
  maxIdle?: number;
  maxWait?: number;
  extraParams?: string;
  description?: string;
  comment?: string;
  status?: number;
  dbState?: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: number;
  name: string;
  sourceId: number;
  sourceName?: string;
  source_id?: number;
  source_name?: string;
  querySql: string;
  query_sql?: string;
  targetId: number;
  targetName?: string;
  target_id?: number;
  target_name?: string;
  targetTable: string;
  target_table?: string;
  columns?: string;
  dynamicSql?: string;
  dynamic_sql?: string;
  windowValue: number;
  window_value?: number;
  windowUnit: 'minutes' | 'hours' | 'days';
  window_unit?: string;
  status: number;
  lastRunTime?: string;
  last_run_time?: string;
  createdAt: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

// ========== API管理相关类型 ==========

export interface ApiConfig {
  id?: number;
  name: string;
  path: string;
  method: 'GET' | 'POST';
  datasourceId: number;
  datasourceName?: string;
  databaseName: string;
  tableName: string;
  apiType?: 'public' | 'private'; // 权限类型：public-公有, private-私有
  description?: string;
  querySql?: string;
  paginationEnabled?: number;
  mockEnabled?: number;
  mockData?: string;
  status?: number;
  source?: 'auto' | 'manual'; // 来源：auto-自动生成, manual-手动添加
  createdAt?: string;
  updatedAt?: string;
  // 参数配置
  inputParams?: ApiInputParam[];
  outputParams?: ApiOutputParam[];
}

export interface ApiInputParam {
  id?: number;
  apiId?: number;
  paramName: string;
  columnName?: string;
  paramType: string;
  required?: number;
  defaultValue?: string;
  description?: string;
}

export interface ApiOutputParam {
  id?: number;
  apiId?: number;
  columnName: string;
  alias?: string;
  dataType?: string;
  description?: string;
}

export interface ApiApp {
  id?: number;
  appName: string;
  appKey?: string;
  appSecret?: string;
  appType?: string;
  description?: string;
  expireTime?: string;
  status?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiGrant {
  id?: number;
  apiId: number;
  appId: number;
  allowIps?: string;
  rateLimit?: number;
  status?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 树形结构
export interface TableInfo {
  tableName: string;
  tableComment: string;
}

export interface ColumnInfo {
  columnName: string;
  columnType: string;
  dataType: string;
  isPrimary?: boolean;
  isNullable?: boolean;
  columnComment?: string;
}

// ========== 功能管理相关类型 ==========

export type FeatureType = 'list' | 'form';

export interface Feature {
  id?: number;
  name: string;
  code: string;
  type?: FeatureType;  // 功能类型：list-列表页, form-表单页
  description?: string;
  datasourceId?: number;
  datasourceName?: string;
  tableName?: string;
  // CRUD API 配置
  queryApiId?: number;
  queryApiName?: string;
  queryApiPath?: string;
  createApiId?: number;
  createApiName?: string;
  updateApiId?: number;
  updateApiName?: string;
  deleteApiId?: number;
  deleteApiName?: string;
  detailApiId?: number;
  detailApiName?: string;
  // 页面字段配置
  columns?: FeatureColumn[];
  // 权限配置
  permissions?: FeaturePermission[];
  // 菜单配置
  showInMenu?: number;    // 是否显示在菜单：0-不显示，1-显示
  menuIcon?: string;      // 菜单图标
  menuOrder?: number;      // 菜单排序
  // 页面路由配置
  routePath?: string;     // 路由路径
  // 状态
  status?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FeatureColumn {
  id?: number;
  featureId?: number;
  fieldName: string;
  fieldLabel: string;
  fieldType: 'text' | 'number' | 'date' | 'select' | 'image' | 'action';
  span?: number;           // 长度（表单中占据的grid宽度，默认1）
  sortable?: boolean;
  visible?: boolean;
  align?: 'left' | 'center' | 'right';
  queryCondition?: boolean;  // 是否作为查询条件
  fieldOrder?: number;
  dataDictionary?: string;   // 数据字典编码
}

export interface FeaturePermission {
  id?: number;
  featureId?: number;
  roleId?: number;
  roleName?: string;
  canView?: boolean;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
}

// ========== 数据字典相关类型 ==========

export interface Dict {
  id?: number;
  code: string;
  name: string;
  type?: 'string' | 'number';
  remark?: string;
  status?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DictItem {
  id?: number;
  dictId?: number;
  dictCode?: string;
  itemValue: string;
  itemLabel: string;
  sort?: number;
  status?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ========== 系统参数相关类型 ==========

export interface SystemConfig {
  id?: number;
  code: string;
  name: string;
  value?: string;
  type?: 'string' | 'number' | 'boolean';
  groupName?: string;
  description?: string;
  status?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ========== 角色管理相关类型 ==========

export interface SysRole {
  roleId?: number;
  role: string;
  description?: string;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ========== 用户管理相关类型 ==========

export interface SysUser {
  id?: number;
  name: string;
  phone: string;
  employeeNo: string;
  password?: string;
  status?: number;
  createdAt?: string;
  updatedAt?: string;
}

// ========== 菜单管理相关类型 ==========

export interface SysMenu {
  id?: number;
  name: string;
  code?: string;
  icon?: string;
  path?: string;
  parentId?: number;
  orderNum?: number;
  type?: 'menu' | 'button';
  menuFrom?: 'static' | 'dynamic'; // 菜单来源：static-静态菜单, dynamic-动态菜单
  status?: number;
  createdAt?: string;
  updatedAt?: string;
  children?: SysMenu[];
}
