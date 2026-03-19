import { Router } from 'express';
import { addressController } from '../controllers/addressController';

const router = Router();

// 获取统计信息
router.get('/stats', addressController.getStats);

// 获取地址列表
router.get('/', addressController.getAddresses);

// 创建地址
router.post('/', addressController.createAddress);

// 获取单个地址
router.get('/:id', addressController.getAddress);

// 更新地址
router.put('/:id', addressController.updateAddress);

// 删除地址
router.delete('/:id', addressController.deleteAddress);

// 分配地址
router.post('/:id/assign', addressController.assignAddress);

// 释放地址
router.post('/:id/release', addressController.releaseAddress);

export default router;
