# Detailed Implementation Plan: Email to Telegram Bot

This document breaks down the entire project into 7 actionable phases. We will complete these phases sequentially to build the fully serverless, zero-cost email summarization system.

---

## Phase 1: Environment & Scaffolding
**Goal:** Set up the local development environment and project structure.
1. [x] Create `.env.example` file.
2. [x] Create `.gitignore` to protect secrets.
3. [ ] Install the Supabase CLI via Homebrew (`brew install supabase/tap/supabase`).
4. [ ] Run `supabase init` to scaffold the serverless edge functions architecture.
5. [ ] User fills out their local `.env` file with Telegram, Groq, and Supabase keys.

---

## Phase 2: Database Setup & Security
**Goal:** Create the PostgreSQL schema and configure credential encryption.
1. [ ] Generate a new database migration: `supabase migration new initial_schema`.
2. [ ] Write SQL to create the `users` and `email_accounts` tables.
3. [ ] Write SQL to create the `blocklist`, `vip_list`, and `processed_emails` tables.
4. [ ] Enable the `pg_crypto` extension and configure **Supabase Vault** to ensure the user's App Passwords are encrypted at rest.
5. [ ] Run `supabase start` to apply migrations locally.

---

## Phase 3: Edge Function Skeleton
**Goal:** Create the serverless backend that listens to Telegram and Cron jobs.
1. [ ] Create a new edge function: `supabase functions new email-bot`.
2. [ ] Configure `deno.json` to import standard libraries (Supabase JS, HTTP routing).
3. [ ] Build the **Dual-Router** in `index.ts`:
   - *Route A:* Listen for standard HTTP POST requests (Telegram Webhooks).
   - *Route B:* Listen for Cron scheduling triggers.

---

## Phase 4: Secure IMAP Integration
**Goal:** Connect to the user's inbox securely without downloading heavy attachments.
1. [ ] Create `imapClient.ts`.
2. [ ] Implement logic to query the Supabase database and decrypt the user's App Password from the Vault.
3. [ ] Connect to `imap.gmail.com` over SSL.
4. [ ] Search for `UNSEEN` emails (Limit: 5 at a time).
5. [ ] Use `BODY.PEEK[TEXT]` to extract *only* the text body, avoiding the 50MB Edge Function memory limit.

---

## Phase 5: Groq AI Summarization
**Goal:** Analyze the text instantly using free Llama 3 models.
1. [ ] Create `aiService.ts`.
2. [ ] Write the strict system prompt instructing the AI to classify as `IMPORTANT` or `ROUTINE`.
3. [ ] Connect to the Groq API endpoint.
4. [ ] If the AI returns `IMPORTANT`, parse the 3-bullet summary. If `ROUTINE`, signal the script to skip the email.

---

## Phase 6: Telegram UI & Bot Logic
**Goal:** Build the interactive chat interface for the user.
1. [ ] Create `telegram.ts`.
2. [ ] Implement Onboarding: Handle the `/add_email` command to securely ask the user for their App Password and save it to the DB.
3. [ ] Implement Preferences: Handle the `/block` and `/vip` commands to update the SQLite/Supabase tables.
4. [ ] Implement Output: Send the AI-generated summary back to the user, including **Inline Buttons** beneath the message (e.g., `[Translate]`, `[Snooze]`, `[Mark as Read]`).

---

## Phase 7: Deployment & Final Wiring
**Goal:** Push the code to the cloud so it runs 24/7 for free.
1. [ ] Deploy the edge function to Supabase: `supabase functions deploy email-bot --no-verify-jwt`.
2. [ ] Push local `.env` secrets to the cloud: `supabase secrets set --env-file .env`.
3. [ ] Register the Webhook: Use `curl` to tell the Telegram API to send all chat messages to the newly deployed Supabase URL.
4. [ ] Set up the Cron Trigger: Use `pg_cron` in Supabase to tell the Edge Function to run the IMAP checker every 5 minutes.
5. [ ] Perform a full End-to-End test with a real unread email.
