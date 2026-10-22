// Helpers for Recharts tooltip formatters. Recharts types the incoming value
// as `number | string | Array<number | string>`, so formatters must accept the
// full union to satisfy `strictFunctionTypes`.
type RVal = number | string | ReadonlyArray<number | string> | undefined;
type RName = number | string | undefined;

const toNumber = (v: RVal): number => Number(Array.isArray(v) ? v[0] : v ?? 0);

export const fmtNumber = (n: number) => n.toLocaleString('en-US');

/** Tooltip formatter: "12,345 tCO₂e" with a fixed series label. */
export const tooltipTco2e =
  (label = 'Emissions') =>
  (value: RVal): [string, string] =>
    [`${fmtNumber(toNumber(value))} tCO₂e`, label];

/** Tooltip formatter for pies that keeps the slice name, value in tCO₂e. */
export const tooltipTco2eNamed = (value: RVal, name: RName): [string, string] => [
  `${fmtNumber(toNumber(value))} tCO₂e`,
  String(name),
];

/** Tooltip formatter that shows a percentage and keeps the slice name. */
export const tooltipPercentNamed = (value: RVal, name: RName): [string, string] => [
  `${toNumber(value)}%`,
  String(name),
];
