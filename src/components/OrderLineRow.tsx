import { isShort } from '../rules/shortPick';
import type { OrderLine } from '../types';
import Badge from './Badge';
import Button from './Button';

interface Props {
  line: OrderLine;
  onOpen: (line: OrderLine) => void;
}

function detailText(line: OrderLine): string {
  if (line.status === 'substituted' && line.substituteProduct) {
    return `Swapped for ${line.substituteProduct.name}`;
  }
  if (line.status === 'nil') {
    return line.nilEvidence === 'shelf_scan' ? 'Shelf scanned' : `Reason: ${line.nilReason ?? ''}`;
  }
  return '';
}

export default function OrderLineRow({ line, onOpen }: Props) {
  const { product } = line;
  return (
    <tr className="border-t border-slate-200">
      <td className="w-[300px] px-3 py-2 whitespace-nowrap">{product.name}</td>
      <td className="w-[90px] px-3 py-2 font-mono text-xs text-slate-500">{product.shelfCode}</td>
      <td className="w-[120px] px-3 py-2 text-slate-500 capitalize">
        {product.category}
        {product.ageRestricted && ' · 18+'}
      </td>
      <td className="w-[70px] px-3 py-2 text-right tabular-nums">
        {line.qtyPicked}/{line.qtyOrdered}
      </td>
      <td className="w-[190px] px-3 py-2">
        <Badge tone={line.status}>{line.status}</Badge>
        {isShort(line) && line.status !== 'nil' && <Badge tone="short">short</Badge>}
      </td>
      <td className="px-3 py-2 text-xs text-slate-600">{detailText(line)}</td>
      <td className="w-[100px] px-3 py-2 text-right">
        <Button onClick={() => onOpen(line)}>{line.status === 'pending' ? 'Pick' : 'Change'}</Button>
      </td>
    </tr>
  );
}
