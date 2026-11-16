import { Router } from 'express';
import { login, me, logout } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { loginSchema } from '../validators/schemas';

const router = Router();

router.post('/login', validate(loginSchema), login);
router.get('/me', authenticate, me);
router.post('/logout', logout);

export default router;
