export function extractOdometer(text: string, minimumKm = 0): number | null {
  const candidates: { value: number; score: number }[] = [];
  for (const line of text.split(/[\r\n]+/)) {
    const context = line.toLowerCase();
    for (const match of line.matchAll(/\d[\d.,\s]{2,18}\d|\d{4,8}/g)) {
      const digits = match[0].replace(/\D/g, '');
      const value = Number(digits);
      if (digits.length < 4 || digits.length > 7 || value < minimumKm || value > 2_000_000) continue;
      const score = (/\bodo(?:meter|metro)?\b|kilometraje|total/i.test(context) ? 6 : 0)
        + (/\bkm\b/i.test(context) ? 3 : 0)
        + digits.length * .25 + Math.log10(value + 1) * .2;
      candidates.push({ value, score });
    }
  }
  candidates.sort((a, b) => b.score - a.score || b.value - a.value);
  return candidates[0]?.value ?? null;
}
