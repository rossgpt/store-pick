// Nil pick evidence. Pure functions, no React.
//
// A nil pick means the picker could not find the product at all. The picker
// has to prove they looked in the right place before the line can be closed.

import type { Product } from '../types';

export const FAILED_SCANS_BEFORE_TYPED_REASON = 2;

export type NilEvidence =
  | { kind: 'shelf_scan'; shelfCode: string }
  | { kind: 'typed_reason'; reason: string; failedScans: number };

export function scanMatchesShelf(scanned: string, product: Product): boolean {
  return scanned.trim().toUpperCase() === product.shelfCode.toUpperCase();
}

export function typedReasonAvailable(failedScans: number): boolean {
  return failedScans >= FAILED_SCANS_BEFORE_TYPED_REASON;
}

export function isValidNilPickEvidence(evidence: NilEvidence, product: Product): boolean {
  switch (evidence.kind) {
    case 'shelf_scan':
      return scanMatchesShelf(evidence.shelfCode, product);
    case 'typed_reason':
      return typedReasonAvailable(evidence.failedScans) && evidence.reason.trim().length > 0;
  }
}
