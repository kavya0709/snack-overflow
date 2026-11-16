import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const createSnackSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  category: z.enum(['SWEET', 'SAVOURY', 'DRINK', 'HEALTHY_ISH'], {
    errorMap: () => ({ message: 'Category must be one of: SWEET, SAVOURY, DRINK, HEALTHY_ISH' }),
  }),
  quantity: z.number().int('Quantity must be an integer').min(0, 'Quantity must be non-negative'),
  lowStockThreshold: z
    .number()
    .int('Threshold must be an integer')
    .min(0, 'Threshold must be non-negative')
    .default(5),
});

export const updateSnackSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.enum(['SWEET', 'SAVOURY', 'DRINK', 'HEALTHY_ISH']).optional(),
  quantity: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
});

export const consumeSnackSchema = z.object({
  amount: z
    .number()
    .int('Amount must be an integer')
    .positive('Amount must be a positive integer'),
});

export const restockSnackSchema = z.object({
  amount: z
    .number()
    .int('Amount must be an integer')
    .positive('Amount must be a positive integer'),
});

export const snackQuerySchema = z.object({
  category: z.enum(['SWEET', 'SAVOURY', 'DRINK', 'HEALTHY_ISH']).optional(),
  status: z.enum(['STOCKED', 'RUNNING_LOW', 'GONE']).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['name', 'quantity', 'votes']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});
