# OnlyOffice 迁移检查

旧报告中的固定服务器和临时隧道地址已移除。迁移后请使用正式环境变量重新验证。

## 配置

```env
ONLYOFFICE_URL=https://office.example.com
NEXT_PUBLIC_ONLYOFFICE_URL=https://office.example.com
ONLYOFFICE_JWT_ENABLED=true
ONLYOFFICE_JWT_SECRET=
APP_URL=https://app.example.com
```

## 检查项

1. OnlyOffice Document Server 可通过 HTTPS 访问。
2. `APP_URL` 可被 Document Server 回调访问。
3. JWT 开关和密钥在应用与 Document Server 两侧一致。
4. 文档下载代理能够访问 S3 对象。
5. 编辑、保存、强制保存和回调均返回成功。

不要使用临时隧道地址作为生产配置，也不要在文档中记录真实 JWT 密钥。
