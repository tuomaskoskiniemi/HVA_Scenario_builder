/** Finnish number formatting: space as thousands separator, comma decimals. */
export function fmt(x: number, decimals = 0): string {
  const [int, dec] = x.toFixed(decimals).split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return dec ? `${grouped},${dec}` : grouped;
}

const sign = (x: number) => (x > 0 ? '+' : x < 0 ? '−' : '±');

/** Signed one-decimal value, e.g. "+2,4" / "−1,0". */
export const signed1 = (x: number) => sign(x) + fmt(Math.abs(x), 1);

/** Signed integer, e.g. "+1 204". */
export const signedInt = (x: number) => sign(x) + fmt(Math.abs(Math.round(x)));

/** Parse a Finnish-formatted number out of a display string ("27 577 €" → 27577). */
export function parseFi(s: string): number {
  const m = s.match(/-?[\d\s ]+(?:,\d+)?/);
  return m ? parseFloat(m[0].replace(/[\s ]/g, '').replace(',', '.')) : NaN;
}
