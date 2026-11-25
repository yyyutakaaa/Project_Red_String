// A suspect's reply is spoken dialogue with the odd action between asterisks: "*looks away* I was home."
// These helpers split the two so the screen can show the action as a stage direction, not as raw stars.

export interface ReplySegment {
  kind: 'speech' | 'action';
  text: string;
}

/**
 * Split a reply into speech and actions. Text between a pair of asterisks is an action; an asterisk that
 * is still open at the end (a reply that is streaming in) makes the rest an action too, so no star ever
 * shows. Underscores used the same way count as well. Empty pieces are dropped.
 */
export function splitReply(text: string): ReplySegment[] {
  const out: ReplySegment[] = [];
  let kind: ReplySegment['kind'] = 'speech';
  let buf = '';
  const flush = () => {
    if (kind === 'action') {
      const t = buf.trim();
      if (t) out.push({ kind, text: t });
    } else if (buf) {
      out.push({ kind, text: buf });
    }
    buf = '';
  };
  for (const ch of text.replace(/\*{2,}/g, '*')) {
    if (ch === '*') {
      flush();
      kind = kind === 'speech' ? 'action' : 'speech';
    } else {
      buf += ch;
    }
  }
  flush();
  // Tidy the seams: no space hanging before punctuation or at the very start and end.
  return out
    .map((s, i, all) => {
      if (s.kind === 'action') return s;
      let t = s.text;
      if (i === 0) t = t.replace(/^\s+/, '');
      if (i === all.length - 1) t = t.replace(/\s+$/, '');
      return { ...s, text: t };
    })
    .filter((s) => s.text.length > 0);
}

/** The spoken words only, actions left out: for quoting a statement on a chip. */
export function spokenOnly(text: string): string {
  return splitReply(text)
    .filter((s) => s.kind === 'speech')
    .map((s) => s.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .trim();
}
