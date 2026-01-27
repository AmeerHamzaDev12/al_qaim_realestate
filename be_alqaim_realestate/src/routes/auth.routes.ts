import express from 'express';
import { registerUser,loginUser, CurrentUser } from '../controllers/auth.controllers';
import { authMiddleware } from '../middleware/auth.middleware';
const router = express.Router();

router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.get('/auth/CurrentUser', authMiddleware, CurrentUser);

export default router;