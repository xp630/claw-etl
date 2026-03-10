import axios from 'axios';
import type { DataSource, Task } from '../types';

// 后端API基础URL（开发模式用空，通过Vite代理；生产模式需要配置）
const API_BASE = '';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 拦截器：打印每个请求的curl命令
api.interceptors.request.use((config) => {
  // 开发模式显示实际后端地址，方便调试
  const fullURL = 'http://139.9.200.56:8090' + config.url;
  const method = config.method?.toUpperCase() || 'GET';
  
  let curl = `curl -X ${method} '${fullURL}'`;
  
  if (config.params) {
    const queryString = new URLSearchParams(config.params).toString();
    curl = `curl -X ${method} '${fullURL}?${queryString}'`;
  }
  if (config.data) {
    curl += ` \\\n  -d '${JSON.stringify(config.data)}'`;
  }
  curl += ` \\\n  -H 'Content-Type: application/json'`;
  
  console.log('🔗 API Request:\n', curl);
  return config;
});

// 响应拦截器：统一判断code
api.interceptors.response.use(
  (response) => {
    const { data } = response;
    // code为0或1表示成功，其他表示失败
    if (data.code !== 0 && data.code !== 1) {
      console.error('❌ API Error:', data.msg || '请求失败');
      return Promise.reject(new Error(data.msg || '请求失败'));
    }
    return response;
  },
  (error) => {
    console.error('❌ Network Error:', error.message);
    return Promise.reject(error);
  }
);

// ========== 数据源 API ==========

// 获取数据源列表
export async function getDataSources(dataType?: string): Promise<DataSource[]> {
  try {
    // 调用后端数据源列表接口
    const params: any = { limit: 100, page: 1 };
    if (dataType) {
      params.dataType = dataType;
    }
    const res = await api.post('/etl-admin/dataSourceManager/dataSourceList', params);
    if (res.data && res.data.list) {
      return res.data.list.map((item: any) => ({
        id: item.id,
        name: item.dbName,
        type: item.dbType?.toLowerCase() || 'mysql',
        dataType: item.dataType || 'source',
        host: item.dbUrl?.match(/:\/\/([^:]+):/)?.[1] || '',
        port: parseInt(item.dbUrl?.match(/:(\d+)\//)?.[1]) || 3306,
        username: item.dbAccount,
        password: item.dbPassword,
        database_name: item.realDataBaseName || item.dbName,
        maxConnections: item.maxConnections,
        minIdle: item.minIdle,
        initialConnections: item.initialConnections,
        maxIdle: item.maxIdle,
        extraParams: item.extraParams,
        description: item.comment,
        status: item.dbState === '启用' ? 1 : 0,
        created_at: item.createTime,
        updated_at: item.updateTime,
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to load datasources:', error);
    return MOCK_DATASOURCES;
  }
}

// 获取单个数据源
export async function getDataSource(id: number): Promise<DataSource | undefined> {
  try {
    const res = await api.post('/etl-admin/dataSourceManager/dbSourceDetail', { id: String(id) });
    const data = res.data?.data;
    if (data) {
      return {
        id: data.id,
        name: data.dbName,
        type: data.dbType?.toLowerCase() || 'mysql',
        dataType: data.dataType || 'source',
        host: data.dbUrl?.match(/:\/\/([^:]+):/)?.[1] || '',
        port: parseInt(data.dbUrl?.match(/:(\d+)\//)?.[1]) || 3306,
        username: data.dbAccount,
        password: data.dbPassword,
        database_name: data.realDataBaseName || data.dbName,
        maxConnections: data.maxConnections,
        minIdle: data.minIdle,
        initialConnections: data.initialConnections,
        maxIdle: data.maxIdle,
        extraParams: data.extraParams,
        description: data.comment,
        status: data.dbState === '启用' ? 1 : 0,
        created_at: data.createTime,
        updated_at: data.updateTime,
      };
    }
    return undefined;
  } catch (error) {
    console.error('Failed to load datasource:', error);
    return MOCK_DATASOURCES.find(ds => ds.id === id);
  }
}

// 新增数据源
export async function createDataSource(data: Partial<DataSource>): Promise<DataSource> {
  try {
    // 构建JDBC URL
    const dbUrl = data.host && data.port 
      ? `jdbc:mysql://${data.host}:${data.port}/${data.database_name}?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai`
      : '';
    
    // 转换字段名以匹配后端格式
    const postData = {
      dbName: data.name,
      dbUrl,
      dbAccount: data.username,
      dbPassword: data.password,
      dbState: data.status === 1 ? '启用' : '禁用',
      driverClass: 'com.mysql.cj.jdbc.Driver',
      dbType: data.type?.toUpperCase() || 'MYSQL',
      comment: data.description,
      dataType: data.dataType || 'source',
      categoryId: 5683,
      maxConnections: data.maxConnections,
      minIdle: data.minIdle,
      initialConnections: data.initialConnections,
      maxIdle: data.maxIdle,
      extraParams: data.extraParams,
    };
    const res = await api.post('/etl-admin/dataSourceManager/addDataSource', postData);
    return res.data;
  } catch (error) {
    const newDS: DataSource = {
      ...data as DataSource,
      id: Math.max(...MOCK_DATASOURCES.map(ds => ds.id), 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 1,
    };
    MOCK_DATASOURCES.push(newDS);
    return newDS;
  }
}

// 更新数据源
export async function updateDataSource(id: number, data: Partial<DataSource>): Promise<DataSource> {
  try {
    // 构建JDBC URL
    const dbUrl = data.host && data.port 
      ? `jdbc:mysql://${data.host}:${data.port}/${data.database_name}?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai`
      : '';
    
    const postData = {
      id,
      dbName: data.name,
      dbUrl,
      dbAccount: data.username,
      dbPassword: data.password,
      dbState: data.status === 1 ? '启用' : '禁用',
      driverClass: 'com.mysql.cj.jdbc.Driver',
      dbType: data.type?.toUpperCase() || 'MYSQL',
      comment: data.description,
      dataType: data.dataType || 'source',
      categoryId: 5683,
      maxConnections: data.maxConnections,
      minIdle: data.minIdle,
      initialConnections: data.initialConnections,
      maxIdle: data.maxIdle,
      extraParams: data.extraParams,
    };
    const res = await api.post('/etl-admin/dataSourceManager/addDataSource', postData);
    return res.data;
  } catch (error) {
    const index = MOCK_DATASOURCES.findIndex(ds => ds.id === id);
    if (index >= 0) {
      MOCK_DATASOURCES[index] = { ...MOCK_DATASOURCES[index], ...data, updated_at: new Date().toISOString() };
      return MOCK_DATASOURCES[index];
    }
    throw new Error('DataSource not found');
  }
}

// 删除数据源
export async function deleteDataSource(id: number): Promise<void> {
  try {
    await api.post('/etl-admin/simple/updateStatus', { id, status: -1 });
  } catch (error) {
    const index = MOCK_DATASOURCES.findIndex(ds => ds.id === id);
    if (index >= 0) {
      MOCK_DATASOURCES.splice(index, 1);
    }
  }
}

// 测试数据源连接
export async function testDataSource(id: number): Promise<{ success: boolean; message: string }> {
  try {
    const ds = MOCK_DATASOURCES.find(d => d.id === id);
    if (!ds) return { success: false, message: '数据源不存在' };
    
    const res = await api.post('/etl-admin/dataSourceManager/checkUrl', {
      dbUrl: `jdbc:mysql://${ds.host}:${ds.port}/${ds.database_name}`,
      dbAccount: ds.username,
      dbPassword: ds.password,
      driverClass: 'com.mysql.cj.jdbc.Driver',
    });
    
    if (res.data?.success) {
      return { success: true, message: '连接成功' };
    }
    return { success: false, message: res.data?.msg || '连接失败' };
  } catch (error: any) {
    return { success: false, message: error?.response?.data?.msg || '连接失败' };
  }
}

// ========== 任务 API ==========

// 获取任务列表
export async function getTasks(): Promise<Task[]> {
  try {
    const res = await api.post('/etl-admin/simple/queryTaskListPage', { page: 1, limit: 20 });
    if (res.data?.list) {
      return res.data.list.map((item: any) => ({
        id: item.id,
        name: item.taskName,
        source_id: 0,
        source_name: item.sourceDb,
        query_sql: item.querySql,
        target_id: 0,
        target_name: item.targetDb,
        target_table: item.targetTable,
        columns: item.columns,
        dynamic_sql: item.dynamicParam,
        window_value: item.taskCronTime || 1,
        window_unit: item.taskCronTimeUnit?.toLowerCase() === 'hours' ? 'hours' : 
                     item.taskCronTimeUnit?.toLowerCase() === 'days' ? 'days' : 'minutes',
        status: item.status,
        last_run_time: item.lastRunTime,
        created_at: item.createTime || '',
        updated_at: item.updateTime || '',
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to load tasks:', error);
    return MOCK_TASKS;
  }
}

// 获取单个任务
export async function getTask(id: number): Promise<Task | undefined> {
  try {
    const res = await api.post('/etl-admin/simple/getById', { id: String(id) });
    const data = res.data?.data;
    if (data) {
      return {
        id: data.id,
        name: data.taskName,
        source_id: 0,
        source_name: data.sourceDb,
        query_sql: data.querySql,
        target_id: 0,
        target_name: data.targetDb,
        target_table: data.targetTable,
        columns: data.columns,
        dynamic_sql: data.dynamicParam,
        window_value: data.taskCronTime || 1,
        window_unit: data.taskCronTimeUnit?.toLowerCase() === 'hours' ? 'hours' : 
                     data.taskCronTimeUnit?.toLowerCase() === 'days' ? 'days' : 'minutes',
        status: data.status,
        last_run_time: data.lastRunTime,
        created_at: data.createTime || '',
        updated_at: data.updateTime || '',
      };
    }
    return undefined;
  } catch (error) {
    return MOCK_TASKS.find(t => t.id === id);
  }
}

// 新增任务
export async function createTask(data: Partial<Task>): Promise<Task> {
  try {
    // 根据 window_unit 推断 taskCronType
    const taskCronTypeMap: Record<string, string> = {
      minutes: 'MINUTES',
      hours: 'HOURS',
      days: 'DAYS',
    };
    
    // 转换为驼峰命名
    const camelData = {
      taskName: data.name,
      sourceDb: data.source_name,
      targetDb: data.target_name,
      querySql: data.query_sql,
      targetTable: data.target_table,
      columns: data.columns,
      dynamicParam: data.dynamic_sql,
      taskCronTime: data.window_value,
      taskCronTimeUnit: data.window_unit?.toUpperCase() || 'HOURS',
      taskCronType: taskCronTypeMap[data.window_unit || 'hours'],
      status: data.status ?? 1,
    };
    const res = await api.post('/etl-admin/simple/saveTaskData', camelData);
    return res.data;
  } catch (error) {
    const newTask: Task = {
      ...data as Task,
      id: Math.max(...MOCK_TASKS.map(t => t.id), 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 1,
    };
    MOCK_TASKS.push(newTask);
    return newTask;
  }
}

// 更新任务
export async function updateTask(id: number, data: Partial<Task>): Promise<Task> {
  try {
    // 根据 window_unit 推断 taskCronType
    const taskCronTypeMap: Record<string, string> = {
      minutes: 'MINUTES',
      hours: 'HOURS',
      days: 'DAYS',
    };
    
    // 转换为驼峰命名
    const camelData = {
      id,
      taskName: data.name,
      sourceDb: data.source_name,
      targetDb: data.target_name,
      querySql: data.query_sql,
      targetTable: data.target_table,
      columns: data.columns,
      dynamicParam: data.dynamic_sql,
      taskCronTime: data.window_value,
      taskCronTimeUnit: data.window_unit?.toUpperCase() || 'HOURS',
      taskCronType: taskCronTypeMap[data.window_unit || 'hours'],
      status: data.status,
    };
    const res = await api.post('/etl-admin/simple/saveTaskData', camelData);
    return res.data;
  } catch (error) {
    const index = MOCK_TASKS.findIndex(t => t.id === id);
    if (index >= 0) {
      MOCK_TASKS[index] = { ...MOCK_TASKS[index], ...data, updated_at: new Date().toISOString() };
      return MOCK_TASKS[index];
    }
    throw new Error('Task not found');
  }
}

// 删除任务
export async function deleteTask(id: number): Promise<void> {
  try {
    await api.post('/etl-admin/simple/updateStatus', { id, status: -1 });
  } catch (error) {
    const index = MOCK_TASKS.findIndex(t => t.id === id);
    if (index >= 0) {
      MOCK_TASKS.splice(index, 1);
    }
  }
}

// 切换任务状态
export async function toggleTask(id: number): Promise<Task> {
  try {
    const task = MOCK_TASKS.find(t => t.id === id);
    const newStatus = task?.status === 1 ? 0 : 1;
    const res = await api.post('/etl-admin/simple/updateStatus', { id, status: newStatus });
    return res.data;
  } catch (error) {
    const index = MOCK_TASKS.findIndex(t => t.id === id);
    if (index >= 0) {
      MOCK_TASKS[index].status = MOCK_TASKS[index].status === 1 ? 0 : 1;
      return MOCK_TASKS[index];
    }
    throw new Error('Task not found');
  }
}

// 根据 querySql 生成目标字段
export async function generateTargetColumns(querySql: string, sourceDb: string): Promise<string[]> {
  try {
    const res = await api.post('/etl-admin/simple/generateTargetColumns', { querySql, sourceDb });
    return res.data?.data || [];
  } catch (error) {
    console.error('Failed to generate columns:', error);
    return [];
  }
}

// ========== 演示数据 ==========

let MOCK_DATASOURCES: DataSource[] = [
  {
    id: 1,
    name: 'WMS源库',
    type: 'mysql',
    host: '192.168.1.100',
    port: 3306,
    username: 'wms_user',
    password: '******',
    database_name: 'wms_db',
    description: 'WMS仓储管理系统数据库',
    status: 1,
    created_at: '2026-01-01 10:00:00',
    updated_at: '2026-01-01 10:00:00',
  },
  {
    id: 2,
    name: 'ERP源库',
    type: 'mysql',
    host: '192.168.1.101',
    port: 3306,
    username: 'erp_user',
    password: '******',
    database_name: 'erp_db',
    description: 'ERP企业资源计划系统数据库',
    status: 1,
    created_at: '2026-01-02 10:00:00',
    updated_at: '2026-01-02 10:00:00',
  },
  {
    id: 3,
    name: '目标库nr_data',
    type: 'mysql',
    host: '192.168.1.200',
    port: 3306,
    username: 'target_user',
    password: '******',
    database_name: 'nr_data',
    description: '数据中台目标库',
    status: 1,
    created_at: '2026-01-03 10:00:00',
    updated_at: '2026-01-03 10:00:00',
  },
];

let MOCK_TASKS: Task[] = [
  {
    id: 1,
    name: '兑换商品同步',
    source_id: 1,
    source_name: 'WMS源库',
    query_sql: 'SELECT * FROM exchange_goods WHERE update_time > {lastSyncTime}',
    target_id: 3,
    target_name: '目标库nr_data',
    target_table: 't_goods_goods_exchange',
    columns: 'id,goods_name,goods_price,stock_num,update_time',
    dynamic_sql: "SELECT MAX(update_time) as lastSyncTime FROM t_goods_goods_exchange",
    window_value: 1,
    window_unit: 'hours',
    status: 1,
    last_run_time: '2026-03-10 10:00:00',
    created_at: '2026-01-05 10:00:00',
    updated_at: '2026-01-05 10:00:00',
  },
  {
    id: 2,
    name: '商品信息同步',
    source_id: 2,
    source_name: 'ERP源库',
    query_sql: 'SELECT * FROM products WHERE status = 1',
    target_id: 3,
    target_name: '目标库nr_data',
    target_table: 't_trade_order',
    columns: 'order_id,product_id,product_name,quantity,price,create_time',
    window_value: 10,
    window_unit: 'minutes',
    status: 1,
    last_run_time: '2026-03-10 09:50:00',
    created_at: '2026-01-06 10:00:00',
    updated_at: '2026-01-06 10:00:00',
  },
  {
    id: 3,
    name: '五粮液-会员同步',
    source_id: 2,
    source_name: 'ERP源库',
    query_sql: 'SELECT * FROM wuliangye_members',
    target_id: 3,
    target_name: '目标库nr_data',
    target_table: 't_member_info',
    columns: 'member_id,member_name,phone,points,level',
    window_value: 1,
    window_unit: 'minutes',
    status: 0,
    last_run_time: 'Invalid Date',
    created_at: '2026-01-07 10:00:00',
    updated_at: '2026-01-07 10:00:00',
  },
];
