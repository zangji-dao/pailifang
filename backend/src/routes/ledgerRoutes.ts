import { Router } from 'express';
import { ledgerController } from '../controllers/ledgerController';

const router = Router();

// 获取账套列表
router.get('/', ledgerController.getLedgers);

// 创建账套
router.post('/', ledgerController.createLedger);

// 获取账套详情
router.get('/:id', ledgerController.getLedgerById);

// 更新账套
router.put('/:id', ledgerController.updateLedger);

// 删除账套
router.delete('/:id', ledgerController.deleteLedger);

export default router;
