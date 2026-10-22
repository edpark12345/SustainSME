import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

interface PageShellProps {
  title?: string;
  subtitle?: string;
  /** When false, hides the top navbar (e.g. on the login screen). */
  chrome?: boolean;
  children: ReactNode;
  /** Optional content rendered on the right side of the page header. */
  headerAction?: ReactNode;
}

export function PageShell({
  title,
  subtitle,
  chrome = true,
  children,
  headerAction,
}: PageShellProps) {
  return (
    <div className="flex min-h-full flex-col">
      {chrome && <Navbar />}
      <main className="mx-auto w-full max-w-[1180px] flex-1 px-6 py-8">
        {title && (
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-accenture-700">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
            </div>
            {headerAction}
          </div>
        )}
        {children}
      </main>
      {chrome && <Footer />}
    </div>
  );
}
