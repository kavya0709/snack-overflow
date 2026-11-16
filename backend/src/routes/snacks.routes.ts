import { Router } from 'express';
import {
  getSnacks,
  getSnackById,
  createSnack,
  updateSnack,
  deleteSnack,
  getSummary,
} from '../controllers/snacks.controller';
import { consumeSnack } from '../controllers/consume.controller';
import { restockSnack } from '../controllers/restock.controller';
import { voteForSnack, removeVote } from '../controllers/votes.controller';
import { authenticate, requireAdmin } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createSnackSchema,
  updateSnackSchema,
  consumeSnackSchema,
  restockSnackSchema,
  snackQuerySchema,
} from '../validators/schemas';

const router = Router();

// Summary must be before /:id to avoid matching 'summary' as an ID
router.get('/summary', authenticate, getSummary);

// Snack CRUD
router.get('/', authenticate, validate(snackQuerySchema, 'query'), getSnacks);
router.get('/:id', authenticate, getSnackById);
router.post('/', authenticate, requireAdmin, validate(createSnackSchema), createSnack);
router.patch('/:id', authenticate, requireAdmin, validate(updateSnackSchema), updateSnack);
router.delete('/:id', authenticate, requireAdmin, deleteSnack);

// Consume & Restock
router.post('/:id/consume', authenticate, validate(consumeSnackSchema), consumeSnack);
router.post('/:id/restock', authenticate, requireAdmin, validate(restockSnackSchema), restockSnack);

// Votes
router.post('/:id/vote', authenticate, voteForSnack);
router.delete('/:id/vote', authenticate, removeVote);

export default router;
