# 低代码平台 - 部署文档

本文档提供低代码可视化编辑器的完整部署指南。

## 📋 环境要求

### 运行环境

| 项目 | 最低版本 | 推荐版本 |
|------|----------|----------|
| Node.js | 18.0.0 | 20.x LTS |
| npm | 9.0.0 | 10.x |
| 操作系统 | macOS 12 / Ubuntu 20.04 / Windows 10 | macOS 14 / Ubuntu 22.04 |

### 后端依赖

- **后端服务**: http://localhost:8090/etl-admin
- **浏览器**: Chrome 90+ / Firefox 88+ / Safari 14+ / Edge 90+

## 🛠 安装步骤

### 1. 克隆项目

```bash
cd /path/to/lowcode-platform
```

### 2. 安装前端依赖

```bash
cd code
npm install
```

> 如果遇到网络问题，可以使用国内镜像：
> ```bash
> npm install --registry=https://registry.npmmirror.com
> ```

### 3. 验证安装

```bash
npm list vue typescript vite
```

确保输出包含：
- vue 3.5.x
- typescript 5.9.x
- vite 8.x

## ⚙️ 配置说明

### 环境变量（可选）

在项目根目录创建 `.env` 文件：

```bash
# API 基础地址
VITE_API_BASE_URL=http://localhost:8090/etl-admin

# 端口配置
VITE_PORT=5173
```

### Vite 配置说明

项目根目录的 `vite.config.ts` 包含开发环境的 API 代理配置：

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8090',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '/etl-admin'),
    },
  },
}
```

**配置说明**：
- `/api` 开头的请求会被代理到后端服务
- `changeOrigin: true` 保证后端能获取到正确的 Host
- `rewrite` 将 `/api` 前缀替换为 `/etl-admin`

### 生产环境配置

构建前请确保后端 API 地址正确，可通过环境变量配置：

```bash
# 构建时指定 API 地址
VITE_API_BASE_URL=https://your-api-domain.com/etl-admin npm run build
```

## 🚀 启动命令

### 开发环境

```bash
# 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 指定端口启动
npm run dev -- --port 3000

# 启动并打开浏览器
npm run dev -- --open
```

### 构建生产版本

```bash
# 构建生产版本（输出到 dist/ 目录）
npm run build

# 构建并查看分析报告
npm run build -- --mode production
```

### 预览生产构建

```bash
# 预览本地构建产物
npm run preview

# 指定端口预览
npm run preview -- --port 4000
```

## 🐳 Docker 部署

### 构建 Docker 镜像

```bash
# 构建前端镜像
docker build -t lowcode-platform:latest .

# 或者使用多阶段构建（推荐）
docker build -f Dockerfile.multi -t lowcode-platform:latest .
```

### 运行容器

```bash
# 运行容器
docker run -d \
  --name lowcode \
  -p 80:80 \
  lowcode-platform:latest

# 带环境变量运行
docker run -d \
  --name lowcode \
  -p 80:80 \
  -e VITE_API_BASE_URL=https://api.example.com/etl-admin \
  lowcode-platform:latest
```

### Docker Compose 完整部署

```yaml
version: '3.8'

services:
  frontend:
    build: ./code
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=http://backend:8090/etl-admin
    depends_on:
      - backend
    networks:
      - lowcode-network

  backend:
    image: your-backend-image:latest
    ports:
      - "8090:8090"
    networks:
      - lowcode-network

networks:
  lowcode-network:
    driver: bridge
```

## 🌐 Nginx 部署

### 基础配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/lowcode-platform/dist;
    index index.html;

    # 启用 gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:8090/etl-admin/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### HTTPS 配置

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ... 其他配置同上 ...
}
```

## 🔍 常见问题

### 1. 安装依赖失败

**问题**: `npm install` 报网络错误或超时

**解决方案**:
```bash
# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com
npm install

# 或使用 VPN
```

### 2. 端口被占用

**问题**: `Error: listen EADDRINUSE :::5173`

**解决方案**:
```bash
# 方法1：使用其他端口
npm run dev -- --port 3000

# 方法2：查找并终止占用进程
lsof -i :5173
kill -9 <PID>
```

### 3. API 请求 404

**问题**: 调用 API 时返回 404

**解决方案**:
1. 确认后端服务已启动且运行在 `http://localhost:8090`
2. 检查 Vite 代理配置是否正确
3. 确认后端路由前缀是 `/etl-admin`

### 4. 构建后页面空白

**问题**: `npm run build` 后打开页面显示空白

**解决方案**:
1. 清理浏览器缓存
2. 检查浏览器控制台是否有资源 404 错误
3. 确认 `vite.config.ts` 中 `base` 配置正确（生产环境可能需要设置为 `/` 或 `/sub-path/`）
4. 如果部署在子路径，更新 `vite.config.ts`:
   ```typescript
   export default defineConfig({
     base: '/lowcode/',
     // ...
   })
   ```

### 5. TypeScript 类型错误

**问题**: 构建时出现类型错误

**解决方案**:
```bash
# 检查类型定义
npx tsc --noEmit

# 更新 TypeScript 和类型定义
npm update typescript @vue/tsconfig
```

### 6. 跨域问题

**问题**: 浏览器报 CORS 错误

**解决方案**:
- 开发环境：Vite 已配置代理，无需额外处理
- 生产环境：在后端服务配置 CORS 头，或通过 Nginx 反向代理

### 7. 热更新不生效

**问题**: 修改代码后页面没有自动刷新

**解决方案**:
1. 检查终端是否有编译错误
2. 尝试清除缓存：`rm -rf node_modules/.vite`
3. 重启开发服务器

## 📊 健康检查

部署完成后，通过以下方式验证：

```bash
# 检查前端页面
curl -I http://localhost:5173

# 检查 API 代理
curl -I http://localhost:5173/api/health

# 检查后端服务
curl -I http://localhost:8090/etl-admin/health
```

## 🔄 升级指南

### 前端升级

```bash
# 查看可升级的包
npm outdated

# 升级所有依赖到最新版本
npm update

# 升级到新的大版本（请先备份）
npx npm-check-updates -u
npm install
```

### 常见升级场景

| 场景 | 命令 |
|------|------|
| Vue 3 小版本升级 | `npm update vue vue-router pinia` |
| Vite 大版本升级 | `npm update vite @vitejs/plugin-vue` |
| Element Plus 升级 | `npm update element-plus @element-plus/icons-vue` |

## 📞 技术支持

如遇到部署问题，请提供以下信息：

1. 操作系统和版本
2. Node.js 版本：`node -v`
3. npm 版本：`npm -v`
4. 完整的错误信息
5. 相关日志输出
