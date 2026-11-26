import { useEffect, useState } from 'react';
import { Button, ButtonLink } from '../components/Button.tsx';
import { Modal } from '../components/Modal.tsx';
import { RainBackdrop } from '../components/RainBackdrop.tsx';
import { ComicBackdrop } from '../backdrop/ComicBackdrop.tsx';
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
import { localizedCase, t, useT } from '../i18n/index.ts';

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
  if (source === 'story') {
    const c = getStoryCase(id);
    return c ? localizedCase(c).title : t('common.missingFile');
  }
  return t('common.retiredFile');
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
  const { t, language } = useT();

  useEffect(() => {
    document.title = `${t('slots.title')} - Project Red String`;
  }, [t, language]);

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
      kicker: t('common.slot', { n }),
      title: resolved?.caseFile.title ?? t('menu.caseFilesTitle'),
    });
  };

  const startFresh = (n: number) => {
    createSlot(n);
    void launch('/cases', { kicker: t('common.slot', { n }), title: t('slots.newGameTitle') });
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
    setAnnouncement(t('slots.emptied', { n: emptied }));
    // The Delete button that opened the dialog is gone now; keep the keyboard in the same drawer.
    requestAnimationFrame(() => document.getElementById(slotHeadingId(emptied))?.focus());
  };

  return (
    <>
      <ComicBackdrop scene="rooftop" dim="page" fallback={<RainBackdrop lamp="left" intensity="soft" />} />
      <ScreenFrame
        title={t('slots.title')}
        actions={
          <ButtonLink to="/" variant="ghost">
            {t('common.backToMenu')}
          </ButtonLink>
        }
      >
        <ol className={styles.grid} aria-label={t('slots.title')}>
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
                    {t('slots.drawer', { n })}
                  </div>
                  <header className={styles.head}>
                    <h2 id={headingId} className={styles.heading} tabIndex={-1}>
                      {t('common.slot', { n })}
                      {isCurrent && <span className="visually-hidden">{t('slots.inUseHidden')}</span>}
                    </h2>
                    {isCurrent && (
                      <span className={`stamp ${styles.inUse}`} aria-hidden="true">
                        {t('slots.inUse')}
                      </span>
                    )}
                  </header>

                  {data ? (
                    <dl className={styles.facts}>
                      <div>
                        <dt>{t('slots.lastSaved')}</dt>
                        <dd>{formatDate(data.updatedAt)}</dd>
                      </div>
                      <div>
                        <dt>{t('slots.openCase')}</dt>
                        <dd>{activeTitle ?? t('slots.noneOpen')}</dd>
                      </div>
                      <div>
                        <dt>{t('slots.solved')}</dt>
                        <dd>{t('slots.solvedCount', { n: solved, total: STORY_ORDER.length })}</dd>
                      </div>
                      <div>
                        <dt>{t('slots.bestScores')}</dt>
                        <dd>
                          {scores.length === 0 ? (
                            t('slots.nothingClosed')
                          ) : (
                            <ul className={styles.scores}>
                              {scores.map((s) => (
                                <li key={s.key}>
                                  <span className={styles.scoreTitle}>{s.title}</span>
                                  <span className={styles.scoreValue}>
                                    {s.score} <abbr title={t('common.rank', { rank: s.rank })}>{s.rank}</abbr>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <p className={styles.emptyText}>{t('slots.empty')}</p>
                  )}

                  <div className={styles.actions}>
                    {data ? (
                      <>
                        <Button variant="lamp" onClick={() => load(n)} data-testid={`slot-load-${n}`}>
                          {t('slots.load')}
                        </Button>
                        <Button
                          onClick={() => (hasAnything(data) ? setPending({ kind: 'new', slot: n }) : startFresh(n))}
                          data-testid={`slot-new-${n}`}
                        >
                          {t('slots.newGame')}
                        </Button>
                        <Button
                          variant="ghost"
                          className={styles.paperGhost}
                          onClick={() => setPending({ kind: 'delete', slot: n })}
                          data-testid={`slot-delete-${n}`}
                        >
                          {t('slots.delete')}
                        </Button>
                      </>
                    ) : (
                      <Button variant="lamp" onClick={() => startFresh(n)} data-testid={`slot-new-${n}`}>
                        {t('slots.newGame')}
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
        title={pending?.kind === 'delete' ? t('slots.confirmDeleteTitle', { n: pending.slot }) : t('slots.confirmNewTitle', { n: pending?.slot ?? '' })}
        onClose={() => setPending(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPending(null)}>
              {t('slots.keepIt')}
            </Button>
            <Button variant="primary" onClick={confirmPending} data-testid="slot-confirm">
              {pending?.kind === 'delete' ? t('slots.burn') : t('slots.startOver')}
            </Button>
          </>
        }
      >
        {pending?.kind === 'delete' ? (
          <p>{t('slots.deleteBody')}</p>
        ) : (
          <p>{t('slots.newBody')}</p>
        )}
      </Modal>
    </>
  );
}
