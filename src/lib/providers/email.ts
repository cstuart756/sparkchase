import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export interface SendResult { ok: boolean; providerId?: string; error?: string }

export async function sendEmail(to: string, subject: string, body: string): Promise<SendResult> {
  if (!resend) {
    // Local/dev without keys: no-op so the flow stays testable.
    console.info("[email:dry-run]", { to: to.replace(/(.{2}).*@/, "$1***@"), subject });
    return { ok: true, providerId: "dry-run" };
  }
  
  // Convert plain text newlines to HTML breaks and escape HTML entities
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.55;white-space:pre-wrap">${escapeHtml(body)}</div>`;
  
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || "invoices@sparkchase.app",
    to,
    subject,
    text: body,
    html,
  });
  
  if (error) return { ok: false, error: error.message };
  return { ok: true, providerId: data?.id };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}