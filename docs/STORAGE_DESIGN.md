# 对象存储设计方案

## 环境规划

| 环境 | 存储服务 | 说明 |
|------|----------|------|
| 开发环境 | 本地文件系统 | 沙箱环境使用 /tmp |
| 生产环境 | 腾讯云 Lighthouse 轻量对象存储 | S3 兼容，同地域高速访问 |

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
              │   S3 兼容 API           │
              └─────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           │                               │
           ▼                               ▼
   ┌───────────────┐              ┌───────────────┐
   │   开发环境     │              │   生产环境     │
   │   本地 /tmp    │              │  Lighthouse   │
   │   文件系统     │              │  轻量对象存储   │
   └───────────────┘              └───────────────┘
```

## 腾讯云 Lighthouse 轻量对象存储配置

### 1. 开通服务

```bash
# 腾讯云控制台
# 轻量应用服务器 → 对象存储 → 开通

# 或访问：https://lighthouse.cloud.tencent.com/
```

### 2. 创建存储桶

```bash
存储桶名称: pi-cube-files
所属地域: 与 Lighthouse 服务器同地域（如 ap-beijing）
访问权限: 私有读写
```

### 3. 获取密钥

```bash
# 访问管理 → 访问密钥 → API密钥管理

SecretId: AKIDxxxxxxxxxxxxxxxx
SecretKey: xxxxxxxxxxxxxxxxxxxxxxxx

# 或使用 Lighthouse 专属密钥（推荐）
# 轻量对象存储 → 密钥管理
```

### 4. 获取访问端点

```bash
# 存储桶详情中获取
Endpoint: cos.ap-beijing.myqcloud.com
Bucket: pi-cube-files-1234567890  # 带 APPID 的完整名称
```

### 5. 环境变量配置

```bash
# .env.production

# 腾讯云 Lighthouse 轻量对象存储配置
STORAGE_TYPE=lighthouse
S3_ACCESS_KEY_ID=AKIDxxxxxxxxxxxxxxxx
S3_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxx
S3_BUCKET=pi-cube-files-1234567890
S3_REGION=ap-beijing
S3_ENDPOINT=https://cos.ap-beijing.myqcloud.com
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

## 开发环境配置

```bash
# .env.development

# 本地文件系统配置
STORAGE_TYPE=local
LOCAL_STORAGE_PATH=/tmp/uploads
```

**说明**：开发环境使用本地文件系统，文件存储在 `/tmp/uploads` 目录。

## 待办事项

- [ ] 在 Lighthouse 控制台开通轻量对象存储
- [ ] 创建存储桶（pi-cube-files）
- [ ] 获取访问密钥（SecretId/SecretKey）
- [ ] 配置生产环境变量
- [ ] 实现存储服务代码（S3 兼容接口）
- [ ] 测试文件上传下载

## Lighthouse 轻量对象存储优势

| 特性 | 说明 |
|------|------|
| S3 兼容 | 使用标准 S3 API，无需修改代码 |
| 同地域免费内网传输 | 与 Lighthouse 服务器同地域访问免流量费 |
| 按量付费 | 只为实际使用付费 |
| 简单易用 | 无需额外配置，与 Lighthouse 深度集成 |

## 费用预估

| 项目 | 免费额度 | 超出费用 |
|------|----------|----------|
| 存储容量 | 50 GB/月 | 0.118 元/GB/月 |
| 外网下行流量 | 10 GB/月 | 0.5 元/GB |
| 请求次数 | 100 万次/月 | 0.01 元/万次 |

**预估月费用**: 10-50 元（根据使用量）
