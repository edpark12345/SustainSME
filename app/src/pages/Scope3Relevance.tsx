import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/Button';
import { RadioGroup } from '../components/RadioGroup';
import { GuideNote } from '../components/GuideNote';
import { SCOPE3_CATEGORIES, RELEVANCE_QUESTIONS } from '../data/scope3Categories';
import {
  archetypeForSector,
  ARCHETYPE_LABEL,
  ARCHETYPE_RELEVANT_CATEGORIES,
  defaultRelevanceForSector,
} from '../data/sectorArchetypes';
import { useAssessment } from '../context/AssessmentContext';
import { ROUTES } from '../routes';

export function Scope3Relevance() {
  const navigate = useNavigate();
  const { profile, relevance, setRelevance, setRelevanceMap, relevantCategoryIds } =
    useAssessment();

  const answeredCount = SCOPE3_CATEGORIES.filter((c) => relevance[c.id]).length;
  const allAnswered = answeredCount === SCOPE3_CATEGORIES.length;
  const archetype = archetypeForSector(profile.sector);

  // Pre-fill the 15 answers from the sector's archetype on first visit (still editable).
  useEffect(() => {
    if (answeredCount === 0 && archetype) {
      const def = defaultRelevanceForSector(profile.sector);
      if (def) setRelevanceMap(def);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showOther, setShowOther] = useState(false);
  const defaultYes = archetype ? new Set(ARCHETYPE_RELEVANT_CATEGORIES[archetype]) : null;
  const relevantCats = defaultYes ? SCOPE3_CATEGORIES.filter((c) => defaultYes.has(c.id)) : SCOPE3_CATEGORIES;
  const otherCats = defaultYes ? SCOPE3_CATEGORIES.filter((c) => !defaultYes.has(c.id)) : [];

  // A plain-language, question-led list — the category name/definition is secondary.
  const categoryList = (cats: typeof SCOPE3_CATEGORIES) => (
    <div className="card divide-y divide-surface-border">
      {cats.map((cat) => (
        <div key={cat.id} className="flex items-center justify-between gap-4 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-ink">{RELEVANCE_QUESTIONS[cat.id] ?? cat.name}</p>
            <p className="mt-0.5 text-xs text-ink-muted" title={cat.relevanceHint}>
              Scope 3 · Category {cat.id} · {cat.name}
            </p>
          </div>
          <div className="shrink-0">
            <RadioGroup
              name={`relevance-${cat.id}`}
              value={relevance[cat.id]}
              onChange={(v) => setRelevance(cat.id, v)}
            />
          </div>
        </div>
      ))}
    </div>
  );

  // After screening relevance, go to the real calculation page where the Scope 3
  // data is entered and the auditable S1/S2/S3 result is computed & downloadable.
  const onNext = () => navigate(ROUTES.calculations);

  return (
    <PageShell
      title="Scope 3 Category Relevance"
      subtitle="Tell us which of the 15 Scope 3 categories apply to your business. We'll only ask detailed questions for the relevant ones."
    >
      <GuideNote title="Why we ask this">
        Not every category matters for your business. Mark the ones that apply and we'll only ask
        detailed questions for those.
      </GuideNote>

      {archetype && (
        <p className="mb-4 text-sm text-ink-soft">
          Pre-filled for{' '}
          <span className="font-semibold text-accenture-700">{ARCHETYPE_LABEL[archetype]}</span>{' '}
          based on your sector — just review and adjust below.
        </p>
      )}

      {archetype && (
        <div className="mb-3 flex justify-end">
          <Button
            variant="outline"
            onClick={() => {
              const d = defaultRelevanceForSector(profile.sector);
              if (d) setRelevanceMap(d);
            }}
          >
            Reset to my sector's suggestions
          </Button>
        </div>
      )}

      {defaultYes ? (
        <>
          <h3 className="mb-2 text-sm font-semibold text-ink">Likely relevant for your business</h3>
          {categoryList(relevantCats)}
          {otherCats.length > 0 && (
            <>
              <p className="mt-4 text-xs text-ink-muted">
                These are usually not relevant for your sector — but please open and review them, and
                mark any that do apply to your business.
              </p>
              <button
                type="button"
                onClick={() => setShowOther((v) => !v)}
                className="mt-1 text-sm font-semibold text-accenture-700 hover:underline"
              >
                {showOther ? 'Hide' : 'Review'} other categories ({otherCats.length})
              </button>
              {showOther && <div className="mt-3">{categoryList(otherCats)}</div>}
            </>
          )}
        </>
      ) : (
        categoryList(SCOPE3_CATEGORIES)
      )}

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-ink-soft">
          {answeredCount} / {SCOPE3_CATEGORIES.length} answered
          {allAnswered && (
            <span className="ml-2 text-accenture-700">
              · {relevantCategoryIds.length} relevant categories
            </span>
          )}
        </p>
        <Button size="lg" disabled={!allAnswered} onClick={onNext}>
          Next →
        </Button>
      </div>
    </PageShell>
  );
}
