// Case validator. One implementation shared by the web app, the edge functions and the case generator.
// validateCase() never throws: it returns human-readable errors so they can be shown to authors
// or sent back to the model that generated the case.
import { CaseFile, parseCondition, type CaseFileInput, type Suspect } from './caseSchema.ts';

export type ValidationResult =
  | { ok: true; case: CaseFile; errors: []; warnings: string[] }
  | { ok: false; case: null; errors: string[]; warnings: string[] };

function formatPath(path: ReadonlyArray<PropertyKey>): string {
  if (path.length === 0) return '(root)';
  return path
    .map((p, i) => (typeof p === 'number' ? `[${p}]` : `${i === 0 ? '' : '.'}${String(p)}`))
    .join('');
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Strings a suspect's prompt may contain. Must match what buildSuspectPrompt() reads. */
export function suspectPromptStrings(s: Suspect): string[] {
  return [
    s.name,
    s.role,
    s.personality,
    s.speech_style,
    s.alibi,
    ...s.public_facts,
    ...s.private_knowledge,
    ...s.lies.flatMap((l) => [l.topic, l.claim, l.truth]),
    ...s.secrets,
    ...s.never_reveal,
    ...s.revealable_clues.map((c) => c.text),
  ];
}

/**
 * Which evidence ids and clue ids a player can actually obtain.
 * Hotspot evidence is always obtainable. A clue is reachable when its condition can be met:
 * free and pressed clues always, shown_evidence:<id> clues once <id> is obtainable.
 */
export function computeReachability(c: CaseFile): { evidence: Set<string>; clues: Set<string> } {
  const evidence = new Set<string>();
  const clues = new Set<string>();
  for (const room of c.rooms) {
    for (const h of room.hotspots) if (h.evidence_id) evidence.add(h.evidence_id);
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const s of c.suspects) {
      for (const clue of s.revealable_clues) {
        if (clues.has(clue.clue_id)) continue;
        const cond = parseCondition(clue.condition);
        const reachable = cond.kind !== 'shown_evidence' || evidence.has(cond.evidenceId);
        if (reachable) {
          clues.add(clue.clue_id);
          if (clue.evidence_id && !evidence.has(clue.evidence_id)) evidence.add(clue.evidence_id);
          changed = true;
        }
      }
    }
  }
  return { evidence, clues };
}

function timeKey(day: number, time: string): number {
  const [h, m] = time.split(':').map(Number);
  return day * 24 * 60 + (h ?? 0) * 60 + (m ?? 0);
}

export function validateCase(input: unknown): ValidationResult {
  const parsed = CaseFile.safeParse(input);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((i) => `${formatPath(i.path)}: ${i.message}`);
    return { ok: false, case: null, errors, warnings: [] };
  }
  const c = parsed.data;
  const errors: string[] = [];
  const warnings: string[] = [];

  // ---- id uniqueness -------------------------------------------------------
  const seen = new Map<string, string>();
  const claim = (id: string, what: string) => {
    const prev = seen.get(id);
    if (prev) errors.push(`Duplicate id "${id}" used by ${prev} and ${what}.`);
    else seen.set(id, what);
  };
  claim(c.victim.id, 'the victim');
  for (const r of c.rooms) claim(r.id, `room "${r.name}"`);
  for (const o of c.offstage_locations) claim(o.id, `offstage location "${o.name}"`);
  for (const s of c.suspects) claim(s.id, `suspect "${s.name}"`);
  for (const e of c.evidence) claim(e.id, `evidence "${e.name}"`);
  const hotspotIds = new Set<string>();
  for (const r of c.rooms) {
    for (const h of r.hotspots) {
      const key = `${r.id}/${h.id}`;
      if (hotspotIds.has(key)) errors.push(`Room "${r.id}" has two hotspots with id "${h.id}".`);
      hotspotIds.add(key);
    }
  }
  const clueOwner = new Map<string, string>();
  for (const s of c.suspects) {
    for (const clue of s.revealable_clues) {
      const prev = clueOwner.get(clue.clue_id);
      if (prev) errors.push(`Clue id "${clue.clue_id}" is used by both "${prev}" and "${s.id}".`);
      else clueOwner.set(clue.clue_id, s.id);
      if (seen.has(clue.clue_id)) errors.push(`Clue id "${clue.clue_id}" collides with ${seen.get(clue.clue_id)}.`);
    }
  }

  const roomIds = new Set(c.rooms.map((r) => r.id));
  const locationIds = new Set([...roomIds, ...c.offstage_locations.map((o) => o.id)]);
  const suspectIds = new Set(c.suspects.map((s) => s.id));
  const evidenceById = new Map(c.evidence.map((e) => [e.id, e]));
  const suspectById = new Map(c.suspects.map((s) => [s.id, s]));

  // ---- reference resolution ------------------------------------------------
  if (!roomIds.has(c.victim.found_in)) errors.push(`victim.found_in "${c.victim.found_in}" is not a room id.`);

  const hotspotSource = new Map<string, string[]>();
  for (const r of c.rooms) {
    for (const h of r.hotspots) {
      if (h.x + h.width > 100.01 || h.y + h.height > 100.01) {
        errors.push(`Hotspot "${r.id}/${h.id}" extends outside the room (x+width and y+height must be at most 100).`);
      }
      if (h.evidence_id === null) continue;
      const ev = evidenceById.get(h.evidence_id);
      if (!ev) {
        errors.push(`Hotspot "${r.id}/${h.id}" references unknown evidence "${h.evidence_id}".`);
        continue;
      }
      if (ev.found_in !== r.id) {
        errors.push(`Evidence "${ev.id}" is placed in room "${r.id}" but its found_in is "${ev.found_in}".`);
      }
      hotspotSource.set(ev.id, [...(hotspotSource.get(ev.id) ?? []), `${r.id}/${h.id}`]);
    }
  }

  const clueSource = new Map<string, string[]>();
  for (const s of c.suspects) {
    for (const clue of s.revealable_clues) {
      const cond = parseCondition(clue.condition);
      if (cond.kind === 'shown_evidence' && !evidenceById.has(cond.evidenceId)) {
        errors.push(`Clue "${clue.clue_id}" of "${s.id}" requires unknown evidence "${cond.evidenceId}".`);
      }
      if (clue.evidence_id) {
        const ev = evidenceById.get(clue.evidence_id);
        if (!ev) errors.push(`Clue "${clue.clue_id}" of "${s.id}" grants unknown evidence "${clue.evidence_id}".`);
        else {
          if (ev.found_in !== s.id) {
            errors.push(`Clue "${clue.clue_id}" grants evidence "${ev.id}" whose found_in is "${ev.found_in}", not "${s.id}".`);
          }
          clueSource.set(ev.id, [...(clueSource.get(ev.id) ?? []), clue.clue_id]);
        }
      }
    }
    for (const b of s.breaks_on) {
      if (!evidenceById.has(b)) errors.push(`Suspect "${s.id}" breaks_on unknown evidence "${b}".`);
    }
  }

  for (const e of c.evidence) {
    for (const p of e.points_to) {
      if (!suspectIds.has(p)) errors.push(`Evidence "${e.id}" points_to unknown suspect "${p}".`);
    }
    const isRoom = roomIds.has(e.found_in);
    const isSuspect = suspectIds.has(e.found_in);
    if (!isRoom && !isSuspect) errors.push(`Evidence "${e.id}" found_in "${e.found_in}" is neither a room nor a suspect.`);
    if (isRoom && !hotspotSource.has(e.id)) errors.push(`Evidence "${e.id}" says it is in room "${e.found_in}" but no hotspot there holds it.`);
    if (isSuspect && !clueSource.has(e.id)) errors.push(`Evidence "${e.id}" is held by "${e.found_in}" but none of their clues grant it.`);
  }

  c.timeline.forEach((ev, i) => {
    if (!locationIds.has(ev.location)) errors.push(`timeline[${i}] location "${ev.location}" is not a room or offstage location.`);
    for (const w of ev.who) {
      if (!suspectIds.has(w) && w !== c.victim.id) errors.push(`timeline[${i}] who "${w}" is not a suspect or the victim.`);
    }
    if (i > 0) {
      const prev = c.timeline[i - 1]!;
      if (timeKey(ev.day, ev.time) < timeKey(prev.day, prev.time)) {
        errors.push(`timeline[${i}] (${ev.time}) is earlier than timeline[${i - 1}] (${prev.time}); keep events in order.`);
      }
    }
  });

  // ---- solution ------------------------------------------------------------
  const { culprit_id, required_evidence } = c.solution;
  const culprit = suspectById.get(culprit_id);
  if (!culprit) errors.push(`solution.culprit_id "${culprit_id}" is not a suspect.`);

  const reach = computeReachability(c);
  if (new Set(required_evidence).size !== required_evidence.length) errors.push('solution.required_evidence contains duplicates.');
  for (const rid of required_evidence) {
    const ev = evidenceById.get(rid);
    if (!ev) {
      errors.push(`solution.required_evidence "${rid}" is not an evidence id.`);
      continue;
    }
    if (!reach.evidence.has(rid)) errors.push(`Required evidence "${rid}" cannot be obtained from any hotspot or reachable clue.`);
    if (ev.is_red_herring) errors.push(`Required evidence "${rid}" is marked as a red herring.`);
  }
  if (culprit && !required_evidence.some((rid) => evidenceById.get(rid)?.points_to.includes(culprit_id))) {
    errors.push('At least one required evidence item must point_to the culprit.');
  }
  for (const e of c.evidence) {
    if (!reach.evidence.has(e.id)) warnings.push(`Evidence "${e.id}" can never be obtained.`);
  }
  for (const s of c.suspects) {
    for (const clue of s.revealable_clues) {
      if (!reach.clues.has(clue.clue_id)) errors.push(`Clue "${clue.clue_id}" of "${s.id}" can never be revealed (its evidence is unobtainable).`);
    }
  }

  // ---- fairness ------------------------------------------------------------
  const nonCulpritSuspicious = c.suspects.some(
    (s) => s.id !== culprit_id && (s.lies.length > 0 || c.evidence.some((e) => e.points_to.includes(s.id))),
  );
  if (!nonCulpritSuspicious) {
    errors.push('No innocent suspect has evidence pointing to them or a lie; the answer would be obvious.');
  }
  if (!c.evidence.some((e) => e.is_red_herring)) errors.push('The case needs at least one red herring.');

  // ---- opportunity ---------------------------------------------------------
  const crimeEvents = c.timeline.filter((e) => e.tags.includes('crime'));
  if (crimeEvents.length === 0) errors.push('The timeline needs at least one event tagged "crime".');
  if (culprit && !crimeEvents.some((e) => e.who.includes(culprit_id))) {
    errors.push('No "crime" timeline event includes the culprit, so the culprit has no opportunity.');
  }
  for (const e of crimeEvents) {
    if (e.visibility !== 'hidden') errors.push(`Crime event at ${e.time} must have visibility "hidden".`);
  }

  // ---- alibis --------------------------------------------------------------
  for (const s of c.suspects) {
    const v = s.alibi_verification;
    if (v.evidence_ids.length === 0 && v.clue_ids.length === 0) {
      errors.push(`Alibi of "${s.id}" is neither confirmed nor broken by any evidence or clue.`);
    }
    for (const eid of v.evidence_ids) {
      if (!evidenceById.has(eid)) errors.push(`Alibi of "${s.id}" refers to unknown evidence "${eid}".`);
      else if (!reach.evidence.has(eid)) errors.push(`Alibi of "${s.id}" relies on unobtainable evidence "${eid}".`);
    }
    for (const cid of v.clue_ids) {
      const owner = clueOwner.get(cid);
      if (!owner) errors.push(`Alibi of "${s.id}" refers to unknown clue "${cid}".`);
      else if (v.status === 'confirmed' && owner === s.id && v.evidence_ids.length === 0) {
        errors.push(`Alibi of "${s.id}" is only confirmed by their own testimony; confirm it with another fact.`);
      }
    }
    if (s.id === culprit_id && v.status !== 'broken') errors.push(`The culprit's alibi must be broken by evidence, not confirmed.`);
    if (s.id === culprit_id && !v.evidence_ids.some((eid) => reach.evidence.has(eid))) {
      errors.push(`The culprit's alibi must be broken by at least one obtainable evidence item.`);
    }
  }

  // ---- prompt hygiene ------------------------------------------------------
  const secretsOfSolution = [c.solution.motive, c.solution.method, c.solution.reveal]
    .map(normalize)
    .filter((t) => t.length >= 12);
  for (const s of c.suspects) {
    const blob = normalize(suspectPromptStrings(s).join(' | '));
    for (const secret of secretsOfSolution) {
      if (blob.includes(secret)) {
        errors.push(`Suspect "${s.id}" prompt data contains the solution text "${secret.slice(0, 40)}..."; rephrase it in their own words.`);
      }
    }
    if (/\bculprit_id\b|\brequired_evidence\b|"solution"/.test(JSON.stringify(s))) {
      errors.push(`Suspect "${s.id}" prompt data contains solution fields.`);
    }
    if (s.revealable_clues.length === 0 && s.id !== culprit_id) {
      warnings.push(`Suspect "${s.id}" has no revealable clues.`);
    }
  }

  if (errors.length > 0) return { ok: false, case: null, errors, warnings };
  return { ok: true, case: c, errors: [], warnings };
}

/** Parse + validate, throwing with all errors joined. Handy for bundled story cases. */
export function loadCaseOrThrow(input: unknown): CaseFile {
  const r = validateCase(input);
  if (!r.ok) throw new Error(`Invalid case:\n- ${r.errors.join('\n- ')}`);
  return r.case;
}

export type { CaseFileInput };
