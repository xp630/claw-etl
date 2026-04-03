<template>
  <div class="login-wrapper">
    <!-- Left brand panel -->
    <div class="login-brand">
      <div class="brand-content">
        <svg class="brand-logo" width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="12" fill="currentColor"/>
          <path d="M14 34V14l10 10 10-10v20" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h1 class="brand-name">claw-etl</h1>
        <p class="brand-tagline">低代码数据编排平台</p>
        
        <div class="brand-features">
          <div class="feature-item">
            <span class="feature-dot"></span>
            <span>可视化页面编辑</span>
          </div>
          <div class="feature-item">
            <span class="feature-dot"></span>
            <span>多数据源连接</span>
          </div>
          <div class="feature-item">
            <span class="feature-dot"></span>
            <span>任务调度编排</span>
          </div>
        </div>
      </div>
      <div class="brand-footer">
        <span class="brand-version">v1.0.0</span>
      </div>
    </div>

    <!-- Right login form -->
    <div class="login-main">
      <div class="login-container">
        <div class="login-header">
          <h2>登录账号</h2>
          <p>输入您的凭证以继续</p>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          class="login-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="username" class="form-item-block">
            <label class="form-label">用户名</label>
            <el-input
              v-model="form.username"
              placeholder="请输入用户名"
              size="large"
              :prefix-icon="User"
              class="form-input"
            />
          </el-form-item>

          <el-form-item prop="password" class="form-item-block">
            <div class="label-row">
              <label class="form-label">密码</label>
            </div>
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
              show-password
              class="form-input"
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-form-item class="form-item-block">
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              class="login-button"
              @click="handleLogin"
            >
              {{ loading ? '登录中...' : '登录' }}
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-footer">
          <span class="demo-hint">演示账号: admin / admin123</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      const success = await authStore.login(form.username, form.password)
      if (success) {
        router.push('/home')
      }
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
}

/* Left brand panel */
.login-brand {
  flex: 1;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px;
  position: relative;
  overflow: hidden;
}

.login-brand::before {
  content: '';
  position: absolute;
  top: -200px;
  left: -200px;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, var(--accent-light) 0%, transparent 70%);
  pointer-events: none;
}

.brand-content {
  position: relative;
  z-index: 1;
}

.brand-logo {
  color: var(--accent);
  margin-bottom: 24px;
}

.brand-name {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}

.brand-tagline {
  font-size: 16px;
  color: var(--text-muted);
  margin: 0 0 48px;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary);
  font-size: 14px;
}

.feature-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

.brand-footer {
  position: relative;
  z-index: 1;
}

.brand-version {
  font-size: 12px;
  color: var(--text-muted);
  font-family: 'SF Mono', Monaco, monospace;
}

/* Right login form */
.login-main {
  width: 480px;
  background: var(--bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.login-container {
  width: 100%;
  max-width: 360px;
}

.login-header {
  margin-bottom: 40px;
}

.login-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px;
  letter-spacing: -0.01em;
}

.login-header p {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-item-block {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.label-row .form-label {
  margin-bottom: 0;
}

.form-input {
  --el-input-bg-color: var(--input-bg);
  --el-input-border-color: var(--input-border);
  --el-input-hover-border-color: var(--accent);
  --el-input-focus-border-color: var(--accent);
}

.login-button {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 500;
  background: var(--accent);
  border-color: var(--accent);
}

.login-button:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.login-footer {
  margin-top: 24px;
  text-align: center;
}

.demo-hint {
  font-size: 12px;
  color: var(--text-muted);
}

/* Responsive */
@media (max-width: 900px) {
  .login-wrapper {
    flex-direction: column;
  }
  
  .login-brand {
    padding: 32px;
    border-right: none;
    border-bottom: 1px solid var(--border-light);
  }
  
  .brand-features {
    display: none;
  }
  
  .login-main {
    width: 100%;
    padding: 32px;
  }
}
</style>
