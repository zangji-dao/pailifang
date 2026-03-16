import { Router } from 'express';
import { customerController } from '../controllers/customerController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// 所有路由使用可选认证（演示用）
router.use(optionalAuth);

// 获取客户列表
router.get('/', customerController.getCustomers);

// 创建客户
router.post('/', customerController.createCustomer);

export default router;
