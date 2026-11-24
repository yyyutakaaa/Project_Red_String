import type { CSSProperties } from 'react';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { ButtonLink } from '../components/Button.tsx';
import { Portrait } from '../components/Portrait.tsx';
import { casePath, useCaseContext } from '../hooks/useCase.ts';
import { useAmbience } from '../hooks/useAmbience.ts';
import { ambienceForBackground } from '../audio/audio.ts';
import { getConversation, moodLabel } from '../store/game.ts';
import styles from './Suspects.module.css';

/** Height marks painted on the lineup wall behind each portrait. */
const HEIGHT_MARKS = ['6′6″', '6′', '5′6″', '5′', '4′6″'];

export function Suspects() {
  const { caseFile, caseKey, progress } = useCaseContext();
  const victimRoom = caseFile.rooms.find((r) => r.id === caseFile.victim.found_in);
  useAmbience(ambienceForBackground(victimRoom?.background ?? caseFile.rooms[0]?.background));

  return (
    <ScreenFrame
      kicker={caseFile.title}
      title="The lineup"
      actions={
        <>
          <ButtonLink to={casePath(caseKey, 'rooms')} variant="ghost">
            Scenes
          </ButtonLink>
          <ButtonLink to={casePath(caseKey, 'board')}>Board</ButtonLink>
        </>
      }
    >
      <p className={styles.lede}>
        {caseFile.suspects.length} people with a reason to lie tonight. Each one has a story ready. Find the one that does not hold.
      </p>

      <ol className={styles.lineup}>
        {caseFile.suspects.map((s, i) => {
          const conv = getConversation(progress, caseFile, s.id);
          const max = Math.max(0, conv.patienceMax);
          const left = Math.max(0, max - conv.patienceUsed);
          const asked = conv.messages.filter((m) => m.role === 'detective').length;
          const slips = s.revealable_clues.filter((c) => progress.revealedClues.includes(c.clue_id)).length;
          const shown = conv.shownEvidence.length;
          const action = left === 0 ? 'Read the transcript' : asked === 0 ? 'Interrogate' : 'Resume interrogation';
          const pct = max > 0 ? (left / max) * 100 : 0;
          return (
            <li key={s.id} className={styles.card} data-mood={conv.mood} data-spent={left === 0 || undefined} style={{ '--delay': `${i * 70}ms` } as CSSProperties}>
              <div className={styles.wall}>
                <div className={styles.marks} aria-hidden="true">
                  {HEIGHT_MARKS.map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
                <div className={styles.lamp} aria-hidden="true" />
                <Portrait suspect={s} mood={conv.mood} size={168} showInitials={false} className={styles.portrait} />
                <span className={styles.placard} aria-hidden="true">
                  No. {i + 1}
                </span>
              </div>

              <div className={styles.body}>
                <header className={styles.head}>
                  <h2 className={styles.name}>{s.name}</h2>
                  <p className={styles.role}>
                    {s.role}
                    <span className={styles.age}>Age {s.age}</span>
                  </p>
                </header>

                <dl className={styles.stats}>
                  <div className={styles.stat}>
                    <dt>Mood</dt>
                    <dd>
                      <span className={styles.mood} data-mood={conv.mood}>
                        {moodLabel(conv.mood)}
                      </span>
                    </dd>
                  </div>
                  <div className={styles.stat}>
                    <dt>Questions left</dt>
                    <dd>
                      <strong>{left}</strong> of {max}
                    </dd>
                  </div>
                </dl>
                <div className={styles.patience} aria-hidden="true">
                  <span style={{ width: `${pct}%` }} />
                </div>

                <blockquote className={styles.alibi}>
                  <p>
                    <span className={styles.claims}>Claims:</span> {s.alibi}
                  </p>
                </blockquote>

                <section className={styles.factsBlock} aria-label={`What is on record about ${s.name}`}>
                  <h3 className={styles.factsTitle}>On record</h3>
                  <ul className={styles.facts}>
                    {s.public_facts.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </section>

                <p className={styles.status}>
                  {asked === 0 ? 'Not yet questioned.' : `${asked} ${asked === 1 ? 'question' : 'questions'} on record.`}
                  {shown > 0 && ` Shown ${shown} ${shown === 1 ? 'exhibit' : 'exhibits'}.`}
                  {slips > 0 && ` ${slips} ${slips === 1 ? 'slip' : 'slips'} noted.`}
                  {left === 0 && ' Has nothing more to say.'}
                </p>

                <ButtonLink
                  to={casePath(caseKey, `interrogate/${s.id}`)}
                  variant={left === 0 ? 'default' : 'lamp'}
                  block
                  className={styles.cta}
                  data-testid={`interrogate-${s.id}`}
                >
                  {action}
                  <span className="visually-hidden"> {s.name}</span>
                </ButtonLink>
              </div>
            </li>
          );
        })}
      </ol>
    </ScreenFrame>
  );
}
