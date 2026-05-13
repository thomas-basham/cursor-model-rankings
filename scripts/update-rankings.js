#!/usr/bin/env node

import OpenAI from "openai";
import { saveDraftRanking } from "../lib/modelsRepository.js";
import { normalizeModels, parseDraftBody } from "../lib/rankingValidation.js";

const DEFAULT_PROMPT = `You are an analyst preparing "Cursor Model Rankings", a weekly leaderboard ranking the coding models that ship inside the **Cursor IDE / Cursor Agent**. This is NOT a generic LLM leaderboard — restrict yourself to the models Cursor actually exposes to users for coding (Auto, Composer family, Anthropic Claude variants offered in Cursor, OpenAI GPT / Codex variants offered in Cursor, plus any other coding-focused models in Cursor's model picker).

Examples of in-scope models (use the names as Cursor labels them, including any thinking/speed tier such as "high", "medium", "fast"). Treat each tier variant as its own row when it materially changes speed or capability:
- Composer 2 Fast
- Composer 2 (standard)
- Claude Opus 4.7 (thinking high)
- Claude Opus 4.7 (medium)
- Claude Sonnet 4.6 (medium thinking)
- Claude Sonnet 4.6 (high thinking)
- GPT-5.3 Codex
- GPT-5.5 (medium)
- GPT-5.5 (high)
- Gemini 2.5 / 3.x Pro if available in Cursor's picker
- Grok Code / xAI variants if available in Cursor's picker
- Cursor "Auto" routing model
- Any other coding model currently in Cursor's model picker that you can verify

Return STRICT JSON with this shape:
{
  "models": [
    {
      "rank": 1,
      "modelName": "Cursor's display name, including tier (e.g. 'Claude Opus 4.7 high')",
      "provider": "Underlying provider (Anthropic, OpenAI, Cursor, Google, etc.)",
      "codingScore": 0,
      "bestFor": "what to actually USE this model for in coding tasks (e.g. 'long agentic refactors across many files', 'fast inline edits & autocomplete', 'tricky algorithm reasoning', 'large-context code review')",
      "speed": "Cursor-relative speed label: one of 'Very fast', 'Fast', 'Balanced', 'Slower (thinking)', or 'Slow (deep thinking)'",
      "strengths": ["best features bullet", "..."],
      "weaknesses": ["bullet describing where it underperforms or what to avoid", "..."],
      "cursorUsage": "How this model is metered inside Cursor — e.g. 'Free / unlimited (fast pool)', '1 premium request per call', '2× premium request on high-thinking', 'Token-based MAX mode: input ~$X / output ~$Y per 1M tokens', 'Usage-based after Pro quota'. Be specific to Cursor's billing, not the raw API.",
      "pricingSummary": "Underlying provider / API pricing for context (e.g. 'Anthropic API: $15/$75 per 1M I/O', 'OpenAI API: $1.25/$10 per 1M I/O'). Use 'See provider pricing' if unknown.",
      "sourceUrls": ["https://...", "..."]
    }
  ]
}

Rules:
- Return EXACTLY 10 models, ranks 1–10, contiguous and unique. Do not return fewer than 10.
- If a single model family has multiple useful tiers in Cursor (e.g. "Claude Sonnet 4.6 medium" vs "Claude Sonnet 4.6 high", or "Composer 2" vs "Composer 2 Fast"), list each tier as its own entry — they have different speed / quality tradeoffs and users pick between them.
- Only include models actually available inside Cursor for coding. Do NOT include raw API models that aren't in Cursor's picker.
- "bestFor" must describe the concrete coding workflow the model excels at, not vague marketing language.
- "speed" must use one of the allowed labels above (so the UI can show a consistent column).
- codingScore is an integer 0–100 balancing real-world coding usefulness inside Cursor (agentic reliability, multi-file edits, tool use, latency, accuracy).
- sourceUrls: 2–5 reputable URLs per model (Cursor docs, changelog, provider model card / blog, benchmark posts). https only.
- No markdown, no prose outside the JSON object.
`;

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("OPENAI_API_KEY is required");
    process.exit(1);
  }

  const extra = process.argv.slice(2).join(" ").trim();
  const userPrompt = extra
    ? `${DEFAULT_PROMPT}\n\nAdditional researcher instructions: ${extra}`
    : DEFAULT_PROMPT;

  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_RANKINGS_MODEL || "gpt-4o-mini",
    temperature: 0.25,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You output only valid JSON. Never include comments or trailing text.",
      },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    console.error("Empty completion from OpenAI");
    process.exit(1);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error("Invalid JSON from model:", e);
    console.error(raw);
    process.exit(1);
  }

  const validated = parseDraftBody(parsed);
  if (!validated.ok) {
    console.error("Validation failed:", validated.error);
    console.error(JSON.stringify(parsed, null, 2));
    process.exit(1);
  }

  const models = normalizeModels(validated.models);
  const { batchId } = await saveDraftRanking(models);
  console.log("Saved draft ranking to DynamoDB.");
  console.log("batchId:", batchId);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
