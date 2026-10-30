import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { money, parsePaymentTerms, dateUk } from "@/lib/format";
import { isOverdue } from "@/lib/reminders";
import { Card, CardBody, CardHeader, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  
  // 1. Fetch all jobs and their milestones for this user
  const jobs = await db.job.findMany({
    where: { userId: user.id },
    include: { milestones: true },
    orderBy: { createdAt: "desc" },
  });

  // 2. Calculate dashboard stats
  const all = jobs.flatMap((j) =>
    j.milestones.map((m) => ({ 
      ...m, 
      job: j, 
      overdueNow: isOverdue(m, parsePaymentTerms(j.paymentTerms)) 
    })),
  );
  
  const unpaid = all.filter((m) => m.status !== "paid");
  const outstanding = unpaid.reduce((sum, m) => sum + Number(m.amount), 0);
  const overdue = all.filter((m) => m.overdueNow || m.status === "overdue");

  // 3. Empty State
  if (jobs.length === 0) {
    return (
      <Card>
        <CardBody className="py-16 text-center">
          <h1 className="text-lg font-semibold">Create your first job to start chasing payments</h1>
          <p className="mt-1 text-sm text-slate-600">
            Add a job, attach a certificate, and SparkChase will chase the stage payment for you.
          </p>
          <Link href="/jobs/new" className="mt-4 inline-block rounded-md bg-blue-800 px-4 py-2 text-sm text-white hover:bg-blue-900">
            New Job
          </Link>
        </CardBody>
      </Card>
    );
  }

  // 4. Main Dashboard
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <Link href="/jobs/new" className="rounded-md bg-blue-800 px-4 py-2 text-sm text-white hover:bg-blue-900">
          New Job
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardBody>
          <div className="text-xs uppercase tracking-wide text-slate-500">Outstanding</div>
          <div className="mt-1 text-2xl font-bold">{money(outstanding)}</div>
        </CardBody></Card>
        <Card><CardBody>
          <div className="text-xs uppercase tracking-wide text-slate-500">Overdue milestones</div>
          <div className="mt-1 text-2xl font-bold text-amber-700">{overdue.length}</div>
        </CardBody></Card>
        <Card><CardBody>
          <div className="text-xs uppercase tracking-wide text-slate-500">Active jobs</div>
          <div className="mt-1 text-2xl font-bold">{jobs.length}</div>
        </CardBody></Card>
      </div>

      {/* Top 5 Overdue */}
      <Card>
        <CardHeader className="font-semibold">Top 5 most overdue</CardHeader>
        <CardBody className="divide-y divide-slate-100 p-0">
          {overdue.length === 0 && (
            <div className="px-5 py-6 text-sm text-slate-500">Nothing overdue. Nice.</div>
          )}
          {overdue.slice(0, 5).map((m) => (
            <Link key={m.id} href={`/jobs/${m.jobId}`} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50">
              <div>
                <div className="text-sm font-medium">{m.name}</div>
                <div className="text-xs text-slate-500">{m.job.customerName} · {m.job.jobReference}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-amber-700">{money(m.amount)}</div>
                <div className="text-xs text-slate-500">{dateUk(m.anchorDate ?? m.dueDate)}</div>
              </div>
            </Link>
          ))}
        </CardBody>
      </Card>

      {/* All Active Jobs */}
      <Card>
        <CardHeader className="font-semibold">Active jobs</CardHeader>
        <CardBody className="divide-y divide-slate-100 p-0">
          {jobs.map((j) => (
            <Link key={j.id} href={`/jobs/${j.id}`} className="block px-5 py-4 hover:bg-slate-50">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{j.customerName}</div>
                  <div className="text-xs text-slate-500">{j.jobReference} · {j.paymentTerms} · {money(j.totalValue)}</div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {j.milestones.map((m) => (
                    <StatusBadge key={m.id} status={m.status} />
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}