import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';
type Size = 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accenture-300 disabled:cursor-not-allowed';

const variants: Record<Variant, string> = {
  primary:
    'bg-accenture text-white hover:bg-accenture-600 disabled:bg-surface-border disabled:text-ink-muted',
  secondary:
    'bg-accenture-50 text-accenture-700 hover:bg-accenture-100 disabled:opacity-50',
  outline:
    'border border-surface-border bg-white text-ink hover:border-accenture hover:text-accenture-700 disabled:opacity-50',
  ghost: 'text-accenture-700 hover:bg-accenture-50 disabled:opacity-50',
};

const sizes: Record<Size, string> = {
  md: 'text-sm px-4 py-2',
  lg: 'text-sm px-6 py-2.5',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...rest}>
      {children}
    </button>
  );
}
