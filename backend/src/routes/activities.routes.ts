import { Router } from 'express';
import { getActivities } from '../controllers/activities.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, requireAdmin, getActivities);

export default router;
