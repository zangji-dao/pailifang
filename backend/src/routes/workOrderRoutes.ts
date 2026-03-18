import { Router } from 'express';
import { workOrderController } from '../controllers/workOrderController';

const router = Router();

// 获取工单列表
router.get('/', workOrderController.getWorkOrders);

// 创建工单
router.post('/', workOrderController.createWorkOrder);

// 更新工单
router.put('/:id', workOrderController.updateWorkOrder);

// 删除工单
router.delete('/:id', workOrderController.deleteWorkOrder);

export default router;
