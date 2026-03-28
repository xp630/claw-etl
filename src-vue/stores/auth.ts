import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import { encryptPassword } from '@/lib/crypto'

const API_BASE = '/etl-admin'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<{
    id?: number
    name: string
    username?: string
    avatar?: string
    roles?: string[]
  }>({
    name: '用户',
  })
  const loading = ref(false)
  const error = ref<string>('')

  // Getters
  const isLoggedIn = computed(() => !!token.value)

  // Actions
  async function login(username: string, password: string): Promise<boolean> {
    loading.value = true
    error.value = ''

    try {
      const response = await axios.post(`${API_BASE}/sysUser/login`, {
        employeeNo: username,
        password: encryptPassword(password),
      })

      if (response.data?.success) {
        const data = response.data?.data?.user || response.data.data
        // 优先取 token，如果没有则用 username 作为临时 token
        token.value = data?.token || data?.access_token || response.data.data?.token || username
        userInfo.value = {
          id: data?.id,
          name: data?.name || username,
          username: data?.username || username,
          avatar: data?.avatar,
          roles: data?.roles,
        }
        localStorage.setItem('token', token.value)
        localStorage.setItem('user', JSON.stringify(userInfo.value))
        return true
      } else {
        error.value = response.data.message || '登录失败'
        ElMessage.error(error.value)
        return false
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || '登录失败，请检查用户名密码'
      ElMessage.error(error.value)
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = { name: '用户' }
    localStorage.removeItem('token')
    ElMessage.success('已退出登录')
  }

  async function fetchUserInfo() {
    if (!token.value) return

    try {
      const response = await axios.get(`${API_BASE}/users/me`, {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
      })

      if (response.data.code === 0 || response.data.code === 200) {
        const data = response.data.data || response.data
        userInfo.value = {
          id: data.id,
          name: data.name || data.username,
          username: data.username,
          avatar: data.avatar,
          roles: data.roles,
        }
      }
    } catch (error) {
      console.error('Failed to fetch user info:', error)
      if (error.response?.status === 401) {
        logout()
      }
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    loading,
    error,
    login,
    logout,
    fetchUserInfo,
  }
})
