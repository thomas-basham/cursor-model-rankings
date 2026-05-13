/**
 * @param {unknown} body
 * @returns {{ ok: true, models: object[] } | { ok: false, error: string }}
 */
export const MIN_MODELS = 3;
export const MAX_MODELS = 12;

export function parseDraftBody(body) {
  const models = Array.isArray(body) ? body : body?.models;
  if (!Array.isArray(models)) {
    return { ok: false, error: "Request body must be an array of models or { models: [...] }" };
  }
  if (models.length < MIN_MODELS || models.length > MAX_MODELS) {
    return {
      ok: false,
      error: `Expected between ${MIN_MODELS} and ${MAX_MODELS} models, got ${models.length}`,
    };
  }

  const ranks = new Set();
  for (let i = 0; i < models.length; i++) {
    const err = validateModel(models[i], i);
    if (err) return { ok: false, error: err };
    const r = Number(models[i].rank);
    if (r < 1 || r > models.length || !Number.isInteger(r)) {
      return {
        ok: false,
        error: `Invalid rank at index ${i}; must be integer 1–${models.length}`,
      };
    }
    ranks.add(r);
  }
  if (ranks.size !== models.length) {
    return {
      ok: false,
      error: `Ranks must be unique integers from 1 to ${models.length}`,
    };
  }

  return { ok: true, models };
}

function validateModel(m, index) {
  if (!m || typeof m !== "object") {
    return `Invalid model at index ${index}`;
  }
  const strings = [
    "modelName",
    "provider",
    "bestFor",
    "speed",
    "cursorUsage",
    "pricingSummary",
  ];
  for (const k of strings) {
    if (typeof m[k] !== "string" || !m[k].trim()) {
      return `Missing or invalid string field "${k}" at index ${index}`;
    }
  }
  if (
    m.codingScore === undefined ||
    m.codingScore === null ||
    (typeof m.codingScore !== "number" && typeof m.codingScore !== "string")
  ) {
    return `Invalid codingScore at index ${index}`;
  }
  if (!Array.isArray(m.strengths) || m.strengths.some((s) => typeof s !== "string")) {
    return `strengths must be an array of strings at index ${index}`;
  }
  if (!Array.isArray(m.weaknesses) || m.weaknesses.some((s) => typeof s !== "string")) {
    return `weaknesses must be an array of strings at index ${index}`;
  }
  if (!Array.isArray(m.sourceUrls) || m.sourceUrls.some((s) => typeof s !== "string")) {
    return `sourceUrls must be an array of strings at index ${index}`;
  }
  return null;
}

/**
 * Normalize model for persistence (coerce codingScore to number when possible).
 */
export function normalizeModels(models) {
  return models.map((m) => ({
    ...m,
    codingScore:
      typeof m.codingScore === "string" && !isNaN(Number(m.codingScore))
        ? Number(m.codingScore)
        : m.codingScore,
  }));
}
