// The rules of "catch a lie" that need no model: matching a pinned statement to the transcript and
// reading the referee's answer. Shared with the web app so they are tested once.
import { extractJson } from './replyParsing.ts';

/** Same words, whatever the spacing or the case: how a pinned statement is matched to the transcript. */
export function sameStatement(a: string, b: string): boolean {
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
  return norm(a).length > 0 && norm(a) === norm(b);
}

/**
 * Read the referee's answer, {"lie": <1-based number or null>, "contradicts": bool}. Returns the index
 * of the lie that was caught, or null. Anything unclear counts as "not caught".
 */
export function parseLieVerdict(text: string, lieCount: number): number | null {
  const data = extractJson(text);
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const o = data as Record<string, unknown>;
  const n = typeof o.lie === 'number' ? o.lie : typeof o.lie === 'string' && /^\d+$/.test(o.lie) ? Number(o.lie) : null;
  if (n === null || !Number.isInteger(n) || n < 1 || n > lieCount) return null;
  return o.contradicts === true ? n - 1 : null;
}
