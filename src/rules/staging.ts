// Staging time limits. Pure functions, no React.
//
// Once an order's first item is picked it sits in a staging area waiting for
// dispatch. Chilled and frozen items sit in the chilled staging area and are
// timed separately from ambient items.

import type { Order, Product, RunSettings } from '../types';

export type StagingState = 'not_staged' | 'ok' | 'warning' | 'blocked';

const BLOCK_GRACE_MINUTES = 15;

export function minutesSince(iso: string, now: Date): number {
  return Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000);
}

export function usesChilledStaging(product: Product): boolean {
  return product.category === 'chilled' || product.category === 'frozen';
}

export function chilledStagingState(order: Order, settings: RunSettings, now: Date): StagingState {
  if (!order.chilledStagedAt) return 'not_staged';
  const elapsed = minutesSince(order.chilledStagedAt, now);
  if (elapsed >= settings.chilledStagingMinutes + BLOCK_GRACE_MINUTES) return 'blocked';
  if (elapsed >= settings.chilledStagingMinutes) return 'warning';
  return 'ok';
}

export function ambientStagingState(order: Order, settings: RunSettings, now: Date): StagingState {
  if (!order.ambientStagedAt) return 'not_staged';
  const elapsed = minutesSince(order.ambientStagedAt, now);
  if (elapsed >= settings.ambientStagingMinutes) return 'blocked';
  return 'ok';
}

const SEVERITY: Record<StagingState, number> = { not_staged: 0, ok: 1, warning: 2, blocked: 3 };

export function orderStagingState(order: Order, settings: RunSettings, now: Date): StagingState {
  const chilled = chilledStagingState(order, settings, now);
  const ambient = ambientStagingState(order, settings, now);
  return SEVERITY[chilled] >= SEVERITY[ambient] ? chilled : ambient;
}

// Which staging clocks should start when a line of this product is picked?
export function clocksToStart(order: Order, product: Product): { ambient: boolean; chilled: boolean } {
  return {
    ambient: order.ambientStagedAt === null,
    chilled: order.chilledStagedAt === null && usesChilledStaging(product),
  };
}
