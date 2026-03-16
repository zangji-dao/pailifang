import { Router } from 'express';
import { ledgerController } from '../controllers/ledgerController';
import { optionalAuth } from '../middleware/auth';

const router = Router();

router.use(optionalAuth);

// 获取账套列表
router.get('/', ledgerController.getLedgers);

// 创建账套
router.post('/', ledgerController.createLedger);

export default router;
