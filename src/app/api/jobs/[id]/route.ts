import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserOrNull } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await getUserOrNull();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const job = await db.job.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      milestones: {
        include: { certificate: true, reminders: { orderBy: { sentAt: "desc" } } },
        orderBy: { createdAt: "asc" },
      },
      certificates: true,
    },
  });
  if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ job });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await getUserOrNull();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { count } = await db.job.deleteMany({ where: { id: params.id, userId: user.id } });
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}