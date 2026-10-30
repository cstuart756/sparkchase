import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserOrNull } from "@/lib/auth";
import { z } from "zod";
import { DEFAULT_EMAIL_BODY, DEFAULT_EMAIL_SUBJECT, DEFAULT_SMS_BODY } from "@/lib/defaultTemplates";

const TemplateSchema = z.object({
  channel: z.enum(["email", "sms"]),
  subject: z.string().optional(),
  body: z.string().min(1),
});

export async function GET() {
  const user = await getUserOrNull();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await db.template.findMany({ where: { userId: user.id } });

  const emailTpl = templates.find((t) => t.channel === "email");
  const smsTpl = templates.find((t) => t.channel === "sms");

  return NextResponse.json({
    email: {
      subject: emailTpl?.subject || DEFAULT_EMAIL_SUBJECT,
      body: emailTpl?.body || DEFAULT_EMAIL_BODY,
    },
    sms: {
      body: smsTpl?.body || DEFAULT_SMS_BODY,
    },
  });
}

export async function POST(req: Request) {
  const user = await getUserOrNull();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = TemplateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 422 });

  const { channel, subject, body } = parsed.data;

  // Upsert using a predictable ID so each user has exactly one email and one SMS template
  await db.template.upsert({
    where: { id: `${user.id}-${channel}` },
    update: { subject, body },
    create: {
      id: `${user.id}-${channel}`,
      userId: user.id,
      name: `Default ${channel} template`,
      channel,
      subject,
      body,
      isDefault: true,
    },
  });

  return NextResponse.json({ ok: true });
}