interface Step {
  id: number;
  label: string;
  sublabel?: string;
}

interface ProgressStepperProps {
  steps: Step[];
  /** id of the active step */
  current: number;
  onStepClick?: (id: number) => void;
}

export function ProgressStepper({ steps, current, onStepClick }: ProgressStepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === current);

  return (
    <div className="flex items-start overflow-x-auto pb-2">
      {steps.map((step, idx) => {
        const done = idx < currentIndex;
        const active = idx === currentIndex;
        return (
          <div key={step.id} className="flex min-w-[96px] flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {/* left connector */}
              <span
                className={`h-0.5 flex-1 ${idx === 0 ? 'opacity-0' : done || active ? 'bg-accenture-300' : 'bg-surface-border'}`}
              />
              <button
                type="button"
                onClick={() => onStepClick?.(step.id)}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-accenture bg-accenture text-white'
                    : done
                      ? 'border-accenture-300 bg-accenture-50 text-accenture-700'
                      : 'border-surface-border bg-white text-ink-muted'
                }`}
                aria-current={active ? 'step' : undefined}
              >
                {done ? '✓' : idx + 1}
              </button>
              {/* right connector */}
              <span
                className={`h-0.5 flex-1 ${idx === steps.length - 1 ? 'opacity-0' : done ? 'bg-accenture-300' : 'bg-surface-border'}`}
              />
            </div>
            <div className="mt-2 px-1 text-center">
              <p
                className={`text-[11px] font-semibold leading-tight ${active || done ? 'text-ink' : 'text-ink-muted'}`}
              >
                {step.label}
              </p>
              {step.sublabel && (
                <p className="text-[10px] leading-tight text-ink-muted">{step.sublabel}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
