import type { CaseFile, Evidence } from '@shared/caseSchema.ts';

export function initials(name: string): string {
  const parts = name.replace(/[^A-Za-z\s'-]/g, ' ').split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const last = parts.length > 1 ? parts[parts.length - 1]![0] : '';
  return `${first}${last}`.toUpperCase();
}

export function sourceLabel(c: CaseFile, e: Evidence): string {
  const room = c.rooms.find((r) => r.id === e.found_in);
  if (room) return `Found in ${room.name}`;
  const suspect = c.suspects.find((s) => s.id === e.found_in);
  if (suspect) return `From ${suspect.name}`;
  return '';
}

/** A stopwatch reading: 4:07 under an hour, 1:04:07 above. */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** The same, read aloud: "4 minutes 7 seconds". */
export function spokenDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const part = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;
  return [h ? part(h, 'hour') : '', m ? part(m, 'minute') : '', !h && (s || !m) ? part(s, 'second') : ''].filter(Boolean).join(' ');
}

export function formatDate(ts: number): string {
  try {
    return new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return new Date(ts).toISOString();
  }
}
