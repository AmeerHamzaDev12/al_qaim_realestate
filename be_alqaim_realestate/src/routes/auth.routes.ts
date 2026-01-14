import express from 'express';
import { registerUser } from '../controllers/auth.controllers';

const router = express.Router();

router.post('/auth/register', registerUser);

export default router;