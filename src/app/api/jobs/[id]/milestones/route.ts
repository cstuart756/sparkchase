import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accessState, getUserOrNull } from "@/lib/auth";
import { MilestoneCreate } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserOrNull();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const gate = accessState(user);
  if (!gate.canWrite) return NextResponse.json({ error: gate.reason }, { status: 402 });

  const job = await db.job.findFirst({ where: { id: params.id, userId: user.id } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = MilestoneCreate.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 422 });
  }
  const d = parsed.data;
  if (d.triggerType === "date" && !d.dueDate) {
    return NextResponse.json({ error: "dueDate is required for date-triggered milestones" }, { status: 422 });
  }
  if (d.triggerType === "certificate" && !d.certificateId) {
    return NextResponse.json({ error: "certificateId is required for certificate-triggered milestones" }, { status: 422 });
  }

  const milestone = await db.milestone.create({
    data: {
      jobId: job.id,
      name: d.name,
      amount: d.amount,
      triggerType: d.triggerType,
      dueDate: d.triggerType === "date" ? d.dueDate : null,
      certificateId: d.triggerType === "certificate" ? d.certificateId : null,
      reminderOffsets: d.reminderOffsets,
      smsEnabled: d.smsEnabled,
      emailEnabled: d.emailEnabled,
    },
  });
  return NextResponse.json({ milestone }, { status: 201 });
}