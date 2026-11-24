import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CaseFile } from '@shared/caseSchema.ts';
import { Button, ButtonLink } from '../components/Button.tsx';
import { Portrait } from '../components/Portrait.tsx';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { useAmbience } from '../hooks/useAmbience.ts';
import { casePath, useCaseContext } from '../hooks/useCase.ts';
import { STORY_ORDER, getStoryCase, isStoryUnlocked } from '../engine/caseLoader.ts';
import { discoveredCount, questionsUsed, scoreProgress, totalDiscoverables, totalPatience } from '../engine/scoring.ts';
import type { AccusationOutcome, AccusationRecord, CaseProgress, ScoreSnapshot } from '../engine/types.ts';
import { evidenceName, useGame } from '../store/game.ts';
import { sfx } from '../audio/audio.ts';
import { formatDuration } from '../lib/format.ts';
import styles from './Ending.module.css';
import { localizedCase, useT, type MessageKey } from '../i18n/index.ts';
import { rich } from '../i18n/rich.tsx';

const STAMP: Record<AccusationOutcome, MessageKey> = {
  correct: 'ending.stampCorrect',
  weak_proof: 'ending.stampWeak',
  wrong_culprit: 'ending.stampWrong',
};

const HEADLINE: Record<AccusationOutcome, MessageKey> = {
  correct: 'ending.headCorrect',
  weak_proof: 'ending.headWeak',
  wrong_culprit: 'ending.headWrong',
};

/** Delay so the sound lands with the stamp rather than on top of the accusation's own thump. */
// The stamp lands after the front page has spun in.
const STAMP_SOUND_DELAY_MS = 1350;

const DECK: Record<AccusationOutcome, MessageKey> = {
  correct: 'ending.deckCorrect',
  weak_proof: 'ending.deckWeak',
  wrong_culprit: 'ending.deckWrong',
};

/**
 * The tally as it stood when the accusation was made. Older saves have no frozen breakdown, so it is
 * rebuilt from the current progress for them.
 */
function tallyAt(caseFile: CaseFile, progress: CaseProgress, accusation: AccusationRecord): ScoreSnapshot {
  if (accusation.breakdown) return accusation.breakdown;
  const live = scoreProgress(caseFile, progress, accusation.outcome);
  return {
    base: live.base,
    thoroughness: live.thoroughness,
    efficiency: live.efficiency,
    hintPenalty: live.hintPenalty,
    discovered: discoveredCount(progress),
    discoverable: totalDiscoverables(caseFile),
    questionsUsed: questionsUsed(progress),
    questionBudget: totalPatience(caseFile),
    hintsUsed: progress.hintsUsed,
  };
}

export function Ending() {
  const { caseFile, caseKey, progress, source } = useCaseContext();
  const navigate = useNavigate();
  const completions = useGame((s) => s.slot?.completions);
  const ensureProgress = useGame((s) => s.ensureProgress);
  const restartCase = useGame((s) => s.restartCase);
  const [showSolution, setShowSolution] = useState(false);
  const accusation = progress.accusation;
  const stampAt = accusation?.at ?? null;
  useAmbience('rain');
  const { t, language } = useT();

  useEffect(() => {
    document.title = `${t('ending.docTitle')} - ${caseFile.title} - Project Red String`;
  }, [caseFile.title, t, language]);

  useEffect(() => {
    if (stampAt === null) return;
    const timer = window.setTimeout(() => sfx('stamp'), STAMP_SOUND_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [stampAt]);

  if (!accusation) {
    return (
      <ScreenFrame title={t('ending.noVerdict')} kicker={caseFile.title}>
        <p className={styles.pending}>{t('ending.stillOpen')}</p>
        <ButtonLink to={casePath(caseKey, 'accuse')} variant="primary">
          {t('accuse.submit')}
        </ButtonLink>
      </ScreenFrame>
    );
  }

  const outcome = accusation.outcome;
  const breakdown = tallyAt(caseFile, progress, accusation);
  const accused = caseFile.suspects.find((s) => s.id === accusation.culpritId);
  const culprit = caseFile.suspects.find((s) => s.id === caseFile.solution.culprit_id);
  const required = caseFile.solution.required_evidence;
  const revealOpen = outcome !== 'wrong_culprit' || showSolution;

  const storyIndex = source === 'story' ? (STORY_ORDER as readonly string[]).indexOf(caseKey) : -1;
  const nextId = storyIndex >= 0 ? STORY_ORDER[storyIndex + 1] : undefined;
  const nextEnglish = nextId ? getStoryCase(nextId) : null;
  const nextCase = nextEnglish ? localizedCase(nextEnglish) : null;
  const nextUnlocked = nextId ? isStoryUnlocked(storyIndex + 1, (id) => Boolean(completions?.[id])) : false;

  const replay = () => {
    restartCase(caseKey, source);
    navigate(casePath(caseKey, 'briefing'));
  };
  const goNext = () => {
    if (!nextId) return;
    ensureProgress(nextId, 'story');
    navigate(casePath(nextId));
  };

  // Time: older saves have none. A record is a correct solve that set (or matched) the fastest time.
  const timeMs = accusation.timeMs ?? null;
  const bestTimeMs = completions?.[caseKey]?.bestTimeMs;
  const newRecord = outcome === 'correct' && timeMs !== null && bestTimeMs !== undefined && timeMs <= bestTimeMs;

  const rows: Array<{ label: string; value: number; note: string }> = [
    { label: t('ending.rowVerdict'), value: breakdown.base, note: t(STAMP[outcome]) },
    { label: t('ending.rowThoroughness'), value: breakdown.thoroughness, note: t('ending.rowFound', { n: breakdown.discovered, total: breakdown.discoverable }) },
    {
      label: t('ending.rowEfficiency'),
      value: breakdown.efficiency,
      note: outcome === 'correct' ? t('ending.rowQuestions', { n: breakdown.questionsUsed, total: breakdown.questionBudget }) : t('ending.rowCleanOnly'),
    },
    { label: t('ending.rowHints'), value: -breakdown.hintPenalty, note: t('ending.rowTaken', { n: breakdown.hintsUsed }) },
  ];

  return (
    <ScreenFrame title={t('ending.title')} kicker={caseFile.title}>
      <section className={`${styles.outcome} ${styles[outcome] ?? ''}`} data-testid="ending-outcome" data-outcome={outcome} aria-labelledby="outcome-heading">
        {/* The verdict arrives the way it does in the pictures: a front page spinning out of the dark. */}
        <article className={`paper selectable ${styles.frontPage}`}>
          <header className={styles.masthead}>
            <p className={styles.edition}>
              <span>{t('ending.edition')}</span>
              <span>{caseFile.era}</span>
              <span>{t('ending.price')}</span>
            </p>
            <p className={styles.paperName}>The Calder City Ledger</p>
          </header>
          <h2 id="outcome-heading" className={styles.headline}>
            {t(HEADLINE[outcome])}
          </h2>
          <p className={styles.deck}>{t(DECK[outcome])}</p>
          <div className={styles.story}>
            {accused && (
              <figure className={styles.photo}>
                <Portrait suspect={accused} size={190} decorative showInitials={false} />
                <figcaption>{t('ending.caption', { name: accused.name })}</figcaption>
              </figure>
            )}
            <div className={styles.storyText}>
              <p className={styles.accusedLine}>
                {accusation.evidenceIds.length > 0
                  ? rich(t('ending.namedWith'), {
                      name: <strong>{accused?.name ?? t('ending.nobody')}</strong>,
                      evidence: accusation.evidenceIds.map((id) => evidenceName(caseFile, id)).join(', '),
                    })
                  : rich(t('ending.named'), { name: <strong>{accused?.name ?? t('ending.nobody')}</strong> })}
              </p>
              <p className={styles.endingText}>{caseFile.endings[outcome]}</p>
            </div>
          </div>
          <div className={styles.stampWrap}>
            <p className={`stamp ${styles.bigStamp}`}>{t(STAMP[outcome])}</p>
          </div>
        </article>
      </section>

      <div className={styles.columns}>
        <section className={styles.scoreCard} aria-labelledby="score-heading">
          <h2 id="score-heading" className={styles.cardTitle}>
            {t('ending.tally')}
          </h2>
          <div className={styles.scoreTop}>
            <div className={styles.rankStamp} aria-label={t('common.rank', { rank: accusation.rank })}>
              <span className={styles.rankLabel} aria-hidden="true">
                {t('ending.rank')}
              </span>
              <span className={styles.rankLetter} aria-hidden="true">
                {accusation.rank}
              </span>
            </div>
            <p className={styles.total}>
              <span className={styles.totalLabel}>{t('ending.finalScore')}</span>
              <span className={styles.totalValue} data-testid="final-score">
                {accusation.score}
              </span>
            </p>
          </div>
          <table className={styles.breakdown}>
            <caption className="visually-hidden">{t('ending.breakdown')}</caption>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row">
                    {r.label}
                    <span className={styles.rowNote}>{r.note}</span>
                  </th>
                  <td>{r.value > 0 ? `+${r.value}` : r.value < 0 ? `−${Math.abs(r.value)}` : '0'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">{t('ending.total')}</th>
                <td>{accusation.score}</td>
              </tr>
            </tfoot>
          </table>
          <dl className={styles.stats}>
            <div>
              <dt>{t('ending.cluesFound')}</dt>
              <dd>
                {breakdown.discovered} / {breakdown.discoverable}
              </dd>
            </div>
            <div>
              <dt>{t('ending.questionsUsed')}</dt>
              <dd>
                {breakdown.questionsUsed} / {breakdown.questionBudget}
              </dd>
            </div>
            <div>
              <dt>{t('ending.hintsTaken')}</dt>
              <dd>{breakdown.hintsUsed}</dd>
            </div>
            {timeMs !== null && (
              <div>
                <dt>{t('ending.time')}</dt>
                <dd data-testid="case-time">{formatDuration(timeMs)}</dd>
              </div>
            )}
            {bestTimeMs !== undefined && (
              <div>
                <dt>{t('ending.fastest')}</dt>
                <dd>
                  {formatDuration(bestTimeMs)}
                  {newRecord && <span className={styles.record}>{t('ending.newRecord')}</span>}
                </dd>
              </div>
            )}
          </dl>
        </section>

        <section className={styles.solution} aria-labelledby="solution-heading">
          <h2 id="solution-heading" className={styles.cardTitle}>
            {t('ending.whatHappened')}
          </h2>
          {outcome === 'wrong_culprit' && (
            <div className={styles.disclosure}>
              <p>{t('ending.realAnswer')}</p>
              <Button
                variant="lamp"
                aria-expanded={showSolution}
                aria-controls="solution-body"
                onClick={() => setShowSolution((v) => !v)}
                data-testid="reveal-solution"
              >
                {showSolution ? t('ending.hideSolution') : t('ending.readSolution')}
              </Button>
            </div>
          )}
          <div id="solution-body" hidden={!revealOpen} className={styles.solutionBody}>
            {culprit && (
              <div className={styles.culprit}>
                <Portrait suspect={culprit} size={84} showInitials={false} decorative />
                <div>
                  <p className={styles.culpritLabel}>{t('ending.killer')}</p>
                  <p className={styles.culpritName}>{culprit.name}</p>
                  <p className={styles.culpritRole}>{culprit.role}</p>
                </div>
              </div>
            )}
            <div className={styles.reveal}>
              {caseFile.solution.reveal
                .split(/\n{2,}/)
                .filter(Boolean)
                .map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
            </div>
            <h3 className={styles.requiredTitle}>{t('ending.proof')}</h3>
            <ul className={styles.required}>
              {required.map((id) => {
                const presented = accusation.evidenceIds.includes(id);
                return (
                  <li key={id} className={presented ? styles.presented : styles.missed}>
                    <span className={styles.reqName}>{evidenceName(caseFile, id)}</span>
                    <span className={styles.reqStatus}>{presented ? t('ending.presented') : t('ending.missing')}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>

      <nav className={styles.actions} aria-label={t('ending.after')}>
        <Button onClick={replay} data-testid="replay-case">
          {t('ending.replay')}
        </Button>
        {nextId && nextCase && nextUnlocked && (
          <Button variant="lamp" onClick={goNext} data-testid="next-case">
            {t('ending.next', { title: nextCase.title })}
          </Button>
        )}
        <ButtonLink to="/cases" data-testid="to-case-select">
          {t('ending.caseSelect')}
        </ButtonLink>
        <ButtonLink to="/" variant="ghost" data-testid="to-main-menu">
          {t('ending.mainMenu')}
        </ButtonLink>
      </nav>
    </ScreenFrame>
  );
}
