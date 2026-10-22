import type { ReactNode } from 'react';

/**
 * A friendly, recurring "support person" guidance note (Accenture purple).
 * Used at the top of each step to explain — in plain language — why we ask for
 * something and what an SME needs to gather. This same avatar is the natural
 * home for an (advisory) support chatbot later.
 */
export function GuideNote({
  title = 'Why we ask this',
  children,
  tips,
}: {
  title?: string;
  children: ReactNode;
  tips?: string[];
}) {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-accenture-200 bg-accenture-50 p-4">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accenture-600 text-white shadow-card"
        aria-hidden="true"
      >
        <SupportAvatar />
      </div>
      <div className="text-sm leading-relaxed">
        <p className="font-semibold text-accenture-800">{title}</p>
        <div className="mt-0.5 text-ink-soft">{children}</div>
        {tips && tips.length > 0 && (
          <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-ink-muted">
            {tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SupportAvatar() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.6" />
      <path d="M12 13.4c-3.9 0-7 2.4-7 5.4 0 .62.5 1.12 1.12 1.12h11.76c.62 0 1.12-.5 1.12-1.12 0-3-3.1-5.4-7-5.4z" />
    </svg>
  );
}
