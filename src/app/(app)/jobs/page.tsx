import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { money } from "@/lib/format";
import { Card, CardBody, CardHeader, StatusBadge } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const user = await requireUser();
  const jobs = await db.job.findMany({
    where: { userId: user.id },
    include: { milestones: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Jobs</h1>
        <Link href="/jobs/new" className="rounded-md bg-blue-800 px-4 py-2 text-sm text-white hover:bg-blue-900">
          New Job
        </Link>
      </div>

      <Card>
        <CardHeader className="font-semibold">All Jobs</CardHeader>
        <CardBody className="divide-y divide-slate-100 p-0">
          {jobs.length === 0 && (
            <div className="px-5 py-6 text-sm text-slate-500">No jobs found.</div>
          )}
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
                  {j.milestones.length === 0 && <span className="text-xs text-slate-400">No milestones</span>}
                </div>
              </div>
            </Link>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}