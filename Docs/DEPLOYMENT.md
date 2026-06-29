# Deployment Guide: Email Summary to Telegram Bot

This guide walks you through deploying the system to Supabase so it runs 24/7 in the cloud for free.

---

## Prerequisites Checklist
- [x] Supabase account created and project created at supabase.com
- [x] Groq API key obtained from console.groq.com
- [x] Telegram Bot created via @BotFather (your `BOT_TOKEN`)
- [x] `.env` file filled out locally

---

## Step 1: Link Your Local Project to Supabase Cloud

Open your terminal in the project root and run:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

> **Where to find YOUR_PROJECT_REF:** In your Supabase dashboard → Project Settings → General → Reference ID.

---

## Step 2: Apply the Database Migration

This creates all 7 tables and the Vault helper functions in your cloud database.

```bash
supabase db push
```

Verify by checking your Supabase Dashboard → Table Editor — you should see all tables.

---

## Step 3: Push Your Secrets to the Cloud

This uploads all your `.env` values so the Edge Function can read them.

```bash
supabase secrets set \
  TELEGRAM_BOT_TOKEN="your_bot_token_here" \
  TELEGRAM_WEBHOOK_SECRET="wh_sec_9xk4m2v8c7b6n5j3h1L9pQ" \
  GROQ_API_KEY="gsk_your_groq_key_here" \
  SUPABASE_URL="https://your-project.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"
```

> ⚠️ Use your actual values. Do NOT use the placeholder examples above.

---

## Step 4: Deploy the Edge Function

```bash
supabase functions deploy email-bot --no-verify-jwt
```

After deployment, note the function URL. It will look like:
`https://YOUR_PROJECT_REF.supabase.co/functions/v1/email-bot`

---

## Step 5: Register the Telegram Webhook

This tells Telegram to send all messages from your bot to your Supabase function.

```bash
curl -X POST "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://YOUR_PROJECT_REF.supabase.co/functions/v1/email-bot",
    "secret_token": "wh_sec_9xk4m2v8c7b6n5j3h1L9pQ"
  }'
```

Expected response: `{"ok":true,"result":true,"description":"Webhook was set"}`

---

## Step 6: Set Up the 5-Minute Email Polling Cron Job

Run this SQL in your Supabase Dashboard → SQL Editor:

```sql
-- Schedule the email-bot Edge Function to run every 5 minutes
SELECT cron.schedule(
  'email-poller-cron',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/email-bot',
    headers := '{"Content-Type": "application/json", "x-cron-trigger": "email-poller"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);
```

> ⚠️ Replace `YOUR_PROJECT_REF` with your actual Supabase project reference ID.

---

## Step 7: End-to-End Test

1. Open Telegram and find your bot.
2. Send `/start` — you should get a welcome message immediately.
3. Send `/add_email` and follow the prompts to connect your Gmail.
4. Wait up to 5 minutes for the first polling cycle.
5. Send yourself a test email from another account.
6. Wait for the next polling cycle — you should receive a Telegram summary.

---

## Useful Commands

| Command | Description |
|---|---|
| `supabase functions logs email-bot` | View real-time logs from the Edge Function |
| `supabase secrets list` | List all uploaded secrets |
| `supabase db push` | Re-apply migrations after schema changes |
| `supabase functions deploy email-bot` | Redeploy after code changes |

---

## Verify Cron Is Running

Run this in the Supabase SQL Editor:

```sql
SELECT jobname, schedule, active FROM cron.job;
```

You should see `email-poller-cron` listed as active.
