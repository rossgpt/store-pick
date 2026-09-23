import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-emerald-600 text-white',
  secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({ variant = 'secondary', className = '', ...props }: Props) {
  return (
    <button
      className={`rounded-md px-3 py-1.5 text-sm font-medium ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  );
}
