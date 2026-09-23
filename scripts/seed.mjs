// Builds public/storepick.sqlite from scratch. Run with `npm run seed`.
// Timestamps are relative to the moment you run this, so re-seed before a demo.

import { writeFileSync } from 'node:fs';
import initSqlJs from 'sql.js';

const SQL = await initSqlJs();
const db = new SQL.Database();

const now = Date.now();
const minutesAgo = (m) => new Date(now - m * 60_000).toISOString();

db.run(`
  CREATE TABLE stores (
    id   INTEGER PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE pick_runs (
    id          INTEGER PRIMARY KEY,
    store_id    INTEGER NOT NULL REFERENCES stores(id),
    reference   TEXT NOT NULL,
    picker_name TEXT NOT NULL,
    started_at  TEXT NOT NULL
  );

  CREATE TABLE run_settings (
    run_id                   INTEGER PRIMARY KEY REFERENCES pick_runs(id),
    max_substitutions        INTEGER NOT NULL,
    short_pick_tolerance_pct INTEGER NOT NULL,
    chilled_staging_minutes  INTEGER NOT NULL,
    ambient_staging_minutes  INTEGER NOT NULL
  );

  CREATE TABLE orders (
    id                INTEGER PRIMARY KEY,
    run_id            INTEGER NOT NULL REFERENCES pick_runs(id),
    reference         TEXT NOT NULL,
    customer_name     TEXT NOT NULL,
    ambient_staged_at TEXT,
    chilled_staged_at TEXT
  );

  CREATE TABLE products (
    id             INTEGER PRIMARY KEY,
    name           TEXT NOT NULL,
    category       TEXT NOT NULL,
    age_restricted INTEGER NOT NULL DEFAULT 0,
    shelf_code     TEXT NOT NULL
  );

  CREATE TABLE order_lines (
    id                    INTEGER PRIMARY KEY,
    order_id              INTEGER NOT NULL REFERENCES orders(id),
    product_id            INTEGER NOT NULL REFERENCES products(id),
    qty_ordered           INTEGER NOT NULL,
    qty_picked            INTEGER NOT NULL DEFAULT 0,
    status                TEXT NOT NULL DEFAULT 'pending',
    substitute_product_id INTEGER REFERENCES products(id),
    nil_evidence          TEXT,
    nil_failed_scans      INTEGER NOT NULL DEFAULT 0,
    nil_reason            TEXT
  );
`);

db.run(`INSERT INTO stores VALUES (1, 'Northfield Superstore')`);

db.run(`INSERT INTO pick_runs VALUES (1, 1, 'RUN-0923-A', 'Dana Reyes', ?)`, [minutesAgo(58)]);

db.run(`INSERT INTO run_settings VALUES (1, 6, 10, 45, 240)`);

// ---------------------------------------------------------------- products
// [id, name, category, age_restricted, shelf_code]
const products = [
  [1, 'Basmati Rice 1kg', 'ambient', 0, 'A3-04'],
  [2, 'Penne Pasta 500g', 'ambient', 0, 'A3-11'],
  [3, 'Chopped Tomatoes 400g', 'ambient', 0, 'A4-02'],
  [4, 'Olive Oil 500ml', 'ambient', 0, 'A4-08'],
  [5, 'Wholegrain Cereal 750g', 'ambient', 0, 'A2-05'],
  [6, 'Free Range Eggs 12 Pack', 'ambient', 0, 'A6-01'],
  [7, 'Sourdough Loaf 800g', 'ambient', 0, 'B1-03'],
  [8, "Kids' Multigrain Breakfast Cereal with Honey, Almonds & Dried Blueberries Family Pack 1.2kg", 'ambient', 0, 'A2-09'],
  [9, 'Crunchy Peanut Butter 340g', 'ambient', 0, 'A2-12'],
  [10, 'Dark Chocolate 70% 100g', 'ambient', 0, 'A5-06'],
  [11, 'Semi-Skimmed Milk 2L', 'chilled', 0, 'C1-01'],
  [12, 'Greek Yoghurt 500g', 'chilled', 0, 'C1-07'],
  [13, 'Mature Cheddar 350g', 'chilled', 0, 'C2-03'],
  [14, 'Unsalted Butter 250g', 'chilled', 0, 'C2-08'],
  [15, 'Chicken Breast Fillets 600g', 'chilled', 0, 'C3-02'],
  [16, 'Smoked Salmon 100g', 'chilled', 0, 'C3-09'],
  [17, 'Houmous 200g', 'chilled', 0, 'C4-04'],
  [18, 'Orange Juice 1L', 'chilled', 0, 'C4-10'],
  [19, 'Garden Peas 900g', 'frozen', 0, 'F1-02'],
  [20, 'Vanilla Ice Cream 1L', 'frozen', 0, 'F2-05'],
  [21, 'Margherita Pizza 350g', 'frozen', 0, 'F2-11'],
  [22, 'Merlot 75cl', 'alcohol', 1, 'D1-04'],
  [23, 'Lager 4x440ml', 'alcohol', 1, 'D2-02'],
  [24, 'Rolling Tobacco 30g', 'tobacco', 1, 'K1-01'],
  [25, 'Paracetamol 500mg 16 Tablets', 'pharmacy', 1, 'P1-03'],
  [26, 'Ibuprofen 200mg 16 Tablets', 'pharmacy', 1, 'P1-04'],
  // Not on any order line; available as substitutes.
  [27, 'Whole Milk 2L', 'chilled', 0, 'C1-02'],
  [28, 'Natural Yoghurt 500g', 'chilled', 0, 'C1-08'],
  [29, 'Fusilli Pasta 500g', 'ambient', 0, 'A3-12'],
  [30, 'Extra Mature Cheddar 350g', 'chilled', 0, 'C2-04'],
  [31, 'Shiraz 75cl', 'alcohol', 1, 'D1-05'],
  [32, 'Paracetamol 500mg 32 Caplets', 'pharmacy', 1, 'P1-05'],
  [33, 'Salted Butter 250g', 'chilled', 0, 'C2-09'],
  [34, 'Jasmine Rice 1kg', 'ambient', 0, 'A3-05'],
  [35, 'Apple Juice 1L', 'chilled', 0, 'C4-11'],
  [36, 'Petit Pois 900g', 'frozen', 0, 'F1-03'],
];
for (const p of products) {
  db.run(`INSERT INTO products VALUES (?, ?, ?, ?, ?)`, p);
}

// ------------------------------------------------------------------ orders
// [id, reference, customer, ambient_staged_at, chilled_staged_at]
const orders = [
  [1, 'ORD-1041', 'Priya Nair', minutesAgo(30), minutesAgo(20)],
  [2, 'ORD-1042', 'Tom Okafor', minutesAgo(55), minutesAgo(52)],
  [3, 'ORD-1043', 'Hannah Li', minutesAgo(25), minutesAgo(15)],
  [4, 'ORD-1044', 'Marcus Webb', minutesAgo(8), minutesAgo(5)],
];
for (const [id, ref, customer, ambient, chilled] of orders) {
  db.run(`INSERT INTO orders VALUES (?, 1, ?, ?, ?, ?)`, [id, ref, customer, ambient, chilled]);
}

// ------------------------------------------------------------- order lines
const insertLine = db.prepare(`
  INSERT INTO order_lines
    (id, order_id, product_id, qty_ordered, qty_picked, status,
     substitute_product_id, nil_evidence, nil_failed_scans, nil_reason)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const pending = (id, orderId, productId, qty) =>
  insertLine.run([id, orderId, productId, qty, 0, 'pending', null, null, 0, null]);
const picked = (id, orderId, productId, qty) =>
  insertLine.run([id, orderId, productId, qty, qty, 'picked', null, null, 0, null]);
const substituted = (id, orderId, productId, qty, substituteId) =>
  insertLine.run([id, orderId, productId, qty, qty, 'substituted', substituteId, null, 0, null]);
const nilByScan = (id, orderId, productId, qty) =>
  insertLine.run([id, orderId, productId, qty, 0, 'nil', null, 'shelf_scan', 0, null]);
const nilByReason = (id, orderId, productId, qty, failedScans, reason) =>
  insertLine.run([id, orderId, productId, qty, 0, 'nil', null, 'typed_reason', failedScans, reason]);

// ORD-1041: six substitutions already made, one line still to pick.
substituted(1, 1, 11, 2, 27);
substituted(2, 1, 12, 1, 28);
substituted(3, 1, 2, 2, 29);
substituted(4, 1, 13, 1, 30);
substituted(5, 1, 14, 1, 33);
substituted(6, 1, 1, 1, 34);
pending(7, 1, 18, 2);

// ORD-1042: fully picked, chilled items have been staged for 52 minutes.
picked(8, 2, 15, 1);
picked(9, 2, 17, 2);
picked(10, 2, 20, 1);
picked(11, 2, 3, 4);

// ORD-1043: ten lines, thirty units, one nil pick of five units.
picked(12, 3, 3, 6);
picked(13, 3, 2, 3);
picked(14, 3, 6, 1);
picked(15, 3, 11, 2);
picked(16, 3, 19, 2);
picked(17, 3, 5, 1);
nilByScan(18, 3, 9, 5);
picked(19, 3, 4, 2);
picked(20, 3, 21, 4);
picked(21, 3, 10, 4);

// ORD-1044: mixed bag still in progress.
pending(22, 4, 25, 1);
pending(23, 4, 22, 1);
pending(24, 4, 8, 1);
nilByReason(25, 4, 7, 1, 2, 'Shelf label missing, bay empty');
picked(26, 4, 16, 1);

insertLine.free();

writeFileSync('public/storepick.sqlite', Buffer.from(db.export()));
console.log('Seeded public/storepick.sqlite');
