// ============================================================================
// aiService.ts — Groq AI Summarization & Importance Classification
// Phase 5
// ============================================================================
/// <reference types="https://esm.sh/@supabase/functions-js/edge-runtime.d.ts" />

import { config } from "./config.ts";
import { AiResult } from "./types.ts";

// Groq follows the OpenAI REST API format — no SDK needed, just fetch().
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// ─────────────────────────────────────────────────────────────────────────────
// System Prompt — carefully engineered to:
//  1. First decide IMPORTANT vs ROUTINE (acts as a pre-filter to save tokens).
//  2. Only if important, produce a strict 3-bullet summary.
//  3. Return a structured JSON response so we can parse it reliably.
// ─────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an intelligent email assistant. Your job is to classify emails and summarize them.

STEP 1 — CLASSIFY the email as one of:
- "IMPORTANT": Requires attention or action (e.g., work tasks, deadlines, financial, personal matters, job offers, security alerts).
- "ROUTINE": Can be safely ignored (e.g., newsletters, promotions, automated reports, social media notifications, OTP codes already used).

STEP 2 — If "IMPORTANT", write exactly 3 short bullet points summarizing the key information.
Each bullet must be under 100 characters and start with an emoji that matches the tone.

RESPOND ONLY with valid JSON in this exact format (no extra text):
{
  "classification": "IMPORTANT" | "ROUTINE",
  "summary": ["• bullet 1", "• bullet 2", "• bullet 3"] | null
}`;

/**
 * Sends an email to Groq's Llama 3 model for importance classification
 * and summarization.
 *
 * @param from     - Sender's name/email
 * @param subject  - Email subject line
 * @param body     - Plain text email body (already truncated by imapClient)
 * @returns        - AiResult with isImportant flag and optional summary
 */
export async function analyzeEmail(
  from: string,
  subject: string,
  body: string
): Promise<AiResult> {
  const userMessage = `FROM: ${from}\nSUBJECT: ${subject}\n\nBODY:\n${body}`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.groq.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.groq.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        // Force Groq to return valid JSON — prevents hallucinated text wrappers
        response_format: { type: "json_object" },
        temperature: 0.1, // Low temperature = more deterministic, consistent output
        max_tokens: 300,  // Summaries are short — cap to save quota
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI] Groq API error ${response.status}:`, errorText);
      // On API error, default to treating email as important (fail safe)
      return { isImportant: true, summary: null };
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      console.warn("[AI] Groq returned empty content.");
      return { isImportant: true, summary: null };
    }

    // Parse the structured JSON response from Groq
    const parsed = JSON.parse(content);
    const isImportant = parsed?.classification === "IMPORTANT";
    const bulletPoints: string[] | null = parsed?.summary ?? null;

    // Validate the summary is actually an array of 3 strings
    const validSummary =
      isImportant &&
      Array.isArray(bulletPoints) &&
      bulletPoints.length > 0
        ? bulletPoints.join("\n")
        : null;

    console.log(
      `[AI] Classification: ${parsed?.classification} | Subject: ${subject}`
    );

    return { isImportant, summary: validSummary };
  } catch (err) {
    console.error("[AI] Unexpected error during analysis:", err);
    // Fail open: treat as important if we can't reach the AI
    return { isImportant: true, summary: null };
  }
}
