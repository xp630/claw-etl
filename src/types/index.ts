export interface DataSource {
  id: number;
  name: string;
  type: 'mysql' | 'postgresql' | 'oracle' | 'sqlserver';
  host: string;
  port: number;
  username: string;
  password: string;
  database_name: string;
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
