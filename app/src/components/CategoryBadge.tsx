interface CategoryBadgeProps {
  label: string;
}

export function CategoryBadge({ label }: CategoryBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-md bg-accenture-50 px-2.5 py-1 text-sm font-semibold text-accenture-700">
      {label}
    </span>
  );
}
