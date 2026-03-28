<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <div class="logo">
          <Database class="logo-icon" />
          <h1>claw-etl</h1>
        </div>
        <p class="subtitle">低代码平台</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="form-item">
          <label>用户名</label>
          <div class="input-wrapper">
            <User class="input-icon" />
            <input
              v-model="form.username"
              type="text"
              placeholder="请输入用户名"
              autocomplete="username"
            />
          </div>
        </div>

        <div class="form-item">
          <label>密码</label>
          <div class="input-wrapper">
            <Lock class="input-icon" />
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="请输入密码"
              autocomplete="current-password"
            />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword">
              <component :is="showPassword ? EyeOff : Eye" />
            </button>
          </div>
        </div>

        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Database, User, Lock, Eye, EyeOff } from 'lucide-vue-next'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

const form = ref({
  username: '',
  password: '',
})

const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  if (!form.value.username || !form.value.password) {
    errorMessage.value = '请输入用户名和密码'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const result = await userStore.login(form.value.username, form.value.password)
    if (result.success) {
      router.push('/')
    } else {
      errorMessage.value = result.message || '登录失败'
    }
  } catch (error: any) {
    errorMessage.value = error?.message || '登录失败，请稍后重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  color: #667eea;
}

.logo h1 {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.subtitle {
  color: #909399;
  font-size: 14px;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  width: 18px;
  height: 18px;
  color: #909399;
  pointer-events: none;
}

.input-wrapper input {
  width: 100%;
  padding: 12px 40px 12px 40px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.input-wrapper input:focus {
  outline: none;
  border-color: #667eea;
}

.toggle-password {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  color: #909399;
  padding: 4px;
}

.toggle-password:hover {
  color: #606266;
}

.error-message {
  color: #f56c6c;
  font-size: 13px;
  text-align: center;
  padding: 8px;
  background: #fef0f0;
  border-radius: 4px;
}

.login-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;
}

.login-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
