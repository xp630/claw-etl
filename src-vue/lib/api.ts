import axios from 'axios'

// 后端API基础URL
const API_BASE = '/etl-admin'

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：添加 Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：统一判断 code（宽松模式，兼容 React）
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('❌ Network Error:', error.message)
    return Promise.reject(error)
  }
)

// ========== 导出 ==========
export { API_BASE }

// ========== Auth API ==========

export async function userLogin(employeeNo: string, password: string): Promise<{ success: boolean; message: string; user?: any }> {
  try {
    const res = await api.post('/sysUser/login', { employeeNo, password })
    if (res.data.code === 1) {
      return {
        success: true,
        message: '登录成功',
        user: res.data.data
      }
    }
    return {
      success: false,
      message: res.data.msg || '登录失败'
    }
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.msg || '网络错误'
    }
  }
}

export async function getMenuTree(): Promise<any[]> {
  try {
    const res = await api.get('/sysMenu/tree')
    if (res.data.code === 1 || res.data.code === 0) {
      return res.data.data || []
    }
    return []
  } catch (error) {
    console.error('获取菜单失败:', error)
    return []
  }
}

export async function saveMenu(menu: any): Promise<any | null> {
  try {
    const res = await api.post('/sysMenu/save', menu)
    if (res.data.code === 1 || res.data.code === 0) {
      return res.data.data
    }
    return null
  } catch (error) {
    console.error('保存菜单失败:', error)
    throw error
  }
}

export async function deleteMenu(id: number): Promise<void> {
  try {
    await api.post('/sysMenu/delete', { id })
  } catch (error) {
    console.error('删除菜单失败:', error)
    throw error
  }
}

export async function getUserInfo(): Promise<any | null> {
  try {
    const res = await api.get('/auth/current')
    if (res.data.code === 1) {
      return res.data.data
    }
    return null
  } catch (error) {
    return null
  }
}

// ========== Page API ==========

export async function getPageList(params: { page: number; limit: number }): Promise<{ list: any[]; total: number }> {
  try {
    const res = await api.post('/page/list', params)
    if (res.data.code === 1) {
      return {
        list: res.data.data?.list || [],
        total: res.data.data?.total || 0
      }
    }
    return { list: [], total: 0 }
  } catch (error) {
    console.error('获取页面列表失败:', error)
    return { list: [], total: 0 }
  }
}

export async function getPageConfig(id: number): Promise<any | null> {
  try {
    const res = await api.get(`/page/${id}`)
    if (res.data.code === 1) {
      return res.data.data
    }
    return null
  } catch (error) {
    console.error('获取页面配置失败:', error)
    return null
  }
}

export async function getPageConfigList(params?: { page?: number; limit?: number; keyword?: string }): Promise<{ list: any[]; total: number }> {
  try {
    const res = await api.post('/pageConfig/list', { page: params?.page || 1, limit: params?.limit || 20, keyword: params?.keyword || '' })
    let list = res.data?.list || res.data?.data?.list || []
    if (!Array.isArray(list)) list = []
    const total = res.data?.total || res.data?.data?.total || list.length
    return { list, total }
  } catch (error) {
    console.error('Failed to get page config list:', error)
    return { list: [], total: 0 }
  }
}

export async function deletePageConfig(id: number): Promise<void> {
  try {
    await api.post('/pageConfig/delete', { id })
  } catch (error) {
    console.error('Failed to delete page config:', error)
    throw error
  }
}

export async function togglePageStatus(id: number): Promise<void> {
  try {
    await api.post('/pageConfig/toggleStatus', { id })
  } catch (error) {
    console.error('Failed to toggle page status:', error)
    throw error
  }
}

export async function savePageConfig(data: any): Promise<{ success: boolean; message: string }> {
  try {
    const res = await api.post('/page/save', data)
    return {
      success: res.data.code === 1,
      message: res.data.msg || (res.data.code === 1 ? '保存成功' : '保存失败')
    }
  } catch (error: any) {
    return {
      success: false,
      message: error?.response?.data?.msg || '保存失败'
    }
  }
}

// ========== DataSource API ==========

export interface DataSource {
  id?: number
  name?: string
  dataType?: string
  dbHost?: string
  dbPort?: string
  dbName?: string
  dbUser?: string
  dbPassword?: string
  dbState?: string
}

export async function getDataSources(params: {
  page: number
  limit: number
  name?: string
  dataType?: string
  dbState?: string
}): Promise<{ list: any[]; total: number }> {
  try {
    const res = await api.post('/dataSourceManager/dataSourceList', {
      page: params.page,
      limit: params.limit,
      name: params.name,
      dataType: params.dataType,
      dbState: params.dbState,
    })
    if (res.data?.code === 0 || res.data?.code === 1) {
      return {
        list: (res.data.list || []).map((item: any) => ({
          id: item.id,
          name: item.dbName,
          comment: item.comment || item.description,
          type: item.dbType?.toLowerCase() || 'mysql',
          dataType: item.dataType || 'source',
          jdbcUrl: item.dbUrl || '',
          dbCheckUrl: item.dbCheckUrl || '',
          username: item.dbAccount,
          password: item.dbPassword,
          database_name: item.realDataBaseName || item.dbName,
          maxConnections: item.maxConnections ?? item.maxActive,
          maxIdle: item.maxIdle,
          maxWait: item.maxWait,
          extraParams: item.extraParams,
          description: item.comment,
          status: item.dbState === '启用' ? 1 : 0,
          dbState: item.dbState,
          createdAt: item.createTime,
          updatedAt: item.updateTime,
        })),
        total: res.data.count || 0,
      }
    }
    return { list: [], total: 0 }
  } catch (error) {
    console.error('Failed to load datasources:', error)
    return { list: [], total: 0 }
  }
}

export async function getDataSource(id: number): Promise<DataSource | undefined> {
  try {
    const res = await api.post('/dataSourceManager/dbSourceDetail', { id: String(id) })
    const data = res.data?.data
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
      }
    }
    return undefined
  } catch (error) {
    console.error('Failed to load datasource:', error)
    return undefined
  }
}


export async function createDataSource(data: Partial<DataSource>): Promise<DataSource | null> {
  try {
    const res = await api.post('/dataSourceManager/addDataSource', data)
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data
    }
    return null
  } catch (error) {
    console.error('Failed to create datasource:', error)
    throw error
  }
}

export async function updateDataSource(id: number, data: Partial<DataSource>): Promise<DataSource | null> {
  try {
    const res = await api.post('/dataSourceManager/addDataSource', { ...data, id })
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data
    }
    return null
  } catch (error) {
    console.error('Failed to update datasource:', error)
    throw error
  }
}

export async function deleteDataSource(id: number): Promise<void> {
  try {
    await api.post('/dataSourceManager/deleteDataSource', { id })
  } catch (error) {
    console.error('Failed to delete datasource:', error)
    throw error
  }
}

export async function toggleDataSourceStatus(id: number, dbState: string): Promise<void> {
  try {
    await api.post('/dataSourceManager/updateDataSourceState', { id, dbState })
  } catch (error) {
    console.error('Failed to toggle datasource status:', error)
    throw error
  }
}

export async function testDataSource(idOrData: number | any): Promise<{ success: boolean; message: string }> {
  try {
    const driverMap: Record<string, string> = {
      mysql: 'com.mysql.cj.jdbc.Driver',
      postgresql: 'org.postgresql.Driver',
      oracle: 'oracle.jdbc.OracleDriver',
      sqlserver: 'com.microsoft.sqlserver.jdbc.SQLServerDriver',
    }

    const defaultDbCheckUrls: Record<string, string> = {
      mysql: 'select 1',
      postgresql: 'select 1',
      oracle: 'select 1 from dual',
      sqlserver: 'select 1',
    }

    let postData: any

    if (typeof idOrData === 'number') {
      // 传入id时，从列表获取数据
      const ds = await getDataSource(idOrData)
      if (!ds) return { success: false, message: '数据源不存在' }
      postData = {
        dbUrl: ds.jdbcUrl,
        dbAccount: ds.username,
        dbPassword: ds.password,
        driverClass: driverMap[ds.type] || 'com.mysql.cj.jdbc.Driver',
        dbCheckUrl: ds.dbCheckUrl || defaultDbCheckUrls[ds.type] || 'select 1',
      }
    } else {
      // 直接传数据测试
      postData = {
        dbUrl: idOrData.jdbcUrl,
        dbAccount: idOrData.username,
        dbPassword: idOrData.password,
        driverClass: driverMap[idOrData.type || 'mysql'],
        dbCheckUrl: idOrData.dbCheckUrl || defaultDbCheckUrls[idOrData.type || 'mysql'] || 'select 1',
      }
    }

    const res = await api.post('/dataSourceManager/testDataSource', postData)
    if (res.data?.code === 1 || res.data?.code === 0) {
      return { success: true, message: res.data?.msg || '连接成功' }
    }
    return { success: false, message: res.data?.msg || '连接失败' }
  } catch (error: any) {
    return { success: false, message: error?.response?.data?.msg || '连接失败' }
  }
}

// ========== Dict API ==========

export async function getDictByName(dictName: string): Promise<{ label: string; value: string }[]> {
  try {
    const res = await api.post('/api/dict/list', { name: dictName, page: 1, limit: 50 })
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data?.list) {
      const dict = res.data.data.list.find((d: any) => d.name === dictName || d.code === dictName)
      if (dict) {
        const itemsRes = await api.get(`/api/dict/${dict.id}/items`)
        if ((itemsRes.data?.code === 1 || itemsRes.data?.code === 0) && itemsRes.data?.data) {
          return (itemsRes.data.data || []).map((item: any) => ({
            label: item.itemLabel,
            value: item.itemValue,
          }))
        }
      }
    }
    return []
  } catch (error) {
    console.error('Failed to load dict by name:', error)
    return []
  }
}

export async function getAllDictItems(): Promise<Record<string, any[]>> {
  try {
    const res = await api.get('/api/dict/all-items')
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data || {}
    }
    return {}
  } catch (error) {
    console.error('Failed to load all dict items:', error)
    return {}
  }
}

export async function getDictList(params?: {
  name?: string
  code?: string
  status?: number
  page?: number
  limit?: number
}): Promise<{ list: any[]; total: number }> {
  try {
    const res = await api.post('/api/dict/list', { ...params, page: params?.page || 1, limit: params?.limit || 10 })
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data) {
      return {
        list: res.data.list || [],
        total: res.data.count || 0
      }
    }
    return { list: [], total: 0 }
  } catch (error) {
    console.error('Failed to load dict list:', error)
    return { list: [], total: 0 }
  }
}

export async function getDictDetail(id: number): Promise<any | null> {
  try {
    const res = await api.get(`/api/dict/${id}`)
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data
    }
    return null
  } catch (error) {
    console.error('Failed to load dict detail:', error)
    return null
  }
}

export async function saveDict(dict: any): Promise<any | null> {
  try {
    const res = await api.post('/api/dict', dict)
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data
    }
    throw new Error(res.data?.msg || '保存失败')
  } catch (error) {
    console.error('Failed to save dict:', error)
    throw error
  }
}

export async function deleteDict(id: number): Promise<void> {
  try {
    await api.delete(`/api/dict/${id}`)
  } catch (error) {
    console.error('Failed to delete dict:', error)
    throw error
  }
}

export async function getDictItems(dictId: number): Promise<any[]> {
  try {
    const res = await api.get(`/api/dict/${dictId}/items`)
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data || []
    }
    return []
  } catch (error) {
    console.error('Failed to load dict items:', error)
    return []
  }
}

export async function saveDictItem(item: any): Promise<any | null> {
  try {
    const res = await api.post('/api/dict/item', item)
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data
    }
    throw new Error(res.data?.msg || '保存失败')
  } catch (error) {
    console.error('Failed to save dict item:', error)
    throw error
  }
}

export async function deleteDictItem(id: number): Promise<void> {
  try {
    await api.delete(`/api/dict/item/${id}`)
  } catch (error) {
    console.error('Failed to delete dict item:', error)
    throw error
  }
}

export async function saveDictItems(dictId: number, dictCode: string, items: any[]): Promise<void> {
  try {
    await api.post(`/api/dict/${dictId}/items?dictCode=${dictCode}`, items)
  } catch (error) {
    console.error('Failed to save dict items:', error)
    throw error
  }
}

// ========== Task API ==========

export async function getTasks(): Promise<any[]> {
  try {
    const res = await api.post('/simple/queryTaskListPage', { page: 1, limit: 20 })
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
        windowUnit: item.taskCronTimeUnit?.toLowerCase() === 'hours' ? 'hours' :
                    item.taskCronTimeUnit?.toLowerCase() === 'days' ? 'days' : 'minutes',
        status: item.status,
        lastRunTime: item.lastRunTime,
        createdAt: item.createTime || '',
        updatedAt: item.updateTime || '',
      }))
    }
    return []
  } catch (error) {
    console.error('Failed to load tasks:', error)
    return []
  }
}

export async function getTask(id: number): Promise<any | undefined> {
  try {
    const res = await api.post('/simple/getById', { id: String(id) })
    if (res.data?.data) {
      return res.data.data
    }
    return undefined
  } catch (error) {
    console.error('Failed to load task:', error)
    return undefined
  }
}

export async function createTask(data: any): Promise<any | null> {
  try {
    // 转换字段名为后端格式
    const camelData = {
      taskName: data.name,
      sourceDb: data.sourceName,
      sourceDbId: data.sourceId,
      targetDb: data.targetName,
      targetDbId: data.targetId,
      querySql: data.querySql,
      targetTable: data.targetTable,
      columns: data.columns,
      dynamicParam: data.dynamicSql,
      taskCronTime: data.windowValue,
      taskCronTimeUnit: data.windowUnit?.toUpperCase() || 'HOURS',
      status: data.status ?? 1,
    }
    const res = await api.post('/simple/saveTaskData', camelData)
    return res.data
  } catch (error) {
    console.error('Failed to create task:', error)
    throw error
  }
}

export async function updateTask(id: number, data: any): Promise<any | null> {
  try {
    const camelData = {
      id,
      taskName: data.name,
      sourceDb: data.sourceName,
      sourceDbId: data.sourceId,
      targetDb: data.targetName,
      targetDbId: data.targetId,
      querySql: data.querySql,
      targetTable: data.targetTable,
      columns: data.columns,
      dynamicParam: data.dynamicSql,
      taskCronTime: data.windowValue,
      taskCronTimeUnit: data.windowUnit?.toUpperCase() || 'HOURS',
      status: data.status,
    }
    const res = await api.post('/simple/saveTaskData', camelData)
    return res.data
  } catch (error) {
    console.error('Failed to update task:', error)
    throw error
  }
}

export async function deleteTask(id: number): Promise<void> {
  try {
    await api.post('/simple/updateStatus', { id, status: -1 })
  } catch (error) {
    console.error('Failed to delete task:', error)
    throw error
  }
}

export async function toggleTask(id: number): Promise<any | null> {
  try {
    const res = await api.post('/simple/updateStatus', { id })
    return res.data
  } catch (error) {
    console.error('Failed to toggle task:', error)
    throw error
  }
}

export async function generateColumns(querySql: string, sourceDb: string): Promise<string[]> {
  try {
    const res = await api.post('/simple/generateTargetColumns', { querySql, sourceDb })
    return res.data?.data || []
  } catch (error) {
    console.error('Failed to generate columns:', error)
    return []
  }
}

// ========== User API ==========

export async function getUsers(params?: {
  name?: string
  phone?: string
  employeeNo?: string
  page?: number
  limit?: number
  status?: number
}): Promise<{ list: any[]; total: number }> {
  try {
    const res = await api.post('/sysUser/list', {
      page: params?.page || 1,
      limit: params?.limit || 10,
      name: params?.name || '',
      phone: params?.phone || '',
      employeeNo: params?.employeeNo || '',
      status: params?.status,
    })
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data) {
      return {
        list: res.data.list || [],
        total: res.data.count || 0,
      }
    }
    return { list: [], total: 0 }
  } catch (error) {
    console.error('Failed to load users:', error)
    return { list: [], total: 0 }
  }
}

export async function getUserDetail(id: number): Promise<any | null> {
  try {
    const res = await api.post('/sysUser/detail', { id })
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data
    }
    return null
  } catch (error) {
    console.error('Failed to load user detail:', error)
    return null
  }
}

export async function saveUser(user: any): Promise<any | null> {
  try {
    const res = await api.post('/sysUser/save', user)
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data
    }
    throw new Error(res.data?.msg || '保存失败')
  } catch (error) {
    console.error('Failed to save user:', error)
    throw error
  }
}

export async function deleteUser(id: number): Promise<void> {
  try {
    await api.post('/sysUser/delete', { id })
  } catch (error) {
    console.error('Failed to delete user:', error)
    throw error
  }
}

// ========== Role API ==========

export async function getRoles(params?: {
  role?: string
  page?: number
  limit?: number
}): Promise<{ list: any[]; total: number }> {
  try {
    const res = await api.post('/sysRole/list', {
      page: params?.page || 1,
      limit: params?.limit || 10,
      role: params?.role || '',
    })
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data) {
      return {
        list: res.data.list || [],
        total: res.data.count || 0,
      }
    }
    return { list: [], total: 0 }
  } catch (error) {
    console.error('Failed to load roles:', error)
    return { list: [], total: 0 }
  }
}

export async function getRoleDetail(id: number): Promise<any | null> {
  try {
    const res = await api.post('/sysRole/detail', { id })
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data
    }
    return null
  } catch (error) {
    console.error('Failed to load role detail:', error)
    return null
  }
}

export async function saveRole(role: any): Promise<any | null> {
  try {
    const res = await api.post('/sysRole/save', role)
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data
    }
    throw new Error(res.data?.msg || '保存失败')
  } catch (error) {
    console.error('Failed to save role:', error)
    throw error
  }
}

export async function deleteRole(id: number): Promise<void> {
  try {
    await api.post('/sysRole/delete', { id })
  } catch (error) {
    console.error('Failed to delete role:', error)
    throw error
  }
}

export async function getRoleMenuIds(roleId: number): Promise<number[]> {
  try {
    const res = await api.post('/sysRole/menuIds', { roleId })
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data || []
    }
    return []
  } catch (error) {
    console.error('Failed to load role menu ids:', error)
    return []
  }
}

export async function bindMenus(roleId: number, menuIds: number[]): Promise<void> {
  try {
    await api.post('/sysRole/bindMenus', { roleId, menuIds })
  } catch (error) {
    console.error('Failed to bind menus:', error)
    throw error
  }
}

// ========== System Config API ==========

export async function getSystemConfigList(params?: {
  name?: string
  code?: string
  groupName?: string
  status?: number
  page?: number
  limit?: number
}): Promise<{ list: any[]; total: number }> {
  try {
    const res = await api.post('/api/system-config/list', {
      page: params?.page || 1,
      limit: params?.limit || 10,
      name: params?.name || '',
      code: params?.code || '',
      groupName: params?.groupName || '',
      status: params?.status,
    })
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data) {
      return {
        list: res.data.list || [],
        total: res.data.count || 0,
      }
    }
    return { list: [], total: 0 }
  } catch (error) {
    console.error('Failed to load system config list:', error)
    return { list: [], total: 0 }
  }
}

export async function getSystemConfigDetail(id: number): Promise<any | null> {
  try {
    const res = await api.get(`/api/system-config/${id}`)
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data
    }
    return null
  } catch (error) {
    console.error('Failed to load system config detail:', error)
    return null
  }
}

export async function saveSystemConfig(config: any): Promise<any | null> {
  try {
    const res = await api.post('/api/system-config', config)
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data
    }
    throw new Error(res.data?.msg || '保存失败')
  } catch (error) {
    console.error('Failed to save system config:', error)
    throw error
  }
}

export async function deleteSystemConfig(id: number): Promise<void> {
  try {
    await api.delete(`/api/system-config/${id}`)
  } catch (error) {
    console.error('Failed to delete system config:', error)
    throw error
  }
}


// ========== API Manager ==========

export async function getApiList(params?: {
  page?: number
  limit?: number
  datasourceId?: number
  name?: string
  path?: string
}): Promise<{ list: any[]; total: number }> {
  try {
    const res = await api.post('/apiManager/list', { page: 1, limit: 100, ...params })
    if (res.data?.list) {
      return { list: res.data.list || [], total: res.data.count || 0 }
    }
    return { list: [], total: 0 }
  } catch (error) {
    console.error('Failed to load API list:', error)
    return { list: [], total: 0 }
  }
}

export async function getApiDetail(id: number): Promise<any | null> {
  try {
    const res = await api.post('/apiManager/detail', { id })
    if (res.data?.data) return res.data.data
    return res.data || null
  } catch (error) {
    console.error('Failed to load API detail:', error)
    return null
  }
}

export async function saveApi(data: any): Promise<any> {
  try {
    const res = await api.post('/apiManager/save', data)
    return res.data
  } catch (error) {
    console.error('Failed to save API:', error)
    throw error
  }
}

export async function deleteApi(id: number): Promise<void> {
  try {
    await api.post('/apiManager/delete', { id })
  } catch (error) {
    console.error('Failed to delete API:', error)
    throw error
  }
}

export async function toggleApi(id: number, status: number): Promise<void> {
  try {
    await api.post('/apiManager/toggle', { id, status })
  } catch (error) {
    console.error('Failed to toggle API:', error)
    throw error
  }
}

export async function testApi(id: number, testParams: Record<string, any>): Promise<any> {
  try {
    const res = await api.post('/apiManager/test', { id, testParams })
    return res.data
  } catch (error) {
    console.error('Failed to test API:', error)
    throw error
  }
}

// ========== Feature API ==========

export interface Feature {
  id?: number
  name: string
  code: string
  type?: 'list' | 'form'
  description?: string
  datasourceId?: number
  datasourceName?: string
  tableName?: string
  queryApiId?: number
  queryApiName?: string
  queryApiPath?: string
  createApiId?: number
  createApiName?: string
  updateApiId?: number
  updateApiName?: string
  deleteApiId?: number
  deleteApiName?: string
  detailApiId?: number
  detailApiName?: string
  columns?: FeatureColumn[]
  permissions?: FeaturePermission[]
  showInMenu?: number
  menuIcon?: string
  menuOrder?: number
  routePath?: string
  status?: number
  createdAt?: string
  updatedAt?: string
}

export interface FeatureColumn {
  id?: number
  featureId?: number
  fieldName: string
  fieldLabel: string
  fieldType: 'text' | 'number' | 'date' | 'select' | 'image' | 'action'
  span?: number
  sortable?: boolean
  visible?: boolean
  align?: 'left' | 'center' | 'right'
  queryCondition?: boolean
  fieldOrder?: number
  dataDictionary?: string
}

export interface FeaturePermission {
  id?: number
  featureId?: number
  roleId?: number
  roleName?: string
  canView?: boolean
  canAdd?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

export async function getFeatures(params: {
  page: number
  limit: number
  keyword?: string
}): Promise<{ list: Feature[]; total: number }> {
  try {
    const res = await api.post('/feature/list', {
      page: params.page,
      limit: params.limit,
      keyword: params.keyword || '',
    })
    if (res.data?.code === 0 || res.data?.code === 1) {
      return {
        list: res.data?.list || res.data?.data?.list || [],
        total: res.data?.count || res.data?.data?.count || res.data?.data?.total || 0,
      }
    }
    return { list: [], total: 0 }
  } catch (error) {
    console.error('Failed to load features:', error)
    return { list: [], total: 0 }
  }
}

export async function getFeatureDetail(id: number): Promise<Feature | null> {
  try {
    const res = await api.post('/feature/detail', { id })
    if (res.data?.code === 0 || res.data?.code === 1) {
      return res.data?.data
    }
    return null
  } catch (error) {
    console.error('Failed to load feature detail:', error)
    return null
  }
}

export async function getFeatureByCode(code: string): Promise<Feature | null> {
  try {
    const res = await api.post('/feature/detailByCode', { code })
    if (res.data?.code === 0 || res.data?.code === 1) {
      return res.data?.data
    }
    return null
  } catch (error) {
    console.error('Failed to load feature by code:', error)
    return null
  }
}

export async function saveFeature(data: Partial<Feature>): Promise<Feature | null> {
  try {
    const res = await api.post('/feature/save', data)
    if (res.data?.code === 0 || res.data?.code === 1) {
      return res.data?.data
    }
    throw new Error(res.data?.msg || '保存失败')
  } catch (error) {
    console.error('Failed to save feature:', error)
    throw error
  }
}

export async function deleteFeature(id: number): Promise<void> {
  try {
    await api.post('/feature/delete', { id })
  } catch (error) {
    console.error('Failed to delete feature:', error)
    throw error
  }
}

// ========== DictItem 类型 (getAllDictItems 返回的数据结构) ==========

export interface DictItem {
  itemValue: string | number
  itemLabel: string
  sort?: number
}

// ========== SQL Manager API ==========

export interface TableInfo {
  tableName: string
  tableComment?: string
}

export interface ColumnInfo {
  columnName: string
  columnType?: string
  dataType: string
  isPrimary?: boolean
  isNullable?: boolean
  columnComment?: string
}

// 获取表列表
export async function getTableList(database: string): Promise<TableInfo[]> {
  try {
    const res = await api.get('/sqlManager/findTable', {
      params: { database }
    });
    if (res.data?.data) {
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

// 映射SQL类型到JS类型
function mapColumnType(sqlType: string): string {
  const type = sqlType.toLowerCase();
  if (type.includes('int') || type.includes('bigint')) return 'integer';
  if (type.includes('decimal') || type.includes('float') || type.includes('double')) return 'decimal';
  if (type.includes('date') && !type.includes('time')) return 'date';
  if (type.includes('time')) return 'datetime';
  if (type.includes('bool')) return 'boolean';
  return 'string';
}

// 兼容性别名
export async function getDatasourceTables(database: string): Promise<TableInfo[]> {
  return getTableList(database);
}
