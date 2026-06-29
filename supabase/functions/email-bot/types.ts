// ============================================================================
// types.ts — Shared TypeScript interfaces across all modules
// ============================================================================

/**
 * Represents a row from the `email_accounts` table joined with the
 * decrypted App Password from Supabase Vault.
 */
export interface EmailAccount {
  id: string;
  user_telegram_id: number;
  email_address: string;
  imap_host: string;
  imap_port: number;
  app_password_secret_id: string;
  /** Decrypted at runtime from Vault. Never stored in plain text. */
  app_password?: string;
}

/**
 * Represents a parsed email fetched from the IMAP server.
 */
export interface ParsedEmail {
  messageId: string;
  from: string;
  subject: string;
  body: string;
}

/**
 * The result returned by the AI summarization service.
 */
export interface AiResult {
  isImportant: boolean;
  summary: string | null;
}

/**
 * A Telegram Update object (subset of the full Telegram API type).
 * Used when handling incoming Webhook POST requests from Telegram.
 */
export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: { id: number };
    text?: string;
  };
  callback_query?: {
    id: string;
    from: {
      id: number;
      first_name: string;
    };
    message?: {
      message_id: number;
      chat: { id: number };
    };
    data?: string;
  };
}

/**
 * Internal context passed through the processing pipeline.
 */
export interface ProcessingContext {
  telegramId: number;
  emailAccountId: string;
  emailAddress: string;
}
