import { useEffect, useMemo, useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { GuideNote } from './GuideNote';
import { api } from '../lib/apiClient';
import { useAssessment } from '../context/AssessmentContext';
import type { Scope3Bucket, Scope3Spend } from '../types';

// The spend-core categories our EEIO engine computes.
const SPEND_CATEGORIES = [1, 2, 4, 9];

/**
 * Spend-based Scope 3 entry (GHG Protocol categories 1, 2, 4, 9).
 * The SME enters what it spent per purchase type; the backend applies EEIO
 * factors (money → kg CO₂e). Buckets + currencies come from /api/scope3-buckets
 * so there is a single source of truth with the factor library.
 */
export function Scope3SpendEntry() {
  const { bundle, setScope3Spend, profile } = useAssessment();
  const [buckets, setBuckets] = useState<Scope3Bucket[]>([]);
  const [catLabels, setCatLabels] = useState<Record<string, string>>({});
  const [currencies, setCurrencies] = useState<string[]>(['EUR', 'USD']);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .scope3Buckets()
      .then((r) => {
        setBuckets(r.buckets);
        setCatLabels(r.categories);
        if (r.currencies.length) setCurrencies(r.currencies);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const defaultCurrency = profile.revenueCurrency || 'EUR';
  const lines = bundle.scope3_spend;

  const bucketsFor = useMemo(
    () => (cat: number) => buckets.filter((b) => b.suggested_categories.includes(cat)),
    [buckets],
  );

  const addRow = (category: number) => {
    const first = bucketsFor(category)[0];
    setScope3Spend([
      ...lines,
      { category, factor_key: first?.key ?? '', amount: null, currency: defaultCurrency },
    ]);
  };
  const setRow = (idx: number, patch: Partial<Scope3Spend>) =>
    setScope3Spend(lines.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  const removeRow = (idx: number) => setScope3Spend(lines.filter((_, i) => i !== idx));

  const num = (v: string): number | null => (v.trim() === '' ? null : Number(v));

  return (
    <div className="space-y-6">
      <GuideNote
        title="What did your business spend money on?"
        tips={[
          'Most of a company’s footprint sits in what it buys. Where you don’t have supplier or physical data yet, we estimate emissions from how much you spend, using official “money-to-emissions” factors published per industry (kg CO₂e per € spent).',
          'Enter annual amounts by purchase type. Rough figures from your P&L or bookkeeping are fine — this is a screening estimate, flagged as “spend-based”.',
        ]}
      >
        Spend-based figures are the GHG Protocol’s starting point for Scope 3. You can refine any
        category later with supplier-specific or activity data for a more accurate result.
      </GuideNote>

      {!loaded && <p className="text-sm text-ink-muted">Loading spend categories…</p>}

      {loaded &&
        SPEND_CATEGORIES.map((cat) => {
          const catBuckets = bucketsFor(cat);
          const catLines = lines.map((l, i) => ({ l, i })).filter(({ l }) => l.category === cat);
          if (!catBuckets.length) return null;
          return (
            <Card
              key={cat}
              title={catLabels[String(cat)] ?? `Category ${cat}`}
              subtitle={`GHG Protocol Scope 3, category ${cat}`}
              action={
                <Button variant="ghost" onClick={() => addRow(cat)}>
                  + Add spend
                </Button>
              }
            >
              {catLines.length === 0 && (
                <p className="text-sm text-ink-muted">
                  Nothing added. Click “Add spend” for each type of purchase in this category.
                </p>
              )}
              <div className="space-y-3">
                {catLines.map(({ l, i }) => (
                  <div key={i} className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_1fr_auto_auto] sm:items-end">
                    <div>
                      <label className="block text-[11px] font-medium text-ink-muted">Purchase type</label>
                      <select
                        className="text-input mt-1"
                        value={l.factor_key}
                        onChange={(e) => setRow(i, { factor_key: e.target.value })}
                      >
                        {catBuckets.map((b) => (
                          <option key={b.key} value={b.key}>
                            {b.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-ink-muted">Amount spent (per year)</label>
                      <input
                        className="text-input mt-1"
                        inputMode="numeric"
                        value={l.amount ?? ''}
                        onChange={(e) => setRow(i, { amount: num(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-ink-muted">Currency</label>
                      <select
                        className="text-input mt-1"
                        value={l.currency ?? defaultCurrency}
                        onChange={(e) => setRow(i, { currency: e.target.value })}
                      >
                        {currencies.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => removeRow(i)}
                      className="pb-2 text-xs text-danger hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
    </div>
  );
}
