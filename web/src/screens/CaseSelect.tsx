import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ButtonLink } from '../components/Button.tsx';
import { Modal } from '../components/Modal.tsx';
import { RainBackdrop } from '../components/RainBackdrop.tsx';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { useAmbience } from '../hooks/useAmbience.ts';
import { casePath } from '../hooks/useCase.ts';
import { STORY_ORDER, caseKeyFor, getStoryCase, isStoryUnlocked } from '../engine/caseLoader.ts';
import { deleteGeneratedCase, listGeneratedCases } from '../engine/generatedCases.ts';
import { loadSlot } from '../engine/save.ts';
import type { CaseProgress, CaseSource, CompletionRecord } from '../engine/types.ts';
import { formatDate } from '../lib/format.ts';
import { useGame } from '../store/game.ts';
import styles from './CaseSelect.module.css';

type Status = 'new' | 'open' | 'closed';

const STATUS_LABEL: Record<Status, string> = { new: 'Not started', open: 'In progress', closed: 'Closed' };

function statusOf(p: CaseProgress | undefined): Status {
  if (!p) return 'new';
  return p.accusation ? 'closed' : 'open';
}

type Pending = { kind: 'replay'; key: string; source: CaseSource; title: string } | { kind: 'delete'; id: string; key: string; title: string };

interface CaseActionsProps {
  caseKey: string;
  source: CaseSource;
  status: Status;
  title: string;
  onOpen: (key: string, source: CaseSource, status: Status) => void;
  onVerdict: (key: string) => void;
  onReplay: (key: string, source: CaseSource, title: string) => void;
  openLabel?: string;
  testKey: string;
}

function CaseActions({ caseKey, source, status, title, onOpen, onVerdict, onReplay, openLabel = 'Open case', testKey }: CaseActionsProps) {
  if (status === 'closed') {
    return (
      <>
        <Button variant="lamp" onClick={() => onVerdict(caseKey)} data-testid={`view-verdict-${testKey}`} aria-label={`View verdict: ${title}`}>
          View verdict
        </Button>
        <Button onClick={() => onReplay(caseKey, source, title)} data-testid={`replay-case-${testKey}`} aria-label={`Replay case: ${title}`}>
          Replay case
        </Button>
      </>
    );
  }
  return (
    <Button
      variant="lamp"
      onClick={() => onOpen(caseKey, source, status)}
      data-testid={`open-case-${testKey}`}
      aria-label={`${openLabel}: ${title}`}
    >
      {openLabel}
    </Button>
  );
}

function CompletionStamp({ completion }: { completion: CompletionRecord | undefined }) {
  if (!completion) return null;
  return (
    <div className={styles.record}>
      <span className={`stamp ${completion.solved ? styles.stampSolved : styles.stampClosed}`}>{completion.solved ? 'Solved' : 'Closed'}</span>
      <span className={styles.best}>
        Best {completion.bestScore}
        <span className={styles.rank} aria-label={`rank ${completion.bestRank}`}>
          {completion.bestRank}
        </span>
      </span>
    </div>
  );
}

export function CaseSelect() {
  useAmbience('menu');
  const navigate = useNavigate();
  const slot = useGame((s) => s.slot);
  const storage = useGame((s) => s.storage);
  const ensureActiveSlot = useGame((s) => s.ensureActiveSlot);
  const ensureProgress = useGame((s) => s.ensureProgress);
  const restartCase = useGame((s) => s.restartCase);
  const setActiveCase = useGame((s) => s.setActiveCase);
  const [generated, setGenerated] = useState(() => listGeneratedCases(storage));
  const [pending, setPending] = useState<Pending | null>(null);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (!slot) ensureActiveSlot();
  }, [slot, ensureActiveSlot]);

  useEffect(() => {
    document.title = 'Case files - Project Red String';
  }, []);

  const backLink = (
    <>
      <ButtonLink to="/slots" variant="ghost">
        Save slots
      </ButtonLink>
      <ButtonLink to="/" variant="ghost">
        Back to the menu
      </ButtonLink>
    </>
  );

  if (!slot) {
    return (
      <>
        <RainBackdrop lamp="right" intensity="soft" />
        <ScreenFrame title="Case files" kicker="Records office" actions={backLink}>
          <p className="muted">Pulling the drawer.</p>
        </ScreenFrame>
      </>
    );
  }

  const open = (key: string, source: CaseSource, status: Status) => {
    ensureProgress(key, source);
    navigate(status === 'new' ? casePath(key, 'briefing') : casePath(key));
  };
  const viewVerdict = (key: string) => {
    setActiveCase(key);
    navigate(casePath(key, 'ending'));
  };
  const askReplay = (key: string, source: CaseSource, title: string) => setPending({ kind: 'replay', key, source, title });

  const confirmPending = () => {
    if (!pending) return;
    setPending(null);
    if (pending.kind === 'replay') {
      restartCase(pending.key, pending.source);
      navigate(casePath(pending.key, 'briefing'));
      return;
    }
    // Removes the case and its progress from every slot, then reload the active slot from storage.
    deleteGeneratedCase(storage, pending.id);
    useGame.setState({ slot: loadSlot(storage, slot.slot) ?? slot });
    setGenerated(listGeneratedCases(storage));
    setAnnouncement(`${pending.title} removed from the shelf.`);
  };

  const completed = (id: string) => Boolean(slot.completions[id]);

  return (
    <>
      <RainBackdrop lamp="right" intensity="soft" />
      <ScreenFrame title="Case files" kicker={`Records office. Slot ${slot.slot}.`} actions={backLink}>
        <section aria-labelledby="story-heading" className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 id="story-heading">Story cases</h2>
            <p className={styles.sectionNote}>Hand-written, in order. Close one to open the next.</p>
          </div>
          <ol className={styles.storyGrid}>
            {STORY_ORDER.map((id, index) => {
              const c = getStoryCase(id);
              const number = `Case No. ${index + 1}`;
              const unlocked = isStoryUnlocked(index, completed);
              const progress = slot.progress[id];
              const status = statusOf(progress);
              const completion = slot.completions[id];
              const headingId = `case-${id}-title`;
              if (!c) {
                return (
                  <li key={id} className={styles.storyCell}>
                    <article className={`${styles.file} ${styles.missing}`} aria-labelledby={headingId} data-testid={`case-card-${id}`}>
                      <p className={styles.number}>{number}</p>
                      <h3 id={headingId} className={styles.fileTitle}>
                        File not on the desk
                      </h3>
                      <p className={styles.tagline}>This case file is missing or failed inspection.</p>
                    </article>
                  </li>
                );
              }
              if (!unlocked) {
                return (
                  <li key={id} className={styles.storyCell}>
                    <article className={`${styles.file} ${styles.locked}`} aria-labelledby={headingId} data-testid={`case-card-${id}`}>
                      <p className={styles.number}>{number}</p>
                      <h3 id={headingId} className={styles.fileTitle}>
                        {c.title}
                      </h3>
                      <div className={styles.redacted} aria-hidden="true">
                        <span style={{ width: '92%' }} />
                        <span style={{ width: '70%' }} />
                        <span style={{ width: '48%' }} />
                      </div>
                      <p className={styles.lockNote}>
                        <span className={styles.sealed}>Sealed</span> Solve the previous case to unlock
                      </p>
                    </article>
                  </li>
                );
              }
              return (
                <li key={id} className={styles.storyCell}>
                  <article className={`paper ${styles.file} ${styles.unlocked}`} aria-labelledby={headingId} data-testid={`case-card-${id}`}>
                    <div className={styles.fileHead}>
                      <p className={styles.number}>{number}</p>
                      <p className={`${styles.status} ${styles[`status-${status}`] ?? ''}`}>{STATUS_LABEL[status]}</p>
                    </div>
                    <h3 id={headingId} className={styles.fileTitle}>
                      {c.title}
                    </h3>
                    <p className={styles.tagline}>{c.tagline}</p>
                    <dl className={styles.meta}>
                      <div>
                        <dt>Setting</dt>
                        <dd>{c.setting}</dd>
                      </div>
                      <div>
                        <dt>Era</dt>
                        <dd>{c.era}</dd>
                      </div>
                    </dl>
                    <CompletionStamp completion={completion} />
                    <div className={styles.actions}>
                      <CaseActions
                        caseKey={id}
                        source="story"
                        status={status}
                        title={c.title}
                        onOpen={open}
                        onVerdict={viewVerdict}
                        onReplay={askReplay}
                        testKey={id}
                      />
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="generated-heading" className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 id="generated-heading">Generated cases</h2>
            <p className={styles.sectionNote}>Typed up by the case office. Kept on this device only.</p>
          </div>
          {generated.length === 0 ? (
            <div className={styles.emptyShelf}>
              <p>The shelf is bare. The case office will type you up a fresh one.</p>
              <ButtonLink to="/new-case" variant="lamp">
                New case
              </ButtonLink>
            </div>
          ) : (
            <>
              <ul className={styles.genList}>
                {generated.map((g) => {
                  const key = caseKeyFor('generated', g.id);
                  const status = statusOf(slot.progress[key]);
                  const completion = slot.completions[key];
                  return (
                    <li key={g.id} className={styles.genItem} data-testid={`generated-case-${g.id}`}>
                      <div className={styles.genText}>
                        <h3 className={styles.genTitle}>{g.title}</h3>
                        <p className={styles.genTagline}>{g.tagline}</p>
                        <p className={styles.genMeta}>
                          Filed {formatDate(g.createdAt)}. {g.caseFile.era}. {STATUS_LABEL[status]}.
                          {completion && ` Best ${completion.bestScore}, rank ${completion.bestRank}.`}
                        </p>
                      </div>
                      <div className={styles.genActions}>
                        <CaseActions
                          caseKey={key}
                          source="generated"
                          status={status}
                          title={g.title}
                          onOpen={open}
                          onVerdict={viewVerdict}
                          onReplay={askReplay}
                          openLabel="Play"
                          testKey={key}
                        />
                        <Button
                          variant="ghost"
                          onClick={() => setPending({ kind: 'delete', id: g.id, key, title: g.title })}
                          aria-label={`Delete generated case: ${g.title}`}
                          data-testid={`delete-generated-${g.id}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <ButtonLink to="/new-case">Request another case</ButtonLink>
            </>
          )}
        </section>

        <p className="visually-hidden" role="status" aria-live="polite">
          {announcement}
        </p>
      </ScreenFrame>

      <Modal
        open={pending !== null}
        title={pending?.kind === 'delete' ? 'Throw out this case file?' : 'Reopen the case?'}
        onClose={() => setPending(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPending(null)}>
              Keep it
            </Button>
            <Button variant="primary" onClick={confirmPending} data-testid="case-confirm">
              {pending?.kind === 'delete' ? 'Throw it out' : 'Reopen the file'}
            </Button>
          </>
        }
      >
        {pending?.kind === 'delete' ? (
          <p>
            <strong>{pending.title}</strong> goes in the bin, along with any run you have going on it. Generated files cannot be typed up
            twice.
          </p>
        ) : (
          <p>
            Start <strong>{pending?.title}</strong> from the briefing. Your notes, board and interrogations from the last run are cleared. Your best
            score stays on record.
          </p>
        )}
      </Modal>
    </>
  );
}
