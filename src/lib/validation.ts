import { z } from "zod";

const money = z.coerce.number().positive().max(10_000_000).transform((n) =>
  Math.round(n * 100) / 100,
);

export const JobCreate = z.object({
  customerName: z.string().min(1).max(120),
  customerEmail: z.string().email(),
  customerPhone: z.string().max(32).optional().or(z.literal("")),
  jobReference: z.string().min(1).max(60),
  totalValue: money,
  paymentTerms: z.string().min(1).max(40).default("Net 30"),
  milestones: z
    .array(
      z.object({
        name: z.string().min(1).max(120),
        amount: money,
        triggerType: z.enum(["date", "certificate"]),
        dueDate: z.coerce.date().optional(),
        certificateId: z.string().cuid().optional(),
      }),
    )
    .default([]),
});

export const MilestoneCreate = z.object({
  name: z.string().min(1).max(120),
  amount: money,
  triggerType: z.enum(["date", "certificate"]),
  dueDate: z.coerce.date().optional(),
  certificateId: z.string().optional(),
  reminderOffsets: z.array(z.number().int().min(0).max(365)).min(1).max(10).default([0, 3, 7, 14]),
  smsEnabled: z.boolean().default(false),
  emailEnabled: z.boolean().default(true),
});

export const CertificateCreate = z.object({
  type: z.enum(["EICR", "EIC", "Minor Works", "Other"]),
  certificateNumber: z.string().min(1).max(60),
});

export const CertificateIssue = z.object({
  issueDate: z.coerce.date(),
});

export const MilestonePatch = z
  .object({
    name: z.string().min(1).max(120).optional(),
    amount: money.optional(),
    dueDate: z.coerce.date().nullable().optional(),
    reminderOffsets: z.array(z.number().int().min(0).max(365)).min(1).max(10).optional(),
    smsEnabled: z.boolean().optional(),
    emailEnabled: z.boolean().optional(),
    status: z.enum(["pending", "invoiced", "paid", "overdue"]).optional(),
  })
  .strict();

export const TemplateUpsert = z.object({
  name: z.string().min(1).max(80),
  channel: z.enum(["sms", "email"]),
  subject: z.string().max(160).optional(),
  body: z.string().min(1).max(4000),
});