import { db } from "./db";
import { renderTemplate } from "./placeholders";
import { CERT_SENTENCE, ensureCertificationSentence } from "./reminders";
import { dateUk, money } from "./format";
import { sendEmail } from "./providers/email";
import { sendSms } from "./providers/sms";
import {
  DEFAULT_CERT_EMAIL_BODY, DEFAULT_CERT_SMS_BODY,
  DEFAULT_EMAIL_BODY, DEFAULT_EMAIL_SUBJECT, DEFAULT_SMS_BODY,
} from "./defaultTemplates";
import type { Milestone, Job, Certificate, User } from "@prisma/client";

type FullMilestone = Milestone & { job: Job & { user: User }; certificate: Certificate | null };

export interface DispatchOutcome {
  email: "sent" | "failed" | "skipped";
  sms: "sent" | "failed" | "skipped" | "skipped_no_credits";
}

export function buildContext(m: FullMilestone): Record<string, string> {
  const isCert = m.triggerType === "certificate";
  return {
    customer_name: m.job.customerName,
    job_reference: m.job.jobReference,
    milestone_name: m.name,
    amount_due: money(m.amount),
    due_date: dateUk(m.dueDate ?? m.anchorDate),
    certificate_number: isCert ? (m.certificate?.certificateNumber ?? "") : "",
    certificate_issue_date: isCert ? dateUk(m.certificate?.issueDate ?? m.anchorDate) : "",
    company_name: m.job.user.companyName ?? "SparkChase",
  };
}

/**
 * Send one reminder (email and/or SMS) for a milestone and log it.
 * `sequenceOffset = null` ⇒ manual one-off (spec §3.6).
 */
export async function dispatchReminder(
  milestoneId: string,
  sequenceOffset: number | null,
): Promise<DispatchOutcome> {
  const m = await db.milestone.findUnique({
    where: { id: milestoneId },
    include: { job: { include: { user: true } }, certificate: true },
  });
  if (!m) throw new Error("Milestone not found");

  const isCert = m.triggerType === "certificate";
  const ctx = buildContext(m as FullMilestone);

  // ---- Email ----
  let email: DispatchOutcome["email"] = "skipped";
  if (m.emailEnabled && m.job.customerEmail) {
    const tpl = await db.template.findFirst({ where: { userId: m.job.userId, channel: "email", isDefault: true } });
    const subject = renderTemplate(tpl?.subject ?? DEFAULT_EMAIL_SUBJECT, ctx);
    let body = renderTemplate(tpl?.body ?? (isCert ? DEFAULT_CERT_EMAIL_BODY : DEFAULT_EMAIL_BODY), ctx);
    
    if (isCert) body = ensureCertificationSentence(body);

    const res = await sendEmail(m.job.customerEmail, subject, body);
    email = res.ok ? "sent" : "failed";
    
    await db.reminder.create({
      data: {
        milestoneId: m.id, channel: "email", toAddress: m.job.customerEmail,
        status: res.ok ? "sent" : "failed", messageBody: body, sequenceOffset,
      },
    });
  }

  // ---- SMS (spec §6 Flow B: credits exhausted ⇒ email only + flag) ----
  let sms: DispatchOutcome["sms"] = "skipped";
  if (m.smsEnabled && m.job.customerPhone) {
    const user = m.job.user;
    if (user.smsCredits <= 0) {
      sms = "skipped_no_credits";
      await db.reminder.create({
        data: {
          milestoneId: m.id, channel: "sms", toAddress: m.job.customerPhone,
          status: "skipped_no_credits", messageBody: "(skipped — no SMS credits)", sequenceOffset,
        },
      });
      await db.user.update({ where: { id: user.id }, data: { smsOverageCount: { increment: 1 } } });
    } else {
      const tpl = await db.template.findFirst({ where: { userId: m.job.userId, channel: "sms", isDefault: true } });
      let body = renderTemplate(tpl?.body ?? (isCert ? DEFAULT_CERT_SMS_BODY : DEFAULT_SMS_BODY), ctx);
      
      if (isCert && !body.includes("Certificate")) body = `${CERT_SENTENCE} ${body}`;

      const res = await sendSms(m.job.customerPhone, body);
      sms = res.ok ? "sent" : "failed";
      
      await db.reminder.create({
        data: {
          milestoneId: m.id, channel: "sms", toAddress: m.job.customerPhone,
          status: res.ok ? "sent" : "failed", messageBody: body, sequenceOffset,
        },
      });
      
      if (res.ok) {
        await db.user.update({ where: { id: user.id }, data: { smsCredits: { decrement: 1 } } });
      }
    }
  }

  return { email, sms };
}

/** Flow A step 6: certificate issued → start the sequence. */
export async function startCertificateSequences(certificateId: string): Promise<number> {
  const cert = await db.certificate.findUnique({
    where: { id: certificateId },
    include: { milestones: true },
  });
  if (!cert || !cert.isIssued || !cert.issueDate) return 0;

  const linked = cert.milestones.filter((m) => m.status === "pending");
  await db.$transaction(
    linked.map((m) =>
      db.milestone.update({
        where: { id: m.id },
        data: { status: "invoiced", invoicedAt: new Date(), anchorDate: cert.issueDate! },
      }),
    ),
  );
  return linked.length;
}