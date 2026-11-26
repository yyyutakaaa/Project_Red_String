import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CaseFile, Evidence, RevealableClue, Suspect, TimelineEvent } from '@shared/caseSchema.ts';
import type { CaseProgress, PartnerLogEntry } from '../engine/types.ts';
import doyleAvatar from '../assets/art/partner/doyle.webp';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { ButtonLink } from '../components/Button.tsx';
import { EvidenceCard } from '../components/EvidenceCard.tsx';
import { Portrait } from '../components/Portrait.tsx';
import { casePath, useCaseContext } from '../hooks/useCase.ts';
import { useAmbience } from '../hooks/useAmbience.ts';
import { HINT_COST } from '../engine/scoring.ts';
import { clueById, evidenceName, getConversation, hintsShown, setNotes } from '../store/game.ts';
import { sfx } from '../audio/audio.ts';
import styles from './Notebook.module.css';
import { t, tn, useT, type MessageKey } from '../i18n/index.ts';

type TabKey = 'evidence' | 'clues' | 'suspects' | 'timeline' | 'notes' | 'partner' | 'hints';

const TAB_ORDER: readonly TabKey[] = ['evidence', 'clues', 'suspects', 'timeline', 'notes', 'partner', 'hints'];
const TAB_LABEL: Record<TabKey, MessageKey> = {
  evidence: 'notebook.tabEvidence',
  clues: 'notebook.tabClues',
  suspects: 'notebook.tabSuspects',
  timeline: 'notebook.tabTimeline',
  notes: 'notebook.tabNotes',
  partner: 'notebook.tabPartner',
  hints: 'notebook.tabHints',
};

const isTab = (v: string | null): v is TabKey => v !== null && (TAB_ORDER as readonly string[]).includes(v);

const NOTES_DEBOUNCE_MS = 400;

interface ClueGroup {
  suspect: Suspect;
  clues: RevealableClue[];
}

function prettyId(id: string): string {
  const words = id.replace(/[-_]+/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : id;
}

function placeName(c: CaseFile, id: string): string {
  return c.rooms.find((r) => r.id === id)?.name ?? c.offstage_locations.find((o) => o.id === id)?.name ?? prettyId(id);
}

function personName(c: CaseFile, id: string): string {
  if (c.victim.id === id) return c.victim.name;
  return c.suspects.find((s) => s.id === id)?.name ?? prettyId(id);
}

function firstName(name: string): string {
  return name.split(/\s+/)[0] ?? name;
}

function Empty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className={styles.empty}>
      <p>{children}</p>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panels

function EvidencePanel({ caseFile, caseKey, found, shownTo }: { caseFile: CaseFile; caseKey: string; found: Evidence[]; shownTo: Map<string, string[]> }) {
  return (
    <>
      <header className={styles.panelHead}>
        <h2>{t('notebook.evidenceTitle')}</h2>
        <p className={styles.intro}>{t('notebook.evidenceIntro')}</p>
      </header>
      <div data-testid="notebook-evidence">
        {found.length === 0 ? (
          <Empty
            action={
              <ButtonLink to={casePath(caseKey, 'rooms')} size="small">
                {t('notebook.searchScenes')}
              </ButtonLink>
            }
          >
            {t('notebook.bagEmpty')}
          </Empty>
        ) : (
          <ul className={styles.evidenceGrid}>
            {found.map((e, index) => {
              const shown = shownTo.get(e.id);
              return (
                <li key={e.id} className={styles.evidenceItem}>
                  <EvidenceCard evidence={e} caseFile={caseFile} exhibit={index + 1} />
                  {shown && shown.length > 0 && <p className={styles.shownTo}>{t('notebook.shownTo', { names: shown.join(', ') })}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

function CluesPanel({ caseFile, groups, uid }: { caseFile: CaseFile; groups: ClueGroup[]; uid: string }) {
  return (
    <>
      <header className={styles.panelHead}>
        <h2>{t('notebook.cluesTitle')}</h2>
        <p className={styles.intro}>{t('notebook.cluesIntro')}</p>
      </header>
      <div data-testid="notebook-clues" className={styles.clueGroups}>
        {groups.length === 0 ? (
          <Empty>{t('notebook.noClues')}</Empty>
        ) : (
          groups.map(({ suspect, clues }) => (
            <section key={suspect.id} className={styles.clueGroup} aria-labelledby={`${uid}-clues-${suspect.id}`}>
              <h3 id={`${uid}-clues-${suspect.id}`} className={styles.groupTitle}>
                {suspect.name}
                <span className={styles.groupMeta}>
                  {tn('notebook.clueCount', clues.length)}
                </span>
              </h3>
              <ol className={styles.clueList}>
                {clues.map((cl) => (
                  <li key={cl.clue_id} className={styles.clue}>
                    <p className={styles.clueText}>{cl.text}</p>
                    {cl.evidence_id && (
                      <p className={styles.handed}>
                        <span className={styles.label}>{t('notebook.handedOver')}</span> {evidenceName(caseFile, cl.evidence_id)}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          ))
        )}
      </div>
    </>
  );
}

function SuspectsPanel({
  caseFile,
  caseKey,
  progress,
  groups,
}: {
  caseFile: CaseFile;
  caseKey: string;
  progress: CaseProgress;
  groups: ClueGroup[];
}) {
  const closed = progress.accusation !== null;
  return (
    <>
      <header className={styles.panelHead}>
        <h2>{t('notebook.peopleTitle')}</h2>
        <p className={styles.intro}>{t('notebook.peopleIntro')}</p>
      </header>
      <ul className={styles.suspectList}>
        {caseFile.suspects.map((s) => {
          const conv = getConversation(progress, caseFile, s.id);
          const questioned = conv.messages.length > 0 || conv.patienceUsed > 0;
          const theirClues = groups.find((g) => g.suspect.id === s.id)?.clues ?? [];
          return (
            <li key={s.id} className={styles.suspect}>
              <Portrait suspect={s} size={88} mood={questioned ? conv.mood : null} decorative showInitials={false} className={styles.portrait} />
              <div className={styles.suspectBody}>
                <h3 className={styles.suspectName}>{s.name}</h3>
                <p className={styles.role}>
                  {t('notebook.roleAge', { role: s.role, age: s.age })}
                </p>
                <dl className={styles.facts}>
                  <div>
                    <dt>{t('notebook.claims')}</dt>
                    <dd className={styles.alibi}>{s.alibi}</dd>
                  </div>
                  <div>
                    <dt>{t('notebook.onRecord')}</dt>
                    <dd>
                      <ul className={styles.bullets}>
                        {s.public_facts.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  <div>
                    <dt>{t('notebook.gaveUp')}</dt>
                    <dd>
                      {theirClues.length === 0 ? (
                        <span className={styles.muted}>{t('notebook.nothingYet')}</span>
                      ) : (
                        <ul className={styles.bullets}>
                          {theirClues.map((cl) => (
                            <li key={cl.clue_id}>{cl.text}</li>
                          ))}
                        </ul>
                      )}
                    </dd>
                  </div>
                  {(conv.caughtLies?.length ?? 0) > 0 && (
                    <div data-testid={`caught-lies-${s.id}`}>
                      <dt>{t('notebook.caughtLying')}</dt>
                      <dd>
                        <ul className={styles.bullets}>
                          {(conv.caughtLies ?? []).map((lie) => (
                            <li key={lie.at}>
                              “{lie.statement}”{' '}
                              <span className={styles.muted}>
                                {t('notebook.disprovedBy', { evidence: caseFile.evidence.find((e) => e.id === lie.evidenceId)?.name ?? lie.evidenceId })}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  )}
                  <div className={styles.inlineFacts}>
                    <div>
                      <dt>{t('notebook.questions')}</dt>
                      <dd>{t('notebook.questionsUsed', { used: conv.patienceUsed, max: conv.patienceMax })}</dd>
                    </div>
                    <div>
                      <dt>{t('notebook.mood')}</dt>
                      <dd className={styles.mood}>
                        <span className={styles.moodDot} data-mood={conv.mood} aria-hidden="true" />
                        {questioned ? t(`mood.${conv.mood}`) : t('notebook.notQuestioned', { mood: t(`mood.${conv.mood}`) })}
                      </dd>
                    </div>
                  </div>
                </dl>
                {!closed && (
                  <ButtonLink to={casePath(caseKey, `interrogate/${s.id}`)} size="small">
                    {t('notebook.question', { name: firstName(s.name) })}
                  </ButtonLink>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function TimelinePanel({ caseFile, events }: { caseFile: CaseFile; events: TimelineEvent[] }) {
  const multiDay = new Set(events.map((e) => e.day)).size > 1;
  return (
    <>
      <header className={styles.panelHead}>
        <h2>{t('notebook.timelineTitle')}</h2>
        <p className={styles.intro}>{t('notebook.timelineIntro')}</p>
      </header>
      {events.length === 0 ? (
        <Empty>{t('notebook.noTimeline')}</Empty>
      ) : (
        <ol className={styles.timeline}>
          {events.map((e, i) => (
            <li key={`${e.day}-${e.time}-${i}`} className={styles.event}>
              <p className={styles.when}>
                {multiDay && <span className={styles.day}>{t('notebook.day', { n: e.day + 1 })}</span>}
                <time className={styles.time} dateTime={e.time}>
                  {e.time}
                </time>
              </p>
              <div className={styles.eventBody}>
                <p className={styles.place}>{placeName(caseFile, e.location)}</p>
                <p className={styles.eventText}>{e.what}</p>
                {e.who.length > 0 && (
                  <p className={styles.who}>
                    <span className={styles.label}>{t('notebook.involved')}</span> {e.who.map((id) => personName(caseFile, id)).join(', ')}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

function NotesPanel({ caseKey, initial }: { caseKey: string; initial: string }) {
  const id = useId();
  const statusId = `${id}-status`;
  const [draft, setDraft] = useState(initial);
  const [status, setStatus] = useState<'idle' | 'pending' | 'saved'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<string | null>(null);

  /** Write any unsaved text now. Returns true when something was written. */
  const flush = useCallback((): boolean => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const value = pending.current;
    if (value === null) return false;
    pending.current = null;
    setNotes(caseKey, value);
    return true;
  }, [caseKey]);

  // Leaving the page never loses the last few keystrokes.
  useEffect(() => () => void flush(), [flush]);

  const onChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDraft(value);
    pending.current = value;
    setStatus('pending');
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (flush()) setStatus('saved');
    }, NOTES_DEBOUNCE_MS);
  };

  const statusText = status === 'pending' ? t('notebook.writing') : status === 'saved' ? t('notebook.saved') : t('notebook.filed');

  return (
    <>
      <header className={styles.panelHead}>
        <h2>
          <label htmlFor={id}>{t('notebook.yourNotes')}</label>
        </h2>
        <p className={styles.intro}>{t('notebook.notesIntro')}</p>
      </header>
      <textarea
        id={id}
        className={styles.notes}
        value={draft}
        onChange={onChange}
        onBlur={() => {
          if (flush()) setStatus('saved');
        }}
        rows={14}
        spellCheck
        aria-describedby={statusId}
        placeholder={t('notebook.notesPlaceholder')}
      />
      <p id={statusId} className={`${styles.saved} ${status === 'saved' ? styles.savedDone : ''}`} role="status" aria-live="polite">
        {statusText}
      </p>
    </>
  );
}

/** What Sergeant Doyle said in this run, so it can be read again after his bubble is gone. */
function PartnerPanel({ log }: { log: readonly PartnerLogEntry[] }) {
  return (
    <>
      <header className={styles.panelHead}>
        <h2>{t('notebook.partnerTitle')}</h2>
      </header>
      {log.length === 0 ? (
        <Empty>{t('notebook.noPartner')}</Empty>
      ) : (
        <ol className={styles.partnerList}>
          {log.map((l, i) => (
            <li key={i}>
              <img src={doyleAvatar} alt="" className={styles.partnerAvatar} />
              <p>{l.text}</p>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

function HintsPanel({ caseFile, hints }: { caseFile: CaseFile; hints: string[] }) {
  const remaining = caseFile.hints.length - hints.length;
  return (
    <>
      <header className={styles.panelHead}>
        <h2>{t('notebook.hintsTitle')}</h2>
        <p className={styles.intro}>{t('notebook.hintsIntro', { remaining, total: caseFile.hints.length, cost: HINT_COST })}</p>
      </header>
      {hints.length === 0 ? (
        <Empty>{t('notebook.noHints')}</Empty>
      ) : (
        <ol className={styles.hintList}>
          {hints.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ol>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------

export function Notebook() {
  const { caseFile, caseKey, progress } = useCaseContext();
  useAmbience('rain');
  useT();
  const uid = `n${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [params, setParams] = useSearchParams();
  const tabParam = params.get('tab');
  const active: TabKey = isTab(tabParam) ? tabParam : 'evidence';
  const tabRefs = useRef<Partial<Record<TabKey, HTMLButtonElement | null>>>({});

  const found = useMemo(
    () => progress.foundEvidence.map((id) => caseFile.evidence.find((e) => e.id === id)).filter((e): e is Evidence => !!e),
    [progress.foundEvidence, caseFile],
  );

  const shownTo = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const s of caseFile.suspects) {
      const conv = progress.conversations[s.id];
      for (const ev of conv?.shownEvidence ?? []) {
        const list = m.get(ev) ?? [];
        // Evidence that meant nothing to someone is marked, so nobody shows it to them twice.
        const entry = conv?.evidenceEffects?.[ev] === 'none' ? t('notebook.nothingNew', { name: s.name }) : s.name;
        if (!list.includes(entry)) list.push(entry);
        m.set(ev, list);
      }
    }
    return m;
  }, [caseFile, progress.conversations]);

  const clueGroups = useMemo<ClueGroup[]>(() => {
    const bySuspect = new Map<string, RevealableClue[]>();
    for (const id of progress.revealedClues) {
      const hit = clueById(caseFile, id);
      if (!hit) continue;
      const list = bySuspect.get(hit.suspect.id) ?? [];
      if (!list.some((c) => c.clue_id === hit.clue.clue_id)) list.push(hit.clue);
      bySuspect.set(hit.suspect.id, list);
    }
    return caseFile.suspects.filter((s) => bySuspect.has(s.id)).map((s) => ({ suspect: s, clues: bySuspect.get(s.id) ?? [] }));
  }, [progress.revealedClues, caseFile]);

  const publicEvents = useMemo(
    () =>
      caseFile.timeline
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => e.visibility === 'public')
        .sort((a, b) => a.e.day - b.e.day || a.e.time.localeCompare(b.e.time) || a.i - b.i)
        .map(({ e }) => e),
    [caseFile],
  );

  const hints = hintsShown(caseFile, progress);
  const clueCount = clueGroups.reduce((n, g) => n + g.clues.length, 0);

  const counts: Record<TabKey, number | null> = {
    evidence: found.length,
    clues: clueCount,
    suspects: caseFile.suspects.length,
    timeline: publicEvents.length,
    notes: null,
    partner: progress.partnerLog?.length ?? 0,
    hints: hints.length,
  };

  const select = (key: TabKey, focus = false) => {
    if (key !== active) {
      sfx('page');
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('tab', key);
          return next;
        },
        { replace: true, preventScrollReset: true },
      );
    }
    if (focus) tabRefs.current[key]?.focus();
  };

  const onTabKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>, key: TabKey) => {
    const i = TAB_ORDER.indexOf(key);
    const n = TAB_ORDER.length;
    let next: TabKey | undefined;
    if (e.key === 'ArrowRight') next = TAB_ORDER[(i + 1) % n];
    else if (e.key === 'ArrowLeft') next = TAB_ORDER[(i - 1 + n) % n];
    else if (e.key === 'Home') next = TAB_ORDER[0];
    else if (e.key === 'End') next = TAB_ORDER[n - 1];
    if (!next) return;
    e.preventDefault();
    select(next, true);
  };

  const panels: Record<TabKey, ReactNode> = {
    evidence: <EvidencePanel caseFile={caseFile} caseKey={caseKey} found={found} shownTo={shownTo} />,
    clues: <CluesPanel caseFile={caseFile} groups={clueGroups} uid={uid} />,
    suspects: <SuspectsPanel caseFile={caseFile} caseKey={caseKey} progress={progress} groups={clueGroups} />,
    timeline: <TimelinePanel caseFile={caseFile} events={publicEvents} />,
    notes: <NotesPanel key={caseKey} caseKey={caseKey} initial={progress.notes} />,
    partner: <PartnerPanel log={progress.partnerLog ?? []} />,
    hints: <HintsPanel caseFile={caseFile} hints={hints} />,
  };

  return (
    <ScreenFrame
      title={t('notebook.title')}
      actions={
        <ButtonLink to={casePath(caseKey, 'board')} variant="ghost">
          {t('notebook.toBoard')}
        </ButtonLink>
      }
    >
      <div className={styles.notebook}>
        <div role="tablist" aria-label={t('notebook.sections')} className={styles.tabs}>
          {TAB_ORDER.map((key) => {
            const selected = key === active;
            const count = counts[key];
            return (
              <button
                key={key}
                ref={(el) => {
                  tabRefs.current[key] = el;
                }}
                type="button"
                role="tab"
                id={`${uid}-tab-${key}`}
                aria-selected={selected}
                aria-controls={`${uid}-panel-${key}`}
                tabIndex={selected ? 0 : -1}
                className={styles.tab}
                onClick={() => select(key)}
                onKeyDown={(e) => onTabKeyDown(e, key)}
              >
                <span>{t(TAB_LABEL[key])}</span>
                {count !== null && (
                  <>
                    <span className={styles.count} aria-hidden="true">
                      {count}
                    </span>
                    <span className="visually-hidden">, {count}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
        <div className={`paper ${styles.sheet}`}>
          {TAB_ORDER.map((key) => (
            <section
              key={key}
              role="tabpanel"
              id={`${uid}-panel-${key}`}
              aria-labelledby={`${uid}-tab-${key}`}
              hidden={key !== active}
              tabIndex={0}
              className={styles.panel}
            >
              {panels[key]}
            </section>
          ))}
        </div>
      </div>
    </ScreenFrame>
  );
}
