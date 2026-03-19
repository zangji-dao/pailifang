import { Router } from 'express';
import { enterpriseController } from '../controllers/enterpriseController';

const router = Router();

// 获取企业统计
router.get('/stats', enterpriseController.getStats);

// 获取企业列表
router.get('/', enterpriseController.getEnterprises);

// 创建企业
router.post('/', enterpriseController.createEnterprise);

export default router;
