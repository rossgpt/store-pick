// Short pick tolerance. Pure functions, no React.
//
// A line is "short" when the customer receives fewer units than they ordered,
// either because it was nil picked or because it was picked with a lower quantity.

import type { OrderLine, RunSettings } from '../types';

export function isShort(line: OrderLine): boolean {
  if (line.status === 'nil') return true;
  return line.status === 'picked' && line.qtyPicked < line.qtyOrdered;
}

export function shortPickedLines(orderLines: OrderLine[]): OrderLine[] {
  return orderLines.filter(isShort);
}

export function shortPickAllowance(orderLines: OrderLine[], settings: RunSettings): number {
  return Math.floor((orderLines.length * settings.shortPickTolerancePct) / 100);
}

export function isWithinTolerance(orderLines: OrderLine[], settings: RunSettings): boolean {
  return shortPickedLines(orderLines).length <= shortPickAllowance(orderLines, settings);
}
