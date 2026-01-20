import express from 'express';
import { registerUser,loginUser, CurrentUser } from '../controllers/auth.controllers';

const router = express.Router();

router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
router.get('/auth/CurrentUser', CurrentUser);

export default router;