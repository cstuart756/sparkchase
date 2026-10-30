"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui";
import type { Certificate } from "@prisma/client";
import { dateUk } from "@/lib/format";

export function MilestoneActions({ id, status, triggerType }: {
  id: string; status: string; triggerType: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const call = async (url: string, body?: unknown, method = "POST") => {
    setBusy(url);
    try {
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Something went wrong");
      }
    } finally {
      setBusy(null);
      start(() => router.refresh());
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {status === "pending" && triggerType === "date" && (
        <Button size="sm" variant="outline" disabled={pending || !!busy}
          onClick={() => call(`/api/milestones/${id}`, { status: "invoiced" }, "PATCH")}>
          Start chasing
        </Button>
      )}
      {status !== "paid" && (
        <>
          <Button size="sm" variant="outline" disabled={pending || !!busy}
            onClick={() => call(`/api/milestones/${id}/remind`)}>
            Send reminder now
          </Button>
          <Button size="sm" disabled={pending || !!busy}
            onClick={() => call(`/api/milestones/${id}`, { status: "paid" }, "PATCH")}>
            Mark as paid
          </Button>
        </>
      )}
    </div>
  );
}

export function CertificatePanel({ jobId, certificates }: { jobId: string; certificates: Certificate[] }) {
  const router = useRouter();
  const [type, setType] = useState("EICR");
  const [number, setNumber] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));

  const create = async () => {
    const res = await fetch(`/api/jobs/${jobId}/certificates`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type, certificateNumber: number }),
    });
    if (!res.ok) {
      const data = await res.json();
      return alert(data.error);
    }
    setNumber("");
    router.refresh();
  };

  const issue = async (id: string) => {
    const res = await fetch(`/api/certificates/${id}/issue`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ issueDate }),
    });
    if (!res.ok) {
      const data = await res.json();
      return alert(data.error);
    }
    router.refresh();
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-900">Certificates</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {certificates.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 px-3 py-2">
            <span>
              <strong className="text-slate-800">{c.type}</strong> · {c.certificateNumber} ·{" "}
              {c.isIssued ? (
                <span className="text-green-700 font-medium">Issued {dateUk(c.issueDate)}</span>
              ) : (
                <span className="text-amber-600 font-medium">Not issued</span>
              )}
            </span>
            {!c.isIssued && (
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  value={issueDate} 
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                />
                <Button size="sm" onClick={() => issue(c.id)}>Mark issued</Button>
              </div>
            )}
          </li>
        ))}
        {certificates.length === 0 && <li className="text-slate-500">No certificates yet.</li>}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <input className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none" placeholder="Certificate number"
          value={number} onChange={(e) => setNumber(e.target.value)} />
        <select className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none" value={type} onChange={(e) => setType(e.target.value)}>
          {["EICR", "EIC", "Minor Works", "Other"].map((t) => <option key={t}>{t}</option>)}
        </select>
        <Button size="sm" variant="outline" onClick={create} disabled={!number.trim()}>Add certificate</Button>
      </div>
    </div>
  );
}