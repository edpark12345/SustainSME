import logo from '../assets/accenture-logo.png';

export function Footer() {
  return (
    <footer className="border-t border-surface-border bg-white">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 py-4">
        <img src={logo} alt="Accenture" className="h-4 w-auto" />
        <p className="text-xs text-ink-muted">
          Copyright © {new Date().getFullYear()} Accenture. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
