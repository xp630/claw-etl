export interface DataSource {
  id: number;
  name: string;
  type: 'mysql' | 'postgresql' | 'oracle' | 'sqlserver';
  dataType?: 'source' | 'target';
  host: string;
  port: number;
  username: string;
  password: string;
  databaseName: string;
  maxConnections?: number;
  maxActive?: number;
  minIdle?: number;
  initialConnections?: number;
  initialSize?: number;
  maxIdle?: number;
  extraParams?: string;
  description?: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  name: string;
  sourceId: number;
  sourceName?: string;
  querySql: string;
  targetId: number;
  targetName?: string;
  targetTable: string;
  columns?: string;
  dynamicSql?: string;
  windowValue: number;
  windowUnit: 'minutes' | 'hours' | 'days';
  status: number;
  lastRunTime?: string;
  createdAt: string;
  updatedAt: string;
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
  description?: string;
  queryFields?: string;
  paginationEnabled?: number;
  mockEnabled?: number;
  mockData?: string;
  status?: number;
  createdAt?: string;
  updatedAt?: string;
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
