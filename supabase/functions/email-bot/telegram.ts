// ============================================================================
// telegram.ts — Telegram Bot API Wrapper
// Phase 6
// ============================================================================
/// <reference types="https://esm.sh/@supabase/functions-js/edge-runtime.d.ts" />

import { config } from "./config.ts";

const TELEGRAM_API = `https://api.telegram.org/bot${config.telegram.botToken}`;

// ─────────────────────────────────────────────────────────────────────────────
// Core API helper — all Telegram calls go through this
// ─────────────────────────────────────────────────────────────────────────────
async function callTelegramApi(
  method: string,
  body: Record<string, unknown>
): Promise<void> {
  const res = await fetch(`${TELEGRAM_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[Telegram] API error on ${method}:`, err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sends a plain text message (Markdown supported).
 */
export async function sendMessage(chatId: number, text: string): Promise<void> {
  await callTelegramApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
  });
}

/**
 * Sends an email summary with inline action buttons below it.
 *
 * Button callback_data format (max 64 bytes each):
 *  - "blk:<sender_email>"   → Block this sender
 *  - "s1h:<message_id>"     → Snooze summary for 1 hour
 *  - "s24:<message_id>"     → Snooze summary for 24 hours (tomorrow)
 */
export async function sendSummary(
  chatId: number,
  from: string,
  subject: string,
  emailAddress: string,
  summary: string,
  messageId: string
): Promise<void> {
  const senderEmail = extractEmail(from);

  // Telegram Markdown: * = bold, _ = italic, ` = code
  const text =
    `📧 *New Important Email*\n` +
    `*From:* ${escapeMarkdown(from)}\n` +
    `*Account:* ${escapeMarkdown(emailAddress)}\n` +
    `*Subject:* ${escapeMarkdown(subject)}\n\n` +
    `${summary}`;

  // Shorten message_id for callback_data (Telegram has a 64-byte limit)
  // We encode it as a Base64 short hash to keep within limits
  const shortId = btoa(messageId).substring(0, 20).replace(/[+=\/]/g, "");

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: "🔕 Block Sender", callback_data: `blk:${senderEmail}`.substring(0, 64) },
        { text: "🕒 Snooze 1h",    callback_data: `s1h:${shortId}` },
      ],
      [
        { text: "📅 Remind Tomorrow", callback_data: `s24:${shortId}` },
      ],
    ],
  };

  await callTelegramApi("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
    reply_markup: inlineKeyboard,
  });
}

/**
 * Sends a multi-account summary digest (used by /digest command).
 */
export async function sendDigest(
  chatId: number,
  summaries: { from: string; subject: string; summary: string }[]
): Promise<void> {
  if (summaries.length === 0) {
    await sendMessage(chatId, "📭 No important emails in the last 24 hours.");
    return;
  }

  let text = `📊 *Your Daily Digest* (${summaries.length} important email${summaries.length > 1 ? "s" : ""})\n\n`;

  for (const [i, item] of summaries.entries()) {
    text +=
      `*${i + 1}. ${escapeMarkdown(item.subject)}*\n` +
      `_From: ${escapeMarkdown(item.from)}_\n` +
      `${item.summary}\n\n`;
  }

  await sendMessage(chatId, text);
}

/**
 * Acknowledges a Telegram inline button press (required by Telegram API).
 * Without this, the button shows a loading spinner indefinitely.
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
): Promise<void> {
  await callTelegramApi("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text: text || "✅ Done!",
    show_alert: false,
  });
}

/**
 * Edits the text of an existing message (e.g., after a button is pressed,
 * update the message to show "Sender blocked ✅").
 */
export async function editMessageText(
  chatId: number,
  messageId: number,
  newText: string
): Promise<void> {
  await callTelegramApi("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text: newText,
    parse_mode: "Markdown",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Extracts plain email from "Name <email@domain.com>" format */
function extractEmail(from: string): string {
  const match = from.match(/<(.+?)>/);
  return match ? match[1] : from.trim();
}

/** Escapes Telegram Markdown special characters to prevent formatting errors */
function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
}
