// Asset registry. Every visual and sound has a key. By default the game draws rooms, props and portraits
// procedurally (SVG/CSS) and synthesises audio. To use real art, drop files into src/assets/art/:
//   art/rooms/<background-key>.(webp|png|jpg)      e.g. art/rooms/study.webp
//   art/portraits/<portrait-key>.(webp|png|jpg)     e.g. art/portraits/man-glasses.webp
//   art/portraits/<suspect-id>.(webp|png|jpg)       per-character override, e.g. art/portraits/vance.webp
//   art/audio/<key>.(ogg|mp3)                       music, music-<ambience>, ambience-rain, ambience-<ambience>
//   art/cutscenes/<case-id>/<layer>.(webp|png|svg)   one layer of a cutscene panel, e.g. art/cutscenes/tutorial/door-doyle.png
//                                                    (1600 x 900, transparent around the drawing; see src/cutscene/scripts)
//   art/backdrops/<scene>/<layer>.(webp|png|jpg)    painted layers behind the screens, see src/backdrop/scenes.ts
// The registry picks them up at build time; nothing else needs to change. See README "Replacing placeholder art".

const files = import.meta.glob<string>('./art/**/*.{webp,png,jpg,jpeg,svg,ogg,mp3}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const byCategory: Record<string, Map<string, string>> = { rooms: new Map(), portraits: new Map(), audio: new Map() };
const backdrops = new Map<string, string>();

const cutscenes = new Map<string, string>();

for (const [path, url] of Object.entries(files)) {
  const cut = /\.\/art\/cutscenes\/([^/]+)\/([^/]+)\.[a-z0-9]+$/i.exec(path);
  if (cut) {
    cutscenes.set(`${cut[1]!.toLowerCase()}/${cut[2]!.toLowerCase()}`, url);
    continue;
  }
  const b = /\.\/art\/backdrops\/([^/]+)\/([^/]+)\.[a-z0-9]+$/i.exec(path);
  if (b) {
    backdrops.set(`${b[1]!.toLowerCase()}/${b[2]!.toLowerCase()}`, url);
    continue;
  }
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

/** Every painted portrait, by key (suspect ids and the stock faces of generated cases). */
export function portraitKeys(): string[] {
  return [...byCategory.portraits!.keys()].sort();
}

/** A real drawing for one layer of a cutscene, if one was dropped in. */
export function cutsceneArt(cutsceneId: string, layer: string): string | null {
  return cutscenes.get(`${cutsceneId.toLowerCase()}/${layer.toLowerCase()}`) ?? null;
}

/** A painted layer of a screen backdrop: art/backdrops/<scene>/<layer>. */
export function backdropArt(scene: string, layer: string): string | null {
  return backdrops.get(`${scene.toLowerCase()}/${layer.toLowerCase()}`) ?? null;
}

export function audioArt(key: string): string | null {
  return byCategory.audio!.get(key.toLowerCase()) ?? null;
}

export function registrySummary(): Record<string, string[]> {
  return { ...Object.fromEntries(Object.entries(byCategory).map(([k, v]) => [k, [...v.keys()]])), cutscenes: [...cutscenes.keys()] };
}
