import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accessState, getUserOrNull } from "@/lib/auth";
import { CertificateCreate } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getUserOrNull();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const gate = accessState(user);
  if (!gate.canWrite) return NextResponse.json({ error: gate.reason }, { status: 402 });

  const job = await db.job.findFirst({ where: { id: params.id, userId: user.id } });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = CertificateCreate.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", issues: parsed.error.flatten() }, { status: 422 });
  }

  const certificate = await db.certificate.create({
    data: { jobId: job.id, ...parsed.data },
  });
  return NextResponse.json({ certificate }, { status: 201 });
}