import { useState } from 'react';
import { lineCounts, linesForOrder, runStatus } from '../rules/runStatus';
import { isWithinTolerance, shortPickedLines } from '../rules/shortPick';
import { chilledStagingState, minutesSince, orderStagingState } from '../rules/staging';
import { substitutionsUsed } from '../rules/substitution';
import type { Order, OrderLine, RunData } from '../types';
import Badge from './Badge';
import LineActionPanel from './LineActionPanel';
import OrderLineRow from './OrderLineRow';
import StatusChip from './StatusChip';

interface Props {
  data: RunData;
  now: Date;
  onChanged: () => void;
}

export default function PickRunView({ data, now, onChanged }: Props) {
  const { run, settings, orders, lines } = data;
  const [openLineId, setOpenLineId] = useState<number | null>(null);

  const status = runStatus(orders, lines, settings, now);
  const counts = lineCounts(lines);
  const openLine = lines.find((line) => line.id === openLineId) ?? null;
  const openOrder = openLine ? orders.find((order) => order.id === openLine.orderId) : null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-3">
        <h1 className="text-xl font-semibold">{run.reference}</h1>
        <StatusChip status={status} />
        <p className="ml-auto text-sm text-slate-600">
          {run.storeName} · {run.pickerName} · started {minutesSince(run.startedAt, now)} min ago
        </p>
      </header>

      <dl className="grid grid-cols-4 gap-3 text-sm">
        <Stat label="Pending" value={counts.pending} />
        <Stat label="Picked" value={counts.picked} />
        <Stat label="Substituted" value={counts.substituted} />
        <Stat label="Nil picked" value={counts.nil} />
      </dl>

      {orders.map((order) => (
        <OrderSection
          key={order.id}
          order={order}
          lines={linesForOrder(order, lines)}
          settings={settings}
          now={now}
          onOpen={(line) => setOpenLineId(line.id)}
        />
      ))}

      {openLine && openOrder && (
        <LineActionPanel
          line={openLine}
          order={openOrder}
          orderLines={linesForOrder(openOrder, lines)}
          now={now}
          onClose={() => setOpenLineId(null)}
          onChanged={onChanged}
        />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white px-4 py-3 shadow-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

interface OrderSectionProps {
  order: Order;
  lines: OrderLine[];
  settings: RunData['settings'];
  now: Date;
  onOpen: (line: OrderLine) => void;
}

function OrderSection({ order, lines, settings, now, onOpen }: OrderSectionProps) {
  const units = lines.reduce((sum, line) => sum + line.qtyOrdered, 0);
  const staging = orderStagingState(order, settings, now);
  const chilled = chilledStagingState(order, settings, now);
  const withinTolerance = isWithinTolerance(lines, settings);
  const shortCount = shortPickedLines(lines).length;
  const subs = substitutionsUsed(lines);

  return (
    <section className="overflow-hidden rounded-lg bg-white shadow-sm">
      <div className="flex items-center border-b border-slate-200 px-4 py-3">
        <h2 className="font-semibold">{order.reference}</h2>
        <span className="ml-2 text-sm text-slate-600">
          {order.customerName} · {lines.length} lines · {units} units
        </span>
        <div className="ml-auto flex items-center">
          {subs > 0 && <Badge tone="substituted">{subs} substitutions</Badge>}
          {shortCount > 0 && (
            <Badge tone={withinTolerance ? 'ok' : 'blocked'}>
              {withinTolerance ? 'within tolerance' : 'over tolerance'}
            </Badge>
          )}
          {order.chilledStagedAt && (
            <Badge tone={chilled === 'not_staged' ? 'neutral' : chilled}>
              chilled {minutesSince(order.chilledStagedAt, now)} min
            </Badge>
          )}
          {staging === 'blocked' && <Badge tone="blocked">dispatch blocked</Badge>}
        </div>
      </div>
      <table className="w-full table-fixed text-sm">
        <thead className="text-left text-xs text-slate-500 uppercase">
          <tr>
            <th className="w-[300px] px-3 py-2">Product</th>
            <th className="w-[90px] px-3 py-2">Shelf</th>
            <th className="w-[120px] px-3 py-2">Category</th>
            <th className="w-[70px] px-3 py-2 text-right">Qty</th>
            <th className="w-[190px] px-3 py-2">Status</th>
            <th className="px-3 py-2">Detail</th>
            <th className="w-[100px] px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <OrderLineRow key={line.id} line={line} onOpen={onOpen} />
          ))}
        </tbody>
      </table>
    </section>
  );
}
