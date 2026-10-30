import twilio from "twilio";
import { maskPhone } from "../format";

const client =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

export interface SmsResult { ok: boolean; providerId?: string; error?: string }

export async function sendSms(to: string, body: string): Promise<SmsResult> {
  if (!client || !process.env.TWILIO_FROM_NUMBER) {
    console.info("[sms:dry-run]", { to: maskPhone(to) });
    return { ok: true, providerId: "dry-run" };
  }
  try {
    const msg = await client.messages.create({ to, from: process.env.TWILIO_FROM_NUMBER, body });
    return { ok: true, providerId: msg.sid };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "SMS send failed" };
  }
}