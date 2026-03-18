# 对象存储配置指南

本指南帮助你配置腾讯云 COS（对象存储）服务。

## 📋 配置步骤

### 第一步：开通对象存储

1. 登录腾讯云控制台：https://console.cloud.tencent.com

2. 搜索「对象存储 COS」或访问：https://console.cloud.tencent.com/cos

3. 如果未开通，点击「立即开通」（免费开通，按量付费）

### 第二步：创建存储桶

1. 在存储桶列表页面，点击「创建存储桶」

2. 填写基本信息：
   
   | 配置项 | 推荐值 | 说明 |
   |--------|--------|------|
   | 名称 | pi-cube-files | 全局唯一，会自动追加 APPID |
   | 所属地域 | 北京 | 选择离用户最近的地域 |
   | 访问权限 | 私有读写 | 推荐使用签名 URL 访问 |

3. 点击「创建」

### 第三步：获取 API 密钥

1. 点击右上角头像 → 「访问管理」→「访问密钥」→「API密钥管理」
   
   或直接访问：https://console.cloud.tencent.com/cam/capi

2. 点击「新建密钥」

3. 记录以下信息：
   - **SecretId** → `S3_ACCESS_KEY_ID`
   - **SecretKey** → `S3_SECRET_ACCESS_KEY`

   ⚠️ **重要**：密钥只显示一次，请妥善保存！

### 第四步：获取存储桶信息

在存储桶列表中，点击刚创建的存储桶：

1. **存储桶名称**
   - 位置：存储桶列表 → 名称列
   - 格式：`pi-cube-files-1234567890`（包含自动追加的 APPID）
   - 对应：`S3_BUCKET`

2. **所属地域**
   - 位置：存储桶详情 → 基本信息 → 所属地域
   - 格式：`ap-beijing`
   - 对应：`S3_REGION`

3. **访问域名**
   - 位置：存储桶详情 → 基本信息 → 访问域名
   - 格式：`pi-cube-files-1234567890.cos.ap-beijing.myqcloud.com`
   - 端点：`https://cos.ap-beijing.myqcloud.com`（去掉存储桶名）
   - 对应：`S3_ENDPOINT`

### 第五步：配置环境变量

在 `backend/.env` 文件中添加：

```bash
# 对象存储配置
S3_ACCESS_KEY_ID=你的SecretId
S3_SECRET_ACCESS_KEY=你的SecretKey
S3_BUCKET=pi-cube-files-1234567890
S3_REGION=ap-beijing
S3_ENDPOINT=https://cos.ap-beijing.myqcloud.com
```

## 🧪 测试配置

运行测试脚本验证配置：

```bash
cd backend
pnpm tsx src/scripts/test-storage.ts
```

成功输出：

```
======================================
  对象存储服务测试
======================================

📋 检查环境变量...
✅ 环境变量配置完整

📦 存储配置:
   存储桶: pi-cube-files-1234567890
   地域: ap-beijing
   端点: https://cos.ap-beijing.myqcloud.com

📤 测试上传文件...
✅ 上传成功:
   Key: temp/1234567890-abc123.txt
   Size: 45 bytes
   URL: https://pi-cube-files-1234567890.cos.ap-beijing.myqcloud.com/...

======================================
  ✅ 所有测试通过！
======================================
```

## 🌍 地域对照表

| 地域 | S3_REGION | S3_ENDPOINT |
|------|-----------|-------------|
| 北京 | ap-beijing | https://cos.ap-beijing.myqcloud.com |
| 上海 | ap-shanghai | https://cos.ap-shanghai.myqcloud.com |
| 广州 | ap-guangzhou | https://cos.ap-guangzhou.myqcloud.com |
| 成都 | ap-chengdu | https://cos.ap-chengdu.myqcloud.com |
| 重庆 | ap-chongqing | https://cos.ap-chongqing.myqcloud.com |
| 深圳 | ap-shenzhen | https://cos.ap-shenzhen.myqcloud.com |

## ❓ 常见问题

### 1. SignatureDoesNotMatch 错误

**原因**：SecretId 或 SecretKey 不正确

**解决**：
- 检查 `.env` 文件中的密钥是否正确
- 确保密钥没有多余空格或换行
- 重新生成密钥

### 2. NoSuchBucket 错误

**原因**：存储桶名称不正确或存储桶不存在

**解决**：
- 确认存储桶名称包含 APPID（如 `pi-cube-files-1234567890`）
- 检查存储桶是否已创建

### 3. AccessDenied 错误

**原因**：密钥没有存储桶访问权限

**解决**：
1. 访问 CAM 控制台：https://console.cloud.tencent.com/cam
2. 找到对应的用户或密钥
3. 添加 `QcloudCOSFullAccess` 策略

### 4. 连接超时

**原因**：地域或端点配置错误

**解决**：
- 确认 `S3_REGION` 和 `S3_ENDPOINT` 匹配
- 检查网络连接

## 💰 费用说明

腾讯云 COS 采用按量付费：

| 计费项 | 免费额度 | 超出后价格 |
|--------|----------|------------|
| 存储容量 | 6个月免费 50GB | ~0.118元/GB/月 |
| 外网下行流量 | 6个月免费 10GB | ~0.5元/GB |
| 请求次数 | 6个月免费 100万次 | ~0.01元/万次 |

> 对于中小企业应用，月费用通常在几元到几十元之间。

## 🔒 安全建议

1. **使用私有读写**：通过签名 URL 临时授权访问
2. **定期轮换密钥**：建议每 3-6 个月更换一次
3. **最小权限原则**：只授予必要的存储桶访问权限
4. **启用版本控制**：防止误删除（可选）
