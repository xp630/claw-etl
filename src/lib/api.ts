import axios from 'axios';
import type { DataSource, Task, ApiConfig, ApiInputParam, ApiOutputParam, TableInfo, ColumnInfo, Feature, Dict, DictItem, SystemConfig, SysRole, SysMenu, SysUser } from '../types';

// 后端API基础URL
const API_BASE = '/etl-admin';

// 创建axios实例
export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 拦截器：打印每个请求的curl命令
api.interceptors.request.use((config) => {
  // 开发模式显示实际后端地址，方便调试
  const fullURL = API_BASE + config.url;
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
export async function getDataSources(params: {
  dataType?: string;
  name?: string;
  dbState?: string;
  page?: number;
  limit?: number;
}): Promise<{ list: DataSource[]; total: number }> {
  try {
    const res = await api.post('/dataSourceManager/dataSourceList', {
      limit: params.limit || 10,
      page: params.page || 1,
      dataType: params.dataType || '',
      dbName: params.name || '',
      dbState: params.dbState || '',
    });
    if (res.data && res.data.list) {
      return {
        list: res.data.list.map((item: any) => ({
          id: item.id,
          name: item.dbName,
          type: item.dbType?.toLowerCase() || 'mysql',
          dataType: item.dataType || 'source',
          jdbcUrl: item.dbUrl || '',
          dbCheckUrl: item.dbCheckUrl || '',
          username: item.dbAccount,
          password: item.dbPassword,
          database_name: item.realDataBaseName || item.dbName || '',
          databaseName: item.realDataBaseName || item.dbName || '',
          dbName: item.dbName,
          maxConnections: item.maxConnections ?? item.maxActive,
          maxActive: item.maxActive ?? item.maxConnections,
          initialConnections: item.initialConnections ?? item.initialSize,
          initialSize: item.initialSize ?? item.initialConnections,
          maxIdle: item.maxIdle,
          maxWait: item.maxWait,
          extraParams: item.extraParams,
          description: item.comment,
          status: item.dbState === '启用' ? 1 : 0,
          dbState: item.dbState,
          createdAt: item.createTime,
          updatedAt: item.updateTime,
          comment: item.comment
        })),
        total: res.data.count || 0,
      };
    }
    return { list: [], total: 0 };
  } catch (error) {
    console.error('Failed to load datasources:', error);
    return { list: [], total: 0 };
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
        jdbcUrl: data.dbUrl || '',
        dbCheckUrl: data.dbCheckUrl || '',
        username: data.dbAccount,
        password: data.dbPassword,
        database_name: data.realDataBaseName || data.dbName,
        maxConnections: data.maxConnections ?? data.maxActive,
        maxActive: data.maxActive ?? data.maxConnections,
        initialConnections: data.initialConnections ?? data.initialSize,
        initialSize: data.initialSize ?? data.initialConnections,
        maxIdle: data.maxIdle,
        maxWait: data.maxWait,
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
    // 直接使用jdbcUrl字段
    const dbUrl = data.jdbcUrl || '';
    // 根据数据库类型获取默认dbCheckUrl
    const defaultDbCheckUrls: Record<string, string> = {
      mysql: 'select 1',
      postgresql: 'select 1',
      oracle: 'select 1 from dual',
      sqlserver: 'select 1',
    };
    const dbCheckUrl = data.dbCheckUrl || defaultDbCheckUrls[data.type || 'mysql'] || 'select 1';

    // 获取对应的驱动类
    const driverMap: Record<string, string> = {
      mysql: 'com.mysql.cj.jdbc.Driver',
      postgresql: 'org.postgresql.Driver',
      oracle: 'oracle.jdbc.OracleDriver',
      sqlserver: 'com.microsoft.sqlserver.jdbc.SQLServerDriver',
    };

    // 转换字段名以匹配后端格式
    const postData: any = {
      id: data.id,  // 编辑时需要传ID
      dbName: data.name,
      dbUrl,
      dbCheckUrl,  // 检查用URL
      dbAccount: data.username,
      dbPassword: data.password,
      dbState: data.status === 1 ? '启用' : '禁用',
      driverClass: driverMap[data.type || 'mysql'],
      dbType: data.type?.toUpperCase() || 'MYSQL',
      comment: data.description,
      dataType: data.dataType || 'source',
      categoryId: 5683,
      realDataBaseName: data.database_name,
      // 连接池参数 - 确保始终传递
      maxConnections: data.maxConnections ?? 10,
      maxActive: data.maxActive ?? 10,
      initialConnections: data.initialConnections ?? 5,
      initialSize: data.initialSize ?? 5,
      maxIdle: data.maxIdle ?? 10,
      maxWait: data.maxWait ?? 30000,
      extraParams: data.extraParams || '',
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
    // 直接使用jdbcUrl字段
    const dbUrl = data.jdbcUrl || '';
    // 根据数据库类型获取默认dbCheckUrl
    const defaultDbCheckUrls: Record<string, string> = {
      mysql: 'select 1',
      postgresql: 'select 1',
      oracle: 'select 1 from dual',
      sqlserver: 'select 1',
    };
    const dbCheckUrl = data.dbCheckUrl || defaultDbCheckUrls[data.type || 'mysql'] || 'select 1';

    // 获取对应的驱动类
    const driverMap: Record<string, string> = {
      mysql: 'com.mysql.cj.jdbc.Driver',
      postgresql: 'org.postgresql.Driver',
      oracle: 'oracle.jdbc.OracleDriver',
      sqlserver: 'com.microsoft.sqlserver.jdbc.SQLServerDriver',
    };

    const postData: any = {
      id,
      dbName: data.name,
      dbUrl,
      dbCheckUrl,  // 检查用URL
      dbAccount: data.username,
      dbPassword: data.password,
      dbState: data.status === 1 ? '启用' : '禁用',
      driverClass: driverMap[data.type || 'mysql'],
      dbType: data.type?.toUpperCase() || 'MYSQL',
      comment: data.description,
      dataType: data.dataType || 'source',
      categoryId: 5683,
      realDataBaseName: data.database_name,
      // 连接池参数 - 确保始终传递，空值给默认值
      maxConnections: data.maxConnections ?? 10,
      maxActive: data.maxActive ?? 10,
      initialConnections: data.initialConnections ?? 5,
      initialSize: data.initialSize ?? 5,
      maxIdle: data.maxIdle ?? 10,
      maxWait: data.maxWait ?? 30000,
      extraParams: data.extraParams || '',
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

// 切换数据源状态
export async function toggleDataSourceStatus(id: number, dbState: string): Promise<void> {
  try {
    await api.post('/etl-admin/dataSourceManager/updateDataSourceState', {
      id,
      dbState
    });
  } catch (error) {
    console.error('Failed to toggle datasource status:', error);
    throw error;
  }
}

// 测试数据源连接
export async function testDataSource(idOrData: number | Partial<DataSource>): Promise<{ success: boolean; message: string }> {
  try {
    // 获取驱动类映射
    const driverMap: Record<string, string> = {
      mysql: 'com.mysql.cj.jdbc.Driver',
      postgresql: 'org.postgresql.Driver',
      oracle: 'oracle.jdbc.OracleDriver',
      sqlserver: 'com.microsoft.sqlserver.jdbc.SQLServerDriver',
    };

    // 获取默认dbCheckUrl
    const defaultDbCheckUrls: Record<string, string> = {
      mysql: 'select 1',
      postgresql: 'select 1',
      oracle: 'select 1 from dual',
      sqlserver: 'select 1',
    };

    let postData: any;

    if (typeof idOrData === 'number') {
      // 传入id时，从列表获取数据
      const ds = MOCK_DATASOURCES.find(d => d.id === idOrData);
      if (!ds) return { success: false, message: '数据源不存在' };
      postData = {
        dbUrl: ds.jdbcUrl,
        dbAccount: ds.username,
        dbPassword: ds.password,
        driverClass: driverMap[ds.type] || 'com.mysql.cj.jdbc.Driver',
        dbCheckUrl: ds.dbCheckUrl || defaultDbCheckUrls[ds.type] || 'select 1',
      };
    } else {
      // 直接传数据测试
      postData = {
        dbUrl: idOrData.jdbcUrl,
        dbAccount: idOrData.username,
        dbPassword: idOrData.password,
        driverClass: driverMap[idOrData.type || 'mysql'],
        dbCheckUrl: idOrData.dbCheckUrl || defaultDbCheckUrls[idOrData.type || 'mysql'] || 'select 1',
      };
    }

    const res = await api.post('/etl-admin/dataSourceManager/checkUrl', postData);

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
        sourceId: 0,
        sourceName: item.sourceDb,
        querySql: item.querySql,
        targetId: 0,
        targetName: item.targetDb,
        targetTable: item.targetTable,
        columns: item.columns,
        dynamicSql: item.dynamicParam,
        windowValue: item.taskCronTime || 1,
        windowUnit: (item.taskCronTimeUnit?.toLowerCase() === 'hours' ? 'hours' : 
                     item.taskCronTimeUnit?.toLowerCase() === 'days' ? 'days' : 'minutes') as 'minutes' | 'hours' | 'days',
        status: item.status,
        lastRunTime: item.lastRunTime,
        createdAt: item.createTime || '',
        updatedAt: item.updateTime || '',
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
        sourceId: 0,
        sourceName: data.sourceDb,
        querySql: data.querySql,
        targetId: 0,
        targetName: data.targetDb,
        targetTable: data.targetTable,
        columns: data.columns,
        dynamicSql: data.dynamicParam,
        windowValue: data.taskCronTime || 1,
        windowUnit: (data.taskCronTimeUnit?.toLowerCase() === 'hours' ? 'hours' : 
                     data.taskCronTimeUnit?.toLowerCase() === 'days' ? 'days' : 'minutes') as 'minutes' | 'hours' | 'days',
        status: data.status,
        lastRunTime: data.lastRunTime,
        createdAt: data.createTime || '',
        updatedAt: data.updateTime || '',
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
      sourceDb: data.source_name,  // 数据库名称
      sourceDbId: data.source_id,  // 数据源ID
      targetDb: data.target_name,   // 数据库名称
      targetDbId: data.target_id,  // 数据源ID
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
      sourceDb: data.source_name,  // 数据库名称
      sourceDbId: data.source_id,  // 数据源ID
      targetDb: data.target_name,   // 数据库名称
      targetDbId: data.target_id,  // 数据源ID
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
    sourceId: 1,
    sourceName: 'WMS源库',
    querySql: 'SELECT * FROM exchange_goods WHERE update_time > {lastSyncTime}',
    targetId: 3,
    targetName: '目标库nr_data',
    targetTable: 't_goods_goods_exchange',
    columns: 'id,goods_name,goods_price,stock_num,update_time',
    dynamicSql: "SELECT MAX(update_time) as lastSyncTime FROM t_goods_goods_exchange",
    windowValue: 1,
    windowUnit: 'hours',
    status: 1,
    lastRunTime: '2026-03-10 10:00:00',
    createdAt: '2026-01-05 10:00:00',
    updatedAt: '2026-01-05 10:00:00',
  },
  {
    id: 2,
    name: '商品信息同步',
    sourceId: 2,
    sourceName: 'ERP源库',
    querySql: 'SELECT * FROM products WHERE status = 1',
    targetId: 3,
    targetName: '目标库nr_data',
    targetTable: 't_trade_order',
    columns: 'order_id,product_id,product_name,quantity,price,create_time',
    windowValue: 10,
    windowUnit: 'minutes',
    status: 1,
    lastRunTime: '2026-03-10 09:50:00',
    createdAt: '2026-01-06 10:00:00',
    updatedAt: '2026-01-06 10:00:00',
  },
  {
    id: 3,
    name: '五粮液-会员同步',
    sourceId: 2,
    sourceName: 'ERP源库',
    querySql: 'SELECT * FROM wuliangye_members',
    targetId: 3,
    targetName: '目标库nr_data',
    targetTable: 't_member_info',
    columns: 'member_id,member_name,phone,points,level',
    windowValue: 1,
    windowUnit: 'minutes',
    status: 0,
    lastRunTime: 'Invalid Date',
    createdAt: '2026-01-07 10:00:00',
    updatedAt: '2026-01-07 10:00:00',
  },
];

// ========== API管理 API ==========

// 获取数据源树形结构（按层级）
export async function getDataSourceTree(): Promise<any[]> {
  try {
    // 先获取数据源列表
    const datasources = await getDataSources({});
    // 转换格式
    return datasources.list.map(ds => ({
      id: ds.id,
      name: ds.name,
      type: 'datasource',
      dataType: ds.dataType,
      databaseName: ds.databaseName,
      children: []
    }));
  } catch (error) {
    console.error('Failed to load datasource tree:', error);
    return [];
  }
}

// 获取表列表
export async function getTableList(database: string): Promise<TableInfo[]> {
  try {
    const res = await api.get('/etl-admin/sqlManager/findTable', {
      params: { database }
    });
    if (res.data?.data) {
      // 转换为驼峰命名
      return res.data.data.map((item: any) => ({
        tableName: item.TABLE_NAME,
        tableComment: item.TABLE_COMMENT
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to load tables:', error);
    return [];
  }
}

// 获取表字段信息
export async function getTableColumns(database: string, table: string): Promise<ColumnInfo[]> {
  try {
    const res = await api.get('/etl-admin/sqlManager/findMetaTable', {
      params: { database, table }
    });
    if (res.data?.data?.tablesMetaList) {
      return res.data.data.tablesMetaList.map((item: any) => ({
        columnName: item.columnName || '',
        columnType: item.typeName || '',
        dataType: mapColumnType(item.typeName || ''),
        isPrimary: item.keySeq != null && item.keySeq > 0,
        isNullable: item.nullable === 'YES',
        columnComment: item.comment || ''
      }));
    }
    return [];
  } catch (error) {
    console.error('Failed to load columns:', error);
    return [];
  }
}

// 映射SQL类型
function mapColumnType(sqlType: string): string {
  const type = (sqlType || '').toLowerCase();
  if (type.includes('int') || type.includes('bigint')) return 'integer';
  if (type.includes('decimal') || type.includes('float') || type.includes('double')) return 'decimal';
  if (type.includes('date') && !type.includes('time')) return 'date';
  if (type.includes('time')) return 'datetime';
  if (type.includes('bool')) return 'boolean';
  return 'string';
}

// 获取API列表
export async function getApiList(params: {
  page?: number;
  limit?: number;
  datasourceId?: number;
  databaseName?: string;
  tableName?: string;
  name?: string;
  path?: string;
  source?: string;
}): Promise<{ list: ApiConfig[]; total: number }> {
  try {
    const res = await api.post('/etl-admin/apiManager/list', params);
    if (res.data?.list) {
      return {
        list: res.data.list || [],
        total: res.data.count || 0
      };
    }
    return { list: [], total: 0 };
  } catch (error) {
    console.error('Failed to load API list:', error);
    return { list: MOCK_API_LIST, total: MOCK_API_LIST.length };
  }
}

// 获取API详情
export async function getApiDetail(id: number): Promise<ApiConfig | undefined> {
  try {
    const res = await api.post('/apiManager/detail', { id });
    if (res.data?.data) {
      return res.data.data;
    }
    if (res.data) {
      return res.data;
    }
    return undefined;
  } catch (error) {
    console.error('Failed to load API detail:', error);
    return undefined;
  }
}

// 保存API
export async function saveApi(data: Partial<ApiConfig>): Promise<ApiConfig> {
  try {
    const res = await api.post('/apiManager/save', data);
    return res.data;
  } catch (error) {
    console.error('Failed to save API:', error);
    throw error;
  }
}

// 删除API
export async function deleteApi(id: number): Promise<void> {
  try {
    await api.post('/apiManager/delete', { id });
  } catch (error) {
    console.error('Failed to delete API:', error);
    throw error;
  }
}

// 切换API状态
export async function toggleApi(id: number, status: number): Promise<void> {
  try {
    await api.post('/apiManager/toggle', { id, status });
  } catch (error) {
    console.error('Failed to toggle API:', error);
    throw error;
  }
}

// 测试API
export async function testApi(id: number, testParams: Record<string, any>): Promise<any> {
  try {
    const res = await api.post('/apiManager/test', {
      id,
      testParams
    });
    return res.data;
  } catch (error) {
    console.error('Failed to test API:', error);
    throw error;
  }
}

// 复制API
export async function copyApi(id: number, newName: string): Promise<any> {
  try {
    const res = await api.post('/apiManager/copy', { id, newName });
    return res.data;
  } catch (error) {
    console.error('Failed to copy API:', error);
    throw error;
  }
}

// 获取输入参数
export async function getApiInputParams(_apiId: number): Promise<ApiInputParam[]> {
  try {
    // 这里需要后端提供接口，暂时返回空
    return [];
  } catch (error) {
    return [];
  }
}

// 保存输入参数
export async function saveApiInputParams(apiId: number, params: ApiInputParam[]): Promise<void> {
  try {
    await api.post('apiManager/saveInputParams', {
      apiId,
      params
    });
  } catch (error) {
    console.error('Failed to save input params:', error);
    throw error;
  }
}

// 获取输出参数
export async function getApiOutputParams(_apiId: number): Promise<ApiOutputParam[]> {
  try {
    // 这里需要后端提供接口，暂时返回空
    return [];
  } catch (error) {
    return [];
  }
}

// 保存输出参数
export async function saveApiOutputParams(apiId: number, params: ApiOutputParam[]): Promise<void> {
  try {
    await api.post('/apiManager/saveOutputParams', {
      apiId,
      params
    });
  } catch (error) {
    console.error('Failed to save output params:', error);
    throw error;
  }
}

// ========== 演示数据 ==========
let MOCK_API_LIST: ApiConfig[] = [
  {
    id: 1,
    name: '用户查询',
    path: '/api/user/list',
    method: 'POST',
    datasourceId: 1,
    datasourceName: 'WMS源库',
    databaseName: 'wms_db',
    tableName: 't_users',
    description: '查询用户列表',
    querySql: 'SELECT id,username,email,phone,status\nFROM t_users\n<where>\n  1=1\n</where>',
    paginationEnabled: 1,
    mockEnabled: 1,
    mockData: '{"code":1,"data":{"list":[]},"msg":"success"}',
    status: 1,
    createdAt: '2026-03-01 10:00:00',
    updatedAt: '2026-03-01 10:00:00',
  },
  {
    id: 2,
    name: '订单查询',
    path: '/api/order/list',
    method: 'POST',
    datasourceId: 1,
    datasourceName: 'WMS源库',
    databaseName: 'wms_db',
    tableName: 't_orders',
    description: '查询订单列表',
    querySql: 'SELECT order_id,order_no,amount,status\nFROM t_orders\n<where>\n  1=1\n</where>',
    paginationEnabled: 1,
    mockEnabled: 0,
    status: 1,
    createdAt: '2026-03-02 10:00:00',
    updatedAt: '2026-03-02 10:00:00',
  },
];

// ========== 功能管理 API ==========

// 获取功能列表
export async function getFeatures(params?: { page?: number; limit?: number; keyword?: string }): Promise<{ list: Feature[]; total: number }> {
  try {
    const res = await api.post('/feature/list', {
      page: params?.page || 1,
      pageSize: params?.limit || 5,
      keyword: params?.keyword || '',
    });
    if (((res.data?.code === 1 || res.data?.code === 0 || res.data?.success)) && res.data?.list) {
      return {
        list: res.data.list || [],
        total: res.data.count || 0,
      };
    }
    return { list: [], total: 0 };
  } catch (error) {
    console.error('Failed to load features:', error);
    return { list: [], total: 0 };
  }
}

// 获取功能详情
export async function getFeatureDetail(id: number): Promise<Feature | null> {
  try {
    const res = await api.post('/feature/detail', { id });
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to load feature detail:', error);
    return null;
  }
}

// 保存功能
export async function saveFeature(feature: Feature): Promise<boolean> {
  try {
    const cleanFeature = {
      ...feature,
      columns: feature.columns?.map(col => ({
        fieldName: col.fieldName,
        fieldLabel: col.fieldLabel,
        fieldType: col.fieldType,
        span: col.span,
        sortable: col.sortable,
        visible: col.visible,
        align: col.align,
        queryCondition: col.queryCondition,
        fieldOrder: col.fieldOrder,
        dataDictionary: col.dataDictionary,
      })),
    };
    const res = await api.post('/feature/save', cleanFeature);
    return res.data?.code === 1 || res.data?.code === 0;
  } catch (error) {
    console.error('Failed to save feature:', error);
    return false;
  }
}

// 删除功能
export async function deleteFeature(id: number): Promise<void> {
  try {
    await api.post('/feature/delete', { id });
  } catch (error) {
    console.error('Failed to delete feature:', error);
    throw error;
  }
}

// 获取API列表（用于功能关联）
export async function getApiListSimple(): Promise<ApiConfig[]> {
  try {
    const res = await api.post('/etl-admin/apiManager/list', { page: 1, pageSize: 1000 });
    if (((res.data?.code === 1 || res.data?.code === 0 || res.data?.success)) && res.data?.list) {
      return res.data.list || [];
    }
    return [];
  } catch (error) {
    console.error('Failed to load API list:', error);
    return [];
  }
}

// 获取显示在菜单的功能列表
export async function getMenuFeatures(): Promise<Feature[]> {
  try {
    const res = await api.get('/feature/menuList');
    if (((res.data?.code === 1 || res.data?.code === 0 || res.data?.success)) && res.data?.data) {
      return res.data.data;
    }
    return [];
  } catch (error) {
    console.error('Failed to load menu features:', error);
    return [];
  }
}

// 根据编码获取功能
export async function getFeatureByCode(code: string): Promise<Feature | null> {
  try {
    const res = await api.get('/feature/getByCode', { params: { code } });
    if (((res.data?.code === 1 || res.data?.code === 0 || res.data?.success)) && res.data?.data) {
      return res.data.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to load feature by code:', error);
    return null;
  }
}

// 生成CRUD API
export async function generateCrudApi(dataSourceId: number, tableName: string, featureCode: string, columns?: any[]): Promise<any> {
  try {
    const res = await api.post('/feature/generateApi', {
      dataSourceId,
      tableName,
      featureCode,
      columns: columns || [],
    });
    if ((res.data?.code === 1 || res.data?.code === 0 || res.data?.success)) {
      return res.data.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to generate CRUD API:', error);
    return null;
  }
}

// ========== 数据字典 API ==========

export async function getDictList(params?: { name?: string; code?: string; status?: number; page?: number; limit?: number }): Promise<{ list: Dict[]; total: number }> {
  try {
    const res = await api.post('/api/dict/list', { ...params, page: params?.page || 1, limit: params?.limit || 10 });
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data) {
      return {
        list: res.data.list || [],
        total: res.data.count || 0
      };
    }
    return { list: [], total: 0 };
  } catch (error) {
    console.error('Failed to load dict list:', error);
    return { list: [], total: 0 };
  }
}

export async function getDictDetail(id: number): Promise<Dict | null> {
  try {
    const res = await api.get(`/api/dict/${id}`);
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data) {
      return res.data.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to load dict detail:', error);
    return null;
  }
}

export async function saveDict(dict: Partial<Dict>): Promise<Dict | null> {
  try {
    const res = await api.post('/api/dict', dict);
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data) {
      return res.data.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to save dict:', error);
    throw error;
  }
}

export async function deleteDict(id: number): Promise<void> {
  try {
    await api.delete(`/api/dict/${id}`);
  } catch (error) {
    console.error('Failed to delete dict:', error);
    throw error;
  }
}

export async function getDictItems(dictId: number): Promise<DictItem[]> {
  try {
    const res = await api.get(`/api/dict/${dictId}/items`);
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data || [];
    }
    return [];
  } catch (error) {
    console.error('Failed to load dict items:', error);
    return [];
  }
}

export async function saveDictItem(item: Partial<DictItem>): Promise<DictItem | null> {
  try {
    const res = await api.post('/api/dict/item', item);
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to save dict item:', error);
    throw error;
  }
}

export async function deleteDictItem(id: number): Promise<void> {
  try {
    await api.delete(`/api/dict/item/${id}`);
  } catch (error) {
    console.error('Failed to delete dict item:', error);
    throw error;
  }
}

export async function saveDictItems(dictId: number, dictCode: string, items: DictItem[]): Promise<void> {
  try {
    await api.post(`/api/dict/${dictId}/items?dictCode=${dictCode}`, items);
  } catch (error) {
    console.error('Failed to save dict items:', error);
    throw error;
  }
}

export async function getAllDictItems(): Promise<Record<string, DictItem[]>> {
  try {
    const res = await api.get('/api/dict/all-items');
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data || {};
    }
    return {};
  } catch (error) {
    console.error('Failed to load all dict items:', error);
    return {};
  }
}

// ========== 系统参数 API ==========

export async function getSystemConfigList(params?: { name?: string; code?: string; groupName?: string; status?: number; page?: number; limit?: number }): Promise<{ list: SystemConfig[]; total: number }> {
  try {
    const res = await api.post('/api/system-config/list', { ...params, page: params?.page || 1, limit: params?.limit || 10 });
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data) {
      return {
        list: res.data.list || [],
        total: res.data.count || 0
      };
    }
    return { list: [], total: 0 };
  } catch (error) {
    console.error('Failed to load system config list:', error);
    return { list: [], total: 0 };
  }
}

export async function getSystemConfigDetail(id: number): Promise<SystemConfig | null> {
  try {
    const res = await api.get(`/api/system-config/${id}`);
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to load system config detail:', error);
    return null;
  }
}

export async function saveSystemConfig(config: Partial<SystemConfig>): Promise<SystemConfig | null> {
  try {
    const res = await api.post('/api/system-config', config);
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to save system config:', error);
    throw error;
  }
}

export async function deleteSystemConfig(id: number): Promise<void> {
  try {
    await api.delete(`/api/system-config/${id}`);
  } catch (error) {
    console.error('Failed to delete system config:', error);
    throw error;
  }
}

export async function getSystemConfigByGroup(groupName: string): Promise<SystemConfig[]> {
  try {
    const res = await api.get(`/api/system-config/group/${groupName}`);
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data || [];
    }
    return [];
  } catch (error) {
    console.error('Failed to load system config by group:', error);
    return [];
  }
}

export async function getSystemConfigByCode(code: string): Promise<SystemConfig | null> {
  try {
    const res = await api.post('/api/system-config/list', { code, limit: 1 });
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.list?.length > 0) {
      return res.data.list[0];
    }
    return null;
  } catch (error) {
    console.error('Failed to load system config by code:', error);
    return null;
  }
}

// ========== 角色管理 API ==========

export async function getRoles(params?: { role?: string; page?: number; limit?: number }): Promise<{ list: SysRole[]; total: number }> {
  try {
    const res = await api.post('/sysRole/list', {
      page: params?.page || 1,
      limit: params?.limit || 10,
      role: params?.role || '',
    });
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data) {
      return {
        list: res.data.list || [],
        total: res.data.count || 0
      };
    }
    return { list: [], total: 0 };
  } catch (error) {
    console.error('Failed to load roles:', error);
    return { list: [], total: 0 };
  }
}

export async function getRoleDetail(id: number): Promise<SysRole | null> {
  try {
    const res = await api.post('/sysRole/detail', { id });
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to load role detail:', error);
    return null;
  }
}

export async function saveRole(role: Partial<SysRole>): Promise<SysRole | null> {
  try {
    const res = await api.post('/sysRole/save', role);
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to save role:', error);
    throw error;
  }
}

export async function deleteRole(id: number): Promise<void> {
  try {
    await api.post('/sysRole/delete', { id });
  } catch (error) {
    console.error('Failed to delete role:', error);
    throw error;
  }
}

export async function getRoleMenuIds(roleId: number): Promise<number[]> {
  try {
    const res = await api.post('/sysRole/menuIds', { roleId });
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data || [];
    }
    return [];
  } catch (error) {
    console.error('Failed to load role menu ids:', error);
    return [];
  }
}

export async function bindMenus(roleId: number, menuIds: number[]): Promise<void> {
  try {
    await api.post('/sysRole/bindMenus', { roleId, menuIds });
  } catch (error) {
    console.error('Failed to bind menus:', error);
    throw error;
  }
}

// ========== 用户管理 API ==========

export async function getUsers(params?: { name?: string; phone?: string; employeeNo?: string; page?: number; limit?: number; status?: number }): Promise<{ list: SysUser[]; total: number }> {
  try {
    const res = await api.post('/sysUser/list', {
      page: params?.page || 1,
      limit: params?.limit || 10,
      name: params?.name || '',
      phone: params?.phone || '',
      employeeNo: params?.employeeNo || '',
      status: params?.status,
    });
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data) {
      return {
        list: res.data.list || [],
        total: res.data.count || 0
      };
    }
    return { list: [], total: 0 };
  } catch (error) {
    console.error('Failed to load users:', error);
    return { list: [], total: 0 };
  }
}

export async function getUserDetail(id: number): Promise<SysUser | null> {
  try {
    const res = await api.post('/sysUser/detail', { id });
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to load user detail:', error);
    return null;
  }
}

export async function saveUser(user: Partial<SysUser>): Promise<SysUser | null> {
  const res = await api.post('/etl-admin/sysUser/save', user);
  if (res.data?.code === 0 && res.data?.data) {
    return res.data.data;
  }
  throw new Error(res.data?.msg || '保存失败');
}

export async function deleteUser(id: number): Promise<void> {
  try {
    await api.post('/sysUser/delete', { id });
  } catch (error) {
    console.error('Failed to delete user:', error);
    throw error;
  }
}

export async function userLogin(employeeNo: string, password: string): Promise<{ success: boolean; message: string; user?: SysUser }> {
  try {
    const res = await api.post('/sysUser/login', { employeeNo, password });
    if (res.data?.success) {
      return {
        success: true,
        message: res.data?.message || '登录成功',
        user: res.data?.data?.user,
      };
    }
    return {
      success: false,
      message: res.data?.message || '登录失败',
    };
  } catch (error) {
    console.error('Failed to login:', error);
    return { success: false, message: '登录异常' };
  }
}

export async function changePassword(employeeNo: string, oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await api.post('/sysUser/changePassword', {
      employeeNo,
      oldPassword,
      newPassword,
    });
    if (res.data?.success) {
      return { success: true, message: res.data?.message || '密码修改成功' };
    }
    return { success: false, message: res.data?.message || '密码修改失败' };
  } catch (error) {
    console.error('Failed to change password:', error);
    return { success: false, message: '密码修改异常' };
  }
}

// ========== 菜单管理 API ==========

export async function getMenus(params?: { name?: string; code?: string; page?: number; limit?: number }): Promise<{ list: SysMenu[]; total: number }> {
  try {
    const res = await api.post('/sysMenu/list', {
      page: params?.page || 1,
      limit: params?.limit || 10,
      name: params?.name || '',
      code: params?.code || '',
    });
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data) {
      return {
        list: res.data.list || [],
        total: res.data.count || 0
      };
    }
    return { list: [], total: 0 };
  } catch (error) {
    console.error('Failed to load menus:', error);
    return { list: [], total: 0 };
  }
}

export async function getMenuDetail(id: number): Promise<SysMenu | null> {
  try {
    const res = await api.post('/sysMenu/detail', { id });
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to load menu detail:', error);
    return null;
  }
}

export async function saveMenu(menu: Partial<SysMenu>): Promise<SysMenu | null> {
  try {
    const res = await api.post('/sysMenu/save', menu);
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data;
    }
    return null;
  } catch (error) {
    console.error('Failed to save menu:', error);
    throw error;
  }
}

export async function deleteMenu(id: number): Promise<void> {
  try {
    await api.post('/sysMenu/delete', { id });
  } catch (error) {
    console.error('Failed to delete menu:', error);
    throw error;
  }
}

export async function getMenuTree(): Promise<SysMenu[]> {
  try {
    const res = await api.get('/sysMenu/tree');
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data || [];
    }
    return [];
  } catch (error) {
    console.error('Failed to load menu tree:', error);
    return [];
  }
}

export async function getMenuTreeByRoleId(roleId: number): Promise<SysMenu[]> {
  try {
    const res = await api.post('/sysMenu/roleMenus', { roleId });
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data || [];
    }
    return [];
  } catch (error) {
    console.error('Failed to load role menus:', error);
    return [];
  }
}
