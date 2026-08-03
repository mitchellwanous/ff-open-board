export function fmt(n: number | null | undefined, digits = 1): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

export function fmtInt(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return Math.round(n).toLocaleString();
}

export function fmtPct(
  n: number | null | undefined,
  digits = 1,
  alreadyPct = true,
): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  const v = alreadyPct ? n : n * 100;
  return `${v.toFixed(digits)}%`;
}

export function fmtShare(
  n: number | null | undefined,
  asPctDigits = 1,
): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  // flat shares are 0–1
  if (Math.abs(n) <= 1.5) return `${(n * 100).toFixed(asPctDigits)}%`;
  return `${n.toFixed(asPctDigits)}%`;
}

export function displayClaimValue(
  field: string,
  value: number | null,
  unit: string,
): string {
  if (value === null || value === undefined) return "—";
  if (
    unit === "share" ||
    field.includes("share") ||
    field === "pass_rate" ||
    field.endsWith("_rate") ||
    field === "catch_pct" ||
    field === "int_rate"
  ) {
    return fmtShare(value);
  }
  if (unit === "pct") return fmtPct(value);
  if (unit === "rank") return String(Math.round(value));
  if (unit === "fp" || unit === "ppg" || unit === "plays") return fmt(value, 1);
  if (unit === "yp") return fmt(value, 2);
  if (unit === "ppp" || unit === "mult") return fmt(value, 3);
  return fmt(value, 2);
}

/** Projected / hist team efficiency bridge: PPG ÷ plays per game. */
export function pointsPerPlay(
  ppg: number | null | undefined,
  playsPg: number | null | undefined,
): number | null {
  if (ppg == null || playsPg == null || Number.isNaN(ppg) || Number.isNaN(playsPg))
    return null;
  if (playsPg <= 0) return null;
  return ppg / playsPg;
}
