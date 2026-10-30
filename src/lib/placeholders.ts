export interface ReminderContext {
  customer_name: string;
  job_reference: string;
  milestone_name: string;
  amount_due: string;
  due_date: string;
  certificate_number: string;
  certificate_issue_date: string;
  company_name: string;
}

const RE = /{{\s*([a-z_]+)\s*}}/gi;

export function renderTemplate(body: string, ctx: Partial<ReminderContext>): string {
  return body.replace(RE, (_m, key: string) => {
    const v = (ctx as Record<string, string | undefined>)[key.toLowerCase()];
    return v ?? "";
  });
}

export function missingPlaceholders(body: string, ctx: Partial<ReminderContext>): string[] {
  const found = new Set<string>();
  for (const m of body.matchAll(RE)) {
    const k = m[1].toLowerCase();
    if (!(ctx as Record<string, string | undefined>)[k]) found.add(k);
  }
  return [...found];
}