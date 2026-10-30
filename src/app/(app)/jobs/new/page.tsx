"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody } from "@/components/ui";

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    jobReference: "",
    totalValue: "",
    paymentTerms: "Net 30",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...formData,
        totalValue: Number(formData.totalValue),
        milestones: [], // Empty for now, we'll add them on the job page
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      setLoading(false);
      return;
    }

    const { job } = await res.json();
    router.push(`/jobs/${job.id}`);
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Create New Job</h1>
      
      <Card>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Customer Name</label>
                <input required value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} className="w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Customer Email</label>
                <input type="email" required value={formData.customerEmail} onChange={(e) => setFormData({...formData, customerEmail: e.target.value})} className="w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Customer Phone</label>
                <input type="tel" value={formData.customerPhone} onChange={(e) => setFormData({...formData, customerPhone: e.target.value})} className="w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Job Reference</label>
                <input required value={formData.jobReference} onChange={(e) => setFormData({...formData, jobReference: e.target.value})} placeholder="e.g. NG-2025-014" className="w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Total Value (£)</label>
                <input type="number" step="0.01" required value={formData.totalValue} onChange={(e) => setFormData({...formData, totalValue: e.target.value})} className="w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Payment Terms</label>
                <input required value={formData.paymentTerms} onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})} placeholder="Net 30" className="w-full rounded-md border px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Job"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}