// The partner's prompt: Sergeant Doyle says one short thing about what the detective just found out.
//
// He is told only that one observation and the facts it rests on, which the player has already seen
// (the evidence, what a suspect said, who is named). He never sees the solution, the culprit, the
// lies on anyone's sheet or what is still hidden, so he cannot give the case away even if he tried.
import type { CaseFile } from './caseSchema.ts';
import { PLAY_LANGUAGES, type PlayLanguage } from './language.ts';

export const PARTNER_KINDS = ['explains', 'contradicts', 'confirms', 'askAbout', 'changedStory', 'holdingOut'] as const;
export type PartnerKind = (typeof PARTNER_KINDS)[number];

export const PARTNER_MAX_WORDS = 28;

export interface PartnerInput {
  caseFile: CaseFile;
  kind: PartnerKind;
  language: PlayLanguage;
  suspectId?: string | null;
  speakerId?: string | null;
  evidenceId?: string | null;
  clueId?: string | null;
  /** What the suspect just said, when the remark is about their reply (shown to the player already). */
  said?: string | null;
}

function who(c: CaseFile, id: string | null | undefined): string | null {
  const s = id ? c.suspects.find((x) => x.id === id) : null;
  return s ? `${s.name} (${s.role})` : null;
}

/** The observation in plain words, or null when the ids do not fit the case. */
export function observation(input: PartnerInput): string | null {
  const { caseFile: c, kind } = input;
  const person = who(c, input.suspectId);
  const speaker = who(c, input.speakerId);
  const e = input.evidenceId ? c.evidence.find((x) => x.id === input.evidenceId) : null;
  const clue = input.clueId ? c.suspects.flatMap((s) => s.revealable_clues).find((cl) => cl.clue_id === input.clueId) : null;
  const evidence = e ? `${e.name}: ${e.description}` : null;
  const statement = clue && speaker ? `${speaker} just told us: ${clue.text}` : null;
  switch (kind) {
    case 'explains':
      return statement && evidence ? `${statement}\nThat explains a piece of evidence we found earlier. ${evidence}` : null;
    case 'contradicts': {
      const fact = statement ?? (evidence ? `We just found this. ${evidence}` : null);
      const alibi = person ? c.suspects.find((s) => s.id === input.suspectId)?.alibi : null;
      return fact && person && alibi ? `${fact}\nThat does not fit the story ${person} gave us about where they were: "${alibi}"` : null;
    }
    case 'confirms': {
      const fact = statement ?? (evidence ? `We just found this. ${evidence}` : null);
      const alibi = person ? c.suspects.find((s) => s.id === input.suspectId)?.alibi : null;
      return fact && person && alibi ? `${fact}\nThat backs up the story ${person} gave us about where they were: "${alibi}"` : null;
    }
    case 'askAbout': {
      const fact = statement ?? (evidence ? `We just found this. ${evidence}` : null);
      return fact && person ? `${fact}\n${person} is named in it, and we have not asked them about it yet. Suggest asking ${person} about it.` : null;
    }
    case 'changedStory':
      return person && evidence
        ? `We put this in front of ${person}. ${evidence}\nThey gave way: what they say now is not the story they told us before.${input.said ? ` What they just said: "${input.said}"` : ''}`
        : null;
    case 'holdingOut':
      return person && evidence
        ? `We put this in front of ${person}. ${evidence}\nThey are holding on to their story for now. Pressing them again, or coming back with more, may help.`
        : null;
  }
}

export function buildPartnerPrompt(input: PartnerInput): { system: string; user: string } | null {
  const obs = observation(input);
  if (!obs) return null;
  const lang = PLAY_LANGUAGES[input.language];
  const system = [
    `You are Sergeant Doyle, an old beat cop in Calder City in ${input.caseFile.era}. You work this case next to the detective (the player) and you think out loud now and then.`,
    `You say ONE short remark in ${lang}, at most ${PARTNER_MAX_WORDS} words, one or two sentences, spoken like a tired, kind, sharp old cop. Address the detective informally where the language has a choice${input.language === 'fr' ? ' (use "vous")' : ''}.`,
    'The remark is about the observation you are given and nothing else, for example "Ah, so that explains the note." or "Maybe we should ask her about that." or "Hm, a minute ago that was a different story."',
    'Rules:',
    '- You help the detective think. You never solve the case: never say or hint who did it, never call anyone guilty, a killer or a liar, never say something proves anything.',
    '- Use only the facts given. Do not add names, times, places, motives or events.',
    `- Write only the remark, in ${lang}, as plain text. No quotes around it, no name tag, no actions between asterisks, no dashes.`,
    `- Case: ${input.caseFile.title}. Setting: ${input.caseFile.setting}.`,
  ].join('\n');
  return { system, user: `Observation:\n${obs}\n\nYour remark, in ${lang}:` };
}

/** Clean what came back: one line, no surrounding quotes or speaker tag, at most PARTNER_MAX_WORDS + a few words. */
export function cleanPartnerLine(text: string): string {
  let out = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\*[^*]*\*/g, ' ')
    .replace(/^\s*(sergeant\s+)?doyle\s*:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^["“”„«»'‘’]+|["“”„«»'‘’]+$/g, '')
    .replace(/\s*[—–]\s*/g, ', ')
    .trim();
  const words = out.split(' ');
  if (words.length > PARTNER_MAX_WORDS + 6) out = `${words.slice(0, PARTNER_MAX_WORDS + 6).join(' ').replace(/[,;:]$/, '')}...`;
  return out;
}
