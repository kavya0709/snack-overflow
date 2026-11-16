import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { AuthenticatedRequest } from '../middleware/auth';
import { consumeSnackSchema } from '../validators/schemas';
import { Prisma } from '@prisma/client';

/**
 * POST /snacks/:id/consume
 *
 * Uses an atomic PostgreSQL conditional UPDATE to safely decrement quantity.
 * This prevents race conditions: the check and decrement happen atomically in
 * a single SQL statement inside a transaction.
 *
 * The key query:
 *   UPDATE snacks SET quantity = quantity - $amount
 *   WHERE id = $id AND quantity >= $amount
 *   RETURNING *
 *
 * If 0 rows are returned, it means either:
 *   - The snack doesn't exist, OR
 *   - There is insufficient stock
 *
 * We distinguish these by checking snack existence separately.
 *
 * NOTE: We cast id::text on the column side so that the parameterized
 * ${id} (a text value) can be compared to the uuid column without
 * triggering the "operator does not exist: text = uuid" PostgreSQL error.
 * Casting the column is safe and correct since uuid has a canonical text form.
 */
export async function consumeSnack(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const { amount } = consumeSnackSchema.parse(req.body);
  const userId = req.user!.id;

  const result = await prisma.$transaction(async (tx) => {
    // Atomic conditional decrement — this is the critical operation.
    // The WHERE id::text = ${id} pattern avoids the PostgreSQL uuid/text
    // operator mismatch while keeping the value safely parameterized.
    const updated = await tx.$queryRaw<
      {
        id: string;
        name: string;
        quantity: number;
        category: string;
        lowStockThreshold: number;
        createdAt: Date;
        updatedAt: Date;
      }[]
    >(
      Prisma.sql`
        UPDATE snacks
        SET quantity = quantity - ${amount}, "updatedAt" = NOW()
        WHERE id::text = ${id} AND quantity >= ${amount}
        RETURNING id, name, quantity, category, "lowStockThreshold", "createdAt", "updatedAt"
      `,
    );

    if (updated.length === 0) {
      // Check if snack exists at all
      const snack = await tx.snack.findUnique({ where: { id } });
      if (!snack) {
        throw AppError.notFound('Snack not found', 'SNACK_NOT_FOUND');
      }
      // Snack exists but insufficient stock
      throw AppError.conflict(
        'Someone beat you to the last packet! Please refresh the pantry.',
        'INSUFFICIENT_STOCK',
      );
    }

    // Record the consumption activity in the SAME transaction
    await tx.activity.create({
      data: {
        userId,
        snackId: id,
        action: 'CONSUMED',
        amount,
      },
    });

    return updated[0];
  });

  // Fetch the full updated snack for response
  const snack = await prisma.snack.findUnique({
    where: { id },
    include: { _count: { select: { votes: true } } },
  });

  res.json({
    message: `Successfully consumed ${amount} unit(s)`,
    snack: snack
      ? {
          ...snack,
          status:
            snack.quantity === 0
              ? 'GONE'
              : snack.quantity <= snack.lowStockThreshold
              ? 'RUNNING_LOW'
              : 'STOCKED',
          voteCount: snack._count.votes,
          _count: undefined,
        }
      : null,
  });
}
