-- ============================================================================
-- Email to Telegram Bot - Initial Database Schema
-- Phase 2: Database Setup & Security
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enable Required Extensions
-- ----------------------------------------------------------------------------

-- UUID generation for primary keys
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Supabase Vault for encrypted secret storage (App Passwords)
CREATE EXTENSION IF NOT EXISTS "supabase_vault" SCHEMA vault;

-- pg_cron for scheduling the 5-minute email polling job
CREATE EXTENSION IF NOT EXISTS "pg_cron";


-- ============================================================================
-- TABLE 1: users
-- Stores the Telegram identity of each user.
-- telegram_id is the unique ID Telegram assigns to each person.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
    telegram_id   BIGINT      PRIMARY KEY,
    username      TEXT,
    first_name    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'One row per Telegram user who has started the bot.';


-- ============================================================================
-- TABLE 2: email_accounts
-- Stores each email inbox connected by a user.
-- Supports 1 User -> N Email Accounts relationship.
-- The app_password_secret_id references the Supabase Vault — the actual
-- password is NEVER stored in plain text.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.email_accounts (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_telegram_id        BIGINT      NOT NULL REFERENCES public.users(telegram_id) ON DELETE CASCADE,
    email_address           TEXT        NOT NULL,
    imap_host               TEXT        NOT NULL DEFAULT 'imap.gmail.com',
    imap_port               INTEGER     NOT NULL DEFAULT 993,
    -- References the Vault secret ID, not the actual password
    app_password_secret_id  UUID        NOT NULL,
    is_active               BOOLEAN     NOT NULL DEFAULT TRUE,
    last_polled_at          TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_telegram_id, email_address)
);

COMMENT ON TABLE public.email_accounts IS 'Each connected email inbox. App Passwords are encrypted in Supabase Vault.';
COMMENT ON COLUMN public.email_accounts.app_password_secret_id IS 'UUID pointing to the encrypted secret in vault.secrets — never the raw password.';


-- ============================================================================
-- TABLE 3: processed_emails
-- Tracks every email that has already been sent to the user.
-- Prevents duplicate Telegram notifications for the same email.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.processed_emails (
    message_id          TEXT        NOT NULL,
    email_account_id    UUID        NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
    subject             TEXT,
    sender              TEXT,
    summary             TEXT,
    processed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (message_id, email_account_id)
);

COMMENT ON TABLE public.processed_emails IS 'Every email that was processed and notified. Prevents duplicate alerts.';


-- ============================================================================
-- TABLE 4: blocklist
-- Stores email senders the user never wants to hear from again.
-- Checked BEFORE calling the AI to save Groq API tokens.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.blocklist (
    user_telegram_id  BIGINT  NOT NULL REFERENCES public.users(telegram_id) ON DELETE CASCADE,
    sender_email      TEXT    NOT NULL,
    blocked_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_telegram_id, sender_email)
);

COMMENT ON TABLE public.blocklist IS 'Senders the user has blocked via /block command. Checked before AI processing.';


-- ============================================================================
-- TABLE 5: vip_list
-- Senders who ALWAYS bypass the AI importance filter.
-- Guarantees the user is never alerted for an email from a VIP contact.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.vip_list (
    user_telegram_id  BIGINT  NOT NULL REFERENCES public.users(telegram_id) ON DELETE CASCADE,
    sender_email      TEXT    NOT NULL,
    label             TEXT,   -- Optional: e.g., "My Boss", "Client A"
    added_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_telegram_id, sender_email)
);

COMMENT ON TABLE public.vip_list IS 'Senders who always trigger a notification, bypassing the AI importance filter.';


-- ============================================================================
-- TABLE 6: snooze_queue
-- Holds summaries that were generated during a /snooze period.
-- A separate cron job checks this table and delivers them at the right time.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.snooze_queue (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_telegram_id  BIGINT      NOT NULL REFERENCES public.users(telegram_id) ON DELETE CASCADE,
    summary_text      TEXT        NOT NULL,
    scheduled_for     TIMESTAMPTZ NOT NULL,
    is_delivered      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.snooze_queue IS 'Summaries held back during quiet hours, delivered in batch when snooze ends.';


-- ============================================================================
-- TABLE 7: user_preferences
-- Stores per-user configuration like quiet hours and AI prompt instructions.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_telegram_id      BIGINT      PRIMARY KEY REFERENCES public.users(telegram_id) ON DELETE CASCADE,
    snooze_until          TIMESTAMPTZ,
    custom_ai_prompt      TEXT,
    preferred_language    TEXT NOT NULL DEFAULT 'English',
    digest_mode           BOOLEAN NOT NULL DEFAULT FALSE,
    -- Stores multi-step conversation state for the Telegram bot UI.
    -- Example: { "type": "await_email" } or { "type": "await_password", "email": "..." }
    pending_action        JSONB DEFAULT NULL,
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_preferences IS 'Per-user settings: quiet hours, custom AI prompts, language preference, and conversation state.';


-- ============================================================================
-- Row Level Security (RLS) 
-- Ensures no user can ever read another user's data.
-- ============================================================================

ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_accounts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_emails  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocklist         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vip_list          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snooze_queue      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences  ENABLE ROW LEVEL SECURITY;

-- Note: The Edge Function uses the SERVICE_ROLE_KEY which bypasses RLS.
-- RLS is a safety net to protect against any accidental public API exposure.


-- ============================================================================
-- Supabase Vault Helper Functions
-- These PostgreSQL functions allow the Edge Function to securely read and
-- write encrypted secrets without exposing the raw password.
-- ============================================================================

-- Creates a new secret in the Vault and returns the secret UUID.
-- Used by webhookHandler.ts when connecting a new email account.
CREATE OR REPLACE FUNCTION public.vault_create_secret(
  secret TEXT,
  name   TEXT
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  secret_id UUID;
BEGIN
  SELECT vault.create_secret(secret, name, 'Email App Password') INTO secret_id;
  RETURN secret_id;
END;
$$;

-- Reads and decrypts a secret from the Vault by its UUID.
-- Used by emailPoller.ts when fetching emails.
CREATE OR REPLACE FUNCTION public.vault_read_secret(
  secret_id UUID
) RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  decrypted TEXT;
BEGIN
  SELECT decrypted_secret
    INTO decrypted
    FROM vault.decrypted_secrets
   WHERE id = secret_id;
  RETURN decrypted;
END;
$$;

