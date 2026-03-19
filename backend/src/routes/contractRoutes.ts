import { Router } from 'express';
import { contractController } from '../controllers/contractController';

const router = Router();

// 获取统计信息
router.get('/stats', contractController.getStats);

// 获取合同列表
router.get('/', contractController.getContracts);

// 创建合同
router.post('/', contractController.createContract);

// 获取单个合同
router.get('/:id', contractController.getContract);

// 更新合同
router.put('/:id', contractController.updateContract);

// 删除合同
router.delete('/:id', contractController.deleteContract);

// 签署合同
router.post('/:id/sign', contractController.signContract);

// 终止合同
router.post('/:id/terminate', contractController.terminateContract);

export default router;
