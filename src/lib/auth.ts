import { redirect } from "next/navigation";
import { db } from "./db";
import { supabaseServer } from "./supabase/server";
import type { User } from "@prisma/client";
import { Prisma } from "@prisma/client";

/** Upsert a profile row for a freshly-created auth user. */
async function ensureProfile(id: string, email: string, companyName?: string): Promise<User> {
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  
  try {
    return await db.user.upsert({
      where: { id },
      update: {},
      create: { 
        id, 
        email, 
        companyName: companyName || null,
        trialEndsAt, 
        subscriptionStatus: "trialing", 
        smsCredits: 100 
      },
    });
  } catch (error) {
    // Catch the race condition if two requests try to create the profile at the same time
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const user = await db.user.findUnique({ where: { id } });
      if (user) return user;
    }
    throw error;
  }
}

/** Server components / actions: redirect unauthenticated users. */
export async function requireUser(): Promise<User> {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user?.email) redirect("/login");
  return ensureProfile(user.id, user.email, user.user_metadata?.company_name);
}

/** Route handlers: return null instead of redirecting. */
export async function getUserOrNull(): Promise<User | null> {
  const sb = supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user?.email) return null;
  return ensureProfile(user.id, user.email, user.user_metadata?.company_name);
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