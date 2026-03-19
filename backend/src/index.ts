import { config } from './config/env';

// 打印环境信息
console.log(`[环境] 当前环境: ${config.env}`);
console.log(`[环境] 数据库: ${config.database.database}`);
console.log(`[环境] 服务端口: ${config.server.port}`);

import express from 'express';
import multer from 'multer';
import { corsMiddleware } from './middleware/cors';
import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import ledgerRoutes from './routes/ledgerRoutes';
import baseRoutes from './routes/baseRoutes';
import accountRoutes from './routes/accountRoutes';
import workOrderRoutes from './routes/workOrderRoutes';
import profitShareRoutes from './routes/profitShareRoutes';
import storageRoutes from './routes/storageRoutes';
import alipayRoutes from './routes/alipayRoutes';
import ysWithRoutes from './routes/ysWithRoutes';

const app = express();
const PORT = config.server.port;

// 文件上传中间件配置
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 最大 50MB
  },
});

// 中间件
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Π立方企业服务中心 API',
    version: '1.0.0',
    environment: config.env,
    database: config.database.database,
  });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/ledgers', ledgerRoutes);
app.use('/api/bases', baseRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/profit-shares', profitShareRoutes);
app.use('/api/alipay', alipayRoutes);
app.use('/api/yswith', ysWithRoutes);

// 文件存储路由（需要文件上传中间件）
app.use('/api/storage', upload.single('file'), storageRoutes);

// API 文档
app.get('/api', (req, res) => {
  res.json({
    message: 'Π立方企业服务中心 API',
    version: '1.0.0',
    environment: config.env,
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
      },
      customers: {
        list: 'GET /api/customers',
        create: 'POST /api/customers',
        get: 'GET /api/customers/:id',
        update: 'PUT /api/customers/:id',
        delete: 'DELETE /api/customers/:id',
      },
      ledgers: {
        list: 'GET /api/ledgers',
        create: 'POST /api/ledgers',
        get: 'GET /api/ledgers/:id',
        update: 'PUT /api/ledgers/:id',
        delete: 'DELETE /api/ledgers/:id',
      },
      bases: {
        list: 'GET /api/bases',
        init: 'POST /api/bases/init',
        create: 'POST /api/bases',
        get: 'GET /api/bases/:id',
        update: 'PUT /api/bases/:id',
        delete: 'DELETE /api/bases/:id',
      },
      accounts: {
        list: 'GET /api/accounts',
        create: 'POST /api/accounts',
        update: 'PUT /api/accounts/:id',
        delete: 'DELETE /api/accounts/:id',
      },
      workOrders: {
        list: 'GET /api/work-orders',
        create: 'POST /api/work-orders',
        update: 'PUT /api/work-orders/:id',
        delete: 'DELETE /api/work-orders/:id',
      },
      profitShares: {
        list: 'GET /api/profit-shares',
        create: 'POST /api/profit-shares',
        update: 'PUT /api/profit-shares/:id',
      },
      storage: {
        upload: 'POST /api/storage/upload',
        list: 'GET /api/storage/files',
        download: 'GET /api/storage/files/:key',
        delete: 'DELETE /api/storage/files/:key',
      },
    },
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({ success: false, error: '接口不存在' });
});

// 错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || '服务器内部错误',
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Backend server is running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/api`);
});

export default app;
