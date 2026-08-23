import type { Contract } from '@/data/cv';

export type StatusTone = 'success' | 'cdi';

export const STATUS_CLASSES_BY_TONE = {
  success: 'border-status-success/45 bg-status-success/14 text-status-success',
  cdi: 'border-status-cdi/45 bg-status-cdi/14 text-status-cdi',
} as const satisfies Record<StatusTone, string>;

export const TONE_BY_CONTRACT = {
  freelance: 'success',
  permanent: 'cdi',
} as const satisfies Record<Contract, StatusTone>;
