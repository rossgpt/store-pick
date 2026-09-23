// The only file that talks to SQLite. Everything else works with the types
// in src/types.ts. The database file is produced by scripts/seed.mjs and
// loaded into memory in the browser via sql.js, so edits made in the UI
// last until the page is refreshed.

import initSqlJs, { type Database, type SqlValue } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import type { NilEvidence } from '../rules/nilPick';
import type { Order, OrderLine, PickRun, Product, RunData, RunSettings } from '../types';

let db: Database;

export async function openDatabase(): Promise<void> {
  const SQL = await initSqlJs({ locateFile: () => wasmUrl });
  const response = await fetch('/storepick.sqlite');
  db = new SQL.Database(new Uint8Array(await response.arrayBuffer()));
}

type Row = Record<string, SqlValue>;

function query(sql: string, params: SqlValue[] = []): Row[] {
  const statement = db.prepare(sql);
  statement.bind(params);
  const rows: Row[] = [];
  while (statement.step()) rows.push(statement.getAsObject());
  statement.free();
  return rows;
}

function execute(sql: string, params: SqlValue[] = []): void {
  db.run(sql, params);
}

// ------------------------------------------------------------------ reads

export function loadRun(): RunData {
  const run = getActiveRun();
  return {
    run,
    settings: getRunSettings(run.id),
    orders: getOrders(run.id),
    lines: getOrderLines(run.id),
  };
}

function getActiveRun(): PickRun {
  const [row] = query(`
    SELECT r.id, r.reference, r.picker_name, r.started_at, s.name AS store_name
    FROM pick_runs r JOIN stores s ON s.id = r.store_id
    ORDER BY r.started_at DESC LIMIT 1
  `);
  return {
    id: row.id as number,
    reference: row.reference as string,
    storeName: row.store_name as string,
    pickerName: row.picker_name as string,
    startedAt: row.started_at as string,
  };
}

function getRunSettings(runId: number): RunSettings {
  const [row] = query(`SELECT * FROM run_settings WHERE run_id = ?`, [runId]);
  return {
    runId,
    maxSubstitutions: row.max_substitutions as number,
    shortPickTolerancePct: row.short_pick_tolerance_pct as number,
    chilledStagingMinutes: row.chilled_staging_minutes as number,
    ambientStagingMinutes: row.ambient_staging_minutes as number,
  };
}

function getOrders(runId: number): Order[] {
  return query(`SELECT * FROM orders WHERE run_id = ? ORDER BY id`, [runId]).map((row) => ({
    id: row.id as number,
    runId,
    reference: row.reference as string,
    customerName: row.customer_name as string,
    ambientStagedAt: row.ambient_staged_at as string | null,
    chilledStagedAt: row.chilled_staged_at as string | null,
  }));
}

const PRODUCT_COLUMNS = (alias: string, prefix: string) => `
  ${alias}.id AS ${prefix}id, ${alias}.name AS ${prefix}name, ${alias}.category AS ${prefix}category,
  ${alias}.age_restricted AS ${prefix}age_restricted, ${alias}.shelf_code AS ${prefix}shelf_code
`;

function productFromRow(row: Row, prefix: string): Product {
  return {
    id: row[`${prefix}id`] as number,
    name: row[`${prefix}name`] as string,
    category: row[`${prefix}category`] as Product['category'],
    ageRestricted: row[`${prefix}age_restricted`] === 1,
    shelfCode: row[`${prefix}shelf_code`] as string,
  };
}

function getOrderLines(runId: number): OrderLine[] {
  const rows = query(
    `
    SELECT ol.*, ${PRODUCT_COLUMNS('p', 'p_')}, ${PRODUCT_COLUMNS('s', 's_')}
    FROM order_lines ol
    JOIN orders o ON o.id = ol.order_id
    JOIN products p ON p.id = ol.product_id
    LEFT JOIN products s ON s.id = ol.substitute_product_id
    WHERE o.run_id = ?
    ORDER BY ol.order_id, ol.id
  `,
    [runId],
  );
  return rows.map((row) => ({
    id: row.id as number,
    orderId: row.order_id as number,
    product: productFromRow(row, 'p_'),
    qtyOrdered: row.qty_ordered as number,
    qtyPicked: row.qty_picked as number,
    status: row.status as OrderLine['status'],
    substituteProduct: row.s_id === null ? null : productFromRow(row, 's_'),
    nilEvidence: row.nil_evidence as OrderLine['nilEvidence'],
    nilFailedScans: row.nil_failed_scans as number,
    nilReason: row.nil_reason as string | null,
  }));
}

export function getProductsInCategory(category: Product['category']): Product[] {
  return query(`SELECT ${PRODUCT_COLUMNS('p', '')} FROM products p WHERE category = ? ORDER BY name`, [
    category,
  ]).map((row) => productFromRow(row, ''));
}

// ----------------------------------------------------------------- writes

export function markPicked(lineId: number, qtyPicked: number): void {
  execute(`UPDATE order_lines SET status = 'picked', qty_picked = ? WHERE id = ?`, [qtyPicked, lineId]);
}

export function markSubstituted(lineId: number, substituteProductId: number): void {
  execute(
    `UPDATE order_lines
     SET status = 'substituted', qty_picked = qty_ordered, substitute_product_id = ?
     WHERE id = ?`,
    [substituteProductId, lineId],
  );
}

export function markNilPicked(lineId: number, evidence: NilEvidence): void {
  const failedScans = evidence.kind === 'typed_reason' ? evidence.failedScans : 0;
  const reason = evidence.kind === 'typed_reason' ? evidence.reason : null;
  execute(
    `UPDATE order_lines
     SET status = 'nil', qty_picked = 0, nil_evidence = ?, nil_failed_scans = ?, nil_reason = ?
     WHERE id = ?`,
    [evidence.kind, failedScans, reason, lineId],
  );
}

export function startStagingClocks(orderId: number, clocks: { ambient: boolean; chilled: boolean }, now: Date): void {
  const iso = now.toISOString();
  if (clocks.ambient) execute(`UPDATE orders SET ambient_staged_at = ? WHERE id = ?`, [iso, orderId]);
  if (clocks.chilled) execute(`UPDATE orders SET chilled_staged_at = ? WHERE id = ?`, [iso, orderId]);
}
