import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { money, dateUk, parsePaymentTerms } from "@/lib/format";
import { isOverdue } from "@/lib/reminders";
import { Card, CardBody, CardHeader, StatusBadge } from "@/components/ui";
import { MilestoneActions, CertificatePanel } from "./actions";
import { AddMilestoneForm } from "./add-milestone";

export const dynamic = "force-dynamic";

export default async function JobPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const job = await db.job.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      milestones: { include: { certificate: true, reminders: { orderBy: { sentAt: "desc" } } } },
      certificates: true,
    },
  });
  if (!job) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{job.customerName}</h1>
        <p className="text-sm text-slate-600">
          Ref: <span className="font-medium text-slate-800">{job.jobReference}</span> · {job.paymentTerms} · {money(job.totalValue)} · {job.customerEmail}
        </p>
      </div>

      <CertificatePanel jobId={job.id} certificates={job.certificates} />

      <Card>
        <CardHeader className="font-semibold flex items-center justify-between">
          <span>Milestones</span>
          <AddMilestoneForm jobId={job.id} certificates={job.certificates} />
        </CardHeader>
        <CardBody className="divide-y divide-slate-100 p-0">
          {job.milestones.length === 0 && (
            <div className="px-5 py-6 text-sm text-slate-500">No milestones added yet.</div>
          )}
          
          {job.milestones.map((m) => (
            <div key={m.id} className="px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 font-medium">
                    {m.name} <StatusBadge status={m.status} />
                    {isOverdue(m, parsePaymentTerms(job.paymentTerms)) && m.status !== "overdue" && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold text-red-700">Past terms</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {money(m.amount)} · {m.triggerType === "certificate" ? "Chases on Certificate issue" : `Due ${dateUk(m.dueDate)}`}
                    {m.certificate && ` · Linked to ${m.certificate.type} ${m.certificate.certificateNumber}`}
                  </div>
                </div>
                <MilestoneActions id={m.id} status={m.status} triggerType={m.triggerType} />
              </div>

              {m.reminders.length > 0 && (
                <details className="mt-3 text-xs text-slate-600">
                  <summary className="cursor-pointer font-medium hover:text-blue-700">Reminder log ({m.reminders.length})</summary>
                  <ul className="mt-2 space-y-1.5 border-l-2 border-slate-200 pl-3">
                    {m.reminders.map((r) => (
                      <li key={r.id} className="flex gap-2">
                        <span className="text-slate-400">{dateUk(r.sentAt)}</span>
                        <span className="uppercase text-[10px] font-bold tracking-wider text-slate-500 bg-slate-100 px-1 py-0.5 rounded">{r.channel}</span>
                        <span className={r.status === 'sent' ? 'text-green-600' : r.status === 'failed' ? 'text-red-600' : 'text-slate-500'}>
                          {r.status}
                        </span>
                        {r.sequenceOffset !== null ? <span className="text-slate-400">(Auto +{r.sequenceOffset}d)</span> : <span className="text-blue-600">(Manual)</span>}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}