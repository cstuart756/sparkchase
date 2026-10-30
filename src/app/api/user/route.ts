import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserOrNull } from "@/lib/auth";
import { z } from "zod";

const UpdateUserSchema = z.object({
  companyName: z.string().min(1).max(100),
});

export async function PATCH(req: Request) {
  const user = await getUserOrNull();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = UpdateUserSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 422 });
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: { companyName: parsed.data.companyName },
  });

  return NextResponse.json({ user: updated });
}