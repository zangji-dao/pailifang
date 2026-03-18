import { Router } from 'express';
import { baseController } from '../controllers/baseController';

const router = Router();

// 获取基地列表
router.get('/', baseController.getBases);

// 初始化基地数据
router.post('/init', baseController.initBaseData);

// 创建基地
router.post('/', baseController.createBase);

// 获取基地详情
router.get('/:id', baseController.getBaseById);

// 更新基地
router.put('/:id', baseController.updateBase);

// 删除基地
router.delete('/:id', baseController.deleteBase);

export default router;
