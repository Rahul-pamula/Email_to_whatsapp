// ============================================================================
// webhookHandler.ts — Handles all incoming Telegram commands & button presses
// Phase 6
// ============================================================================
/// <reference types="https://esm.sh/@supabase/functions-js/edge-runtime.d.ts" />

import { SupabaseClient } from "@supabase/supabase-js";
import { TelegramUpdate } from "./types.ts";
import {
  sendMessage,
  answerCallbackQuery,
  editMessageText,
} from "./telegram.ts";

// ─────────────────────────────────────────────────────────────────────────────
// State machine states for multi-step conversations (e.g., /add_email)
// Stored in user_preferences.pending_action as JSONB
// ─────────────────────────────────────────────────────────────────────────────
interface PendingAction {
  type: "await_email" | "await_password";
  email?: string; // Stored between steps of /add_email
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point — routes to the correct handler
// ─────────────────────────────────────────────────────────────────────────────
export async function handleWebhook(
  update: TelegramUpdate,
  supabase: SupabaseClient
): Promise<void> {
  // Handle inline button presses
  if (update.callback_query) {
    await handleCallbackQuery(update.callback_query, supabase);
    return;
  }

  // Handle text messages and commands
  if (update.message?.text) {
    await handleMessage(update.message, supabase);
    return;
  }

  console.log("[Webhook] Received update with no actionable content.");
}

// ─────────────────────────────────────────────────────────────────────────────
// Message Handler — routes commands and stateful conversation steps
// ─────────────────────────────────────────────────────────────────────────────
async function handleMessage(
  message: NonNullable<TelegramUpdate["message"]>,
  supabase: SupabaseClient
): Promise<void> {
  // Guard: text might be undefined if message contains media (photo, sticker, etc.)
  // We already check update.message?.text before calling this function, but
  // TypeScript cannot narrow types across function call boundaries.
  if (!message.text) return;

  const chatId = message.chat.id;
  const telegramId = message.from.id;
  const text = message.text.trim();

  // ── Ensure the user exists in our DB ────────────────────────────────────
  await upsertUser(supabase, message.from);

  // ── Check for an active stateful conversation ────────────────────────────
  const pendingAction = await getPendingAction(supabase, telegramId);
  if (pendingAction) {
    await handleStatefulInput(text, chatId, telegramId, pendingAction, supabase);
    return;
  }

  // ── Route top-level commands ─────────────────────────────────────────────
  if (text.startsWith("/start")) {
    await handleStart(chatId, message.from.first_name);
  } else if (text.startsWith("/add_email")) {
    await handleAddEmailStart(chatId, telegramId, supabase);
  } else if (text.startsWith("/list_emails")) {
    await handleListEmails(chatId, telegramId, supabase);
  } else if (text.startsWith("/remove_email")) {
    const email = text.replace("/remove_email", "").trim();
    await handleRemoveEmail(chatId, telegramId, email, supabase);
  } else if (text.startsWith("/block")) {
    const email = text.replace("/block", "").trim();
    await handleBlock(chatId, telegramId, email, supabase);
  } else if (text.startsWith("/unblock")) {
    const email = text.replace("/unblock", "").trim();
    await handleUnblock(chatId, telegramId, email, supabase);
  } else if (text.startsWith("/vip")) {
    const email = text.replace("/vip", "").trim();
    await handleVip(chatId, telegramId, email, supabase);
  } else if (text.startsWith("/snooze")) {
    const duration = text.replace("/snooze", "").trim();
    await handleSnooze(chatId, telegramId, duration, supabase);
  } else if (text.startsWith("/digest")) {
    await handleDigest(chatId, telegramId, supabase);
  } else if (text.startsWith("/help")) {
    await handleHelp(chatId);
  } else {
    await sendMessage(chatId, "❓ Unknown command. Type /help to see all available commands.");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Callback Query Handler — handles inline button presses
// ─────────────────────────────────────────────────────────────────────────────
async function handleCallbackQuery(
  callbackQuery: NonNullable<TelegramUpdate["callback_query"]>,
  supabase: SupabaseClient
): Promise<void> {
  const chatId = callbackQuery.message?.chat.id;
  const messageId = callbackQuery.message?.message_id;
  const telegramId = callbackQuery.from.id;
  const data = callbackQuery.data || "";

  if (!chatId) return;

  // ── Block sender (blk:<email>) ────────────────────────────────────────────
  if (data.startsWith("blk:")) {
    const senderEmail = data.replace("blk:", "").trim();
    await supabase.from("blocklist").upsert({
      user_telegram_id: telegramId,
      sender_email: senderEmail,
    });
    await answerCallbackQuery(callbackQuery.id, `🔕 ${senderEmail} blocked!`);
    if (messageId) {
      await editMessageText(chatId, messageId, `🔕 *Sender blocked*: \`${senderEmail}\`\nYou won't receive summaries from this sender anymore.`);
    }
  }

  // ── Snooze 1 hour (s1h:<shortId>) ────────────────────────────────────────
  else if (data.startsWith("s1h:")) {
    const snoozeUntil = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await supabase.from("user_preferences").upsert({
      user_telegram_id: telegramId,
      snooze_until: snoozeUntil,
    });
    await answerCallbackQuery(callbackQuery.id, "🕒 Snoozed for 1 hour!");
    if (messageId) {
      await editMessageText(chatId, messageId, "🕒 *Notifications snoozed for 1 hour.*\nI'll resume sending summaries after that.");
    }
  }

  // ── Snooze until tomorrow (s24:<shortId>) ─────────────────────────────────
  else if (data.startsWith("s24:")) {
    const snoozeUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabase.from("user_preferences").upsert({
      user_telegram_id: telegramId,
      snooze_until: snoozeUntil,
    });
    await answerCallbackQuery(callbackQuery.id, "📅 Snoozed until tomorrow!");
    if (messageId) {
      await editMessageText(chatId, messageId, "📅 *Notifications snoozed until tomorrow.*\nEnjoy your rest!");
    }
  }

  else {
    await answerCallbackQuery(callbackQuery.id, "Action completed.");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Command Handlers
// ─────────────────────────────────────────────────────────────────────────────

async function handleStart(chatId: number, firstName: string): Promise<void> {
  await sendMessage(
    chatId,
    `👋 Welcome, *${firstName}*!\n\n` +
    `I'm your personal *Email Summary Bot*. I'll monitor your inbox and send you smart AI summaries of important emails — right here in Telegram.\n\n` +
    `*Get started:*\n` +
    `• /add\\_email — Connect your first inbox\n` +
    `• /help — See all available commands\n\n` +
    `_I'm 100% free, private, and open-source._`
  );
}

async function handleHelp(chatId: number): Promise<void> {
  await sendMessage(
    chatId,
    `📖 *Available Commands*\n\n` +
    `*📧 Email Management*\n` +
    `/add\\_email — Connect a new email inbox\n` +
    `/list\\_emails — View connected inboxes\n` +
    `/remove\\_email — Disconnect an inbox\n\n` +
    `*🔕 Preferences*\n` +
    `/block \\<email\\> — Block a sender\n` +
    `/unblock \\<email\\> — Unblock a sender\n` +
    `/vip \\<email\\> — Always notify for this sender\n\n` +
    `*⏰ Notifications*\n` +
    `/snooze \\<1h|8h|24h\\> — Pause notifications\n` +
    `/digest — Get a summary of today's important emails`
  );
}

async function handleAddEmailStart(
  chatId: number,
  telegramId: number,
  supabase: SupabaseClient
): Promise<void> {
  // Set the pending state to await the user's email address input
  await setPendingAction(supabase, telegramId, { type: "await_email" });
  await sendMessage(
    chatId,
    `📧 *Add Email Account*\n\n` +
    `Please send me your email address.\n` +
    `_Example: yourname@gmail.com_`
  );
}

async function handleListEmails(
  chatId: number,
  telegramId: number,
  supabase: SupabaseClient
): Promise<void> {
  const { data: accounts } = await supabase
    .from("email_accounts")
    .select("email_address, is_active")
    .eq("user_telegram_id", telegramId);

  if (!accounts || accounts.length === 0) {
    await sendMessage(chatId, "📭 No email accounts connected yet. Use /add\\_email to add one.");
    return;
  }

  const list = accounts
    .map((a: { email_address: string; is_active: boolean }, i: number) =>
      `${i + 1}. \`${a.email_address}\` ${a.is_active ? "✅" : "⏸"}`
    )
    .join("\n");

  await sendMessage(chatId, `📧 *Your Connected Inboxes:*\n\n${list}`);
}

async function handleRemoveEmail(
  chatId: number,
  telegramId: number,
  email: string,
  supabase: SupabaseClient
): Promise<void> {
  if (!email) {
    await sendMessage(chatId, "⚠️ Please provide the email to remove.\n_Example: /remove\\_email you@gmail.com_");
    return;
  }

  const { error } = await supabase
    .from("email_accounts")
    .delete()
    .eq("user_telegram_id", telegramId)
    .eq("email_address", email.toLowerCase());

  if (error) {
    await sendMessage(chatId, `❌ Failed to remove ${email}. Please try again.`);
  } else {
    await sendMessage(chatId, `✅ *${email}* has been disconnected.`);
  }
}

async function handleBlock(
  chatId: number,
  telegramId: number,
  email: string,
  supabase: SupabaseClient
): Promise<void> {
  if (!email) {
    await sendMessage(chatId, "⚠️ Please provide an email to block.\n_Example: /block spam@example.com_");
    return;
  }

  await supabase.from("blocklist").upsert({
    user_telegram_id: telegramId,
    sender_email: email.toLowerCase(),
  });

  await sendMessage(chatId, `🔕 *${email}* has been blocked. You won't receive summaries from this sender.`);
}

async function handleUnblock(
  chatId: number,
  telegramId: number,
  email: string,
  supabase: SupabaseClient
): Promise<void> {
  if (!email) {
    await sendMessage(chatId, "⚠️ Please provide an email to unblock.\n_Example: /unblock sender@example.com_");
    return;
  }

  await supabase
    .from("blocklist")
    .delete()
    .eq("user_telegram_id", telegramId)
    .eq("sender_email", email.toLowerCase());

  await sendMessage(chatId, `✅ *${email}* has been unblocked.`);
}

async function handleVip(
  chatId: number,
  telegramId: number,
  email: string,
  supabase: SupabaseClient
): Promise<void> {
  if (!email) {
    await sendMessage(chatId, "⚠️ Please provide an email to mark as VIP.\n_Example: /vip boss@company.com_");
    return;
  }

  await supabase.from("vip_list").upsert({
    user_telegram_id: telegramId,
    sender_email: email.toLowerCase(),
  });

  await sendMessage(chatId, `⭐ *${email}* is now a VIP. You'll always be notified about their emails, regardless of AI classification.`);
}

async function handleSnooze(
  chatId: number,
  telegramId: number,
  duration: string,
  supabase: SupabaseClient
): Promise<void> {
  const durationMap: Record<string, number> = {
    "1h": 1, "8h": 8, "24h": 24,
  };

  const hours = durationMap[duration];
  if (!hours) {
    await sendMessage(chatId, "⚠️ Please use: /snooze 1h, /snooze 8h, or /snooze 24h");
    return;
  }

  const snoozeUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  await supabase.from("user_preferences").upsert({
    user_telegram_id: telegramId,
    snooze_until: snoozeUntil,
  });

  await sendMessage(chatId, `😴 *Snoozed for ${duration}.*\nI'll resume sending summaries at ${new Date(snoozeUntil).toLocaleTimeString()}.`);
}

async function handleDigest(
  chatId: number,
  telegramId: number,
  supabase: SupabaseClient
): Promise<void> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: summaries } = await supabase
    .from("processed_emails")
    .select("subject, sender, summary, processed_at")
    .gte("processed_at", since)
    .not("summary", "is", null)
    .order("processed_at", { ascending: false });

  if (!summaries || summaries.length === 0) {
    await sendMessage(chatId, "📭 No important emails in the last 24 hours.");
    return;
  }

  let text = `📊 *Your Digest* — last 24 hours (${summaries.length} important)\n\n`;
  for (const [i, s] of summaries.entries()) {
    text += `*${i + 1}. ${s.subject}*\n_From: ${s.sender}_\n${s.summary}\n\n`;
  }

  await sendMessage(chatId, text);
}

// ─────────────────────────────────────────────────────────────────────────────
// Stateful Conversation Handler (/add_email multi-step flow)
// ─────────────────────────────────────────────────────────────────────────────
async function handleStatefulInput(
  text: string,
  chatId: number,
  telegramId: number,
  pending: PendingAction,
  supabase: SupabaseClient
): Promise<void> {
  // Allow user to cancel at any time
  if (text.startsWith("/")) {
    await clearPendingAction(supabase, telegramId);
    await sendMessage(chatId, "❌ Action cancelled. Type /help to see all commands.");
    return;
  }

  if (pending.type === "await_email") {
    // Basic email format validation
    if (!text.includes("@") || !text.includes(".")) {
      await sendMessage(chatId, "⚠️ That doesn't look like a valid email. Please try again:");
      return;
    }

    // Save the email address and move to the next step
    await setPendingAction(supabase, telegramId, {
      type: "await_password",
      email: text.toLowerCase().trim(),
    });

    await sendMessage(
      chatId,
      `✅ Got it: \`${text}\`\n\n` +
      `Now, please send me your *Gmail App Password*.\n\n` +
      `_How to get one:_\n` +
      `1. Go to myaccount.google.com\n` +
      `2. Security → 2-Step Verification → App passwords\n` +
      `3. Create a new one and paste the 16-character code here.\n\n` +
      `⚠️ *Delete this message after sending for safety.*`
    );
    return;
  }

  if (pending.type === "await_password" && pending.email) {
    const appPassword = text.replace(/\s/g, ""); // Gmail app passwords sometimes have spaces

    // Basic length validation
    if (appPassword.length < 16) {
      await sendMessage(chatId, "⚠️ App Password seems too short. Gmail App Passwords are 16 characters. Please try again:");
      return;
    }

    // Store the App Password securely in Supabase Vault and save account
    const success = await saveEmailAccount(
      supabase,
      telegramId,
      pending.email,
      appPassword
    );

    await clearPendingAction(supabase, telegramId);

    if (success) {
      await sendMessage(
        chatId,
        `🎉 *${pending.email}* has been connected successfully\\!\n\n` +
        `I'll start monitoring your inbox and send you summaries of important emails.\n` +
        `The first check will happen within 5 minutes.\n\n` +
        `_Please delete your message containing the App Password from this chat._`
      );
    } else {
      await sendMessage(chatId, `❌ Failed to connect *${pending.email}*. Please try /add\\_email again.`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Database Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function upsertUser(
  supabase: SupabaseClient,
  from: { id: number; first_name: string; username?: string }
): Promise<void> {
  await supabase.from("users").upsert({
    telegram_id: from.id,
    first_name: from.first_name,
    username: from.username || null,
    updated_at: new Date().toISOString(),
  });
}

async function getPendingAction(
  supabase: SupabaseClient,
  telegramId: number
): Promise<PendingAction | null> {
  const { data } = await supabase
    .from("user_preferences")
    .select("pending_action")
    .eq("user_telegram_id", telegramId)
    .single();
  return data?.pending_action ?? null;
}

async function setPendingAction(
  supabase: SupabaseClient,
  telegramId: number,
  action: PendingAction
): Promise<void> {
  await supabase.from("user_preferences").upsert({
    user_telegram_id: telegramId,
    pending_action: action,
  });
}

async function clearPendingAction(
  supabase: SupabaseClient,
  telegramId: number
): Promise<void> {
  await supabase
    .from("user_preferences")
    .update({ pending_action: null })
    .eq("user_telegram_id", telegramId);
}

/**
 * Saves the App Password to Supabase Vault and creates the email_accounts row.
 * Returns true on success.
 */
async function saveEmailAccount(
  supabase: SupabaseClient,
  telegramId: number,
  emailAddress: string,
  appPassword: string
): Promise<boolean> {
  try {
    // Step 1: Encrypt and store the App Password in Supabase Vault
    const { data: secretId, error: vaultError } = await supabase.rpc(
      "vault_create_secret",
      {
        secret: appPassword,
        name: `app_password_${telegramId}_${emailAddress}`,
      }
    );

    if (vaultError || !secretId) {
      console.error("[Webhook] Failed to store secret in Vault:", vaultError);
      return false;
    }

    // Step 2: Save the email account with a reference to the Vault secret
    const { error: dbError } = await supabase.from("email_accounts").upsert({
      user_telegram_id: telegramId,
      email_address: emailAddress,
      app_password_secret_id: secretId,
      is_active: true,
    });

    if (dbError) {
      console.error("[Webhook] Failed to save email account:", dbError);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[Webhook] Unexpected error in saveEmailAccount:", err);
    return false;
  }
}
