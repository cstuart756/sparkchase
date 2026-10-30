import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  const userId = "demo-user-0001";
  await db.user.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId, email: "demo@sparkchase.app", companyName: "Sparky Co",
      subscriptionStatus: "trialing", trialEndsAt: new Date(Date.now() + 14 * 864e5), smsCredits: 100,
    },
  });

  await db.reminder.deleteMany({ where: { milestone: { job: { userId } } } });
  await db.milestone.deleteMany({ where: { job: { userId } } });
  await db.certificate.deleteMany({ where: { job: { userId } } });
  await db.job.deleteMany({ where: { userId } });

  const job = await db.job.create({
    data: {
      userId, customerName: "Northgate Developments Ltd", customerEmail: "accounts@northgate.example",
      customerPhone: "+447700900123", jobReference: "NG-2025-014", totalValue: 18500, paymentTerms: "Net 30",
      certificates: { create: [{ type: "EICR", certificateNumber: "EICR-2025-001" }] },
    },
    include: { certificates: true },
  });

  const cert = job.certificates[0];
  await db.milestone.createMany({
    data: [
      { jobId: job.id, name: "First Fix", amount: 5000, triggerType: "date",
        dueDate: new Date(Date.now() - 20 * 864e5), status: "overdue", anchorDate: new Date(Date.now() - 20 * 864e5) },
      { jobId: job.id, name: "Testing & Certification", amount: 2500, triggerType: "certificate",
        certificateId: cert.id, status: "pending" },
      { jobId: job.id, name: "Retention Release", amount: 1000, triggerType: "date",
        dueDate: new Date(Date.now() + 60 * 864e5), status: "pending" },
    ],
  });

  console.log("Seeded demo user", userId, "job", job.jobReference);
}

main().finally(() => db.$disconnect());