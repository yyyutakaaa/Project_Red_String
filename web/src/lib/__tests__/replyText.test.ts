import { describe, expect, it } from 'vitest';
import { splitReply, spokenOnly } from '../replyText.ts';

describe('reply text', () => {
  it('splits actions between asterisks from speech', () => {
    expect(splitReply('*looks away* I was home all night.')).toEqual([
      { kind: 'action', text: 'looks away' },
      { kind: 'speech', text: ' I was home all night.' },
    ]);
    expect(splitReply('I told you. *taps the table* Twice.')).toEqual([
      { kind: 'speech', text: 'I told you. ' },
      { kind: 'action', text: 'taps the table' },
      { kind: 'speech', text: ' Twice.' },
    ]);
  });

  it('never shows a star while an action is still streaming in', () => {
    expect(splitReply('Fine. *sigh')).toEqual([
      { kind: 'speech', text: 'Fine. ' },
      { kind: 'action', text: 'sigh' },
    ]);
    expect(splitReply('Fine. *')).toEqual([{ kind: 'speech', text: 'Fine.' }]);
  });

  it('treats double stars like single ones and leaves plain text alone', () => {
    expect(splitReply('**shrugs** No.')).toEqual([
      { kind: 'action', text: 'shrugs' },
      { kind: 'speech', text: ' No.' },
    ]);
    expect(splitReply('Just words.')).toEqual([{ kind: 'speech', text: 'Just words.' }]);
  });

  it('quotes only the spoken words', () => {
    expect(spokenOnly('*leans back* I never left the ballroom. *smiles*')).toBe('I never left the ballroom.');
  });
});
