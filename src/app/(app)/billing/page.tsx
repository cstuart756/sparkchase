"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader, Button } from "@/components/ui";

export default function BillingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: "starter" | "pro") => {
    setLoading(plan);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url; // Redirect to Stripe Checkout
    } else {
      alert(data.error || "Failed to start checkout. Did you add your Stripe keys to .env?");
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    setLoading("portal");
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error || "Failed to open billing portal");
      setLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
        <p className="text-sm text-slate-600">Manage your subscription and SMS credits.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Starter Plan */}
        <Card>
          <CardHeader className="font-semibold text-lg text-blue-900">
            Starter
            <span className="block text-sm font-normal text-slate-500">For solo traders</span>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="text-3xl font-bold">£19<span className="text-base font-normal text-slate-500">/mo</span></div>
            <ul className="text-sm space-y-2 text-slate-700">
              <li>✓ Up to 10 active jobs</li>
              <li>✓ 100 SMS credits/month</li>
              <li>✓ Unlimited email reminders</li>
            </ul>
            <Button className="w-full" onClick={() => handleUpgrade("starter")} disabled={!!loading}>
              {loading === "starter" ? "Redirecting..." : "Upgrade to Starter"}
            </Button>
          </CardBody>
        </Card>

        {/* Pro Plan */}
        <Card className="border-blue-200 ring-1 ring-blue-500">
          <CardHeader className="font-semibold text-lg text-blue-900 flex justify-between items-center">
            <div>
              Pro
              <span className="block text-sm font-normal text-slate-500">For growing teams</span>
            </div>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Popular</span>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="text-3xl font-bold">£29<span className="text-base font-normal text-slate-500">/mo</span></div>
            <ul className="text-sm space-y-2 text-slate-700">
              <li>✓ Unlimited active jobs</li>
              <li>✓ 300 SMS credits/month</li>
              <li>✓ Unlimited email reminders</li>
              <li>✓ Priority support</li>
            </ul>
            <Button className="w-full" onClick={() => handleUpgrade("pro")} disabled={!!loading}>
              {loading === "pro" ? "Redirecting..." : "Upgrade to Pro"}
            </Button>
          </CardBody>
        </Card>
      </div>

      <div className="mt-8 border-t border-slate-200 pt-8 text-center">
        <p className="text-sm text-slate-600 mb-4">Already subscribed? Manage your billing details, update your card, or cancel.</p>
        <Button variant="outline" onClick={handlePortal} disabled={!!loading}>
          {loading === "portal" ? "Opening..." : "Open Stripe Customer Portal"}
        </Button>
      </div>
    </div>
  );
}