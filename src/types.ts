// Shared domain types. These mirror the SQLite tables one-for-one,
// with snake_case columns mapped to camelCase in src/data/db.ts.

export type Category = 'ambient' | 'chilled' | 'frozen' | 'alcohol' | 'tobacco' | 'pharmacy';

export type LineStatus = 'pending' | 'picked' | 'substituted' | 'nil';

export type NilEvidenceKind = 'shelf_scan' | 'typed_reason';

export interface PickRun {
  id: number;
  reference: string;
  storeName: string;
  pickerName: string;
  startedAt: string; // ISO timestamp
}

export interface RunSettings {
  runId: number;
  maxSubstitutions: number;
  shortPickTolerancePct: number;
  chilledStagingMinutes: number;
  ambientStagingMinutes: number;
}

export interface Order {
  id: number;
  runId: number;
  reference: string;
  customerName: string;
  ambientStagedAt: string | null; // set when the first line of the order is picked
  chilledStagedAt: string | null; // set when the first chilled or frozen line is picked
}

export interface Product {
  id: number;
  name: string;
  category: Category;
  ageRestricted: boolean;
  shelfCode: string;
}

export interface OrderLine {
  id: number;
  orderId: number;
  product: Product;
  qtyOrdered: number;
  qtyPicked: number;
  status: LineStatus;
  substituteProduct: Product | null;
  nilEvidence: NilEvidenceKind | null;
  nilFailedScans: number;
  nilReason: string | null;
}

export interface RunData {
  run: PickRun;
  settings: RunSettings;
  orders: Order[];
  lines: OrderLine[];
}
