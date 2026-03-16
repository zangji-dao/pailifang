import { Router } from 'express';
import { profitShareController } from '../controllers/profitShareController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.use(optionalAuth);

// 获取分润记录列表
router.get('/', profitShareController.getProfitShares);

// 创建分润记录
router.post('/', profitShareController.createProfitShare);

// 更新分润记录状态
router.patch('/:id/status', profitShareController.updateProfitShareStatus);

export default router;
