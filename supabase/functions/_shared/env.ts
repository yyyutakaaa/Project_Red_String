// Runtime configuration for the edge functions. Secrets are read from Supabase function secrets.
// Model ids are config values so they can be switched without code changes:
//   supabase secrets set SUSPECT_MODEL=mimo-v2.6-flash GENERATOR_MODEL=gpt-6.2-sol

export function env(name: string, fallback = ''): string {
  return Deno.env.get(name) ?? fallback;
}

export function envNumber(name: string, fallback: number): number {
  const raw = Deno.env.get(name);
  const n = raw === undefined ? NaN : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function effort(value: string): string | undefined {
  const v = value.trim().toLowerCase();
  return v === '' || v === 'none' ? undefined : v;
}

export const config = {
  omniakeyBaseUrl: () => env('OMNIAKEY_BASE_URL', 'https://api.omniakey.com/v1').replace(/\/$/, ''),
  omniakeyKey: () => env('OMNIAKEY_API_KEY'),
  suspectModel: () => env('SUSPECT_MODEL', 'claude-haiku-5-5'),
  generatorModel: () => env('GENERATOR_MODEL', 'claude-opus-5-5'),
  /**
   * reasoning_effort sent to the models ("low" | "medium" | "high", or "none" to omit it). Thinking models
   * otherwise spend the token budget on reasoning before writing (seen live with claude-opus-5-5).
   */
  generatorReasoningEffort: () => effort(env('GENERATOR_REASONING_EFFORT', 'low')),
  suspectReasoningEffort: () => effort(env('SUSPECT_REASONING_EFFORT', 'low')),
  dailySpendLimitUsd: () => envNumber('DAILY_SPEND_LIMIT_USD', 5),
  /** Comma-separated extra origins, e.g. a custom domain. */
  allowedOrigins: () =>
    env('ALLOWED_ORIGINS')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  /** Vercel project name used to allow production and preview deployment URLs. */
  vercelProject: () => env('VERCEL_PROJECT_NAME', 'project-red-string'),
  supabaseUrl: () => env('SUPABASE_URL'),
  serviceRoleKey: () => env('SUPABASE_SERVICE_ROLE_KEY'),
  /** Optional override of the price table: {"model-id": {"input": 0.1, "output": 0.5}} in USD per million tokens. */
  pricingOverride: () => env('MODEL_PRICING_JSON'),
  /** Eval tool only: lets a request pick a model id from this allow-list (comma-separated). */
  evalModels: () =>
    env('EVAL_ALLOWED_MODELS')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  evalToken: () => env('EVAL_TOKEN'),
};
