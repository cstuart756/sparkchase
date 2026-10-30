import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accessState, getUserOrNull } from "@/lib/auth";
import { JobCreate } from "@/lib/validation";
import { PLANS, type PlanKey } from "@/lib/stripe";

export async function GET() {
  const user = await getUserOrNull();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jobs = await db.job.findMany({
    where: { userId: user.id },
    include: { milestones: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ jobs });
}

export async function POST(req: Request) {
  const user = await getUserOrNull();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const gate = accessState(user);
  if (!gate.canWrite) return NextResponse.json({ error: gate.reason }, { status: 402 });

  const parsed = JobCreate.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 422 });
  }
  const input = parsed.data;

  // Plan gate: Starter = 10 active jobs.
  const maxJobs = PLANS[(user.plan as PlanKey) ?? "starter"].maxActiveJobs;
  const activeJobs = await db.job.count({
    where: { userId: user.id, milestones: { some: { status: { in: ["pending", "invoiced", "overdue"] } } } },
  });
  
  if (activeJobs >= maxJobs) {
    return NextResponse.json(
      { error: `Your plan allows ${maxJobs} active jobs. Upgrade to Pro for unlimited.` },
      { status: 402 },
    );
  }

  const job = await db.job.create({
    data: {
      userId: user.id,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone || null,
      jobReference: input.jobReference,
      totalValue: input.totalValue,
      paymentTerms: input.paymentTerms,
      milestones: {
        create: input.milestones.map((m) => ({
          name: m.name,
          amount: m.amount,
          triggerType: m.triggerType,
          dueDate: m.triggerType === "date" ? m.dueDate ?? null : null,
          certificateId: m.triggerType === "certificate" ? m.certificateId ?? null : null,
          status: "pending",
          anchorDate: null,
        })),
      },
    },
    include: { milestones: true },
  });

  return NextResponse.json({ job }, { status: 201 });
}