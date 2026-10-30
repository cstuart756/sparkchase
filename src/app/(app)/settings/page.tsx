"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader } from "@/components/ui";

export default function SettingsPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ companyName }),
    });

    if (!res.ok) {
      setMessage("Failed to update settings.");
    } else {
      setMessage("Settings saved successfully!");
      router.refresh(); // Refresh to update the layout/sidebar if needed
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>

      <Card>
        <CardHeader className="font-semibold">Company Profile</CardHeader>
        <CardBody>
          <form onSubmit={handleSave} className="space-y-4">
            {message && (
              <div className={`rounded p-3 text-sm ${message.includes("Failed") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                {message}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Company Name (shown in reminder emails)
              </label>
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Sparky Co"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading || !companyName.trim()}>
                {loading ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}