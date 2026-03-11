export interface DataSource {
  id: number;
  name: string;
  type: 'mysql' | 'postgresql' | 'oracle' | 'sqlserver';
  dataType?: 'source' | 'target';  // 数据源类型：source=源库，target=目标库
  host: string;
  port: number;
  username: string;
  password: string;
  database_name: string;
  maxConnections?: number;     // 最大连接数
  maxActive?: number;         // 最大活跃连接数
  minIdle?: number;           // 最小空闲连接数
  initialConnections?: number;// 初始化连接数
  initialSize?: number;       // 初始连接数
  maxIdle?: number;           // 最大空闲数
  extraParams?: string;       // 扩展参数
  description?: string;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  name: string;
  source_id: number;
  source_name?: string;
  query_sql: string;
  target_id: number;
  target_name?: string;
  target_table: string;
  columns?: string;
  dynamic_sql?: string;
  window_value: number;
  window_unit: 'minutes' | 'hours' | 'days';
  status: number;
  last_run_time?: string;
  created_at: string;
  updated_at: string;
}
