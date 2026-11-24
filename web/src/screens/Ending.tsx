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
import styles from './Ending.module.css';

const STAMP: Record<AccusationOutcome, string> = {
  correct: 'Case closed',
  weak_proof: 'Weak case',
  wrong_culprit: 'Wrong suspect',
};

const HEADLINE: Record<AccusationOutcome, string> = {
  correct: 'You got your man. And the proof to keep him.',
  weak_proof: 'Right name. Not enough to hold it.',
  wrong_culprit: 'The wrong door got knocked on.',
};

/** Delay so the sound lands with the stamp rather than on top of the accusation's own thump. */
// The stamp lands after the front page has spun in.
const STAMP_SOUND_DELAY_MS = 1350;

const DECK: Record<AccusationOutcome, string> = {
  correct: 'Detective names the guilty party. District attorney to bring charges at once.',
  weak_proof: 'Detective names a suspect, but the proof falls short. Counsel expects to walk.',
  wrong_culprit: 'Detective names the wrong party. The guilty one is still at large.',
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

  useEffect(() => {
    document.title = `Verdict - ${caseFile.title} - Project Red String`;
  }, [caseFile.title]);

  useEffect(() => {
    if (stampAt === null) return;
    const t = window.setTimeout(() => sfx('stamp'), STAMP_SOUND_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [stampAt]);

  if (!accusation) {
    return (
      <ScreenFrame title="No verdict yet" kicker={caseFile.title}>
        <p className={styles.pending}>The case is still open. Nobody has been named.</p>
        <ButtonLink to={casePath(caseKey, 'accuse')} variant="primary">
          Make the accusation
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
  const nextCase = nextId ? getStoryCase(nextId) : null;
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

  const rows: Array<{ label: string; value: number; note: string }> = [
    { label: 'Verdict', value: breakdown.base, note: STAMP[outcome] },
    { label: 'Thoroughness', value: breakdown.thoroughness, note: `${breakdown.discovered} of ${breakdown.discoverable} found` },
    {
      label: 'Efficiency',
      value: breakdown.efficiency,
      note: outcome === 'correct' ? `${breakdown.questionsUsed} of ${breakdown.questionBudget} questions` : 'Only paid on a clean solve',
    },
    { label: 'Hints', value: -breakdown.hintPenalty, note: `${breakdown.hintsUsed} taken` },
  ];

  return (
    <ScreenFrame title="The verdict" kicker={caseFile.title}>
      <section className={`${styles.outcome} ${styles[outcome] ?? ''}`} data-testid="ending-outcome" data-outcome={outcome} aria-labelledby="outcome-heading">
        {/* The verdict arrives the way it does in the pictures: a front page spinning out of the dark. */}
        <article className={`paper selectable ${styles.frontPage}`}>
          <header className={styles.masthead}>
            <p className={styles.edition}>
              <span>Late city edition</span>
              <span>{caseFile.era}</span>
              <span>Five cents</span>
            </p>
            <p className={styles.paperName}>The Calder City Ledger</p>
          </header>
          <h2 id="outcome-heading" className={styles.headline}>
            {HEADLINE[outcome]}
          </h2>
          <p className={styles.deck}>{DECK[outcome]}</p>
          <div className={styles.story}>
            {accused && (
              <figure className={styles.photo}>
                <Portrait suspect={accused} size={190} decorative showInitials={false} />
                <figcaption>{accused.name}, named by the detective.</figcaption>
              </figure>
            )}
            <div className={styles.storyText}>
              <p className={styles.accusedLine}>
                You named <strong>{accused?.name ?? 'nobody'}</strong>
                {accusation.evidenceIds.length > 0 && (
                  <>
                    {' '}
                    on the strength of {accusation.evidenceIds.map((id) => evidenceName(caseFile, id)).join(', ')}.
                  </>
                )}
              </p>
              <p className={styles.endingText}>{caseFile.endings[outcome]}</p>
            </div>
          </div>
          <div className={styles.stampWrap}>
            <p className={`stamp ${styles.bigStamp}`}>{STAMP[outcome]}</p>
          </div>
        </article>
      </section>

      <div className={styles.columns}>
        <section className={styles.scoreCard} aria-labelledby="score-heading">
          <h2 id="score-heading" className={styles.cardTitle}>
            The tally
          </h2>
          <div className={styles.scoreTop}>
            <div className={styles.rankStamp} aria-label={`Rank ${accusation.rank}`}>
              <span className={styles.rankLabel} aria-hidden="true">
                Rank
              </span>
              <span className={styles.rankLetter} aria-hidden="true">
                {accusation.rank}
              </span>
            </div>
            <p className={styles.total}>
              <span className={styles.totalLabel}>Final score</span>
              <span className={styles.totalValue} data-testid="final-score">
                {accusation.score}
              </span>
            </p>
          </div>
          <table className={styles.breakdown}>
            <caption className="visually-hidden">Score breakdown</caption>
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
                <th scope="row">Total</th>
                <td>{accusation.score}</td>
              </tr>
            </tfoot>
          </table>
          <dl className={styles.stats}>
            <div>
              <dt>Clues found</dt>
              <dd>
                {breakdown.discovered} / {breakdown.discoverable}
              </dd>
            </div>
            <div>
              <dt>Questions used</dt>
              <dd>
                {breakdown.questionsUsed} / {breakdown.questionBudget}
              </dd>
            </div>
            <div>
              <dt>Hints taken</dt>
              <dd>{breakdown.hintsUsed}</dd>
            </div>
          </dl>
        </section>

        <section className={styles.solution} aria-labelledby="solution-heading">
          <h2 id="solution-heading" className={styles.cardTitle}>
            What really happened
          </h2>
          {outcome === 'wrong_culprit' && (
            <div className={styles.disclosure}>
              <p>The real answer is in the file. Read it now, or close the folder and try the case again.</p>
              <Button
                variant="lamp"
                aria-expanded={showSolution}
                aria-controls="solution-body"
                onClick={() => setShowSolution((v) => !v)}
                data-testid="reveal-solution"
              >
                {showSolution ? 'Hide the solution' : 'Read the full solution'}
              </Button>
            </div>
          )}
          <div id="solution-body" hidden={!revealOpen} className={styles.solutionBody}>
            {culprit && (
              <div className={styles.culprit}>
                <Portrait suspect={culprit} size={84} showInitials={false} decorative />
                <div>
                  <p className={styles.culpritLabel}>The killer</p>
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
            <h3 className={styles.requiredTitle}>The proof that holds</h3>
            <ul className={styles.required}>
              {required.map((id) => {
                const presented = accusation.evidenceIds.includes(id);
                return (
                  <li key={id} className={presented ? styles.presented : styles.missed}>
                    <span className={styles.reqName}>{evidenceName(caseFile, id)}</span>
                    <span className={styles.reqStatus}>{presented ? 'You presented it' : 'Missing from your case'}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      </div>

      <nav className={styles.actions} aria-label="After the verdict">
        <Button onClick={replay} data-testid="replay-case">
          Replay case
        </Button>
        {nextId && nextCase && nextUnlocked && (
          <Button variant="lamp" onClick={goNext} data-testid="next-case">
            Next case: {nextCase.title}
          </Button>
        )}
        <ButtonLink to="/cases" data-testid="to-case-select">
          Case select
        </ButtonLink>
        <ButtonLink to="/" variant="ghost" data-testid="to-main-menu">
          Main menu
        </ButtonLink>
      </nav>
    </ScreenFrame>
  );
}
