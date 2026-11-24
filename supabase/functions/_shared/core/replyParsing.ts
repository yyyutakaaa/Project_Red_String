// Defensive parsing of model output. OmniaKey does not document structured output, so models are asked to
// write their spoken reply followed by a fenced JSON block. These helpers split and parse that safely.

const FENCE = '```';
const META_START = /\{\s*"(revealed_clue_ids|mood)"/;

/**
 * How many characters of a streaming reply are safe to show to the player: everything before the JSON
 * fence (or a bare JSON object), holding back a short tail that could be the start of a fence.
 */
export function visibleLength(full: string): number {
  const fence = full.indexOf(FENCE);
  const meta = full.search(META_START);
  const cut = [fence, meta].filter((i) => i >= 0);
  if (cut.length) return Math.min(...cut);
  let n = full.length;
  // A trailing "`" or "``" might be the start of a fence.
  while (n > 0 && full[n - 1] === '`' && full.length - n < 2) n--;
  // A trailing "{" (possibly followed by whitespace or a partial key) might be the start of the metadata.
  const brace = full.lastIndexOf('{');
  if (brace >= 0 && brace >= full.length - 24 && !full.slice(brace).includes('}')) n = Math.min(n, brace);
  return n;
}

/** The spoken part of a complete reply. */
export function spokenPart(full: string): string {
  return full.slice(0, visibleLength(full)).trim();
}

/** Extract the first JSON object from text: a ```json fenced block, any fenced block, or the last {...}. */
export function extractJson(text: string): unknown {
  const fenced = /```(?:json|JSON)?\s*([\s\S]*?)```/g;
  let m: RegExpExecArray | null;
  const candidates: string[] = [];
  while ((m = fenced.exec(text)) !== null) if (m[1]) candidates.push(m[1].trim());
  // An unterminated fence at the end of the text (model stopped early).
  const open = text.lastIndexOf(FENCE);
  if (open >= 0) {
    const tail = text.slice(open + 3).replace(/^(json|JSON)/, '').trim();
    if (tail.startsWith('{')) candidates.push(tail);
  }
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first >= 0 && last > first) candidates.push(text.slice(first, last + 1));
  for (const c of candidates) {
    const parsed = tryParse(c);
    if (parsed !== undefined) return parsed;
  }
  return undefined;
}

function tryParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    // Common model slips: trailing commas, smart quotes.
    const repaired = s
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/,\s*([}\]])/g, '$1');
    try {
      return JSON.parse(repaired);
    } catch {
      return undefined;
    }
  }
}

export interface ReplyMeta {
  revealed_clue_ids: unknown;
  mood: unknown;
}

export function parseReplyMeta(full: string): ReplyMeta | null {
  const after = full.slice(visibleLength(full));
  const data = extractJson(after) ?? extractJson(full);
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const obj = data as Record<string, unknown>;
  if (!('revealed_clue_ids' in obj) && !('mood' in obj)) return null;
  return { revealed_clue_ids: obj.revealed_clue_ids ?? [], mood: obj.mood };
}

/** Trim a reply to roughly maxWords, ending on a sentence boundary where possible. */
export function limitWords(text: string, maxWords = 90): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text.trim();
  const clipped = words.slice(0, maxWords).join(' ');
  const end = Math.max(clipped.lastIndexOf('. '), clipped.lastIndexOf('? '), clipped.lastIndexOf('! '), clipped.lastIndexOf('."'));
  return (end > clipped.length * 0.5 ? clipped.slice(0, end + 1) : `${clipped}...`).trim();
}

const LEAK_MARKERS = [
  /revealed_clue_ids/i,
  /\bsystem prompt\b/i,
  /#\s*(never reveal|lies you tell|output format|rules|what you privately know)/i,
  /\bmy (instructions|prompt)\b/i,
  /\bas an ai\b/i,
  /\blanguage model\b/i,
];

/**
 * Last line of defence on what the player sees: strips clue ids and markdown headers, and reports
 * whether the reply looks like it broke character or echoed its instructions.
 */
export function sanitizeReply(text: string, clueIds: readonly string[]): { text: string; suspicious: boolean } {
  let out = plainPunctuation(text);
  for (const id of clueIds) out = out.split(`[${id}]`).join('').split(id).join('');
  out = out
    .split('\n')
    .filter((line) => !/^\s*#/.test(line))
    .join('\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
  const suspicious = LEAK_MARKERS.some((re) => re.test(out));
  return { text: out, suspicious };
}

/**
 * Plain punctuation for spoken replies: dashes used as connectors become commas and curly quotes become
 * straight ones. Applied to streamed text and to the final reply, in every language.
 */
export function plainPunctuation(text: string): string {
  return text
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/\s+--\s+/g, ', ')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/,\s*,/g, ',')
    .replace(/,\s*([.!?])/g, '$1');
}

/** The part of a streaming reply that is safe to clean and show: trailing spaces and dashes are held back. */
export function streamableText(visible: string): string {
  return plainPunctuation(visible.replace(/[\s—–,-]+$/, ''));
}
