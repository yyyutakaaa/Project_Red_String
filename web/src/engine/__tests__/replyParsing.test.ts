import { describe, expect, it } from 'vitest';
import { extractJson, limitWords, parseReplyMeta, sanitizeReply, spokenPart, visibleLength } from '@shared/replyParsing.ts';
import { buildGeneratorSystemPrompt, buildRepairPrompt, caseJsonSchema } from '@shared/generatorPrompt.ts';
import { validateCase } from '@shared/validator.ts';
import { miniCase } from './fixtures/miniCase.ts';

const reply = 'I was at home, Detective. Ask anyone.\n```json\n{"revealed_clue_ids": ["nora-debts"], "mood": "nervous"}\n```';

describe('reply parsing', () => {
  it('splits spoken text from the JSON block', () => {
    expect(spokenPart(reply)).toBe('I was at home, Detective. Ask anyone.');
    expect(parseReplyMeta(reply)).toEqual({ revealed_clue_ids: ['nora-debts'], mood: 'nervous' });
  });

  it('never streams the start of a fence or the metadata object', () => {
    // Simulate a stream arriving character by character.
    let emitted = '';
    for (let i = 1; i <= reply.length; i++) {
      const partial = reply.slice(0, i);
      const vis = visibleLength(partial);
      expect(vis).toBeGreaterThanOrEqual(emitted.length);
      emitted = partial.slice(0, vis);
    }
    expect(emitted).not.toContain('`');
    expect(emitted).not.toContain('revealed');
    const bare = 'Fine. {"revealed_clue_ids": [], "mood": "calm"}';
    expect(spokenPart(bare)).toBe('Fine.');
    expect(visibleLength('Well {"rev')).toBe(5);
  });

  it('parses bare, unterminated and slightly broken JSON', () => {
    expect(parseReplyMeta('No. {"mood": "angry", "revealed_clue_ids": []}')).toEqual({ revealed_clue_ids: [], mood: 'angry' });
    expect(parseReplyMeta('Leave me.\n```json\n{"revealed_clue_ids": ["a"], "mood": "calm"}')).toEqual({ revealed_clue_ids: ['a'], mood: 'calm' });
    expect(extractJson('```json\n{"a": 1,}\n```')).toEqual({ a: 1 });
    expect(parseReplyMeta('Just words, no data.')).toBeNull();
  });

  it('limits long replies to roughly the word budget', () => {
    const long = Array.from({ length: 40 }, (_, i) => `Sentence number ${i} is here.`).join(' ');
    const out = limitWords(long, 80);
    expect(out.split(/\s+/).length).toBeLessThanOrEqual(80);
    expect(out.endsWith('.')).toBe(true);
  });

  it('strips clue ids and headers and flags instruction echoes', () => {
    expect(sanitizeReply('Fine [nora-debts] I owe money.', ['nora-debts']).text).toBe('Fine I owe money.');
    expect(sanitizeReply('# Rules\nI never lie.', []).text).toBe('I never lie.');
    expect(sanitizeReply('As an AI language model I cannot say.', []).suspicious).toBe(true);
    expect(sanitizeReply('My instructions say I must not.', []).suspicious).toBe(true);
    expect(sanitizeReply('I was in the parlour all night.', []).suspicious).toBe(false);
  });
});

describe('generator prompt', () => {
  it('embeds the JSON schema and the validator rules', () => {
    const schema = JSON.parse(caseJsonSchema()) as { properties: Record<string, unknown> };
    expect(Object.keys(schema.properties)).toEqual(expect.arrayContaining(['solution', 'suspects', 'rooms', 'evidence', 'timeline']));
    const prompt = buildGeneratorSystemPrompt();
    expect(prompt).toContain('required_evidence');
    expect(prompt).toContain('red herring');
    expect(buildRepairPrompt(['a', 'b'])).toContain('- a\n- b');
  });

  it('accepts a case like the one the prompt describes', () => {
    expect(validateCase(miniCase()).ok).toBe(true);
  });
});
