import { Category } from '@prisma/client';

export type SnackStatus = 'STOCKED' | 'RUNNING_LOW' | 'GONE';

/**
 * Calculates snack status dynamically based on quantity and threshold.
 * Never stored in DB — always computed.
 */
export function calculateStatus(quantity: number, lowStockThreshold: number): SnackStatus {
  if (quantity === 0) return 'GONE';
  if (quantity <= lowStockThreshold) return 'RUNNING_LOW';
  return 'STOCKED';
}

export function isValidCategory(value: string): value is Category {
  return Object.values(Category).includes(value as Category);
}

export function isValidStatus(value: string): value is SnackStatus {
  return ['STOCKED', 'RUNNING_LOW', 'GONE'].includes(value);
}
