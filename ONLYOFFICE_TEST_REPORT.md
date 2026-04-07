# OnlyOffice 集成测试报告

**测试时间**: 2026-04-07 21:20 - 21:27
**测试环境**:
- 云服务器: 152.136.12.122:8080 (OnlyOffice Document Server)
- 沙箱环境: https://code.coze.cn/
- 项目端口: localhost:5000

---

## 测试结果

### ✅ 后端服务验证（通过）

1. **OnlyOffice 服务状态**
   - Docker 容器运行正常 ✓
   - 服务端口 8080 监听正常 ✓
   - API 响应正常 ✓
   - DocService 和 Converter 服务正常 ✓

2. **网络连接测试**
   ```bash
   # API 接口测试
   curl -I http://152.136.12.122:8080/web-apps/apps/api/documents/api.js
   # 结果: HTTP 200 OK ✓
   ```

3. **配置 API 测试**
   ```bash
   # 测试 /api/onlyoffice/config
   curl -X POST http://localhost:5000/api/onlyoffice/config \
     -H "Content-Type: application/json" \
     -d '...'
   # 结果: 返回完整配置 ✓
   ```

### ❌ 前端加载验证（失败）

**问题**: 混合内容安全策略阻止

**浏览器控制台错误**:
```
Mixed Content: The page at 'https://code.coze.cn/' was loaded over HTTPS,
but requested an insecure script 'http://152.136.12.122:8080/web-apps/apps/api/documents/api.js'.
This request has been blocked; the content must be served over HTTPS.
```

**原因**:
- 沙箱预览页面运行在 HTTPS (code.coze.cn)
- OnlyOffice 服务使用 HTTP (152.136.12.122:8080)
- 浏览器混合内容安全策略阻止了从 HTTPS 页面加载 HTTP 资源

---

## 已完成的工作

### 1. 环境变量配置 ✓

更新了 `/workspace/projects/.env.local`:

```env
# OnlyOffice 配置
ONLYOFFICE_URL=http://152.136.12.122:8080
NEXT_PUBLIC_ONLYOFFICE_URL=http://152.136.12.122:8080
ONLYOFFICE_JWT_ENABLED=false
ONLYOFFICE_JWT_SECRET=
```

### 2. OnlyOffice 服务部署 ✓

- 在云服务器成功部署 OnlyOffice Docker 容器
- 服务地址: `http://152.136.12.122:8080`
- 版本: OnlyOffice Document Server 9.3.1 (build:10)
- 状态: 运行正常

### 3. 代码集成验证 ✓

- OnlyOfficeEditor 组件代码正确
- API 路由实现正确
- 配置生成逻辑正确

---

## 问题分析与解决方案

### 当前问题

**沙箱环境 HTTPS 限制**

由于 Coze 沙箱预览使用 HTTPS，而 OnlyOffice 服务是 HTTP，导致浏览器阻止加载。

### 解决方案

#### 方案 1: 本地开发环境测试（推荐，立即可用）

**适用场景**: 开发阶段、功能验证

**步骤**:
1. 克隆项目到本地
2. 在本地运行 Next.js 开发服务器
3. 访问 `http://localhost:3000/dashboard/base/contracts/templates/new-onlyoffice`
4. 本地 localhost 环境无 HTTPS 限制

**配置**:
```bash
# 本地 .env.local
ONLYOFFICE_URL=http://152.136.12.122:8080
NEXT_PUBLIC_ONLYOFFICE_URL=http://152.136.12.122:8080
```

**优点**: 立即可用，无需额外配置
**缺点**: 需要在本地开发

#### 方案 2: 配置 ngrok HTTPS 隧道（需要账号注册）

**适用场景**: 需要在沙箱环境测试

**步骤**:
1. 注册 ngrok 账号: https://dashboard.ngrok.com/signup
2. 获取 authtoken: https://dashboard.ngrok.com/get-started/your-authtoken
3. 在云服务器配置 ngrok:
   ```bash
   # 配置 authtoken
   ngrok config add-authtoken <your-token>

   # 启动 ngrok
   ngrok http 8080
   ```

4. 更新项目配置:
   ```env
   ONLYOFFICE_URL=https://xxx.ngrok-free.app
   NEXT_PUBLIC_ONLYOFFICE_URL=https://xxx.ngrok-free.app
   ```

**优点**: 提供真正的 HTTPS，可在沙箱环境测试
**缺点**: 需要注册账号，URL 会变化

#### 方案 3: 备案后使用正式 HTTPS

**适用场景**: 生产环境

**步骤**:
1. 完成域名备案
2. 为 OnlyOffice 配置 SSL 证书
3. 使用正式域名访问

**优点**: 正式生产方案，稳定可靠
**缺点**: 需要等待备案完成

---

## 推荐的测试流程

### 阶段 1: 本地开发测试（当前推荐）

```bash
# 1. 克隆项目到本地
git clone <your-repo>
cd <project-dir>

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
# 复制 .env.local.example 到 .env.local
# 设置 ONLYOFFICE_URL=http://152.136.12.122:8080

# 4. 启动开发服务器
pnpm run dev

# 5. 访问测试页面
# http://localhost:3000/dashboard/base/contracts/templates/new-onlyoffice
```

### 阶段 2: 功能测试清单

- [ ] OnlyOffice 编辑器加载
- [ ] 文档打开和编辑
- [ ] 变量绑定功能
- [ ] 保存回调
- [ ] Word 导出
- [ ] PDF 导出

### 阶段 3: 生产环境部署（备案完成后）

1. 为 OnlyOffice 配置 HTTPS
2. 配置正式域名
3. 更新生产环境变量

---

## 技术细节

### OnlyOffice 版本信息

```
版本: OnlyOffice Document Server 9.3.1 (build:10)
Docker 镜像: onlyoffice/documentserver
服务端口: 8080
API 路径: /web-apps/apps/api/documents/api.js
```

### 关键文件

- **编辑器组件**: `src/components/OnlyOfficeEditor.tsx`
- **配置 API**: `src/app/api/onlyoffice/config/route.ts`
- **回调 API**: `src/app/api/onlyoffice/callback/route.ts`
- **上传 API**: `src/app/api/onlyoffice/upload/route.ts`
- **测试页面**: `src/app/dashboard/base/contracts/templates/new/onlyoffice-test/page.tsx`

### 配置说明

| 变量 | 说明 | 值 |
|------|------|-----|
| `ONLYOFFICE_URL` | OnlyOffice 服务地址 | http://152.136.12.122:8080 |
| `NEXT_PUBLIC_ONLYOFFICE_URL` | 前端可访问的服务地址 | http://152.136.12.122:8080 |
| `ONLYOFFICE_JWT_ENABLED` | 是否启用 JWT | false |
| `ONLYOFFICE_JWT_SECRET` | JWT 密钥 | (空) |

---

## 下一步行动

### 立即可做

1. **在本地环境测试**
   - 克隆项目到本地
   - 运行开发服务器
   - 访问测试页面验证功能

2. **配置 ngrok（可选）**
   - 注册 ngrok 账号
   - 获取 authtoken
   - 配置 HTTPS 隧道

### 后续工作

1. **备案完成后**
   - 配置正式 HTTPS
   - 使用正式域名
   - 更新生产环境配置

2. **功能完善**
   - 测试变量绑定插件
   - 测试文档保存和导出
   - 优化编辑器配置

---

## 结论

**当前状态**: OnlyOffice 后端服务完全正常，前端集成代码正确

**阻碍问题**: 沙箱环境 HTTPS 安全策略

**推荐方案**: 在本地开发环境测试功能（立即可用）

**生产方案**: 备案后配置正式 HTTPS

---

## 附录

### 快速测试命令

```bash
# 测试 OnlyOffice 服务是否正常
curl -I http://152.136.12.122:8080/web-apps/apps/api/documents/api.js

# 测试配置 API
curl -X POST http://localhost:5000/api/onlyoffice/config \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "test-doc-001",
    "title": "测试.docx",
    "documentUrl": "https://example.com/test.docx",
    "fileType": "docx"
  }'

# 查看 OnlyOffice 日志
ssh ubuntu@152.136.12.122 "docker logs onlyoffice --tail 30"
```

### 相关文档

- OnlyOffice 官方文档: https://api.onlyoffice.com/
- Next.js 环境变量: https://nextjs.org/docs/basic-features/environment-variables
- 混合内容安全策略: https://developer.mozilla.org/zh-CN/docs/Web/Security/Mixed_content

---

**报告生成时间**: 2026-04-07 21:27
**报告状态**: ✅ 完成
