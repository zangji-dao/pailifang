import { Router } from 'express';
import { accountController } from '../controllers/accountController';

const router = Router();

// 获取科目列表
router.get('/', accountController.getAccounts);

// 创建科目
router.post('/', accountController.createAccount);

// 更新科目
router.put('/:id', accountController.updateAccount);

// 删除科目
router.delete('/:id', accountController.deleteAccount);

export default router;
