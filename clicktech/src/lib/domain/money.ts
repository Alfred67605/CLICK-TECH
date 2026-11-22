/**
 * Exact monetary helpers in Bolivianos (BOB), stored as integer centavos.
 * Never perform floating-point currency addition or multiplication.
 */

export function formatBs(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) {
    return "Por cotizar";
  }
  const safeCents = Math.trunc(cents);
  const negative = safeCents < 0;
  const abs = Math.abs(safeCents);
  const whole = Math.trunc(abs / 100);
  const frac = abs % 100;

  const wholeFormatted = whole
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const fracFormatted = frac.toString().padStart(2, "0");

  return `${negative ? "-" : ""}Bs ${wholeFormatted},${fracFormatted}`;
}

export function formatBsCompact(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) {
    return "Por cotizar";
  }
  const safeCents = Math.trunc(cents);
  const frac = Math.abs(safeCents) % 100;
  if (frac === 0) {
    const negative = safeCents < 0;
    const whole = Math.trunc(Math.abs(safeCents) / 100);
    const wholeFormatted = whole
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${negative ? "-" : ""}Bs ${wholeFormatted}`;
  }
  return formatBs(safeCents);
}

export function parseBsToCents(input: string | number): number {
  if (typeof input === "number") {
    if (!Number.isFinite(input)) return 0;
    return Math.round(input * 100);
  }
  const clean = input.trim().replace(/^Bs\s*/i, "");
  if (!clean) return 0;

  // Handle Bolivian format "1.250,50" or standard "1250.50"
  let normalized = clean;
  if (clean.includes(",") && clean.includes(".")) {
    normalized = clean.replace(/\./g, "").replace(",", ".");
  } else if (clean.includes(",")) {
    normalized = clean.replace(",", ".");
  }

  const match = normalized.match(/^(-?\d+)(?:\.(\d{1,2}))?/);
  if (!match) return 0;
  const sign = match[1].startsWith("-") ? -1 : 1;
  const whole = Math.abs(parseInt(match[1], 10));
  const fracStr = (match[2] ?? "").padEnd(2, "0").slice(0, 2);
  const frac = parseInt(fracStr, 10);
  return sign * (whole * 100 + frac);
}

export function sumCents(...values: number[]): number {
  let total = 0;
  for (const v of values) {
    total += Math.trunc(v);
  }
  return total;
}

export function lineTotalCents(unitPriceCents: number, quantity: number): number {
  const unit = Math.trunc(unitPriceCents);
  const qty = Math.max(0, Math.trunc(quantity));
  return unit * qty;
}
