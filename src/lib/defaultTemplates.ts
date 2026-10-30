import { CERT_SENTENCE } from "./reminders";

export const DEFAULT_EMAIL_SUBJECT = "Payment reminder — {{job_reference}} ({{milestone_name}})";

export const DEFAULT_EMAIL_BODY = `Hi {{customer_name}},

A quick reminder that {{amount_due}} for "{{milestone_name}}" on job {{job_reference}} is now due (due date: {{due_date}}).

Please arrange payment at your earliest convenience. If it's already on its way, thank you — please ignore this note.

Kind regards,
{{company_name}}`;

export const DEFAULT_CERT_EMAIL_BODY = `Hi {{customer_name}},

${CERT_SENTENCE}

Amount due: {{amount_due}}.
Job reference: {{job_reference}}.

Please arrange payment at your earliest convenience.

Kind regards,
{{company_name}}`;

export const DEFAULT_SMS_BODY =
  "{{company_name}}: {{amount_due}} due for {{milestone_name}} ({{job_reference}}). Please arrange payment. Thanks.";

export const DEFAULT_CERT_SMS_BODY =
  "{{company_name}}: Certificate {{certificate_number}} issued {{certificate_issue_date}}. {{amount_due}} now due for {{milestone_name}} ({{job_reference}}).";