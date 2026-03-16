# 构建日志目录

此目录用于存储服务器构建日志，便于远程查看构建状态。

## 文件说明

- `build.log` - 最新构建日志
- `build-error.log` - 构建失败时的错误日志

## 使用方式

在服务器上执行：
```bash
cd /var/www/pi-cube
./scripts/build-and-log.sh
```

构建完成后，日志会自动推送到 GitHub，可在本地通过 `git pull` 获取。
