import { Router } from 'express';
import { businessMetricController } from '../controllers/businessMetricController';
import { authMiddleware, requirePermission } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);
router.get('/options', requirePermission('metrics.read', 'metrics.submit', 'metrics.review', 'metrics.manage'), businessMetricController.options);
router.get('/summary', requirePermission('metrics.read', 'metrics.manage'), businessMetricController.summary);
router.get('/', requirePermission('metrics.read', 'metrics.submit', 'metrics.review', 'metrics.manage'), businessMetricController.list);
router.post('/', requirePermission('metrics.submit', 'metrics.manage'), businessMetricController.save);
router.post('/:id/submit', requirePermission('metrics.submit', 'metrics.manage'), businessMetricController.submit);
router.post('/:id/review', requirePermission('metrics.review', 'metrics.manage'), businessMetricController.review);

export default router;
