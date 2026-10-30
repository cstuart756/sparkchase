export const DEFAULT_OFFSETS = [0, 3, 7, 14];

export interface MilestoneForSchedule {
  id: string;
  status: string;               // pending | invoiced | paid | overdue
  triggerType: string;          // date | certificate
  dueDate: Date | null;
  anchorDate: Date | null;
  reminderOffsets: number[];
}

export function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

/** Sequence anchor: when the chasing clock starts. */
export function sequenceAnchor(m: MilestoneForSchedule): Date | null {
  if (m.status !== "invoiced") return null;
  const a = m.anchorDate ?? m.dueDate;
  return a ? startOfUtcDay(a) : null;
}

/**
 * Effective legal due date. Date-triggered → dueDate.
 * Certificate-triggered → issue date (anchorDate); the job's payment terms
 * are applied by the caller when deciding "overdue" display.
 */
export function effectiveDueDate(m: MilestoneForSchedule): Date | null {
  const base = m.triggerType === "certificate" ? m.anchorDate : m.dueDate;
  return base ? startOfUtcDay(base) : null;
}

export function isOverdue(m: MilestoneForSchedule, paymentTermsDays: number, now = new Date()): boolean {
  if (m.status === "paid" || m.status === "pending") return false;
  const due = effectiveDueDate(m);
  if (!due) return false;
  const graceEnd = addDays(due, m.triggerType === "certificate" ? paymentTermsDays : 0);
  return startOfUtcDay(now) > graceEnd;
}

export interface DueStep {
  offset: number;
  scheduledFor: Date;
}

/**
 * Which steps are due for sending today?
 * - Only "invoiced" milestones ever chase (spec §3.4 stop condition).
 * - A step fires when anchor + offset <= today and has not been sent.
 * - Offsets are deduped and sorted; `offset` doubles as the stable sent-key.
 */
export function computeDueSteps(
  m: MilestoneForSchedule,
  sentOffsets: ReadonlySet<number>,
  now = new Date(),
): DueStep[] {
  const anchor = sequenceAnchor(m);
  if (!anchor) return [];
  const today = startOfUtcDay(now);
  const offsets = Array.from(new Set(m.reminderOffsets?.length ? m.reminderOffsets : DEFAULT_OFFSETS))
    .sort((a, b) => a - b);

  return offsets
    .filter((o) => !sentOffsets.has(o))
    .map((o) => ({ offset: o, scheduledFor: addDays(anchor, o) }))
    .filter((s) => s.scheduledFor <= today);
}

/**
 * Cron safety: if the scheduler was down for days, don't blast four SMS at
 * once. Send only the most recent due step; the caller logs the rest as skipped.
 */
export function pickStepToSend(due: DueStep[]): { send: DueStep | null; skip: DueStep[] } {
  if (due.length === 0) return { send: null, skip: [] };
  const sorted = [...due].sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
  return { send: sorted[sorted.length - 1], skip: sorted.slice(0, -1) };
}

/** Compliance copy required verbatim by spec §3.4 for certificate milestones. */
export const CERT_SENTENCE =
  "Certificate {{certificate_number}} was issued on {{certificate_issue_date}}. " +
  "The stage payment for {{milestone_name}} is now due.";

export function ensureCertificationSentence(body: string): string {
  if (body.includes("Certificate {{certificate_number}}")) return body;
  return `${body}\n\n${CERT_SENTENCE}`;
}