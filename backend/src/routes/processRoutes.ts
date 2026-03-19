import { Router } from 'express';
import { processController } from '../controllers/processController';

const router = Router();

// 获取统计信息
router.get('/stats', processController.getStats);

// 获取流程列表
router.get('/', processController.getProcesses);

// 获取单个流程
router.get('/:id', processController.getProcess);

// 更新流程阶段
router.put('/:id/stage', processController.updateStage);

// 跳过阶段
router.post('/:id/skip', processController.skipStage);

// 关联企业
router.post('/:id/link-enterprise', processController.linkEnterprise);

export default router;
