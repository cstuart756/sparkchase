**[Live app](https://sparkchase-eu-19da17995ae8.herokuapp.com/)**

# ⚡ SparkChase

**Invoice chasing for electricians, built around stage payments, retentions, and certification-triggered billing.**

Generic invoicing tools ignore the specific friction points of electrical subcontracting. SparkChase solves this by understanding that you often can't invoice for "Testing & Certification" until the certificate is actually issued. 

> **"Stop chasing stage payments and retentions manually. SparkChase sends the right reminder at the right milestone, referencing the certificate you issued, so you get paid faster."**

## 🚀 Core Features

- **Certification-Triggered Billing (The Killer Feature):** Link a milestone to a specific certificate (e.g., EICR, EIC). The moment you mark the certificate as "Issued," the milestone automatically flips to "Invoiced," and the Day 0 reminder fires immediately, referencing the certificate number.
- **Automated Reminder Sequences:** Set-and-forget SMS and Email reminders (e.g., Day 0, +3, +7, +14). When a milestone is marked "Paid," the sequence stops instantly.
- **Smart Chasing:** A robust daily cron job ensures no reminder is missed, with built-in catch-up logic so customers aren't spammed if the server was down.
- **Dashboard & Overdue Summary:** Instantly see total outstanding amounts, overdue milestones, and a log of every email/SMS sent.
- **Custom Templates:** Editable email and SMS templates with dynamic placeholders (`{{customer_name}}`, `{{certificate_number}}`, etc.).
- **Stripe Subscriptions:** 14-day free trial (no credit card), followed by Starter (£19/mo) or Pro (£29/mo) tiers.

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL (via Supabase)
- **ORM:** Prisma
- **Auth:** Supabase Auth (Email/Password)
- **Styling:** Tailwind CSS + custom UI primitives (Lucide icons)
- **Email:** Resend
- **SMS:** Twilio
- **Payments:** Stripe (Checkout + Customer Portal + Webhooks)
- **Cron:** External cron runner for daily reminders

## 📋 Prerequisites

Before you begin, ensure you have the following accounts:
1. [Supabase](https://supabase.com) (Database & Auth)
2. [Stripe](https://stripe.com) (Payments - Test mode is fine)
3. [Resend](https://resend.com) (Emails)
4. [Twilio](https://twilio.com) (SMS - optional, falls back to dry-run without keys)

## 💻 Local Setup

### 1. Clone & Install
```bash
git clone https://github.com/YOUR-USERNAME/sparkchase.git
cd sparkchase
npm install
2. Environment Variables

Copy the example environment file:
bash

cp .env.example .env

Fill in your keys in .env.

Crucial Database Note: You must use the Transaction Pooler URL (port 6543) for DATABASE_URL (with ?pgbouncer=true) and the Session Pooler / Direct URL (port 5432) for DIRECT_URL. Both are found in Supabase under Settings → Database.
3. Setup Database

Generate the Prisma client and push the schema to your Supabase database:
bash

npx prisma generate
npx prisma migrate dev --name init

4. Seed Demo Data (Optional)

To populate your local environment with a demo job, milestone, and certificate:
bash

npx tsx prisma/seed.ts

5. Run the App
bash

npm run dev

Open http://localhost:3000 and sign up for an account.
(Note: If Supabase requires email confirmation and you want to skip it locally, go to Supabase → Authentication → Providers → Email and turn OFF "Confirm email").
🧪 How to Test "Flow A" (The Moat)

To see the core engine in action without sending real emails/SMS:

    Go to New Job and create a test job.

    Add a Certificate (e.g., EICR-2025-001).

    Click + Add Milestone, name it "Testing & Certification", set the Trigger Type to Certificate-triggered, and link it to the certificate.

    Scroll up and click Mark issued on the certificate.

    Watch what happens: The milestone status instantly changes from Pending to Invoiced. Check your terminal, and you will see [email:dry-run] firing the Day 0 reminder with the exact certificate sentence required.

⚙️ Environment Variables Reference
Variable	Description
DATABASE_URL	Supabase Transaction Pooler URL (port 6543, include ?pgbouncer=true)
DIRECT_URL	Supabase Direct URL (port 5432, used for migrations)
NEXT_PUBLIC_SUPABASE_URL	Found in Supabase API settings
NEXT_PUBLIC_SUPABASE_ANON_KEY	Found in Supabase API settings
STRIPE_SECRET_KEY	Your Stripe Secret Key (sk_test_...)
STRIPE_WEBHOOK_SECRET	Stripe Webhook secret (whsec_...)
STRIPE_PRICE_STARTER	Stripe Price ID for the £19/mo plan
STRIPE_PRICE_PRO	Stripe Price ID for the £29/mo plan
RESEND_API_KEY	Your Resend API key (re_...)
EMAIL_FROM	Verified sending email address
TWILIO_ACCOUNT_SID	Twilio Account SID
TWILIO_AUTH_TOKEN	Twilio Auth Token
TWILIO_FROM_NUMBER	Your Twilio phone number
CRON_SECRET	A secure random string to protect the cron route
## ☁️ Deployment (Heroku)

The production app runs in Heroku's EU region: [sparkchase-eu](https://sparkchase-eu-19da17995ae8.herokuapp.com/).

To deploy updates, push the `master` branch to the Heroku remote:

```bash
heroku git:remote --app sparkchase-eu
git push heroku master
```

Set the environment variables listed above as Heroku config vars, and set `NEXT_PUBLIC_APP_URL` to the live app URL. Email, SMS, and Stripe webhook integrations also require their respective provider credentials.

The daily reminder endpoint is `GET /api/cron/send-reminders`. Schedule it with an external cron service to run daily, sending `Authorization: Bearer <CRON_SECRET>`.

### Stripe Webhooks (Production)

Configure a Stripe webhook endpoint at `https://sparkchase-eu-19da17995ae8.herokuapp.com/api/stripe/webhook` for these events:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`
- `invoice.paid`

Add the webhook signing secret as the Heroku config var `STRIPE_WEBHOOK_SECRET`.

📄 License

Private / Proprietary. Built for electricians. SparkChase © 2026.