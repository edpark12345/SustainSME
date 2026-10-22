import { Card } from './Card';
import { SCOPE3_CATEGORIES } from '../data/scope3Categories';
import { useAssessment } from '../context/AssessmentContext';

// Categories the deterministic engine can currently compute.
const ENGINE_SUPPORTED = new Set([1, 2, 3, 4, 5, 6, 7, 9]);

type Status = 'quantified' | 'supported' | 'relevant' | 'excluded' | 'unscreened';

const STATUS_STYLE: Record<Status, { label: string; cls: string }> = {
  quantified: { label: 'Quantified', cls: 'bg-positive/10 text-positive' },
  supported: { label: 'Supported · add data', cls: 'bg-accenture-50 text-accenture-700' },
  relevant: { label: 'Relevant · not yet quantified', cls: 'bg-warning/10 text-warning' },
  excluded: { label: 'Not relevant · excluded', cls: 'bg-ink-muted/10 text-ink-soft' },
  unscreened: { label: 'Not screened', cls: 'bg-ink-muted/10 text-ink-muted' },
};

/**
 * Scope 3 coverage map — all 15 GHG-Protocol categories with an honest status.
 * GHG Protocol requires disclosing which categories are included and which are
 * excluded (with justification); this panel is that completeness statement.
 */
export function Scope3Coverage() {
  const { calc, relevance } = useAssessment();

  // Category numbers with a computed Scope 3 result (from the "Cat N ·" label).
  const quantified = new Set<number>();
  (calc?.results ?? []).forEach((r) => {
    if (r.scope === '3') {
      const m = r.category.match(/Cat\s*(\d+)/i);
      if (m) quantified.add(Number(m[1]));
    }
  });

  const statusFor = (id: number): Status => {
    // Quantified always wins (data was entered). Otherwise the SME's own relevance
    // screening takes precedence: a category they marked "not relevant" is excluded
    // even if the engine could compute it.
    if (quantified.has(id)) return 'quantified';
    if (relevance[id] === 'no') return 'excluded';
    if (ENGINE_SUPPORTED.has(id)) return 'supported';
    if (relevance[id] === 'yes') return 'relevant';
    return 'unscreened';
  };

  const counts = SCOPE3_CATEGORIES.reduce<Record<Status, number>>(
    (acc, c) => {
      const s = statusFor(c.id);
      acc[s] += 1;
      return acc;
    },
    { quantified: 0, supported: 0, relevant: 0, excluded: 0, unscreened: 0 },
  );

  return (
    <Card
      title="Scope 3 coverage — all 15 categories"
      subtitle="Which categories are included, quantified, or excluded — the completeness statement a disclosure requires."
      className="mt-6"
    >
      <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
        <span className="text-ink-muted">
          {counts.quantified} quantified · {counts.supported} ready for data · {counts.relevant} relevant
          (pending) · {counts.excluded} excluded
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border border-surface-border">
        <table className="w-full text-left text-xs">
          <tbody>
            {SCOPE3_CATEGORIES.map((c) => {
              const s = STATUS_STYLE[statusFor(c.id)];
              // Categories the engine can't calculate yet are greyed out.
              const computable = ENGINE_SUPPORTED.has(c.id);
              return (
                <tr
                  key={c.id}
                  className={`border-t border-surface-border first:border-t-0 ${
                    computable ? '' : 'bg-surface-subtle/60 opacity-60'
                  }`}
                >
                  <td className="px-3 py-2 text-ink-muted whitespace-nowrap">Cat {c.id}</td>
                  <td className={`px-3 py-2 ${computable ? 'text-ink' : 'text-ink-muted'}`}>
                    {c.name}
                    {!computable && (
                      <span className="ml-2 rounded bg-ink-muted/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-ink-muted">
                        to be included
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.cls}`}>
                      {s.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] text-ink-muted">
        Greyed-out rows (Cat 8 and 10–15) are <span className="font-semibold">work in progress — to be
        included</span>. They apply to specific business models (leased assets, product processing/use,
        franchises, investments) and are not yet added to the Scope 3 total. They are screened for
        relevance and shown for completeness; quantification follows when the business model and data
        require it.
      </p>
    </Card>
  );
}
