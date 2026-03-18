import { Router } from 'express';
import { customerController } from '../controllers/customerController';

const router = Router();

// 获取客户列表
router.get('/', customerController.getCustomers);

// 创建客户
router.post('/', customerController.createCustomer);

// 获取客户详情
router.get('/:id', customerController.getCustomerById);

// 更新客户
router.put('/:id', customerController.updateCustomer);

// 删除客户
router.delete('/:id', customerController.deleteCustomer);

export default router;
