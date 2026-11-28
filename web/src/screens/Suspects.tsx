import type { CSSProperties } from 'react';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { ButtonLink } from '../components/Button.tsx';
import { Portrait } from '../components/Portrait.tsx';
import { casePath, useCaseContext } from '../hooks/useCase.ts';
import { useAmbience } from '../hooks/useAmbience.ts';
import { ambienceForBackground } from '../audio/audio.ts';
import { getConversation } from '../store/game.ts';
import styles from './Suspects.module.css';
import { useT } from '../i18n/index.ts';
import { rich } from '../i18n/rich.tsx';

export function Suspects() {
  const { caseFile, caseKey, progress } = useCaseContext();
  const victimRoom = caseFile.rooms.find((r) => r.id === caseFile.victim.found_in);
  useAmbience(ambienceForBackground(victimRoom?.background ?? caseFile.rooms[0]?.background));
  const { t, tn } = useT();

  return (
    <ScreenFrame
      wide
      title={t('lineup.title')}
    >
      <ol className={styles.lineup}>
        {caseFile.suspects.map((s, i) => {
          const conv = getConversation(progress, caseFile, s.id);
          const max = Math.max(0, conv.patienceMax);
          const left = Math.max(0, max - conv.patienceUsed);
          const asked = conv.messages.filter((m) => m.role === 'detective').length;
          const slips = s.revealable_clues.filter((c) => progress.revealedClues.includes(c.clue_id)).length;
          const shown = conv.shownEvidence.length;
          const action = left === 0 ? t('lineup.readTranscript') : asked === 0 ? t('lineup.interrogate') : t('lineup.resume');
          const pct = max > 0 ? (left / max) * 100 : 0;
          return (
            <li key={s.id} className={styles.card} data-mood={conv.mood} data-spent={left === 0 || undefined} style={{ '--delay': `${i * 70}ms` } as CSSProperties}>
              {/* A comic panel: the painted portrait, with the number and the name in caption boxes. */}
              <div className={styles.panel}>
                <Portrait suspect={s} mood={conv.mood} size={320} showInitials={false} decorative className={styles.portrait} />
                <span className={styles.number} aria-hidden="true">
                  {t('lineup.no', { n: i + 1 })}
                </span>
                <header className={styles.head}>
                  <h2 className={styles.name}>{s.name}</h2>
                  <p className={styles.role}>
                    {s.role}
                    <span className={styles.age}>{t('lineup.age', { age: s.age })}</span>
                  </p>
                </header>
              </div>

              <div className={styles.body}>
                <dl className={styles.stats}>
                  <div className={styles.stat}>
                    <dt>{t('lineup.mood')}</dt>
                    <dd>
                      <span className={styles.mood} data-mood={conv.mood}>
                        {t(`mood.${conv.mood}`)}
                      </span>
                    </dd>
                  </div>
                  <div className={styles.stat}>
                    <dt>{t('lineup.questionsLeft')}</dt>
                    <dd>{rich(t('lineup.leftOf'), { left: <strong>{left}</strong>, max })}</dd>
                  </div>
                </dl>
                <div className={styles.patience} aria-hidden="true">
                  <span style={{ width: `${pct}%` }} />
                </div>

                <blockquote className={styles.alibi}>
                  <p>
                    <span className={styles.claims}>{t('lineup.claims')}</span> {s.alibi}
                  </p>
                </blockquote>

                <section className={styles.factsBlock} aria-label={t('lineup.onRecordLabel', { name: s.name })}>
                  <h3 className={styles.factsTitle}>{t('lineup.onRecord')}</h3>
                  <ul className={styles.facts}>
                    {s.public_facts.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </section>

                <p className={styles.status}>
                  {asked === 0 ? t('lineup.notQuestioned') : tn('lineup.asked', asked)}
                  {shown > 0 && ` ${tn('lineup.shown', shown)}`}
                  {slips > 0 && ` ${tn('lineup.slips', slips)}`}
                  {left === 0 && ` ${t('lineup.nothingMore')}`}
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
