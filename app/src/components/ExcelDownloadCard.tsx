interface ExcelDownloadCardProps {
  fileName: string;
  size?: string;
}

/** A small card mimicking the downloadable Excel template from the Figma. */
export function ExcelDownloadCard({ fileName, size = '15 KB' }: ExcelDownloadCardProps) {
  const handleDownload = () => {
    // Phase 1: generate a tiny placeholder file so the click "works" locally.
    const header = 'This is a placeholder template for the SustainSME prototype.\n';
    const blob = new Blob([header + fileName], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="group flex w-full max-w-sm items-center gap-3 rounded-lg border border-surface-border bg-white px-3 py-2.5 text-left transition-colors hover:border-accenture"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-positive/10 text-positive">
        {/* spreadsheet glyph */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.6" />
          <path d="M3 9h18M9 3v18" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">{fileName}</span>
        <span className="block text-xs text-ink-muted">{size} · .xlsx template</span>
      </span>
      <span className="text-ink-muted group-hover:text-accenture">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}
