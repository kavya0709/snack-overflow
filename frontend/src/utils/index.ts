import type { SnackStatus, Category } from '../types';

export function getStatusBadgeClass(status: SnackStatus): string {
  switch (status) {
    case 'STOCKED':
      return 'badge-stocked';
    case 'RUNNING_LOW':
      return 'badge-running-low';
    case 'GONE':
      return 'badge-gone';
  }
}

export function getStatusLabel(status: SnackStatus): string {
  switch (status) {
    case 'STOCKED':
      return 'Stocked';
    case 'RUNNING_LOW':
      return 'Running Low';
    case 'GONE':
      return 'Gone';
  }
}

export function getCategoryLabel(category: Category): string {
  switch (category) {
    case 'SWEET':
      return 'Sweet';
    case 'SAVOURY':
      return 'Savoury';
    case 'DRINK':
      return 'Drink';
    case 'HEALTHY_ISH':
      return 'Healthy-ish';
  }
}

export function getCategoryEmoji(category: Category): string {
  switch (category) {
    case 'SWEET':
      return '🍬';
    case 'SAVOURY':
      return '🥨';
    case 'DRINK':
      return '🧃';
    case 'HEALTHY_ISH':
      return '🥗';
  }
}

export function getApiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { error?: { message?: string } } } };
    return axiosError.response?.data?.error?.message || 'An unexpected error occurred';
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}

export function getApiErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { error?: { code?: string } } } };
    return axiosError.response?.data?.error?.code || 'UNKNOWN';
  }
  return 'UNKNOWN';
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
