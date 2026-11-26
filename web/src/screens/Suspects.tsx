import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { ButtonLink } from '../components/Button.tsx';
import { Figure, Portrait } from '../components/Portrait.tsx';
import { casePath, useCaseContext } from '../hooks/useCase.ts';
import { useAmbience } from '../hooks/useAmbience.ts';
import { ambienceForBackground } from '../audio/audio.ts';
import { getConversation } from '../store/game.ts';
import styles from './Suspects.module.css';
import { useT } from '../i18n/index.ts';
import { rich } from '../i18n/rich.tsx';

/** Height marks painted on the lineup wall behind each portrait. */
const HEIGHT_MARKS = ['6′6″', '6′', '5′6″', '5′', '4′6″'];

export function Suspects() {
  const { caseFile, caseKey, progress } = useCaseContext();
  const victimRoom = caseFile.rooms.find((r) => r.id === caseFile.victim.found_in);
  useAmbience(ambienceForBackground(victimRoom?.background ?? caseFile.rooms[0]?.background));
  const { t, tn } = useT();

  return (
    <ScreenFrame
      wide
      title={t('lineup.title')}
      actions={
        <>
          <ButtonLink to={casePath(caseKey, 'rooms')} variant="ghost">
            {t('nav.scenes')}
          </ButtonLink>
          <ButtonLink to={casePath(caseKey, 'board')}>{t('nav.board')}</ButtonLink>
        </>
      }
    >
      <p className={styles.lede}>
        {t('lineup.lede', { count: caseFile.suspects.length })}
      </p>

      {/* The lineup room, seen through the one-way glass. A picture of the list below; wide screens only. */}
      <div className={styles.room} aria-hidden="true">
        <div className={styles.roomMarks}>
          {HEIGHT_MARKS.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
        <div className={`${styles.roomMarks} ${styles.roomMarksRight}`}>
          {HEIGHT_MARKS.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>
        <ul className={styles.row}>
          {caseFile.suspects.map((s, i) => {
            const conv = getConversation(progress, caseFile, s.id);
            // People are not all the same height. Stable per suspect.
            const tall = 0.9 + ((s.id.length * 7 + s.age) % 12) / 100;
            return (
              <li key={s.id} className={styles.stand} data-mood={conv.mood} style={{ '--tall': tall, '--tint': s.color } as CSSProperties}>
                <span className={styles.roomBeam} />
                <span className={styles.roomShade} />
                <Link to={casePath(caseKey, `interrogate/${s.id}`)} tabIndex={-1} className={styles.figureLink}>
                  <svg viewBox="0 0 200 240" className={styles.figure} focusable="false">
                    <defs>
                      <linearGradient id={`lineup-${s.id}`} x1="0" y1="0" x2="1" y2="0.2">
                        <stop offset="0%" stopColor="#04060a" />
                        <stop offset="70%" stopColor="#0b0f18" />
                        <stop offset="100%" stopColor="#1d2638" />
                      </linearGradient>
                    </defs>
                    <Figure kind={s.portrait} fill={`url(#lineup-${s.id})`} rim="#f2cd7a" />
                  </svg>
                  <span className={styles.slate}>
                    <span className={styles.slateNo}>{t('lineup.no', { n: i + 1 })}</span>
                    <span className={styles.slateName}>{s.name}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className={styles.floor} />
        <div className={styles.glass} />
        <p className={styles.roomLabel}>{t('lineup.glass')}</p>
      </div>

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
              <div className={styles.wall}>
                <div className={styles.marks} aria-hidden="true">
                  {HEIGHT_MARKS.map((m) => (
                    <span key={m}>{m}</span>
                  ))}
                </div>
                <div className={styles.lamp} aria-hidden="true" />
                <Portrait suspect={s} mood={conv.mood} size={168} showInitials={false} className={styles.portrait} />
                <span className={styles.placard} aria-hidden="true">
                  {t('lineup.no', { n: i + 1 })}
                </span>
              </div>

              <div className={styles.body}>
                <header className={styles.head}>
                  <h2 className={styles.name}>{s.name}</h2>
                  <p className={styles.role}>
                    {s.role}
                    <span className={styles.age}>{t('lineup.age', { age: s.age })}</span>
                  </p>
                </header>

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
