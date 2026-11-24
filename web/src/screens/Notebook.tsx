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
import type { CaseProgress } from '../engine/types.ts';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { ButtonLink } from '../components/Button.tsx';
import { EvidenceCard } from '../components/EvidenceCard.tsx';
import { Portrait } from '../components/Portrait.tsx';
import { casePath, useCaseContext } from '../hooks/useCase.ts';
import { useAmbience } from '../hooks/useAmbience.ts';
import { HINT_COST } from '../engine/scoring.ts';
import { clueById, evidenceName, getConversation, hintsShown, moodLabel, setNotes } from '../store/game.ts';
import { sfx } from '../audio/audio.ts';
import styles from './Notebook.module.css';

type TabKey = 'evidence' | 'clues' | 'suspects' | 'timeline' | 'notes' | 'hints';

const TAB_ORDER: readonly TabKey[] = ['evidence', 'clues', 'suspects', 'timeline', 'notes', 'hints'];
const TAB_LABEL: Record<TabKey, string> = {
  evidence: 'Evidence',
  clues: 'Clues',
  suspects: 'Suspects',
  timeline: 'Timeline',
  notes: 'Notes',
  hints: 'Hints',
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
        <h2>Evidence bag</h2>
        <p className={styles.intro}>Everything you have bagged, in the order you found it.</p>
      </header>
      <div data-testid="notebook-evidence">
        {found.length === 0 ? (
          <Empty
            action={
              <ButtonLink to={casePath(caseKey, 'rooms')} size="small">
                Search the scenes
              </ButtonLink>
            }
          >
            The bag is empty. Rooms do not search themselves.
          </Empty>
        ) : (
          <ul className={styles.evidenceGrid}>
            {found.map((e) => {
              const shown = shownTo.get(e.id);
              return (
                <li key={e.id} className={styles.evidenceItem}>
                  <EvidenceCard evidence={e} caseFile={caseFile} />
                  {shown && shown.length > 0 && <p className={styles.shownTo}>Shown to {shown.join(', ')}</p>}
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
        <h2>What they told you</h2>
        <p className={styles.intro}>Testimony worth keeping, filed under whoever let it slip.</p>
      </header>
      <div data-testid="notebook-clues" className={styles.clueGroups}>
        {groups.length === 0 ? (
          <Empty>Nobody has talked yet. Lean on them. Show them what you found.</Empty>
        ) : (
          groups.map(({ suspect, clues }) => (
            <section key={suspect.id} className={styles.clueGroup} aria-labelledby={`${uid}-clues-${suspect.id}`}>
              <h3 id={`${uid}-clues-${suspect.id}`} className={styles.groupTitle}>
                {suspect.name}
                <span className={styles.groupMeta}>
                  {clues.length} {clues.length === 1 ? 'clue' : 'clues'}
                </span>
              </h3>
              <ol className={styles.clueList}>
                {clues.map((cl) => (
                  <li key={cl.clue_id} className={styles.clue}>
                    <p className={styles.clueText}>{cl.text}</p>
                    {cl.evidence_id && (
                      <p className={styles.handed}>
                        <span className={styles.label}>Handed over</span> {evidenceName(caseFile, cl.evidence_id)}
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
        <h2>The people</h2>
        <p className={styles.intro}>What each of them claims, what is on record, and what you have pried loose.</p>
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
                  {s.role}, {s.age}
                </p>
                <dl className={styles.facts}>
                  <div>
                    <dt>Claims</dt>
                    <dd className={styles.alibi}>{s.alibi}</dd>
                  </div>
                  <div>
                    <dt>On record</dt>
                    <dd>
                      <ul className={styles.bullets}>
                        {s.public_facts.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  <div>
                    <dt>Gave up</dt>
                    <dd>
                      {theirClues.length === 0 ? (
                        <span className={styles.muted}>Nothing yet.</span>
                      ) : (
                        <ul className={styles.bullets}>
                          {theirClues.map((cl) => (
                            <li key={cl.clue_id}>{cl.text}</li>
                          ))}
                        </ul>
                      )}
                    </dd>
                  </div>
                  <div className={styles.inlineFacts}>
                    <div>
                      <dt>Questions</dt>
                      <dd>
                        {conv.patienceUsed} of {conv.patienceMax} used
                      </dd>
                    </div>
                    <div>
                      <dt>Mood</dt>
                      <dd className={styles.mood}>
                        <span className={styles.moodDot} data-mood={conv.mood} aria-hidden="true" />
                        {questioned ? moodLabel(conv.mood) : `${moodLabel(conv.mood)}, not questioned yet`}
                      </dd>
                    </div>
                  </div>
                </dl>
                {!closed && (
                  <ButtonLink to={casePath(caseKey, `interrogate/${s.id}`)} size="small">
                    Question {firstName(s.name)}
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
        <h2>The night, as everyone tells it</h2>
        <p className={styles.intro}>Common knowledge only. The parts nobody admits to are for you to fill in.</p>
      </header>
      {events.length === 0 ? (
        <Empty>No agreed timeline. Everybody remembers it differently.</Empty>
      ) : (
        <ol className={styles.timeline}>
          {events.map((e, i) => (
            <li key={`${e.day}-${e.time}-${i}`} className={styles.event}>
              <p className={styles.when}>
                {multiDay && <span className={styles.day}>Day {e.day + 1}</span>}
                <time className={styles.time} dateTime={e.time}>
                  {e.time}
                </time>
              </p>
              <div className={styles.eventBody}>
                <p className={styles.place}>{placeName(caseFile, e.location)}</p>
                <p className={styles.eventText}>{e.what}</p>
                {e.who.length > 0 && (
                  <p className={styles.who}>
                    <span className={styles.label}>Involved</span> {e.who.map((id) => personName(caseFile, id)).join(', ')}
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

  const statusText = status === 'pending' ? 'Writing...' : status === 'saved' ? 'Saved.' : 'Filed with the case.';

  return (
    <>
      <header className={styles.panelHead}>
        <h2>
          <label htmlFor={id}>Your notes</label>
        </h2>
        <p className={styles.intro}>Hunches, contradictions, times that do not add up. Saved as you type.</p>
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
        placeholder="Who was where at nine? Who is lying about it?"
      />
      <p id={statusId} className={`${styles.saved} ${status === 'saved' ? styles.savedDone : ''}`} role="status" aria-live="polite">
        {statusText}
      </p>
    </>
  );
}

function HintsPanel({ caseFile, hints }: { caseFile: CaseFile; hints: string[] }) {
  const remaining = caseFile.hints.length - hints.length;
  return (
    <>
      <header className={styles.panelHead}>
        <h2>The Captain&rsquo;s hints</h2>
        <p className={styles.intro}>
          {remaining} of {caseFile.hints.length} left. Each one costs {HINT_COST} points; ask with the Hint button up top.
        </p>
      </header>
      {hints.length === 0 ? (
        <Empty>No hints taken. Your pride is intact, for now.</Empty>
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
      for (const ev of progress.conversations[s.id]?.shownEvidence ?? []) {
        const list = m.get(ev) ?? [];
        if (!list.includes(s.name)) list.push(s.name);
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
    hints: <HintsPanel caseFile={caseFile} hints={hints} />,
  };

  return (
    <ScreenFrame
      title="Notebook"
      kicker={caseFile.title}
      actions={
        <ButtonLink to={casePath(caseKey, 'board')} variant="ghost">
          To the board
        </ButtonLink>
      }
    >
      <div className={styles.notebook}>
        <div role="tablist" aria-label="Notebook sections" className={styles.tabs}>
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
                <span>{TAB_LABEL[key]}</span>
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
