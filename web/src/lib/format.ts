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

export function formatDate(ts: number): string {
  try {
    return new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return new Date(ts).toISOString();
  }
}
