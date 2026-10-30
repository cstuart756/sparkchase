import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accessState, getUserOrNull } from "@/lib/auth";
import { MilestonePatch } from "@/lib/validation";

async function loadOwned(milestoneId: string, userId: string) {
  return db.milestone.findFirst({
    where: { id: milestoneId, job: { userId } },
    include: { job: true },
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserOrNull();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const gate = accessState(user);
  if (!gate.canWrite) return NextResponse.json({ error: gate.reason }, { status: 402 });

  const existing = await loadOwned(params.id, user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = MilestonePatch.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 422 });
  }

  const patch = parsed.data;

  // Flow C: marking paid cancels all future reminders (the scheduler only
  // ever selects status === "invoiced").
  if (patch.status === "paid") {
    const m = await db.milestone.update({
      where: { id: existing.id },
      data: { status: "paid" },
    });
    return NextResponse.json({ milestone: m, remindersCanceled: true });
  }

  // Starting a date-triggered sequence: move pending → invoiced and anchor on due date.
  if (patch.status === "invoiced" && existing.status === "pending" && existing.triggerType === "date") {
    const m = await db.milestone.update({
      where: { id: existing.id },
      data: {
        status: "invoiced",
        invoicedAt: new Date(),
        anchorDate: existing.dueDate ?? new Date(),
      },
    });
    return NextResponse.json({ milestone: m });
  }

  const m = await db.milestone.update({ where: { id: existing.id }, data: patch });
  return NextResponse.json({ milestone: m });
}