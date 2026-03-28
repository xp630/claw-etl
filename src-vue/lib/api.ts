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
}): Promise<{ list: DataSource[]; total: number }> {
  try {
    const res = await api.post('/dataSourceManager/dataSourceList', {
      page: params.page,
      limit: params.limit,
      name: params.name,
      dataType: params.dataType,
      dbState: params.dbState,
    })
    if ((res.data?.code === 1 || res.data?.code === 0) && res.data?.data) {
      return res.data.data
    }
    return { list: [], total: 0 }
  } catch (error) {
    console.error('Failed to load datasources:', error)
    return { list: [], total: 0 }
  }
}

export async function createDataSource(data: Partial<DataSource>): Promise<DataSource | null> {
  try {
    const res = await api.post('/etl-admin/dataSourceManager/addDataSource', data)
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
    const res = await api.post('/etl-admin/dataSourceManager/addDataSource', { ...data, id })
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
    await api.post('/etl-admin/dataSourceManager/deleteDataSource', { id })
  } catch (error) {
    console.error('Failed to delete datasource:', error)
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

    const res = await api.post('/etl-admin/dataSourceManager/testDataSource', postData)
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
