import { Router } from 'express';
import { workOrderController } from '../controllers/workOrderController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.use(optionalAuth);

// 获取工单列表
router.get('/', workOrderController.getWorkOrders);

// 创建工单
router.post('/', workOrderController.createWorkOrder);

// 更新工单状态
router.patch('/:id/status', workOrderController.updateWorkOrderStatus);

export default router;
