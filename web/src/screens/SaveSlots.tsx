import { useEffect, useState } from 'react';
import { Button, ButtonLink } from '../components/Button.tsx';
import { Modal } from '../components/Modal.tsx';
import { RainBackdrop } from '../components/RainBackdrop.tsx';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { useAmbience } from '../hooks/useAmbience.ts';
import { casePath, resolveCase } from '../hooks/useCase.ts';
import { STORY_ORDER, getStoryCase, parseCaseKey } from '../engine/caseLoader.ts';
import { SLOT_COUNT, continueSlot, listSlots } from '../engine/save.ts';
import type { SaveSlotData } from '../engine/types.ts';
import { formatDate } from '../lib/format.ts';
import { useGame } from '../store/game.ts';
import { useLaunch } from '../boot/launch.ts';
import styles from './SaveSlots.module.css';

type Pending = { kind: 'new' | 'delete'; slot: number } | null;

interface BestScore {
  key: string;
  title: string;
  score: number;
  rank: string;
  solved: boolean;
}

function caseTitle(key: string): string {
  const { source, id } = parseCaseKey(key);
  if (source === 'story') return getStoryCase(id)?.title ?? 'A missing file';
  return 'A retired case file';
}

function bestScores(slot: SaveSlotData): BestScore[] {
  return Object.entries(slot.completions)
    .map(([key, c]) => ({ key, title: caseTitle(key), score: c.bestScore, rank: c.bestRank, solved: c.solved }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

const slotHeadingId = (n: number) => `slot-heading-${n}`;

function hasAnything(slot: SaveSlotData): boolean {
  return Object.keys(slot.progress).length > 0 || Object.keys(slot.completions).length > 0;
}

export function SaveSlots() {
  useAmbience('menu');
  const storage = useGame((s) => s.storage);
  const loadedSlot = useGame((s) => s.slot?.slot ?? null);
  const activateSlot = useGame((s) => s.activateSlot);
  const createSlot = useGame((s) => s.createSlot);
  const removeSlot = useGame((s) => s.removeSlot);
  const [slots, setSlots] = useState(() => listSlots(storage));
  const [lastUsed, setLastUsed] = useState(() => continueSlot(storage)?.slot ?? null);
  const [pending, setPending] = useState<Pending>(null);
  const [announcement, setAnnouncement] = useState('');
  const launch = useLaunch();

  useEffect(() => {
    document.title = 'Save slots - Project Red String';
  }, []);

  const refresh = () => {
    setSlots(listSlots(storage));
    setLastUsed(continueSlot(storage)?.slot ?? null);
  };

  const current = loadedSlot ?? lastUsed;

  const load = (n: number) => {
    const slot = activateSlot(n);
    const key = slot.activeCaseKey;
    const resolved = key ? resolveCase(key) : null;
    void launch(key && resolved ? casePath(key) : '/cases', {
      kicker: `Slot ${n}`,
      title: resolved?.caseFile.title ?? 'The case files',
    });
  };

  const startFresh = (n: number) => {
    createSlot(n);
    void launch('/cases', { kicker: `Slot ${n}`, title: 'A new game' });
  };

  const confirmPending = () => {
    if (!pending) return;
    if (pending.kind === 'new') {
      setPending(null);
      startFresh(pending.slot);
      return;
    }
    const emptied = pending.slot;
    removeSlot(emptied);
    setPending(null);
    refresh();
    setAnnouncement(`Slot ${emptied} emptied.`);
    // The Delete button that opened the dialog is gone now; keep the keyboard in the same drawer.
    requestAnimationFrame(() => document.getElementById(slotHeadingId(emptied))?.focus());
  };

  return (
    <>
      <RainBackdrop lamp="left" intensity="soft" />
      <ScreenFrame
        title="Save slots"
        kicker="Records office"
        actions={
          <ButtonLink to="/" variant="ghost">
            Back to the menu
          </ButtonLink>
        }
      >
        <p className={styles.lede}>You have three drawers. The game saves itself after every move you make.</p>

        <ol className={styles.grid} aria-label="Save slots">
          {Array.from({ length: SLOT_COUNT }, (_, i) => i + 1).map((n) => {
            const data = slots[n - 1] ?? null;
            const isCurrent = current === n && data !== null;
            const headingId = slotHeadingId(n);
            const solved = data ? STORY_ORDER.filter((id) => data.completions[id]?.solved).length : 0;
            const scores = data ? bestScores(data) : [];
            const activeTitle = data?.activeCaseKey ? caseTitle(data.activeCaseKey) : null;
            return (
              <li key={n} className={styles.cell}>
                <article
                  className={`${styles.folder} ${data ? styles.filled : styles.empty} ${isCurrent ? styles.current : ''}`}
                  aria-labelledby={headingId}
                  data-testid={`slot-${n}`}
                >
                  <div className={styles.tab} aria-hidden="true">
                    Drawer {n}
                  </div>
                  <header className={styles.head}>
                    <h2 id={headingId} className={styles.heading} tabIndex={-1}>
                      Slot {n}
                      {isCurrent && <span className="visually-hidden"> (in use)</span>}
                    </h2>
                    {isCurrent && (
                      <span className={`stamp ${styles.inUse}`} aria-hidden="true">
                        In use
                      </span>
                    )}
                  </header>

                  {data ? (
                    <dl className={styles.facts}>
                      <div>
                        <dt>Last saved</dt>
                        <dd>{formatDate(data.updatedAt)}</dd>
                      </div>
                      <div>
                        <dt>Open case</dt>
                        <dd>{activeTitle ?? 'None open'}</dd>
                      </div>
                      <div>
                        <dt>Story cases solved</dt>
                        <dd>
                          {solved} of {STORY_ORDER.length}
                        </dd>
                      </div>
                      <div>
                        <dt>Best scores</dt>
                        <dd>
                          {scores.length === 0 ? (
                            'Nothing closed yet'
                          ) : (
                            <ul className={styles.scores}>
                              {scores.map((s) => (
                                <li key={s.key}>
                                  <span className={styles.scoreTitle}>{s.title}</span>
                                  <span className={styles.scoreValue}>
                                    {s.score} <abbr title={`Rank ${s.rank}`}>{s.rank}</abbr>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <p className={styles.emptyText}>Empty drawer. Nothing filed here yet.</p>
                  )}

                  <div className={styles.actions}>
                    {data ? (
                      <>
                        <Button variant="lamp" onClick={() => load(n)} data-testid={`slot-load-${n}`}>
                          Load
                        </Button>
                        <Button
                          onClick={() => (hasAnything(data) ? setPending({ kind: 'new', slot: n }) : startFresh(n))}
                          data-testid={`slot-new-${n}`}
                        >
                          New game
                        </Button>
                        <Button
                          variant="ghost"
                          className={styles.paperGhost}
                          onClick={() => setPending({ kind: 'delete', slot: n })}
                          data-testid={`slot-delete-${n}`}
                        >
                          Delete
                        </Button>
                      </>
                    ) : (
                      <Button variant="lamp" onClick={() => startFresh(n)} data-testid={`slot-new-${n}`}>
                        New game
                      </Button>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ol>

        <p className="visually-hidden" role="status" aria-live="polite">
          {announcement}
        </p>
      </ScreenFrame>

      <Modal
        open={pending !== null}
        title={pending?.kind === 'delete' ? `Empty slot ${pending.slot}?` : `Start over in slot ${pending?.slot ?? ''}?`}
        onClose={() => setPending(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPending(null)}>
              Keep it
            </Button>
            <Button variant="primary" onClick={confirmPending} data-testid="slot-confirm">
              {pending?.kind === 'delete' ? 'Burn the file' : 'Start over'}
            </Button>
          </>
        }
      >
        {pending?.kind === 'delete' ? (
          <p>Every case, verdict and best score in this drawer goes into the furnace. There is no getting it back.</p>
        ) : (
          <p>
            A fresh start wipes this drawer: open cases, verdicts and best scores. There is no getting
            the old game back.
          </p>
        )}
      </Modal>
    </>
  );
}
