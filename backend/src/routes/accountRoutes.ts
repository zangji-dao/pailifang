import { Router } from 'express';
import { accountController } from '../controllers/accountController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.use(optionalAuth);

// 批量操作
router.post('/batch', accountController.batchOperation);

// 获取科目列表
router.get('/', accountController.getAccounts);

// 获取单个科目详情
router.get('/:id', accountController.getAccountById);

// 创建科目
router.post('/', accountController.createAccount);

// 更新科目
router.put('/:id', accountController.updateAccount);

// 删除科目
router.delete('/:id', accountController.deleteAccount);

export default router;
