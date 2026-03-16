import { Router } from 'express';
import { authController } from '../controllers/authController';

const router = Router();

// 登录
router.post('/login', authController.login);

// 注册
router.post('/register', authController.register);

export default router;
