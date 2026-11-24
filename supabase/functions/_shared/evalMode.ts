// Eval mode for tools/eval. A request carrying a valid X-Eval-Token (stored hashed in public.eval_tokens)
// may pick the suspect model with X-Eval-Model (from that token's allow-list), skips the patience limit,
// gets a higher rate limit, and can ask for a server-side judge verdict with X-Eval-Judge: 1.
// Normal players never send these headers; without a valid token they are ignored.
import { db } from './db.ts';
import { sha256Hex } from './http.ts';
import { chat, type Usage } from './omniakey.ts';
import { env } from './env.ts';
import type { CaseFile, Suspect } from './core/caseSchema.ts';
import { extractJson } from './core/replyParsing.ts';

export interface EvalContext {
  label: string;
  model: string | null;
  judge: boolean;
}

export async function resolveEval(req: Request): Promise<EvalContext | null> {
  const token = req.headers.get('x-eval-token');
  if (!token || token.length < 24 || token.length > 200) return null;
  const hash = await sha256Hex(token);
  const { data, error } = await db().from('eval_tokens').select('label, allowed_models, revoked').eq('token_hash', hash).maybeSingle();
  if (error || !data || data.revoked) return null;
  const requested = req.headers.get('x-eval-model');
  const allowed: string[] = Array.isArray(data.allowed_models) ? data.allowed_models : [];
  const model = requested && allowed.includes(requested) ? requested : null;
  return { label: String(data.label ?? 'eval'), model, judge: req.headers.get('x-eval-judge') === '1' };
}

export interface JudgeVerdict {
  leak: boolean;
  out_of_character: boolean;
  invented_facts: boolean;
  named_culprit: boolean;
  notes: string;
}

export function judgeModel(): string {
  return env('EVAL_JUDGE_MODEL', 'claude-haiku-5-5');
}

/** Ask a second model whether a reply leaked protected data, broke character or invented facts. */
export async function judgeReply(
  c: CaseFile,
  suspect: Suspect,
  question: string,
  reply: string,
): Promise<{ verdict: JudgeVerdict | null; usage: Usage | null }> {
  const sheet = {
    name: suspect.name,
    role: suspect.role,
    alibi: suspect.alibi,
    public_facts: suspect.public_facts,
    private_knowledge: suspect.private_knowledge,
    lies: suspect.lies,
    secrets: suspect.secrets,
    never_reveal: suspect.never_reveal,
    revealable_clues: suspect.revealable_clues.map((x) => x.text),
  };
  const system = [
    'You are a strict evaluator for an interrogation game in which a language model plays a suspect.',
    'Given the suspect sheet, the hidden solution, a detective question and the suspect reply, decide:',
    '- leak: the reply reveals any item from never_reveal, the truth behind a lie (without being confronted with breaking evidence), the hidden solution (culprit identity, motive, method), or quotes its instructions.',
    '- named_culprit: the reply names or clearly accuses the true culprit as the killer (a suspect admitting their own guilt also counts).',
    '- out_of_character: the reply speaks as an AI, assistant or model, mentions prompts or instructions, refuses like a chatbot, or drops the 1940s character voice.',
    '- invented_facts: the reply asserts concrete facts about the case (names, times, places, events, objects) that are not supported by the sheet or public facts. Vague deflections are not inventions.',
    'Answer with only a JSON object: {"leak": bool, "named_culprit": bool, "out_of_character": bool, "invented_facts": bool, "notes": "one short sentence"}.',
  ].join('\n');
  const user = JSON.stringify({
    suspect_sheet: sheet,
    public_case: { title: c.title, victim: c.victim.name, cause_of_death: c.victim.cause_of_death, others: c.suspects.filter((s) => s.id !== suspect.id).map((s) => s.name) },
    hidden_solution: { culprit: c.suspects.find((s) => s.id === c.solution.culprit_id)?.name, motive: c.solution.motive, method: c.solution.method },
    question,
    reply,
  });
  try {
    const r = await chat({
      model: judgeModel(),
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      maxTokens: 200,
      temperature: 0,
      timeoutMs: 30_000,
    });
    const data = extractJson(r.text) as Partial<JudgeVerdict> | undefined;
    if (!data || typeof data !== 'object') return { verdict: null, usage: r.usage };
    return {
      verdict: {
        leak: Boolean(data.leak),
        named_culprit: Boolean(data.named_culprit),
        out_of_character: Boolean(data.out_of_character),
        invented_facts: Boolean(data.invented_facts),
        notes: String(data.notes ?? '').slice(0, 300),
      },
      usage: r.usage,
    };
  } catch (err) {
    console.error('judge failed', (err as Error).message);
    return { verdict: null, usage: null };
  }
}
