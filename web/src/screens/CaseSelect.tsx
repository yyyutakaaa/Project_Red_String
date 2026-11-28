import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, ButtonLink } from '../components/Button.tsx';
import { Modal } from '../components/Modal.tsx';
import { RainBackdrop } from '../components/RainBackdrop.tsx';
import { ComicBackdrop } from '../backdrop/ComicBackdrop.tsx';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { useAmbience } from '../hooks/useAmbience.ts';
import { casePath, resolveCase } from '../hooks/useCase.ts';
import { RoomScene } from '../components/RoomScene.tsx';
import { backdropArt } from '../assets/registry.ts';
import type { CaseFile } from '@shared/caseSchema.ts';
import { useLaunch } from '../boot/launch.ts';
import { formatDuration } from '../lib/format.ts';
import { STORY_ORDER, TUTORIAL_ID, getStoryCase, isStoryUnlocked } from '../engine/caseLoader.ts';
import type { CaseProgress, CaseSource, CompletionRecord } from '../engine/types.ts';
import { useGame } from '../store/game.ts';
import styles from './CaseSelect.module.css';
import { localizedCase, scenePlaceOf, useT, type MessageKey } from '../i18n/index.ts';
import { rich } from '../i18n/rich.tsx';

type Status = 'new' | 'open' | 'closed';

const STATUS_LABEL: Record<Status, MessageKey> = { new: 'cases.statusNew', open: 'cases.statusOpen', closed: 'cases.statusClosed' };

function statusOf(p: CaseProgress | undefined): Status {
  if (!p) return 'new';
  return p.accusation ? 'closed' : 'open';
}

type Pending = { key: string; source: CaseSource; title: string };

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

function CaseActions({ caseKey, source, status, title, onOpen, onVerdict, onReplay, openLabel, testKey }: CaseActionsProps) {
  const { t } = useT();
  if (status === 'closed') {
    return (
      <>
        <Button variant="lamp" onClick={() => onVerdict(caseKey)} data-testid={`view-verdict-${testKey}`} aria-label={t('cases.viewVerdictLabel', { title })}>
          {t('cases.viewVerdict')}
        </Button>
        <Button onClick={() => onReplay(caseKey, source, title)} data-testid={`replay-case-${testKey}`} aria-label={t('cases.replayLabel', { title })}>
          {t('cases.replay')}
        </Button>
      </>
    );
  }
  return (
    <Button
      variant="lamp"
      onClick={() => onOpen(caseKey, source, status)}
      data-testid={`open-case-${testKey}`}
      aria-label={openLabel ? `${openLabel}: ${title}` : t('cases.openCaseLabel', { title })}
    >
      {openLabel ?? t('cases.openCase')}
    </Button>
  );
}

/**
 * The photograph clipped to the file: the case's painted backdrop when it has one, otherwise the
 * room where the body was found.
 */
function ScenePhoto({ caseFile, sealed = false }: { caseFile: CaseFile; sealed?: boolean }) {
  const { t } = useT();
  const room = caseFile.rooms.find((r) => r.id === caseFile.victim.found_in) ?? caseFile.rooms[0];
  const painted = backdropArt(caseFile.id, 'thumb');
  if (!room && !painted) return null;
  return (
    <div className={`${styles.photo} ${sealed ? styles.photoSealed : ''}`} aria-hidden="true">
      {painted ? (
        <img src={painted} alt="" className={styles.painted} loading="lazy" decoding="async" draggable={false} />
      ) : (
        room && <RoomScene background={room.background} hotspots={room.hotspots} thumbnail place={scenePlaceOf(room, caseFile)} />
      )}
      {sealed && (
        <>
          <span className={styles.tape}>{t('cases.sealedTape')}</span>
          <span className={`${styles.tape} ${styles.tapeB}`}>{t('cases.sealedTape')}</span>
        </>
      )}
      {!sealed && <span className={styles.clip} />}
    </div>
  );
}

function CompletionStamp({ completion }: { completion: CompletionRecord | undefined }) {
  const { t } = useT();
  if (!completion) return null;
  return (
    <div className={styles.record}>
      <span className={`stamp ${completion.solved ? styles.stampSolved : styles.stampClosed}`}>{completion.solved ? t('cases.solved') : t('cases.closed')}</span>
      {completion.bestTimeMs !== undefined && (
        <span className={styles.best} title={t('cases.fastest')}>
          {formatDuration(completion.bestTimeMs)}
        </span>
      )}
      <span className={styles.best}>
        {t('cases.best', { score: completion.bestScore })}
        <span className={styles.rank} aria-label={t('cases.rankLabel', { rank: completion.bestRank })}>
          {completion.bestRank}
        </span>
      </span>
    </div>
  );
}

export function CaseSelect() {
  useAmbience('menu');
  const navigate = useNavigate();
  const launch = useLaunch();
  const slot = useGame((s) => s.slot);
  const ensureActiveSlot = useGame((s) => s.ensureActiveSlot);
  const ensureProgress = useGame((s) => s.ensureProgress);
  const restartCase = useGame((s) => s.restartCase);
  const setActiveCase = useGame((s) => s.setActiveCase);
  const [pending, setPending] = useState<Pending | null>(null);
  const { t, language } = useT();

  useEffect(() => {
    if (!slot) ensureActiveSlot();
  }, [slot, ensureActiveSlot]);

  useEffect(() => {
    document.title = `${t('cases.title')} - Project Red String`;
  }, [t, language]);

  const backLink = (
    <>
      <ButtonLink to="/slots" variant="ghost">
        {t('slots.title')}
      </ButtonLink>
      <ButtonLink to="/" variant="ghost">
        {t('common.backToMenu')}
      </ButtonLink>
    </>
  );

  if (!slot) {
    return (
      <>
        <ComicBackdrop scene="office" dim="page" fallback={<RainBackdrop lamp="right" intensity="soft" />} />
        <ScreenFrame title={t('cases.title')} actions={backLink}>
          <p className="muted">{t('cases.pulling')}</p>
        </ScreenFrame>
      </>
    );
  }

  const titleOf = (key: string) => resolveCase(key)?.caseFile.title ?? t('cases.fallbackTitle');
  const open = (key: string, source: CaseSource, status: Status) => {
    ensureProgress(key, source);
    void launch(status === 'new' ? casePath(key, 'briefing') : casePath(key), {
      kicker: status === 'new' ? t('cases.newCase') : t('common.slot', { n: slot.slot }),
      title: titleOf(key),
    });
  };
  const viewVerdict = (key: string) => {
    setActiveCase(key);
    navigate(casePath(key, 'ending'));
  };
  const askReplay = (key: string, source: CaseSource, title: string) => setPending({ key, source, title });

  const confirmPending = () => {
    if (!pending) return;
    setPending(null);
    restartCase(pending.key, pending.source);
    void launch(casePath(pending.key, 'briefing'), { kicker: t('cases.startingOver'), title: pending.title });
  };

  const completed = (id: string) => Boolean(slot.completions[id]);

  return (
    <>
      <ComicBackdrop scene="office" dim="page" fallback={<RainBackdrop lamp="right" intensity="soft" />} />
      <ScreenFrame wide title={t('cases.title')} actions={backLink}>
        <section aria-labelledby="story-heading" className={styles.section}>
          <h2 id="story-heading" className="visually-hidden">
            {t('cases.storyHeading')}
          </h2>
          <ol className={styles.storyGrid}>
            {[TUTORIAL_ID, ...STORY_ORDER].map((id, position) => {
              // The tutorial comes first, always open and marked as practice; the story is numbered after it.
              const tutorial = id === TUTORIAL_ID;
              const index = position - 1;
              const english = getStoryCase(id);
              const c = english ? localizedCase(english) : null;
              const number = tutorial ? t('cases.tutorialMark') : t('cases.number', { n: index + 1 });
              const unlocked = tutorial || isStoryUnlocked(index, completed);
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
                        {t('cases.missingTitle')}
                      </h3>
                      <p className={styles.tagline}>{t('cases.missingNote')}</p>
                    </article>
                  </li>
                );
              }
              if (!unlocked) {
                return (
                  <li key={id} className={`${styles.storyCell} ${styles.sealedCell}`}>
                    <article className={`${styles.file} ${styles.locked}`} aria-labelledby={headingId} data-testid={`case-card-${id}`}>
                      <ScenePhoto caseFile={c} sealed />
                      <p className={styles.number}>{number}</p>
                      <h3 id={headingId} className={styles.fileTitle}>
                        {c.title}
                      </h3>
                      {/* Only the next file says what opens it; the tape on the others says enough. */}
                      {isStoryUnlocked(index - 1, completed) && (
                        <p className={styles.lockNote} data-testid="sealed-until">
                          {t('cases.sealedUntil', { title: titleOf(STORY_ORDER[index - 1]!) })}
                        </p>
                      )}
                    </article>
                  </li>
                );
              }
              return (
                <li key={id} className={styles.storyCell}>
                  <article
                    className={`paper ${styles.file} ${styles.unlocked} ${tutorial ? styles.tutorial : ''}`}
                    aria-labelledby={headingId}
                    data-testid={`case-card-${id}`}
                  >
                    <ScenePhoto caseFile={c} />
                    <div className={styles.fileHead}>
                      {tutorial ? (
                        <p className={styles.tutorialMark} title={t('cases.tutorialNote')} data-testid="tutorial-mark">
                          {number}
                        </p>
                      ) : (
                        <p className={styles.number}>{number}</p>
                      )}
                      <p className={`${styles.status} ${styles[`status-${status}`] ?? ''}`}>{t(STATUS_LABEL[status])}</p>
                    </div>
                    <h3 id={headingId} className={styles.fileTitle}>
                      {c.title}
                    </h3>
                    <p className={styles.tagline}>{c.tagline}</p>
                    <dl className={styles.meta}>
                      <div>
                        <dt>{t('cases.setting')}</dt>
                        <dd>{c.setting}</dd>
                      </div>
                      <div>
                        <dt>{t('cases.era')}</dt>
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

      </ScreenFrame>

      <Modal
        open={pending !== null}
        title={t('cases.reopenTitle')}
        onClose={() => setPending(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPending(null)}>
              {t('slots.keepIt')}
            </Button>
            <Button variant="primary" onClick={confirmPending} data-testid="case-confirm">
              {t('cases.reopen')}
            </Button>
          </>
        }
      >
          <p>
            {rich(t('cases.reopenBody'), { title: <strong>{pending?.title}</strong> })}
          </p>
      </Modal>
    </>
  );
}
