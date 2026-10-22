import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Button } from '../components/Button';
import { CategoryBadge } from '../components/CategoryBadge';
import { RadioGroup } from '../components/RadioGroup';
import { ProgressStepper } from '../components/ProgressStepper';
import { ExcelDownloadCard } from '../components/ExcelDownloadCard';
import { UploadTrigger } from '../components/UploadTrigger';
import { DataEntryTable } from '../components/DataEntryTable';
import { getCategory } from '../data/scope3Categories';
import { DEMO_RELEVANT_IDS, useAssessment } from '../context/AssessmentContext';
import { ROUTES } from '../routes';
import type { CategoryQuestion, YesNo } from '../types';

export function Scope3Questionnaire() {
  const navigate = useNavigate();
  const { id } = useParams();
  const categoryId = Number(id);
  const category = getCategory(categoryId);
  const { relevantCategoryIds: answeredRelevant } = useAssessment();
  // Fall back to the demo set if the relevance screen hasn't been completed yet
  // (e.g. a category was deep-linked), so the stepper is never empty.
  const relevantCategoryIds = answeredRelevant.length ? answeredRelevant : DEMO_RELEVANT_IDS;

  // Per-category answers; reset when the category changes.
  const [answers, setAnswers] = useState<Record<string, YesNo>>({});
  const [manualEntry, setManualEntry] = useState(false);
  useEffect(() => {
    setAnswers({});
    setManualEntry(false);
  }, [categoryId]);

  // Build the stepper from the categories the user marked relevant.
  const steps = useMemo(
    () =>
      relevantCategoryIds.map((cid) => {
        const c = getCategory(cid)!;
        return { id: cid, label: `Category ${cid}`, sublabel: c.name };
      }),
    [relevantCategoryIds],
  );

  if (!category) {
    return (
      <PageShell title="Category not found">
        <Button onClick={() => navigate(ROUTES.scope3Relevance)}>Back to relevance</Button>
      </PageShell>
    );
  }

  const positionInFlow = relevantCategoryIds.indexOf(categoryId);
  const isLast = positionInFlow === relevantCategoryIds.length - 1;
  const prevId = relevantCategoryIds[positionInFlow - 1];
  const nextId = relevantCategoryIds[positionInFlow + 1];

  const setAnswer = (qid: string, value: YesNo) =>
    setAnswers((prev) => ({ ...prev, [qid]: value }));

  // A question is visible if it has no parent, or the parent's answer matches.
  const isVisible = (q: CategoryQuestion) =>
    !q.parentId || answers[q.parentId] === q.showWhenParent;

  // The upload/data section unlocks when the gating question's answer matches.
  const uploadQuestion = category.questions.find((q) => q.unlocksUploadOn);
  const uploadUnlocked =
    !!uploadQuestion &&
    isVisible(uploadQuestion) &&
    answers[uploadQuestion.id] === uploadQuestion.unlocksUploadOn;

  const goNext = () => {
    if (isLast) navigate(ROUTES.results);
    else navigate(ROUTES.scope3Category(nextId));
    window.scrollTo({ top: 0 });
  };

  const goBack = () => {
    if (prevId) navigate(ROUTES.scope3Category(prevId));
    else navigate(ROUTES.scope3Relevance);
    window.scrollTo({ top: 0 });
  };

  return (
    <PageShell
      title="Scope 3 emissions estimation"
      subtitle="Answer a few questions per category. We'll ask for an Excel upload or a quick manual entry only where it's useful."
    >
      <div className="card mb-6 px-5 py-5">
        <ProgressStepper
          steps={steps}
          current={categoryId}
          onStepClick={(sid) => navigate(ROUTES.scope3Category(sid))}
        />
      </div>

      <div className="card px-6 py-6">
        <div className="flex items-center gap-3">
          <CategoryBadge label={`Category ${category.id}`} />
          <h2 className="text-lg font-semibold text-ink">{category.name}</h2>
        </div>
        <p className="mt-2 text-sm text-ink-soft">({category.description})</p>

        <div className="mt-6 space-y-6">
          {category.questions.filter(isVisible).map((q) => {
            const isFollowUp = !!q.parentId;
            return (
              <div key={q.id} className={isFollowUp ? 'ml-5 border-l-2 border-accenture-100 pl-4' : ''}>
                <p className="text-sm font-medium text-ink">
                  {!isFollowUp && <span className="mr-1 text-ink-soft">{numbered(category.questions, q)}.</span>}
                  {isFollowUp && <span className="mr-1 text-ink-muted">•</span>}
                  {q.text}
                  {q.optional && <span className="ml-1 text-xs text-ink-muted">(Optional)</span>}
                </p>
                <div className="mt-2">
                  <RadioGroup
                    name={`${category.id}-${q.id}`}
                    value={answers[q.id]}
                    onChange={(v) => setAnswer(q.id, v)}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Conditional Excel download + upload / manual entry section */}
        {uploadUnlocked && (
          <div className="mt-7 border-t border-surface-border pt-5">
            {!manualEntry ? (
              <>
                <p className="text-sm text-ink-soft">
                  Please download the below template to fill data about{' '}
                  <span className="font-medium text-ink">{category.templateFile}</span>, and upload
                  the filled excel on the right of this screen.
                </p>
                <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <ExcelDownloadCard fileName={category.templateFile} />
                  <UploadTrigger />
                </div>
                <button
                  type="button"
                  onClick={() => setManualEntry(true)}
                  className="mt-4 text-sm font-medium text-accenture-700 hover:underline"
                >
                  Don't have an Excel? Enter data manually instead →
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <CategoryBadge label={`${category.name} data entry form`} />
                    <p className="mt-2 text-xs text-ink-muted">
                      Indicate {category.name.toLowerCase()} for which data is available.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setManualEntry(false)}
                    className="text-sm font-medium text-accenture-700 hover:underline"
                  >
                    ← Use Excel template instead
                  </button>
                </div>
                <div className="mt-4">
                  <DataEntryTable columns={category.table} addLabel="Add new row" />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="outline" onClick={goBack}>
          ← Back
        </Button>
        <Button size="lg" onClick={goNext}>
          {isLast ? 'View results →' : 'Next →'}
        </Button>
      </div>
    </PageShell>
  );
}

// Display number among top-level (non-follow-up) questions only.
function numbered(all: CategoryQuestion[], q: CategoryQuestion) {
  const topLevel = all.filter((x) => !x.parentId);
  return topLevel.findIndex((x) => x.id === q.id) + 1;
}
