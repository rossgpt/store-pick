import type { RunStatus } from '../rules/runStatus';

const STATUS_CLASSES: Record<RunStatus, string> = {
  'In progress': 'bg-sky-100 text-sky-800',
  Blocked: 'bg-red-100 text-red-800',
  'Needs review': 'bg-amber-100 text-amber-800',
  Complete: 'bg-emerald-100 text-emerald-800',
};

export default function StatusChip({ status }: { status: RunStatus }) {
  return (
    <span
      className={`relative -top-0.5 inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${STATUS_CLASSES[status]}`}
    >
      {status}
    </span>
  );
}
