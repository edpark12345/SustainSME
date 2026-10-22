import type { YesNo } from '../types';

interface RadioGroupProps {
  name: string;
  value?: YesNo;
  onChange: (value: YesNo) => void;
  options?: { label: string; value: YesNo }[];
  /** Layout: inline (default) or stacked. */
  inline?: boolean;
}

const DEFAULT_OPTIONS: { label: string; value: YesNo }[] = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
];

export function RadioGroup({
  name,
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  inline = true,
}: RadioGroupProps) {
  return (
    <div className={inline ? 'flex items-center gap-6' : 'flex flex-col gap-2'}>
      {options.map((opt) => {
        const checked = value === opt.value;
        return (
          <label
            key={opt.value}
            className="inline-flex cursor-pointer items-center gap-2 text-sm text-ink"
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full border transition-colors ${
                checked ? 'border-accenture' : 'border-surface-border'
              }`}
            >
              {checked && <span className="h-2 w-2 rounded-full bg-accenture" />}
            </span>
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={checked}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}
