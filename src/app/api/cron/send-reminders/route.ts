import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { dispatchReminder } from "@/lib/dispatch";
import { computeDueSteps, isOverdue, pickStepToSend, type MilestoneForSchedule } from "@/lib/reminders";
import { parsePaymentTerms } from "@/lib/format";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const summary = { scanned: 0, sent: 0, skipped: 0, failed: 0, markedOverdue: 0 };

  const milestones = await db.milestone.findMany({
    where: { status: { in: ["invoiced", "overdue"] } },
    include: {
      reminders: { where: { sequenceOffset: { not: null } }, select: { sequenceOffset: true } },
      job: { include: { user: true } },
    },
  });

  for (const m of milestones) {
    summary.scanned++;

    // Subscription gate: don't send on behalf of lapsed accounts.
    const u = m.job.user;
    const trialValid = u.subscriptionStatus === "trialing" && u.trialEndsAt && u.trialEndsAt > now;
    if (u.subscriptionStatus === "canceled" || (!trialValid && u.subscriptionStatus !== "active")) {
      continue;
    }

    const shape: MilestoneForSchedule = {
      id: m.id, status: m.status, triggerType: m.triggerType,
      dueDate: m.dueDate, anchorDate: m.anchorDate, reminderOffsets: m.reminderOffsets,
    };

    // Lazy overdue transition.
    if (m.status === "invoiced" && isOverdue(shape, parsePaymentTerms(m.job.paymentTerms), now)) {
      await db.milestone.update({ where: { id: m.id }, data: { status: "overdue" } });
      summary.markedOverdue++;
    }

    const sentOffsets = new Set(
      m.reminders.map((r) => r.sequenceOffset).filter((o): o is number => o !== null),
    );
    const due = computeDueSteps(shape, sentOffsets, now);
    const { send, skip } = pickStepToSend(due);

    // Log missed intermediate steps so the audit trail is honest.
    for (const s of skip) {
      await db.reminder.create({
        data: {
          milestoneId: m.id, channel: "email", status: "skipped",
          messageBody: "(skipped — superseded by a later reminder)", sequenceOffset: s.offset,
        },
      });
      summary.skipped++;
    }

    if (!send) continue;

    try {
      const outcome = await dispatchReminder(m.id, send.offset);
      if (outcome.email === "failed" && outcome.sms === "failed") summary.failed++;
      else summary.sent++;
    } catch (e) {
      console.error("[cron] dispatch failed", m.id, e);
      summary.failed++;
    }
  }

  return NextResponse.json({ ok: true, ranAt: now.toISOString(), ...summary });
}