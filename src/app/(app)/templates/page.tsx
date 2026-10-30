"use client";

import { useState, useEffect } from "react";
import { Button, Card, CardBody, CardHeader } from "@/components/ui";

const PLACEHOLDERS = [
  "{{customer_name}}", "{{job_reference}}", "{{milestone_name}}", 
  "{{amount_due}}", "{{due_date}}", "{{certificate_number}}", 
  "{{certificate_issue_date}}", "{{company_name}}"
];

export default function TemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [channel, setChannel] = useState<"email" | "sms">("email");

  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [smsBody, setSmsBody] = useState("");

  useEffect(() => {
    fetch("/api/templates")
      .then((res) => res.json())
      .then((data) => {
        if (data.email) {
          setEmailSubject(data.email.subject);
          setEmailBody(data.email.body);
        }
        if (data.sms) {
          setSmsBody(data.sms.body);
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    const payload = channel === "email" 
      ? { channel, subject: emailSubject, body: emailBody }
      : { channel, body: smsBody };

    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setMessage("Template saved successfully!");
    } else {
      setMessage("Failed to save template.");
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading templates...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Message Templates</h1>
        <p className="text-sm text-slate-600">Customize the emails and texts your customers receive.</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button 
          onClick={() => setChannel("email")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${channel === "email" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Email Template
        </button>
        <button 
          onClick={() => setChannel("sms")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${channel === "sms" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          SMS Template
        </button>
      </div>

      <Card>
        <CardHeader className="font-semibold flex items-center justify-between">
          <span>Edit {channel === "email" ? "Email" : "SMS"}</span>
          <span className="text-xs font-normal text-slate-500">Use placeholders like {"{{customer_name}}"}</span>
        </CardHeader>
        <CardBody className="space-y-4">
          {message && <div className={`rounded p-3 text-sm ${message.includes("Failed") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{message}</div>}

          {channel === "email" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Subject Line</label>
              <input 
                value={emailSubject} 
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Message Body</label>
            <textarea 
              rows={channel === "email" ? 10 : 4}
              value={channel === "email" ? emailBody : smsBody}
              onChange={(e) => channel === "email" ? setEmailBody(e.target.value) : setSmsBody(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none font-mono"
            />
          </div>

          <div className="bg-slate-50 p-3 rounded-md border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 mb-2">Available Placeholders:</p>
            <div className="flex flex-wrap gap-1.5">
              {PLACEHOLDERS.map(p => (
                <span key={p} className="bg-white border border-slate-300 text-slate-700 text-xs px-2 py-1 rounded select-all cursor-pointer hover:bg-slate-100" title="Click to select">
                  {p}
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Template"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}