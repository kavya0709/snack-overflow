import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';

const activityQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  snackId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  action: z.enum(['RESTOCKED', 'CONSUMED']).optional(),
});

export async function getActivities(req: AuthenticatedRequest, res: Response) {
  const query = activityQuerySchema.parse(req.query);
  const { page, limit, snackId, userId, action } = query;

  const where = {
    ...(snackId && { snackId }),
    ...(userId && { userId }),
    ...(action && { action }),
  };

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        snack: { select: { id: true, name: true, category: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.activity.count({ where }),
  ]);

  res.json({
    activities,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  });
}
