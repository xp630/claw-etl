import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export interface DictItem {
  id?: number
  itemValue: string
  itemLabel: string
  sort?: number
  status?: number
}

export interface PageConfig {
  id: number
  code: string
  name: string
  components?: any[]
}

export async function getPageConfigList(params: { page: number; limit: number }): Promise<{ list: PageConfig[]; total: number }> {
  const res = await api.post('/page/list', params)
  if (res.code === 0 || res.code === 1) {
    return {
      list: res.data?.list || [],
      total: res.data?.total || 0
    }
  }
  return { list: [], total: 0 }
}

export async function getPageConfig(id: number): Promise<PageConfig | null> {
  const res = await api.get(`/page/${id}`)
  if (res.code === 0 || res.code === 1) {
    return res.data
  }
  return null
}

export async function getAllDictItems(): Promise<Record<string, DictItem[]>> {
  try {
    const res = await api.get('/dict/all-items')
    if ((res.code === 1 || res.code === 0) && res.data) {
      return res.data || {}
    }
    return {}
  } catch (error) {
    console.error('Failed to load all dict items:', error)
    return {}
  }
}

export async function getDictByName(dictName: string): Promise<{ label: string; value: string }[]> {
  try {
    const res = await api.post('/dict/list', { name: dictName, page: 1, limit: 50 })
    if ((res.code === 1 || res.code === 0) && res.data?.list) {
      const dict = res.data.list.find((d: any) => d.name === dictName || d.code === dictName)
      if (dict) {
        const itemsRes = await api.get(`/dict/${dict.id}/items`)
        if ((itemsRes.code === 1 || itemsRes.code === 0) && itemsRes.data) {
          return (itemsRes.data || []).map((item: any) => ({
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
