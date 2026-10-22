import { useRef, useState } from 'react';
import { MOCK_PARSED_ROWS } from '../data/dummyData';

/**
 * Upload trigger that accepts a file and shows a *mocked* parsed result.
 * No real parsing happens in Phase 1 — selecting any .xlsx/.csv yields the
 * same illustrative preview so dashboards downstream look populated.
 */
export function UploadTrigger() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFileName(file.name);
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={onSelect}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-2 text-sm font-semibold text-accenture-700 hover:text-accenture"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 16V5m0 0L8 9m4-4l4 4M5 19h14"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {fileName ? 'Replace file' : 'Upload file'}
      </button>

      {fileName && (
        <div className="mt-3 rounded-lg border border-positive/30 bg-positive/5 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">
              <span className="text-positive">✓</span> {fileName} parsed successfully
            </p>
            <span className="rounded-full bg-positive/10 px-2 py-0.5 text-xs font-semibold text-positive">
              {MOCK_PARSED_ROWS.length} rows · 0 errors
            </span>
          </div>
          <div className="mt-2 overflow-hidden rounded-md border border-surface-border bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle text-ink-soft">
                <tr>
                  <th className="px-3 py-1.5 font-semibold">#</th>
                  <th className="px-3 py-1.5 font-semibold">Item</th>
                  <th className="px-3 py-1.5 font-semibold">Supplier</th>
                  <th className="px-3 py-1.5 font-semibold">Quantity</th>
                  <th className="px-3 py-1.5 font-semibold">Unit</th>
                  <th className="px-3 py-1.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_PARSED_ROWS.map((r) => (
                  <tr key={r.row} className="border-t border-surface-border">
                    <td className="px-3 py-1.5 text-ink-muted">{r.row}</td>
                    <td className="px-3 py-1.5 text-ink">{r.item}</td>
                    <td className="px-3 py-1.5 text-ink-soft">{r.supplier}</td>
                    <td className="px-3 py-1.5 text-ink">{r.quantity}</td>
                    <td className="px-3 py-1.5 text-ink-soft">{r.unit}</td>
                    <td className="px-3 py-1.5">
                      <span className="text-positive">{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-ink-muted">
            Preview is illustrative — real Excel parsing is added in a later phase.
          </p>
        </div>
      )}
    </div>
  );
}
