# Π立方企业服务中心 - 首次部署脚本
# 在服务器上直接运行此脚本

# 1. 创建目录
mkdir -p /var/www
cd /var/www

# 2. 克隆代码
git clone https://github.com/zangji-dao/pailifang.git pi-accounting
cd pi-accounting

# 3. 安装 pnpm（如未安装）
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
fi

# 4. 安装 PM2（如未安装）
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# 5. 安装项目依赖
pnpm install

# 6. 构建项目
pnpm run build

# 7. 启动服务
pm2 start pnpm --name "pi-accounting" -- run start

# 8. 保存 PM2 配置
pm2 save

# 9. 设置开机自启
pm2 startup

echo "========================================"
echo "部署完成！"
echo "服务运行在: http://localhost:5000"
echo "========================================"
