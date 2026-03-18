# 对象存储服务说明

## 服务概述

本项目使用腾讯云轻量对象存储（COS），已配置完成并可正常使用。

## 存储桶信息

| 配置项 | 值 |
|--------|-----|
| 存储桶名称 | `tianzhi-1314611801` |
| 所属地域 | `ap-beijing`（北京） |
| 访问端点 | `https://cos.ap-beijing.myqcloud.com` |
| 访问权限 | 私有读写 |

## API 密钥

| 配置项 | 环境变量名 | 值 |
|--------|------------|-----|
| Access Key ID | `S3_ACCESS_KEY_ID` | `your_access_key_id` |
| Secret Access Key | `S3_SECRET_ACCESS_KEY` | `your_secret_access_key` |

## 使用方式

### 方式一：直接调用 S3 API（推荐）

使用 AWS SDK for JavaScript v3 调用：

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: 'ap-beijing',
  endpoint: 'https://cos.ap-beijing.myqcloud.com',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
});

// 上传文件
const uploadCommand = new PutObjectCommand({
  Bucket: 'tianzhi-1314611801',
  Key: 'uploads/example.txt',
  Body: Buffer.from('Hello World'),
  ContentType: 'text/plain',
});
await s3Client.send(uploadCommand);

// 获取临时下载链接（1小时有效）
const getCommand = new GetObjectCommand({
  Bucket: 'tianzhi-1314611801',
  Key: 'uploads/example.txt',
});
const downloadUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
```

### 方式二：调用现有后端 API

如果项目与 Π立方会计系统在同一服务器，可直接调用其 API：

**API 地址**：`http://localhost:4001/api/storage`

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/storage/upload` | POST | 上传文件 |
| `/api/storage/files` | GET | 列出文件 |
| `/api/storage/files/:key` | GET | 获取下载链接 |
| `/api/storage/files/:key` | DELETE | 删除文件 |

**上传示例**：
```typescript
const formData = new FormData();
formData.append('file', fileBlob);
formData.append('type', 'document'); // image|document|voucher|contract|export|temp

const response = await fetch('http://localhost:4001/api/storage/upload', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
// result.data.url - 文件访问链接（临时签名 URL）
// result.data.key - 文件路径
```

**获取下载链接示例**：
```typescript
const response = await fetch(`http://localhost:4001/api/storage/files/${key}`);
const result = await response.json();
// result.data.url - 临时下载链接（默认1小时有效）
```

### 方式三：服务器本地挂载

存储桶已挂载到服务器本地目录 `/data/storage/`，可直接读写：

```bash
# 写文件
cp myfile.pdf /data/storage/documents/

# 读文件
ls /data/storage/
cat /data/storage/documents/myfile.pdf
```

## 文件存储路径规范

| 类型 | 路径前缀 | 说明 |
|------|----------|------|
| 图片 | `avatars/` | 头像、图片等 |
| 文档 | `documents/` | 通用文档 |
| 凭证 | `vouchers/` | 会计凭证附件 |
| 合同 | `contracts/` | 合同文件 |
| 导出 | `exports/` | 导出的 Excel/PDF |
| 临时 | `temp/` | 临时文件 |

## 文件大小限制

| 类型 | 最大大小 |
|------|----------|
| 图片 | 5 MB |
| 文档 | 20 MB |
| 凭证 | 20 MB |
| 合同 | 20 MB |
| 导出 | 50 MB |
| 临时 | 50 MB |

## 环境变量配置

在项目 `.env` 文件中添加：

```bash
# 对象存储配置
S3_ACCESS_KEY_ID=your_access_key_id
S3_SECRET_ACCESS_KEY=your_secret_access_key
S3_BUCKET=tianzhi-1314611801
S3_REGION=ap-beijing
S3_ENDPOINT=https://cos.ap-beijing.myqcloud.com
```

## 费用说明

- 存储容量：约 0.118 元/GB/月
- 外网下行流量：约 0.5 元/GB
- 请求次数：约 0.01 元/万次

轻量对象存储有免费额度，小型项目月费用通常在几元以内。

## 注意事项

1. **安全性**：密钥请勿提交到代码仓库，使用环境变量管理
2. **临时链接**：下载链接默认 1 小时有效，可自定义过期时间
3. **CORS 配置**：如需前端直接上传，需在 COS 控制台配置 CORS 规则
