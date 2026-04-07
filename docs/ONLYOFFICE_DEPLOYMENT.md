# OnlyOffice 部署指南

## 一、服务器要求

| 资源 | 最低要求 | 推荐配置 |
|------|---------|---------|
| CPU | 2 核心 | 4 核心+ |
| 内存 | 4 GB | 8 GB+ |
| 磁盘 | 20 GB | 50 GB+ |
| 操作系统 | Linux (Ubuntu 20.04+) | Ubuntu 22.04 |
| Docker | 20.10+ | 最新版 |

## 二、Docker 部署

### 2.1 安装 Docker（如未安装）

```bash
# Ubuntu
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

### 2.2 部署 OnlyOffice Document Server

```bash
# 方式一：直接运行（最简单）
docker run -i -t -d -p 8080:80 \
  --restart=always \
  --name onlyoffice \
  onlyoffice/documentserver

# 方式二：docker-compose（推荐）
mkdir -p /opt/onlyoffice
cd /opt/onlyoffice
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  onlyoffice:
    image: onlyoffice/documentserver:latest
    container_name: onlyoffice
    restart: always
    ports:
      - "8080:80"
    environment:
      - JWT_ENABLED=true
      - JWT_SECRET=your_jwt_secret_key_here
    volumes:
      - ./data:/var/www/onlyoffice/Data
      - ./logs:/var/log/onlyoffice
      - ./lib:/var/lib/onlyoffice
EOF

docker-compose up -d
```

### 2.3 验证部署

```bash
# 等待 1-2 分钟启动完成
curl http://localhost:8080/healthcheck

# 应该返回: true
```

## 三、安全配置

### 3.1 JWT 认证（生产环境必须）

```bash
# 生成 JWT 密钥
openssl rand -hex 32

# 在 docker-compose.yml 中配置
environment:
  - JWT_ENABLED=true
  - JWT_SECRET=你生成的密钥
```

### 3.2 HTTPS 配置（生产环境推荐）

```nginx
# Nginx 反向代理配置
server {
    listen 443 ssl;
    server_name office.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 四、应用配置

### 4.1 环境变量

在项目中添加以下环境变量：

```bash
# .env.local 或环境变量
ONLYOFFICE_URL=http://localhost:8080  # OnlyOffice 服务地址
ONLYOFFICE_JWT_SECRET=your_jwt_secret_key_here  # JWT 密钥（与 Docker 配置一致）
```

### 4.2 Next.js 配置

```javascript
// next.config.ts
const nextConfig = {
  // 允许加载 OnlyOffice 资源
  async headers() {
    return [
      {
        source: '/api/onlyoffice/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};
```

## 五、工作原理

```
┌──────────────────────────────────────────────────────────────┐
│                      用户浏览器                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │               OnlyOffice Editor (JS)                    │  │
│  │         通过 iframe 嵌入，提供 Word 编辑界面              │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ 1. 加载文档请求
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                   你的 Next.js 应用                           │
│  ┌──────────────────┐    ┌──────────────────────────────┐   │
│  │  /api/onlyoffice │    │    对象存储 (Supabase/OSS)    │   │
│  │  - 返回文档 URL   │◄──►│    存储原始 .docx 文件        │   │
│  │  - 接收回调保存    │    │                              │   │
│  └──────────────────┘    └──────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ 2. 文档 URL
                            ▼
┌──────────────────────────────────────────────────────────────┐
│              OnlyOffice Document Server (Docker)             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  - 获取文档内容                                         │  │
│  │  - 转换为编辑格式                                       │  │
│  │  - 提供协作编辑服务                                     │  │
│  │  - 回调保存修改后的文档                                  │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## 六、常见问题

### Q1: 首次启动很慢？
A: OnlyOffice 首次启动需要初始化数据库，大约需要 1-3 分钟。

### Q2: 文档加载失败？
A: 检查以下几点：
- OnlyOffice 服务是否正常运行
- 文档 URL 是否可访问
- JWT 配置是否正确

### Q3: 如何自定义字体？
A: 将字体文件复制到容器内并重建：
```bash
docker cp /path/to/fonts onlyoffice:/usr/share/fonts/custom/
docker exec onlyoffice fc-cache -fv
docker restart onlyoffice
```

## 七、插件部署

### 7.1 变量绑定插件

本项目提供了一个变量绑定插件，用于在合同模板中插入和管理变量标记。

**插件目录结构**：
```
public/plugins/variable-binding/
├── manifest.json   # 插件配置
├── code.js         # 插件逻辑
├── panel.html      # 插件面板
└── icon.svg        # 插件图标
```

### 7.2 部署插件到 OnlyOffice

```bash
# 方式一：复制到 OnlyOffice 容器内
docker cp public/plugins/variable-binding onlyoffice:/var/www/onlyoffice/documentserver/sdkjs-plugins/

# 重启容器使插件生效
docker restart onlyoffice

# 方式二：使用卷挂载（推荐）
# 在 docker-compose.yml 中添加：
volumes:
  - ./plugins:/var/www/onlyoffice/documentserver/sdkjs-plugins
```

### 7.3 验证插件安装

1. 访问 OnlyOffice 编辑器
2. 点击顶部菜单的「插件」标签
3. 应该能看到「变量绑定」插件

### 7.4 插件使用

1. 在编辑器中打开合同模板
2. 点击「插件」→「变量绑定」
3. 在面板中选择要插入的变量
4. 点击「插入」按钮，变量会以内容控件形式插入到文档中

## 八、资源链接

- [OnlyOffice 官方文档](https://api.onlyoffice.com/)
- [Docker Hub](https://hub.docker.com/r/onlyoffice/documentserver)
- [API 示例](https://api.onlyoffice.com/editors/basic)
- [插件开发指南](https://api.onlyoffice.com/plugin/basic)
