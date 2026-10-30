import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { accessState, getUserOrNull } from "@/lib/auth";
import { dispatchReminder } from "@/lib/dispatch";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const user = await getUserOrNull();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const gate = accessState(user);
  if (!gate.canWrite) return NextResponse.json({ error: gate.reason }, { status: 402 });

  // Rate limit to prevent spam clicking
  if (!rateLimit(`remind:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many reminders — try again shortly." }, { status: 429 });
  }

  const milestone = await db.milestone.findFirst({
    where: { id: params.id, job: { userId: user.id } },
  });
  if (!milestone) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (milestone.status === "paid") {
    return NextResponse.json({ error: "Milestone is already paid." }, { status: 409 });
  }

  const outcome = await dispatchReminder(milestone.id, null);
  return NextResponse.json({ ok: true, outcome });
}