# Implementation Plan: Email Summary to Telegram Notification System

**Goal:** Build a fully serverless, zero-cost email summarization system using Supabase Edge Functions, Groq API, and Telegram. 

## Timeline Feasibility
**Can we do this in 1 week using Antigravity?** 
**Yes, absolutely.** In fact, because the architecture is serverless and well-documented, we can likely build the core functional prototype in just **1 to 2 days**. The remaining time in the week can be used for testing, refining the AI prompts, and adding polish.

## User Action Required Before Coding

> [!IMPORTANT]
> **Prerequisites for you:** Before I can deploy the code, you will need to do a few quick setup steps on your end:
> 1. Create a free account at [Supabase.com](https://supabase.com) and create a new project.
> 2. Get a free API key from [Groq](https://console.groq.com).
> 3. Create a Telegram Bot using `@BotFather` and get the Bot Token.

## Proposed Coding Steps

We will scaffold the project locally using the Supabase CLI. 

### 1. Database Layer
**File:** `supabase/migrations/20260629_initial_schema.sql`
I will write the SQL migration script containing the exact tables we designed in the Architecture document (Users, Email Accounts, Blocklists, Processed Emails) and enable Supabase Vault for credential encryption.

### 2. Edge Function Layer (TypeScript/Deno)
**File:** `supabase/functions/email-bot/index.ts`
This will be the main entry point for our Serverless function. It will act as a dual-router:
1. **Webhook Handler:** Listens for instant HTTP POST requests from Telegram (e.g., when you type `/block` or `/add_email`).
2. **Cron Handler:** Listens for the 5-minute scheduled trigger to check emails.

**File:** `supabase/functions/email-bot/imapClient.ts`
Handles connecting to `imap.gmail.com`, authenticating with the decrypted App Password, and extracting only the `BODY.PEEK[TEXT]` of unread emails.

**File:** `supabase/functions/email-bot/aiService.ts`
Handles the REST API call to Groq (Llama 3 8B), passing the email text and our strict prompt to classify Importance and generate the 3-bullet summary.

**File:** `supabase/functions/email-bot/telegram.ts`
Handles sending messages back to your phone, including the interactive Inline Buttons (Snooze, Block, etc.).

## Verification Plan

### Automated/Local Testing
- We will use `supabase start` and `supabase functions serve` to run the database and Edge Function locally on your Mac.
- I will simulate a Telegram Webhook payload to ensure the function responds correctly to commands like `/start`.

### Manual Verification
- You will connect a test email address via the Telegram bot.
- We will send a test email to that address.
- We will wait for the cron trigger to fire and verify that you receive the summarized Telegram notification with the correct inline buttons.
