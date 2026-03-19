import { Router } from 'express';
import { applicationController } from '../controllers/applicationController';

const router = Router();

// 获取统计信息
router.get('/stats', applicationController.getStats);

// 获取申请列表
router.get('/', applicationController.getApplications);

// 创建申请
router.post('/', applicationController.createApplication);

// 获取单个申请
router.get('/:id', applicationController.getApplication);

// 更新申请
router.put('/:id', applicationController.updateApplication);

// 删除申请
router.delete('/:id', applicationController.deleteApplication);

// 提交审批
router.post('/:id/submit', applicationController.submitApplication);

// 审批通过
router.post('/:id/approve', applicationController.approveApplication);

// 审批驳回
router.post('/:id/reject', applicationController.rejectApplication);

export default router;
