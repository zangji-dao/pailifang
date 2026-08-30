import { Router } from 'express';
import { authController } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// 登录
router.post('/login', authController.login);

// 注册
router.post('/register', authController.register);

router.get('/invitations/:token', authController.invitation);
router.post('/invitations/:token/accept', authController.acceptInvitation);

router.get('/me', authMiddleware, authController.me);

router.post('/context', authMiddleware, authController.switchContext);

router.post('/logout', authMiddleware, authController.logout);

export default router;
