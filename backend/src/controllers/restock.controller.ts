import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { AuthenticatedRequest } from '../middleware/auth';
import { restockSnackSchema } from '../validators/schemas';
import { calculateStatus } from '../utils/snackStatus';

/**
 * POST /snacks/:id/restock
 * ADMIN ONLY
 *
 * Atomically increments quantity and records a RESTOCKED activity
 * within the same database transaction.
 */
export async function restockSnack(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { amount } = restockSnackSchema.parse(req.body);
  const userId = req.user!.id;

  const snack = await prisma.$transaction(async (tx) => {
    const existing = await tx.snack.findUnique({ where: { id } });
    if (!existing) {
      throw AppError.notFound('Snack not found', 'SNACK_NOT_FOUND');
    }

    // Atomic increment
    const updated = await tx.snack.update({
      where: { id },
      data: { quantity: { increment: amount } },
      include: { _count: { select: { votes: true } } },
    });

    // Record activity in the SAME transaction
    await tx.activity.create({
      data: {
        userId,
        snackId: id,
        action: 'RESTOCKED',
        amount,
      },
    });

    return updated;
  });

  res.json({
    message: `Successfully restocked ${amount} unit(s)`,
    snack: {
      ...snack,
      status: calculateStatus(snack.quantity, snack.lowStockThreshold),
      voteCount: snack._count.votes,
      _count: undefined,
    },
  });
}
