import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accessState, getUserOrNull } from "@/lib/auth";
import { CertificateIssue } from "@/lib/validation";
import { startCertificateSequences, dispatchReminder } from "@/lib/dispatch";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserOrNull();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const gate = accessState(user);
  if (!gate.canWrite) return NextResponse.json({ error: gate.reason }, { status: 402 });

  const cert = await db.certificate.findFirst({
    where: { id: params.id, job: { userId: user.id } },
  });
  if (!cert) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (cert.isIssued) return NextResponse.json({ error: "Certificate already issued." }, { status: 409 });

  const parsed = CertificateIssue.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  await db.certificate.update({
    where: { id: cert.id },
    data: { isIssued: true, issueDate: parsed.data.issueDate },
  });

  // Flow A step 6: linked pending milestones → invoiced, sequence starts.
  const started = await startCertificateSequences(cert.id);

  // Send the day-0 reminder immediately rather than waiting for cron.
  const linked = await db.milestone.findMany({
    where: { certificateId: cert.id, status: "invoiced" },
  });
  const outcomes: Record<string, unknown> = {};
  for (const m of linked) {
    try {
      outcomes[m.id] = await dispatchReminder(m.id, 0);
    } catch (e) {
      console.error("[cert-issue] dispatch failed", m.id, e);
    }
  }

  return NextResponse.json({ ok: true, milestonesStarted: started, outcomes });
}