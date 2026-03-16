import express from 'express';
import { corsMiddleware } from './middleware/cors';
import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import ledgerRoutes from './routes/ledgerRoutes';
import workOrderRoutes from './routes/workOrderRoutes';
import profitShareRoutes from './routes/profitShareRoutes';
import accountRoutes from './routes/accountRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/ledgers', ledgerRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/profit-shares', profitShareRoutes);
app.use('/api/accounts', accountRoutes);

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
});

export default app;
