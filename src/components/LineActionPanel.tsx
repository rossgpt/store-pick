import { useState } from 'react';
import { getProductsInCategory, markNilPicked, markPicked, markSubstituted, startStagingClocks } from '../data/db';
import {
  isValidNilPickEvidence,
  scanMatchesShelf,
  typedReasonAvailable,
  type NilEvidence,
} from '../rules/nilPick';
import { clocksToStart } from '../rules/staging';
import { canSubstitute, isValidSubstitute } from '../rules/substitution';
import type { Order, OrderLine } from '../types';
import Button from './Button';

type Action = 'pick' | 'substitute' | 'nil';

interface Props {
  line: OrderLine;
  order: Order;
  orderLines: OrderLine[];
  now: Date;
  onClose: () => void;
  onChanged: () => void;
}

export default function LineActionPanel({ line, order, orderLines, now, onClose, onChanged }: Props) {
  const [action, setAction] = useState<Action>('pick');

  // Pick
  const [qty, setQty] = useState(line.qtyOrdered);

  // Substitute
  const [substituteId, setSubstituteId] = useState<number | null>(null);
  const substitution = canSubstitute(line, orderLines);
  const candidates = getProductsInCategory(line.product.category).filter((p) =>
    isValidSubstitute(line.product, p),
  );

  // Nil pick
  const [scanInput, setScanInput] = useState('');
  const [scannedShelf, setScannedShelf] = useState<string | null>(null);
  const [failedScans, setFailedScans] = useState(0);
  const [typedReason, setTypedReason] = useState('');

  const nilEvidence: NilEvidence = scannedShelf
    ? { kind: 'shelf_scan', shelfCode: scannedShelf }
    : { kind: 'typed_reason', reason: typedReason, failedScans };

  const canConfirm =
    action === 'pick'
      ? qty >= 1 && qty <= line.qtyOrdered
      : action === 'substitute'
        ? substitution.allowed && substituteId !== null
        : isValidNilPickEvidence(nilEvidence, line.product);

  function handleScan() {
    if (scanMatchesShelf(scanInput, line.product)) {
      setScannedShelf(scanInput.trim().toUpperCase());
    } else {
      setFailedScans((n) => n + 1);
    }
    setScanInput('');
  }

  function confirm() {
    if (action === 'pick') {
      markPicked(line.id, qty);
      startStagingClocks(order.id, clocksToStart(order, line.product), now);
    } else if (action === 'substitute' && substituteId !== null) {
      markSubstituted(line.id, substituteId);
      startStagingClocks(order.id, clocksToStart(order, line.product), now);
    } else {
      markNilPicked(line.id, nilEvidence);
    }
    onChanged();
    onClose();
  }

  const tabClass = (selected: boolean) =>
    `flex-1 rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
      selected ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-300 bg-white text-slate-700'
    }`;

  return (
    <div className="fixed inset-0 z-10 flex justify-end bg-slate-900/30" onClick={onClose}>
      <aside
        className="flex h-full w-[420px] flex-col gap-5 overflow-y-auto bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header>
          <p className="text-xs text-slate-500">
            {order.reference} · {order.customerName}
          </p>
          <h2 className="mt-1 text-lg font-semibold break-words">{line.product.name}</h2>
          <p className="mt-1 text-sm text-slate-600">
            Shelf <span className="font-mono">{line.product.shelfCode}</span> · {line.qtyOrdered} ordered
          </p>
        </header>

        <div className="flex gap-2">
          <button className={tabClass(action === 'pick')} onClick={() => setAction('pick')}>
            Picked
          </button>
          <button
            className={tabClass(action === 'substitute')}
            onClick={() => setAction('substitute')}
            disabled={!substitution.allowed}
            title={substitution.reason ?? undefined}
          >
            Substituted
          </button>
          <button className={tabClass(action === 'nil')} onClick={() => setAction('nil')}>
            Nil pick
          </button>
        </div>
        {!substitution.allowed && <p className="-mt-3 text-xs text-slate-500">{substitution.reason}</p>}

        {action === 'pick' && (
          <label className="block text-sm">
            <span className="text-slate-700">Quantity picked</span>
            <input
              type="number"
              min={1}
              max={line.qtyOrdered}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="mt-1 block w-24 rounded-md border border-slate-300 px-2 py-1"
            />
            <span className="mt-1 block text-xs text-slate-500">
              Picking fewer than ordered records a short pick.
            </span>
          </label>
        )}

        {action === 'substitute' && (
          <label className="block text-sm">
            <span className="text-slate-700">Substitute with</span>
            <select
              value={substituteId ?? ''}
              onChange={(e) => setSubstituteId(e.target.value ? Number(e.target.value) : null)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1"
            >
              <option value="">Choose a product…</option>
              {candidates.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {action === 'nil' && (
          <div className="flex flex-col gap-3 text-sm">
            {scannedShelf ? (
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-emerald-800">
                Shelf {scannedShelf} scanned. Location confirmed empty.
              </p>
            ) : (
              <>
                <label className="block">
                  <span className="text-slate-700">Scan the shelf-edge label</span>
                  <div className="mt-1 flex gap-2">
                    <input
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                      placeholder="e.g. A2-12"
                      className="block flex-1 rounded-md border border-slate-300 px-2 py-1 font-mono"
                    />
                    <Button onClick={handleScan}>Scan</Button>
                  </div>
                </label>
                {failedScans > 0 && (
                  <p className="text-xs text-red-700">
                    Scan did not match this product's shelf ({failedScans} failed).
                  </p>
                )}
                {typedReasonAvailable(failedScans) && (
                  <label className="block">
                    <span className="text-slate-700">Can't scan? Type a reason</span>
                    <textarea
                      value={typedReason}
                      onChange={(e) => setTypedReason(e.target.value)}
                      rows={3}
                      className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1"
                    />
                  </label>
                )}
              </>
            )}
          </div>
        )}

        <footer className="mt-auto flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={!canConfirm} onClick={confirm}>
            Confirm
          </Button>
        </footer>
      </aside>
    </div>
  );
}
