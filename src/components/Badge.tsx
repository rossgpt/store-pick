import type { ReactNode } from 'react';

export type BadgeTone =
  | 'pending'
  | 'picked'
  | 'substituted'
  | 'nil'
  | 'short'
  | 'ok'
  | 'warning'
  | 'blocked'
  | 'neutral';

const TONE_CLASSES: Record<BadgeTone, string> = {
  pending: 'bg-slate-100 text-slate-700 ml-[12px]',
  picked: 'bg-emerald-100 text-emerald-800 ml-[12px]',
  substituted: 'bg-sky-100 text-sky-800 ml-[20px]',
  nil: 'bg-red-100 text-red-800 ml-[12px]',
  short: 'bg-amber-100 text-amber-800 ml-[12px]',
  ok: 'bg-emerald-100 text-emerald-800 ml-[12px]',
  warning: 'bg-amber-100 text-amber-800 ml-[12px]',
  blocked: 'bg-red-100 text-red-800 ml-[12px]',
  neutral: 'bg-slate-100 text-slate-600 ml-[12px]',
};

interface Props {
  tone: BadgeTone;
  children: ReactNode;
}

export default function Badge({ tone, children }: Props) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${TONE_CLASSES[tone]}`}
    >
      {children}
    </span>
  );
}
