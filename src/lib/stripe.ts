import Stripe from "stripe";

export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20", typescript: true })
  : (null as unknown as Stripe); // Fallback for local dev without keys

export const PLANS = {
  starter: {
    label: "Starter",
    price: process.env.STRIPE_PRICE_STARTER!,
    smsCredits: 100,
    maxActiveJobs: 10,
  },
  pro: {
    label: "Pro",
    price: process.env.STRIPE_PRICE_PRO!,
    smsCredits: 300,
    maxActiveJobs: Infinity,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function planFromPriceId(priceId: string): PlanKey {
  return priceId === PLANS.pro.price ? "pro" : "starter";
}

export const SMS_OVERAGE_PENCE = 5;