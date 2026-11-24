// The words of a case that a player reads, as a flat map of keys to text, and the way back.
//
// Translations of a case are stored as such a map (src/cases/i18n/<lang>/<case>.json) and laid over
// the English case when it is shown. Ids, rules and everything the suspects' model reads stay
// English: suspects get their sheet in English and answer in the player's language.
//
// Keys use ids where the case has them and positions where it does not:
//   title, intro_briefing.0, rooms.<room>.name, rooms.<room>.hotspots.<hotspot>.label,
//   evidence.<id>.description, suspects.<id>.clues.<clue>.text, timeline.3.what, hints.0, ...
//
// No value imports: tools/translate runs this file with plain Node.
import type { CaseFile } from '@shared/caseSchema.ts';

export type CaseStrings = Record<string, string>;

/** Every piece of text a player can read in the case, by key. */
export function caseStrings(c: CaseFile): CaseStrings {
  const out: CaseStrings = {};
  const put = (key: string, value: string | undefined) => {
    if (typeof value === 'string' && value.trim()) out[key] = value;
  };
  put('title', c.title);
  put('tagline', c.tagline);
  put('setting', c.setting);
  put('era', c.era);
  c.intro_briefing.forEach((p, i) => put(`intro_briefing.${i}`, p));
  put('victim.description', c.victim.description);
  put('victim.cause_of_death', c.victim.cause_of_death);
  put('victim.found_at', c.victim.found_at);
  put('solution.reveal', c.solution.reveal);
  c.timeline.forEach((e, i) => put(`timeline.${i}.what`, e.what));
  for (const o of c.offstage_locations) put(`offstage.${o.id}.name`, o.name);
  for (const r of c.rooms) {
    put(`rooms.${r.id}.name`, r.name);
    put(`rooms.${r.id}.description`, r.description);
    for (const h of r.hotspots) {
      put(`rooms.${r.id}.hotspots.${h.id}.label`, h.label);
      put(`rooms.${r.id}.hotspots.${h.id}.description`, h.description);
    }
  }
  for (const e of c.evidence) {
    put(`evidence.${e.id}.name`, e.name);
    put(`evidence.${e.id}.description`, e.description);
  }
  for (const s of c.suspects) {
    put(`suspects.${s.id}.role`, s.role);
    put(`suspects.${s.id}.alibi`, s.alibi);
    s.public_facts.forEach((f, i) => put(`suspects.${s.id}.public_facts.${i}`, f));
    for (const cl of s.revealable_clues) put(`suspects.${s.id}.clues.${cl.clue_id}.text`, cl.text);
    put(`suspects.${s.id}.alibi_note`, s.alibi_verification.note);
  }
  c.hints.forEach((h, i) => put(`hints.${i}`, h));
  put('endings.correct', c.endings.correct);
  put('endings.wrong_culprit', c.endings.wrong_culprit);
  put('endings.weak_proof', c.endings.weak_proof);
  return out;
}

// A translated case remembers the English objects it was made from, so the drawings (which pick
// furniture and evidence photographs from English names and labels) look the same in every language.
const english = new WeakMap<object, object>();

/** The English original of a translated room, hotspot or case; the object itself otherwise. */
export function englishOf<T extends object>(obj: T): T {
  return (english.get(obj) as T | undefined) ?? obj;
}

/** The case with every translated string laid over the English one. Missing keys stay English. */
export function localizeCase(c: CaseFile, strings: CaseStrings | null | undefined): CaseFile {
  if (!strings || Object.keys(strings).length === 0) return c;
  const pick = (key: string, fallback: string): string => {
    const v = strings[key];
    return typeof v === 'string' && v.trim() ? v : fallback;
  };
  const remember = <T extends object>(copy: T, original: T): T => {
    english.set(copy, original);
    return copy;
  };
  const out: CaseFile = {
    ...c,
    title: pick('title', c.title),
    tagline: pick('tagline', c.tagline),
    setting: pick('setting', c.setting),
    era: pick('era', c.era),
    intro_briefing: c.intro_briefing.map((p, i) => pick(`intro_briefing.${i}`, p)),
    victim: {
      ...c.victim,
      description: pick('victim.description', c.victim.description),
      cause_of_death: pick('victim.cause_of_death', c.victim.cause_of_death),
      found_at: pick('victim.found_at', c.victim.found_at),
    },
    solution: { ...c.solution, reveal: pick('solution.reveal', c.solution.reveal) },
    timeline: c.timeline.map((e, i) => ({ ...e, what: pick(`timeline.${i}.what`, e.what) })),
    offstage_locations: c.offstage_locations.map((o) => ({ ...o, name: pick(`offstage.${o.id}.name`, o.name) })),
    rooms: c.rooms.map((r) =>
      remember(
        {
          ...r,
          name: pick(`rooms.${r.id}.name`, r.name),
          description: pick(`rooms.${r.id}.description`, r.description),
          hotspots: r.hotspots.map((h) =>
            remember(
              {
                ...h,
                label: pick(`rooms.${r.id}.hotspots.${h.id}.label`, h.label),
                description: pick(`rooms.${r.id}.hotspots.${h.id}.description`, h.description),
              },
              h,
            ),
          ),
        },
        r,
      ),
    ),
    evidence: c.evidence.map((e) =>
      remember(
        {
          ...e,
          name: pick(`evidence.${e.id}.name`, e.name),
          description: pick(`evidence.${e.id}.description`, e.description),
        },
        e,
      ),
    ),
    suspects: c.suspects.map((s) => ({
      ...s,
      role: pick(`suspects.${s.id}.role`, s.role),
      alibi: pick(`suspects.${s.id}.alibi`, s.alibi),
      public_facts: s.public_facts.map((f, i) => pick(`suspects.${s.id}.public_facts.${i}`, f)),
      revealable_clues: s.revealable_clues.map((cl) => ({ ...cl, text: pick(`suspects.${s.id}.clues.${cl.clue_id}.text`, cl.text) })),
      alibi_verification: { ...s.alibi_verification, note: pick(`suspects.${s.id}.alibi_note`, s.alibi_verification.note) },
    })),
    hints: c.hints.map((h, i) => pick(`hints.${i}`, h)),
    endings: {
      correct: pick('endings.correct', c.endings.correct),
      wrong_culprit: pick('endings.wrong_culprit', c.endings.wrong_culprit),
      weak_proof: pick('endings.weak_proof', c.endings.weak_proof),
    },
  };
  return remember(out, c);
}
