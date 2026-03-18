import { Router } from 'express';
import { profitShareController } from '../controllers/profitShareController';

const router = Router();

// 获取分润列表
router.get('/', profitShareController.getProfitShares);

// 创建分润记录
router.post('/', profitShareController.createProfitShare);

// 更新分润
router.put('/:id', profitShareController.updateProfitShare);

export default router;
