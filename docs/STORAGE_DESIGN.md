# 对象存储设计方案

## 环境规划

| 环境 | 存储服务 | 说明 |
|------|----------|------|
| 开发环境 | MinIO / 本地 | S3 兼容，本地测试 |
| 生产环境 | 腾讯云 COS | 正式存储 |

## 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                      应用层                              │
│                                                         │
│   uploadFile()  downloadFile()  deleteFile()            │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │     Storage Service     │
              │   (统一存储接口)         │
              └─────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           │                               │
           ▼                               ▼
   ┌───────────────┐              ┌───────────────┐
   │   开发环境     │              │   生产环境     │
   │   MinIO/本地   │              │  腾讯云 COS    │
   │   localhost    │              │ lighthouse     │
   └───────────────┘              └───────────────┘
```

## 腾讯云 COS 配置

### 1. 创建存储桶

```bash
# 登录腾讯云控制台
# 对象存储 COS → 创建存储桶

存储桶名称: pi-cube-files
所属地域: ap-beijing (根据服务器位置选择)
访问权限: 私有读写
```

### 2. 创建密钥

```bash
# 访问管理 → 访问密钥 → API密钥管理

SecretId: AKIDxxxxxxxxxxxxxxxx
SecretKey: xxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. 环境变量配置

```bash
# .env.production

# 腾讯云 COS 配置
COS_SECRET_ID=AKIDxxxxxxxxxxxxxxxx
COS_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
COS_BUCKET=pi-cube-files
COS_REGION=ap-beijing
```

## 存储目录结构

```
pi-cube-files/
├── avatars/                    # 用户头像
│   └── {userId}/
│       └── avatar.jpg
│
├── vouchers/                   # 凭证附件
│   └── {ledgerId}/
│       └── {voucherId}/
│           └── receipt.pdf
│
├── contracts/                  # 合同文件
│   └── {contractId}/
│       └── contract.pdf
│
├── exports/                    # 导出文件
│   └── reports/
│       └── {date}/
│           └── report.xlsx
│
└── temp/                       # 临时文件（定期清理）
    └── {sessionId}/
        └── upload.tmp
```

## 文件命名规范

| 类型 | 格式 | 示例 |
|------|------|------|
| 头像 | `avatars/{userId}/avatar.{ext}` | `avatars/user-123/avatar.jpg` |
| 凭证 | `vouchers/{ledgerId}/{voucherId}/{filename}` | `vouchers/L001/V001/receipt.pdf` |
| 合同 | `contracts/{contractId}/{filename}` | `contracts/C001/lease.pdf` |
| 导出 | `exports/{type}/{date}/{filename}` | `exports/reports/2024-03/summary.xlsx` |

## 文件大小限制

| 类型 | 最大大小 | 说明 |
|------|----------|------|
| 图片 | 5 MB | 头像、照片等 |
| 文档 | 20 MB | PDF、Excel 等 |
| 临时文件 | 50 MB | 导出文件等 |

## 开发环境方案

### 方案1：本地文件系统（简单）

```
开发环境文件存储在: /tmp/uploads/
```

### 方案2：MinIO（S3 兼容）

```bash
# docker-compose.yml
version: '3'
services:
  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
```

## 待办事项

- [ ] 腾讯云创建 COS 存储桶
- [ ] 获取 API 密钥
- [ ] 配置环境变量
- [ ] 实现存储服务代码
- [ ] 测试文件上传下载

## 费用预估

| 项目 | 免费额度 | 超出费用 |
|------|----------|----------|
| 存储容量 | 50 GB/月 | 0.118 元/GB/月 |
| 外网下行流量 | 10 GB/月 | 0.5 元/GB |
| 请求次数 | 100 万次/月 | 0.01 元/万次 |

**预估月费用**: 10-50 元（根据使用量）
