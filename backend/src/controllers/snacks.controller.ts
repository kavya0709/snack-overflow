import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/errors';
import { AuthenticatedRequest } from '../middleware/auth';
import { calculateStatus, isValidStatus } from '../utils/snackStatus';
import {
  createSnackSchema,
  updateSnackSchema,
  snackQuerySchema,
} from '../validators/schemas';
import { Category, Prisma } from '@prisma/client';

function formatSnack(snack: {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  lowStockThreshold: number;
  createdAt: Date;
  updatedAt: Date;
  _count?: { votes: number };
  votes?: { userId: string }[];
}) {
  return {
    ...snack,
    status: calculateStatus(snack.quantity, snack.lowStockThreshold),
    voteCount: snack._count?.votes ?? 0,
    _count: undefined,
  };
}

export async function getSnacks(req: AuthenticatedRequest, res: Response) {
  const query = snackQuerySchema.parse(req.query);
  const { category, status, search, page, limit, sortBy, sortOrder } = query;

  const userId = req.user?.id;

  // Build the where clause
  const where: Prisma.SnackWhereInput = {};

  if (category) {
    where.category = category;
  }

  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  // Status filtering requires filtering after fetching (computed field)
  // For large datasets, a DB view would be better, but this handles it correctly
  const allMatchingSnacks = await prisma.snack.findMany({
    where,
    include: {
      _count: { select: { votes: true } },
      votes: userId ? { where: { userId }, select: { userId: true } } : false,
    },
  });

  // Apply status filter (computed)
  let filtered = allMatchingSnacks;
  if (status && isValidStatus(status)) {
    filtered = allMatchingSnacks.filter(
      (s) => calculateStatus(s.quantity, s.lowStockThreshold) === status,
    );
  }

  // Sort
  if (sortBy === 'name') {
    filtered.sort((a, b) =>
      sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name),
    );
  } else if (sortBy === 'quantity') {
    filtered.sort((a, b) =>
      sortOrder === 'asc' ? a.quantity - b.quantity : b.quantity - a.quantity,
    );
  } else if (sortBy === 'votes') {
    filtered.sort((a, b) =>
      sortOrder === 'asc'
        ? (a._count?.votes ?? 0) - (b._count?.votes ?? 0)
        : (b._count?.votes ?? 0) - (a._count?.votes ?? 0),
    );
  } else {
    // Default sort by name asc
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const offset = (page - 1) * limit;
  const paginated = filtered.slice(offset, offset + limit);

  res.json({
    snacks: paginated.map((s) => ({
      ...formatSnack(s),
      hasVoted: userId ? (s.votes as { userId: string }[]).some((v) => v.userId === userId) : false,
      votes: undefined,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}

export async function getSnackById(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const userId = req.user?.id;

  const snack = await prisma.snack.findUnique({
    where: { id },
    include: {
      _count: { select: { votes: true } },
      votes: userId ? { where: { userId }, select: { userId: true } } : false,
    },
  });

  if (!snack) {
    throw AppError.notFound('Snack not found', 'SNACK_NOT_FOUND');
  }

  res.json({
    snack: {
      ...formatSnack(snack),
      hasVoted: userId ? (snack.votes as { userId: string }[]).some((v) => v.userId === userId) : false,
      votes: undefined,
    },
  });
}

export async function createSnack(req: AuthenticatedRequest, res: Response) {
  const data = createSnackSchema.parse(req.body);

  const existing = await prisma.snack.findUnique({ where: { name: data.name } });
  if (existing) {
    throw AppError.conflict('A snack with this name already exists', 'SNACK_NAME_TAKEN');
  }

  const snack = await prisma.snack.create({
    data,
    include: { _count: { select: { votes: true } } },
  });

  res.status(201).json({ snack: formatSnack(snack) });
}

export async function updateSnack(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const data = updateSnackSchema.parse(req.body);

  const existing = await prisma.snack.findUnique({ where: { id } });
  if (!existing) {
    throw AppError.notFound('Snack not found', 'SNACK_NOT_FOUND');
  }

  if (data.name && data.name !== existing.name) {
    const nameTaken = await prisma.snack.findUnique({ where: { name: data.name } });
    if (nameTaken) {
      throw AppError.conflict('A snack with this name already exists', 'SNACK_NAME_TAKEN');
    }
  }

  const snack = await prisma.snack.update({
    where: { id },
    data,
    include: { _count: { select: { votes: true } } },
  });

  res.json({ snack: formatSnack(snack) });
}

export async function deleteSnack(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;

  const existing = await prisma.snack.findUnique({ where: { id } });
  if (!existing) {
    throw AppError.notFound('Snack not found', 'SNACK_NOT_FOUND');
  }

  // Activities referencing this snack will have snackId set to NULL (onDelete: SetNull)
  await prisma.snack.delete({ where: { id } });

  res.json({ message: 'Snack deleted successfully' });
}

export async function getSummary(req: AuthenticatedRequest, res: Response) {
  const snacks = await prisma.snack.findMany({
    include: { _count: { select: { votes: true } } },
  });

  let stocked = 0;
  let runningLow = 0;
  let gone = 0;

  for (const snack of snacks) {
    const status = calculateStatus(snack.quantity, snack.lowStockThreshold);
    if (status === 'STOCKED') stocked++;
    else if (status === 'RUNNING_LOW') runningLow++;
    else gone++;
  }

  // Snack of the Week: highest votes during current calendar week
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const weeklyVotes = await prisma.vote.groupBy({
    by: ['snackId'],
    where: {
      createdAt: {
        gte: startOfWeek,
        lt: endOfWeek,
      },
    },
    _count: { snackId: true },
    orderBy: [
      { _count: { snackId: 'desc' } },
      { snackId: 'asc' }, // deterministic tie-breaking
    ],
    take: 1,
  });

  let snackOfTheWeek = null;
  if (weeklyVotes.length > 0) {
    const topSnack = await prisma.snack.findUnique({
      where: { id: weeklyVotes[0].snackId },
      include: { _count: { select: { votes: true } } },
    });
    if (topSnack) {
      snackOfTheWeek = {
        ...formatSnack(topSnack),
        weeklyVotes: weeklyVotes[0]._count.snackId,
      };
    }
  }

  res.json({
    summary: {
      total: snacks.length,
      stocked,
      runningLow,
      gone,
      snackOfTheWeek,
    },
  });
}
