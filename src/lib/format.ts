export const money = (v: unknown) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(Number(v));

export const dateUk = (d: Date | null | undefined) =>
  d ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(d) : "—";

/** "Net 30" / "30 days" / "Net 14" → 30, 30, 14. Defaults to 30. */
export function parsePaymentTerms(terms: string): number {
  const m = terms.match(/\d+/);
  return m ? Math.min(parseInt(m[0], 10), 365) : 30;
}

/** Never persist raw phone numbers / bodies in production logs (§9). */
export const maskPhone = (p?: string | null) =>
  !p ? "" : p.length <= 4 ? "****" : `${p.slice(0, 3)}****${p.slice(-2)}`;