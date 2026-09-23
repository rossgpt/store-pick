// Substitution eligibility. Pure functions, no React.

import type { OrderLine, Product } from '../types';

export const MAX_SUBSTITUTIONS_PER_ORDER = 8;

const NEVER_SUBSTITUTE: Product['category'][] = ['alcohol', 'tobacco'];

export function substitutionsUsed(orderLines: OrderLine[]): number {
  return orderLines.filter((line) => line.status === 'substituted').length;
}

export function isSubstitutable(product: Product): boolean {
  return !NEVER_SUBSTITUTE.includes(product.category);
}

export function isValidSubstitute(original: Product, candidate: Product): boolean {
  return candidate.id !== original.id && candidate.category === original.category;
}

export interface SubstitutionCheck {
  allowed: boolean;
  reason: string | null;
}

export function canSubstitute(line: OrderLine, orderLines: OrderLine[]): SubstitutionCheck {
  if (!isSubstitutable(line.product)) {
    return { allowed: false, reason: 'This product cannot be substituted.' };
  }
  if (substitutionsUsed(orderLines) >= MAX_SUBSTITUTIONS_PER_ORDER) {
    return {
      allowed: false,
      reason: `This order already has ${MAX_SUBSTITUTIONS_PER_ORDER} substitutions.`,
    };
  }
  return { allowed: true, reason: null };
}
