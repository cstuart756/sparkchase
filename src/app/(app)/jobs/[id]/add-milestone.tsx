"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import type { Certificate } from "@prisma/client";

export function AddMilestoneForm({ jobId, certificates }: { jobId: string; certificates: Certificate[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [triggerType, setTriggerType] = useState<"date" | "certificate">("date");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [certificateId, setCertificateId] = useState(certificates[0]?.id || "");
  const [smsEnabled, setSmsEnabled] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload = {
      name,
      amount: Number(amount),
      triggerType,
      dueDate: triggerType === "date" ? new Date(dueDate).toISOString() : undefined,
      certificateId: triggerType === "certificate" ? certificateId : undefined,
      smsEnabled,
      emailEnabled: true,
    };

    const res = await fetch(`/api/jobs/${jobId}/milestones`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to add milestone");
      setLoading(false);
      return;
    }

    // Reset and close
    setName("");
    setAmount("");
    setIsOpen(false);
    setLoading(false);
    router.refresh();
  };

  if (!isOpen) {
    return (
      <Button size="sm" variant="outline" onClick={() => setIsOpen(true)}>
        + Add Milestone
      </Button>
    );
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 mb-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-blue-900">Add New Milestone</h3>
        <button onClick={() => setIsOpen(false)} className="text-sm text-blue-700 hover:underline">Cancel</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded bg-red-100 p-2 text-sm text-red-700">{error}</div>}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Milestone Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Testing & Certification" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Amount (£)</label>
            <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Trigger Type</label>
            <select value={triggerType} onChange={(e) => setTriggerType(e.target.value as "date" | "certificate")} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none">
              <option value="date">Date-based (Fixed Due Date)</option>
              <option value="certificate">Certificate-triggered (Starts when cert is issued)</option>
            </select>
          </div>

          {triggerType === "date" ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Due Date</label>
              <input type="date" required value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none" />
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Link to Certificate</label>
              <select required value={certificateId} onChange={(e) => setCertificateId(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none">
                <option value="" disabled>Select a certificate...</option>
                {certificates.map((c) => (
                  <option key={c.id} value={c.id}>{c.type} - {c.certificateNumber}</option>
                ))}
              </select>
              {certificates.length === 0 && <p className="mt-1 text-xs text-red-600">You must add a certificate first.</p>}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="sms" checked={smsEnabled} onChange={(e) => setSmsEnabled(e.target.checked)} className="rounded border-slate-300" />
          <label htmlFor="sms" className="text-sm text-slate-700">Also send SMS reminders (costs 1 credit per text)</label>
        </div>

        <Button type="submit" disabled={loading || (triggerType === "certificate" && !certificateId)}>
          {loading ? "Saving..." : "Save Milestone"}
        </Button>
      </form>
    </div>
  );
}