import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

export function Card({
  title,
  subtitle,
  action,
  className = '',
  bodyClassName = '',
  children,
}: CardProps) {
  return (
    <section className={`card ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-3 border-b border-surface-border px-5 py-4">
          <div>
            {title && <h2 className="text-base font-semibold text-accenture-700">{title}</h2>}
            {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
