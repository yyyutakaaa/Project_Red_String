// The faces a player can pick for their badge: every painted portrait in the game. Story suspects
// come first, in the order the cases are played, with their name; the stock faces of generated
// cases follow without one.
import { portraitArt, portraitKeys } from '../assets/registry.ts';
import { listStoryCases } from '../engine/caseLoader.ts';

export interface AvatarChoice {
  key: string;
  url: string;
  /** The suspect's name, for portraits that belong to one. */
  name: string | null;
}

let cached: AvatarChoice[] | null = null;

export function avatarChoices(): AvatarChoice[] {
  if (cached) return cached;
  const keys = new Set(portraitKeys());
  const out: AvatarChoice[] = [];
  for (const c of listStoryCases()) {
    for (const s of c.suspects) {
      const url = keys.has(s.id) ? portraitArt(s.id) : null;
      if (!url) continue;
      keys.delete(s.id);
      out.push({ key: s.id, url, name: s.name });
    }
  }
  for (const key of keys) {
    const url = portraitArt(key);
    if (url) out.push({ key, url, name: null });
  }
  cached = out;
  return out;
}

export function avatarUrl(key: string | undefined | null): string | null {
  return key ? portraitArt(key) : null;
}
