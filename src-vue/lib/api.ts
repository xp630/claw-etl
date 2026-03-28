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

// 响应拦截器：统一判断 code
api.interceptors.response.use(
  (response) => {
    const { data } = response
    // code 为 0 或 1 表示成功，其他表示失败
    if (data.code !== 0 && data.code !== 1) {
      console.error('❌ API Error:', data.msg || '请求失败')
      return Promise.reject(new Error(data.msg || '请求失败'))
    }
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
    const res = await api.get('/menu/tree')
    if (res.data.code === 1) {
      return res.data.data || []
    }
    return []
  } catch (error) {
    console.error('获取菜单失败:', error)
    return []
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
