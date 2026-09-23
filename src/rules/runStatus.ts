// Run status. Pure functions, no React.

import type { Order, OrderLine, RunSettings } from '../types';
import { isWithinTolerance } from './shortPick';
import { orderStagingState } from './staging';

export type RunStatus = 'In progress' | 'Blocked' | 'Needs review' | 'Complete';

export interface LineCounts {
  pending: number;
  picked: number;
  substituted: number;
  nil: number;
}

export function lineCounts(lines: OrderLine[]): LineCounts {
  const counts: LineCounts = { pending: 0, picked: 0, substituted: 0, nil: 0 };
  for (const line of lines) counts[line.status] += 1;
  return counts;
}

export function linesForOrder(order: Order, lines: OrderLine[]): OrderLine[] {
  return lines.filter((line) => line.orderId === order.id);
}

export function runStatus(
  orders: Order[],
  lines: OrderLine[],
  settings: RunSettings,
  now: Date,
): RunStatus {
  if (orders.some((order) => orderStagingState(order, settings, now) === 'blocked')) {
    return 'Blocked';
  }
  if (lines.some((line) => line.status === 'pending')) {
    return 'In progress';
  }
  if (orders.some((order) => !isWithinTolerance(linesForOrder(order, lines), settings))) {
    return 'Needs review';
  }
  return 'Complete';
}
