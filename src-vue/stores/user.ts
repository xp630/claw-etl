import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/lib/api'

export interface UserInfo {
  id: number
  username: string
  employeeNo?: string
  name?: string
  [key: string]: any
}

export const useUserStore = defineStore('user', () => {
  // ============ State ============
  const token = ref<string | null>(localStorage.getItem('token'))
  const userInfo = ref<UserInfo | null>(null)
  const permissions = ref<string[]>([])

  // ============ Getters ============
  const isLoggedIn = computed(() => !!token.value)

  // ============ Actions ============
  
  // 设置 Token
  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  // 设置用户信息
  function setUserInfo(info: UserInfo) {
    userInfo.value = info
  }

  // 设置权限
  function setPermissions(perms: string[]) {
    permissions.value = perms
  }

  // 登录
  async function login(username: string, password: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await api.post('/auth/login', { username, password })
      if (res.code === 0 || res.code === 1) {
        const { token: newToken, user } = res.data || {}
        if (newToken) {
          setToken(newToken)
        }
        if (user) {
          setUserInfo(user)
        }
        return { success: true }
      }
      return { success: false, message: res.message || '登录失败' }
    } catch (error: any) {
      console.error('Login failed:', error)
      return { success: false, message: error?.message || '登录失败，请稍后重试' }
    }
  }

  // 登出
  function logout() {
    token.value = null
    userInfo.value = null
    permissions.value = []
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // 获取用户信息
  async function fetchUserInfo() {
    if (!token.value) return null
    try {
      const res = await api.get('/user/info')
      if ((res.code === 0 || res.code === 1) && res.data) {
        setUserInfo(res.data)
        return res.data
      }
      return null
    } catch (error) {
      console.error('Failed to fetch user info:', error)
      return null
    }
  }

  // 检查权限
  function hasPermission(perm: string): boolean {
    return permissions.value.includes(perm)
  }

  return {
    // State
    token,
    userInfo,
    permissions,
    // Getters
    isLoggedIn,
    // Actions
    setToken,
    setUserInfo,
    setPermissions,
    login,
    logout,
    fetchUserInfo,
    hasPermission,
  }
})
