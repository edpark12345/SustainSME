import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

/**
 * Real client-side data upload (Phase-2 ingestion preview).
 *
 * Spreadsheets (.xlsx/.xls/.csv) are *actually parsed* in the browser with
 * SheetJS and previewed (phantom-row aware). PDF bills are accepted but flagged
 * for server-side extraction (digital-table parse, or vision/OCR for scans) —
 * in-browser bill OCR is out of scope. This is the front-door of the
 * format-agnostic ingestion layer described in EMISSION_METHODOLOGY.md §8.
 */

type Cell = string | number | boolean | Date | null;

interface SheetPreview {
  name: string;
  rows: Cell[][];
  dataRowCount: number;
  colCount: number;
  truncated: boolean;
}

interface ParsedFile {
  fileName: string;
  sizeKB: number;
  kind: 'spreadsheet' | 'pdf' | 'unsupported';
  sheets?: SheetPreview[];
  note?: string;
}

const MAX_SCAN_ROWS = 1000; // phantom-row guard (some files report 1,000,000+ rows)
const PREVIEW_ROWS = 6;
const PREVIEW_COLS = 8;

function fmt(v: Cell): string {
  if (v === null || v === undefined || v === '') return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'number') return String(Math.round(v * 100) / 100);
  const s = String(v);
  return s.length > 20 ? s.slice(0, 18) + '…' : s;
}

export function DataUpload({
  accept = '.xlsx,.xls,.csv,.pdf',
  hint,
  mapsTo,
}: {
  accept?: string;
  hint?: string;
  mapsTo?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ParsedFile | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResult(null);
    setBusy(true);
    const sizeKB = Math.round(file.size / 1024);
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    try {
      if (ext === 'pdf') {
        setResult({
          fileName: file.name,
          sizeKB,
          kind: 'pdf',
          note: 'Received. Bill extraction runs server-side — a digital-table parse, or vision/OCR for scanned bills. Not parsed in the browser.',
        });
      } else if (['xlsx', 'xls', 'csv'].includes(ext)) {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array', cellDates: true });
        const sheets: SheetPreview[] = wb.SheetNames.map((name) => {
          const ws = wb.Sheets[name];
          const ref = ws['!ref'];
          if (!ref) return { name, rows: [], dataRowCount: 0, colCount: 0, truncated: false };
          const range = XLSX.utils.decode_range(ref);
          const truncated = range.e.r > range.s.r + MAX_SCAN_ROWS;
          const clamped = {
            s: range.s,
            e: {
              r: Math.min(range.e.r, range.s.r + MAX_SCAN_ROWS),
              c: Math.min(range.e.c, range.s.c + 40),
            },
          };
          const aoa = XLSX.utils.sheet_to_json(ws, {
            header: 1,
            blankrows: false,
            defval: null,
            range: XLSX.utils.encode_range(clamped),
          }) as Cell[][];
          const colCount = aoa.reduce((m, r) => Math.max(m, r.length), 0);
          return {
            name,
            rows: aoa.slice(0, PREVIEW_ROWS + 1),
            dataRowCount: Math.max(aoa.length - 1, 0),
            colCount,
            truncated,
          };
        });
        setResult({ fileName: file.name, sizeKB, kind: 'spreadsheet', sheets });
      } else {
        setResult({ fileName: file.name, sizeKB, kind: 'unsupported', note: 'Unsupported file type for this preview.' });
      }
    } catch (err) {
      setError('Could not read this file: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const firstSheet = result?.sheets?.find((s) => s.rows.length > 0);

  return (
    <div>
      <input ref={inputRef} type="file" accept={accept} onChange={onSelect} className="hidden" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-accenture-300 bg-accenture-50 px-4 py-5 text-sm font-semibold text-accenture-700 transition-colors hover:bg-accenture-100"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 16V5m0 0L8 9m4-4l4 4M5 19h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {busy ? 'Reading…' : result ? 'Upload another file' : 'Upload a file'}
      </button>
      {(hint || mapsTo) && (
        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-ink-muted">
          <span>{hint}</span>
          {mapsTo && (
            <span className="shrink-0 rounded-full bg-surface-subtle px-2 py-0.5 font-medium text-ink-soft">{mapsTo}</span>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3 rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</div>
      )}

      {result?.kind === 'pdf' && (
        <div className="mt-3 rounded-lg border border-warning/30 bg-warning/5 p-3">
          <p className="text-sm font-medium text-ink">
            📄 {result.fileName} <span className="text-ink-muted">· {result.sizeKB} KB</span>
          </p>
          <p className="mt-1 text-xs text-ink-soft">{result.note}</p>
        </div>
      )}

      {result?.kind === 'spreadsheet' && (
        <div className="mt-3 rounded-lg border border-positive/30 bg-positive/5 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-ink">
              <span className="text-positive">✓</span> {result.fileName} parsed
              <span className="text-ink-muted"> · {result.sizeKB} KB</span>
            </p>
            <span className="rounded-full bg-positive/10 px-2 py-0.5 text-xs font-semibold text-positive">
              {result.sheets?.length} sheet{(result.sheets?.length ?? 0) === 1 ? '' : 's'}
            </span>
          </div>

          {(result.sheets?.length ?? 0) > 1 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.sheets!.map((s) => (
                <span key={s.name} className="rounded-full border border-surface-border bg-white px-2 py-0.5 text-[11px] text-ink-soft">
                  {s.name} · {s.dataRowCount} rows
                </span>
              ))}
            </div>
          )}

          {firstSheet && (
            <>
              <p className="mt-2 text-[11px] text-ink-muted">
                Preview · sheet “{firstSheet.name}” · {firstSheet.dataRowCount} data rows × {firstSheet.colCount} cols
                {firstSheet.truncated && ' (scan capped at 1,000 rows)'}
              </p>
              <div className="mt-1 overflow-x-auto rounded-md border border-surface-border bg-white">
                <table className="w-full text-left text-xs">
                  <tbody>
                    {firstSheet.rows.map((row, ri) => (
                      <tr key={ri} className={ri === 0 ? 'bg-surface-subtle font-semibold text-ink-soft' : 'border-t border-surface-border'}>
                        {Array.from({ length: Math.min(firstSheet.colCount, PREVIEW_COLS) }).map((_, ci) => (
                          <td key={ci} className="whitespace-nowrap px-2.5 py-1 text-ink">{fmt(row[ci] ?? null)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <p className="mt-2 text-[11px] text-ink-muted">
            Real in-browser parse. Mapping each row to a scope/category + emission factor happens in the calculation engine (Phase 5).
          </p>
        </div>
      )}
    </div>
  );
}
