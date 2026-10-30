import { redirect } from "next/navigation";
import { db } from "./db";
import { supabaseServer } from "./supabase/server";
import type { User } from "@prisma/client";

/** Upsert a profile row for a freshly-created auth user. */
async function ensureProfile(id: string, email: string): Promise<User> {
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  return db.user.upsert({
    where: { id },
    update: {},
    create: { id, email, trialEndsAt, subscriptionStatus: "trialing", smsCredits: 100 },
  });
}

/** Server components / actions: redirect unauthenticated users. */
export async function requireUser(): Promise<User> {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user?.email) redirect("/login");
  return ensureProfile(user.id, user.email);
}

/** Route handlers: return null instead of redirecting. */
export async function getUserOrNull(): Promise<User | null> {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user?.email) return null;
  return ensureProfile(user.id, user.email);
}

/**
 * Write-gate. Spec §3.7/§6 Flow D: expired trial, past_due and canceled
 * lose write access until resolved.
 */
export function accessState(u: User): { canWrite: boolean; reason?: string } {
  if (u.subscriptionStatus === "active") return { canWrite: true };
  if (u.subscriptionStatus === "trialing") {
    if (u.trialEndsAt && u.trialEndsAt > new Date()) return { canWrite: true };
    return { canWrite: false, reason: "Your free trial has ended. Upgrade to continue." };
  }
  if (u.subscriptionStatus === "past_due")
    return { canWrite: false, reason: "Payment failed — update your billing details." };
  return { canWrite: false, reason: "Your subscription is canceled." };
}