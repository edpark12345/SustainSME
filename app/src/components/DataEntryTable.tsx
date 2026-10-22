import { useState } from 'react';
import type { DataEntryColumn } from '../types';

interface DataEntryTableProps {
  columns: DataEntryColumn[];
  addLabel?: string;
  /** Pre-filled illustrative rows for the demo. */
  seedRows?: Record<string, string>[];
}

function blankRow(columns: DataEntryColumn[]): Record<string, string> {
  return Object.fromEntries(columns.map((c) => [c.key, '']));
}

/**
 * The manual data-entry table fallback (Figma screens -21..-28). Rows are
 * editable, can be added or removed. Kept deterministic — no calculation.
 */
export function DataEntryTable({ columns, addLabel = 'Add new row', seedRows }: DataEntryTableProps) {
  const [rows, setRows] = useState<Record<string, string>[]>(
    seedRows && seedRows.length ? seedRows : [blankRow(columns), blankRow(columns)],
  );

  const update = (idx: number, key: string, value: string) =>
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)));

  const addRow = () => setRows((prev) => [...prev, blankRow(columns)]);
  const removeRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-2">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-2 pb-1 text-left text-xs font-semibold text-ink-soft">
                  {c.label}
                </th>
              ))}
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                {columns.map((c) => (
                  <td key={c.key} className="px-2 align-top">
                    {c.type === 'select' ? (
                      <select
                        className="text-input"
                        value={row[c.key] ?? ''}
                        onChange={(e) => update(idx, c.key, e.target.value)}
                      >
                        <option value="">Select…</option>
                        {c.options?.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={c.type === 'number' ? 'number' : 'text'}
                        className="text-input"
                        placeholder={c.optional ? 'Optional' : ''}
                        value={row[c.key] ?? ''}
                        onChange={(e) => update(idx, c.key, e.target.value)}
                      />
                    )}
                  </td>
                ))}
                <td className="px-1 align-top">
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    aria-label="Remove row"
                    className="mt-1.5 text-ink-muted hover:text-danger"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M6 7h12M9 7V5h6v2m-7 0v12a1 1 0 001 1h6a1 1 0 001-1V7"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-accenture-700 hover:text-accenture"
      >
        <span className="text-lg leading-none">+</span> {addLabel}
      </button>
    </div>
  );
}
