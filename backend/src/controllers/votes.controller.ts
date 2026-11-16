import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { AuthenticatedRequest } from '../middleware/auth';
import { Prisma } from '@prisma/client';

/**
 * POST /snacks/:id/vote
 *
 * The uniqueness is enforced at database level via composite unique constraint on (userId, snackId).
 * Concurrent duplicate requests will cause a unique constraint violation (Prisma P2002),
 * which is caught and returned as 409. This handles race conditions correctly.
 */
export async function voteForSnack(req: AuthenticatedRequest, res: Response) {
  const { id: snackId } = req.params;
  const userId = req.user!.id;

  const snack = await prisma.snack.findUnique({ where: { id: snackId } });
  if (!snack) {
    throw AppError.notFound('Snack not found', 'SNACK_NOT_FOUND');
  }

  try {
    await prisma.vote.create({
      data: { userId, snackId },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw AppError.conflict('You have already voted for this snack', 'ALREADY_VOTED');
    }
    throw err;
  }

  const voteCount = await prisma.vote.count({ where: { snackId } });
  res.status(201).json({ message: 'Vote recorded', voteCount, hasVoted: true });
}

/**
 * DELETE /snacks/:id/vote
 *
 * Remove the authenticated user's vote. Users can only remove their own votes.
 */
export async function removeVote(req: AuthenticatedRequest, res: Response) {
  const { id: snackId } = req.params;
  const userId = req.user!.id;

  const vote = await prisma.vote.findUnique({
    where: { userId_snackId: { userId, snackId } },
  });

  if (!vote) {
    throw AppError.notFound("You haven't voted for this snack", 'VOTE_NOT_FOUND');
  }

  await prisma.vote.delete({
    where: { userId_snackId: { userId, snackId } },
  });

  const voteCount = await prisma.vote.count({ where: { snackId } });
  res.json({ message: 'Vote removed', voteCount, hasVoted: false });
}
