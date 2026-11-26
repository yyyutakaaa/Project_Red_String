// Asset registry. Every visual and sound has a key. By default the game draws rooms, props and portraits
// procedurally (SVG/CSS) and synthesises audio. To use real art, drop files into src/assets/art/:
//   art/rooms/<background-key>.(webp|png|jpg)      e.g. art/rooms/study.webp
//   art/portraits/<portrait-key>.(webp|png|jpg)     e.g. art/portraits/man-glasses.webp
//   art/portraits/<suspect-id>.(webp|png|jpg)       per-character override, e.g. art/portraits/vance.webp
//   art/audio/<key>.(ogg|mp3)                       music, music-<ambience>, ambience-rain, ambience-<ambience>
// The registry picks them up at build time; nothing else needs to change. See README "Replacing placeholder art".

const files = import.meta.glob<string>('./art/**/*.{webp,png,jpg,jpeg,svg,ogg,mp3}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const byCategory: Record<string, Map<string, string>> = { rooms: new Map(), portraits: new Map(), audio: new Map() };

for (const [path, url] of Object.entries(files)) {
  const m = /\.\/art\/(rooms|portraits|audio)\/([^/]+)\.[a-z0-9]+$/i.exec(path);
  if (!m) continue;
  byCategory[m[1]!.toLowerCase()]!.set(m[2]!.toLowerCase(), url);
}

export function backgroundArt(key: string): string | null {
  return byCategory.rooms!.get(key.toLowerCase()) ?? null;
}

export function portraitArt(portraitKey: string, suspectId?: string): string | null {
  const p = byCategory.portraits!;
  return (suspectId ? p.get(suspectId.toLowerCase()) : undefined) ?? p.get(portraitKey.toLowerCase()) ?? null;
}

export function audioArt(key: string): string | null {
  return byCategory.audio!.get(key.toLowerCase()) ?? null;
}

export function registrySummary(): Record<string, string[]> {
  return Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, [...v.keys()]]));
}
