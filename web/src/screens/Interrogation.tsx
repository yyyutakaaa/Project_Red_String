import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import { create } from 'zustand';
import type { CaseFile, RevealableClue, Suspect } from '@shared/caseSchema.ts';
import { ambienceForBackground, sfx } from '../audio/audio.ts';
import { Button, ButtonLink } from '../components/Button.tsx';
import { EvidencePicker } from '../components/EvidencePicker.tsx';
import { MoodIndicator } from '../components/MoodIndicator.tsx';
import { PatienceMeter } from '../components/PatienceMeter.tsx';
import { Portrait } from '../components/Portrait.tsx';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { Typewriter } from '../components/Typewriter.tsx';
import { uuid } from '../engine/save.ts';
import type { ChatMessage } from '../engine/types.ts';
import { useAmbience } from '../hooks/useAmbience.ts';
import { casePath, useCaseContext } from '../hooks/useCase.ts';
import { ApiError, checkBackend, describeApiError, interrogate, type ConversationTurn } from '../lib/api.ts';
import { track } from '../lib/telemetry.ts';
import {
  addChatMessage,
  applyRevealedClues,
  clueById,
  evidenceName,
  getConversation,
  patchChatMessage,
  removeChatMessage,
  setConversationState,
  useGame,
} from '../store/game.ts';
import { useReducedMotion } from '../store/settings.ts';
import styles from './Interrogation.module.css';
import { t, useT } from '../i18n/index.ts';

const MAX_LEN = 500;
const HISTORY_TURNS = 12;
const NARROW_QUERY = '(max-width: 899px)';
const PROBE_TTL_MS = 20_000;

// ---------------------------------------------------------------------------
// Module state that outlives the screen: replies still streaming (so leaving and coming back,
// or switching suspects, cannot double-send) and the last backend reachability result.

interface PendingReply {
  placeholderId: string;
  /** True once the first streamed text arrived. */
  started: boolean;
}

const usePendingReplies = create<{ byKey: Record<string, PendingReply> }>(() => ({ byKey: {} }));

function setPending(key: string, value: PendingReply | null): void {
  usePendingReplies.setState((s) => {
    const byKey = { ...s.byKey };
    if (value) byKey[key] = value;
    else delete byKey[key];
    return { byKey };
  });
}

let probeCache: { at: number; result: Promise<boolean> } | null = null;

function probeBackend(force: boolean): Promise<boolean> {
  const now = Date.now();
  if (!force && probeCache && now - probeCache.at < PROBE_TTL_MS) return probeCache.result;
  probeCache = { at: now, result: checkBackend() };
  return probeCache.result;
}

function rememberBackend(ok: boolean): void {
  probeCache = { at: Date.now(), result: Promise.resolve(ok) };
}

/**
 * Set by the "Bring in" links. Switching suspects remounts the room and drops the focused link, so the
 * next room to mount takes focus on its heading instead of leaving keyboard users on the page body.
 */
let focusHeadingOnMount = false;

/** True while the same save slot and the same attempt at the case are active as when a question was sent. */
function isActiveRun(caseKey: string, slotNo: number, runId: string): boolean {
  const slot = useGame.getState().slot;
  return slot?.slot === slotNo && slot.progress[caseKey]?.runId === runId;
}

// ---------------------------------------------------------------------------
// Small helpers

function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => undefined;
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
    () => false,
  );
}

const TITLES = new Set([
  'mr', 'mrs', 'miss', 'ms', 'mx', 'dr', 'doctor', 'lady', 'lord', 'sir', 'dame', 'madame', 'mme', 'monsieur',
  'captain', 'capt', 'officer', 'father', 'sister', 'brother', 'inspector', 'professor', 'prof', 'judge',
  'reverend', 'rev', 'count', 'countess', 'baron', 'baroness', 'colonel', 'major', 'sergeant', 'sgt', 'nurse',
]);

/** "Clara Ashgrove" -> "Clara"; "Dr. Harold Finch" -> "Harold". */
function shortName(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return parts.find((p) => !TITLES.has(p.replace(/\.$/, '').toLowerCase())) ?? parts[0] ?? name;
}

/** The last few spoken turns before a question, in the shape the backend expects. */
function toTurns(messages: readonly ChatMessage[]): ConversationTurn[] {
  const turns: ConversationTurn[] = [];
  for (const m of messages) {
    if (m.role === 'system' || m.silent || !m.text.trim()) continue;
    turns.push({ role: m.role === 'detective' ? 'detective' : 'suspect', text: m.text });
  }
  return turns.slice(-HISTORY_TURNS);
}

function lastSuspectId(messages: readonly ChatMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m?.role === 'suspect') return m.id;
  }
  return null;
}

function scrollToBottom(el: HTMLElement, smooth: boolean): void {
  const top = el.scrollHeight;
  if (typeof el.scrollTo === 'function') el.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
  else el.scrollTop = top;
}

function liveConversation(caseFile: CaseFile, caseKey: string, suspectId: string) {
  const p = useGame.getState().slot?.progress[caseKey];
  return p ? getConversation(p, caseFile, suspectId) : null;
}

// ---------------------------------------------------------------------------
// Screen

export function Interrogation() {
  const { suspectId = '' } = useParams();
  const { caseFile, caseKey } = useCaseContext();
  useAmbience(ambienceForBackground(caseFile.rooms[0]?.background));
  const suspect = caseFile.suspects.find((s) => s.id === suspectId);
  const { t } = useT();

  if (!suspect) {
    return (
      <ScreenFrame title={t('interro.nobody')} kicker={t('interro.room')}>
        <p>{t('interro.nobodyText')}</p>
        <ButtonLink to={casePath(caseKey, 'suspects')} variant="lamp">
          {t('interro.backToSuspects')}
        </ButtonLink>
      </ScreenFrame>
    );
  }
  // Keyed so switching suspects starts with a clean table: no stale draft, evidence or errors.
  return <InterrogationRoom key={suspect.id} suspect={suspect} />;
}

interface RetryPayload {
  text: string;
  evidenceId: string | null;
  detectiveId: string;
}

interface Failure {
  message: string;
  retry: RetryPayload | null;
}

function InterrogationRoom({ suspect }: { suspect: Suspect }) {
  const { caseFile, caseKey, progress } = useCaseContext();
  const reduced = useReducedMotion();
  const { t } = useT();
  const narrow = useMediaQuery(NARROW_QUERY);
  const nameId = useId();
  const othersId = useId();
  const questionId = useId();
  const hintId = useId();
  const counterId = useId();

  const conv = getConversation(progress, caseFile, suspect.id);
  const convKey = `${caseKey}::${suspect.id}`;
  const pending = usePendingReplies((s) => s.byKey[convKey]);
  const inFlight = pending !== undefined;
  const exhausted = conv.patienceUsed >= conv.patienceMax;
  const short = shortName(suspect.name);

  const [draft, setDraft] = useState('');
  const [attached, setAttached] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [silentNotice, setSilentNotice] = useState(false);
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false);
  // Replies that arrived while this screen was open render through the typewriter; older ones are plain text.
  const [typedIds, setTypedIds] = useState<ReadonlySet<string>>(() => new Set(pending ? [pending.placeholderId] : []));
  const [claimsOpen, setClaimsOpen] = useState(() => !narrow);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollState = useRef({ stick: true, lastTop: 0, smoothUntil: 0, first: true });
  const refocusInput = useRef(false);
  const confirmedOnline = useRef(false);

  // Empty suspect messages are reply placeholders: hidden until the first words arrive.
  const messages = conv.messages.filter((m) => !(m.role === 'suspect' && m.text.length === 0));
  const newestSuspectId = lastSuspectId(conv.messages);
  const visibleCount = messages.length;
  const attachedEvidence = attached ? caseFile.evidence.find((e) => e.id === attached) ?? null : null;
  const others = caseFile.suspects.filter((s) => s.id !== suspect.id);
  const noted: RevealableClue[] = suspect.revealable_clues.filter((c) => progress.revealedClues.includes(c.clue_id));
  const canSend = !inFlight && !exhausted && (draft.trim().length > 0 || attached !== null);

  // Reachability: warn before the player types, keep listening to the browser's own signal.
  useEffect(() => {
    let alive = true;
    const run = (force: boolean) => {
      void probeBackend(force).then((ok) => {
        if (!alive || (!ok && confirmedOnline.current)) return;
        setOffline(!ok);
      });
    };
    run(false);
    const onOffline = () => {
      confirmedOnline.current = false;
      setOffline(true);
    };
    const onOnline = () => run(true);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      alive = false;
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  // Arrived here from another suspect's "Bring in" link: the clicked link is gone, so keep focus on this screen.
  useEffect(() => {
    if (!focusHeadingOnMount) return;
    focusHeadingOnMount = false;
    const active = document.activeElement;
    if (!active || active === document.body) headingRef.current?.focus({ preventScroll: true });
  }, []);

  // A reload mid-reply (or a reply dropped because the slot changed under it) can leave an empty placeholder
  // in the save. Sweep it whenever nothing is streaming.
  useEffect(() => {
    if (usePendingReplies.getState().byKey[convKey]) return;
    const live = liveConversation(caseFile, caseKey, suspect.id);
    if (!live) return;
    for (const m of live.messages) {
      if (m.role === 'suspect' && !m.text.trim()) removeChatMessage(caseFile, caseKey, suspect.id, m.id);
    }
  }, [caseFile, caseKey, convKey, suspect.id, inFlight]);

  // New message: jump to the bottom (smoothly, unless motion is reduced or this is the first paint).
  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    const s = scrollState.current;
    const smooth = !reduced && !s.first;
    s.first = false;
    s.stick = true;
    if (smooth) s.smoothUntil = performance.now() + 450;
    scrollToBottom(el, smooth);
  }, [visibleCount, reduced]);

  // Text growing inside a message (streaming, typewriter): follow it while the reader is at the bottom.
  useEffect(() => {
    const el = logRef.current;
    const content = contentRef.current;
    if (!el || !content || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      const s = scrollState.current;
      if (!s.stick || performance.now() < s.smoothUntil) return;
      el.scrollTop = el.scrollHeight;
    });
    ro.observe(content);
    return () => ro.disconnect();
  }, []);

  // After picking evidence the dialog hands focus back to its opener; send it on to the question box.
  useEffect(() => {
    if (!pickerOpen && refocusInput.current) {
      refocusInput.current = false;
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [pickerOpen]);

  const onLogScroll = () => {
    const el = logRef.current;
    if (!el) return;
    const s = scrollState.current;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distance < 48) s.stick = true;
    else if (el.scrollTop < s.lastTop - 1) s.stick = false;
    s.lastTop = el.scrollTop;
  };

  async function ask(text: string, evidenceId: string | null, retryOfId: string | null): Promise<void> {
    if (usePendingReplies.getState().byKey[convKey]) return;
    const activeSlot = useGame.getState().slot;
    const run = activeSlot?.progress[caseKey];
    if (!activeSlot || !run) return;
    const slotNo = activeSlot.slot;
    const runId = run.runId;
    // The player can switch slot or restart the case while the reply is on its way. Anything that lands
    // after that belongs to a game that is no longer on the table, so it is dropped without a word.
    const stillActive = () => isActiveRun(caseKey, slotNo, runId);
    const current = getConversation(run, caseFile, suspect.id);
    if (current.patienceUsed >= current.patienceMax) return;
    const message = (text.trim() || (evidenceId ? t('interro.showLine') : '')).slice(0, MAX_LEN);
    if (!message) return;

    // Everything said before this question. A retry leaves out the question being retried.
    let prior = current.messages;
    if (retryOfId) {
      const idx = prior.findIndex((m) => m.id === retryOfId);
      if (idx >= 0) prior = prior.slice(0, idx);
    }
    const conversation = toTurns(prior);

    setFailure(null);
    setSilentNotice(false);

    const detectiveId = retryOfId ?? uuid();
    if (!retryOfId) {
      addChatMessage(caseFile, caseKey, suspect.id, {
        id: detectiveId,
        role: 'detective',
        text: message,
        at: Date.now(),
        shownEvidenceId: evidenceId,
      });
      setDraft('');
      setAttached(null);
    }

    const placeholderId = uuid();
    addChatMessage(caseFile, caseKey, suspect.id, { id: placeholderId, role: 'suspect', text: '', at: Date.now() }, false);
    setPending(convKey, { placeholderId, started: false });
    setTypedIds((prev) => new Set(prev).add(placeholderId));

    let streamed = '';
    try {
      const final = await interrogate(
        {
          case_id: caseFile.id,
          suspect_id: suspect.id,
          save_id: runId,
          parent_save_id: run.parentRunId ?? null,
          conversation,
          message,
          shown_evidence_id: evidenceId,
          device_id: useGame.getState().deviceId,
        },
        {
          onDelta: (delta) => {
            if (!stillActive()) return;
            if (!streamed) setPending(convKey, { placeholderId, started: true });
            streamed += delta;
            patchChatMessage(caseFile, caseKey, suspect.id, placeholderId, { text: streamed }, false);
          },
        },
      );
      if (!stillActive()) return;

      const reply = final.reply.trim() ? final.reply : streamed.trim() ? streamed : t('interro.emptyReply');
      // The chips on this reply show what it revealed; the notebook also catches up on anything this
      // suspect revealed earlier in the run whose reply never made it here.
      const revealed = Array.isArray(final.revealed_clue_ids) ? final.revealed_clue_ids : [];
      const allRevealed = Array.isArray(final.all_revealed_clue_ids) ? final.all_revealed_clue_ids : revealed;
      patchChatMessage(
        caseFile,
        caseKey,
        suspect.id,
        placeholderId,
        { text: reply, revealedClueIds: revealed, ...(final.silent ? { silent: true } : {}) },
        true,
      );
      applyRevealedClues(caseFile, caseKey, allRevealed);
      track('question', caseKey, {
        suspect: suspect.id,
        shown: evidenceId,
        clues: revealed.length,
        used: final.patience_used,
        max: final.patience_max,
        mood: final.mood,
        silent: final.silent,
        len: message.length,
        retry: Boolean(retryOfId),
      });

      const latest = liveConversation(caseFile, caseKey, suspect.id);
      const shownBefore = latest?.shownEvidence ?? [];
      // A silent reply was a canned brush-off: the suspect never really looked at the evidence.
      const addShown = evidenceId !== null && !final.silent && !shownBefore.includes(evidenceId);
      setConversationState(caseFile, caseKey, suspect.id, {
        mood: final.mood,
        patienceUsed: final.patience_used,
        patienceMax: final.patience_max,
        ...(addShown ? { shownEvidence: [...shownBefore, evidenceId] } : {}),
      });

      if (final.silent) setSilentNotice(true);
      confirmedOnline.current = true;
      rememberBackend(true);
      setOffline(false);
    } catch (err) {
      if (!stillActive()) return;
      removeChatMessage(caseFile, caseKey, suspect.id, placeholderId);
      const code = err instanceof ApiError ? err.code : null;
      track('interrogation_error', caseKey, { suspect: suspect.id, code: code ?? 'unknown', shown: evidenceId });
      if (code === 'patience_exhausted') {
        const latest = liveConversation(caseFile, caseKey, suspect.id);
        if (latest) setConversationState(caseFile, caseKey, suspect.id, { patienceUsed: latest.patienceMax });
        setFailure(null);
      } else {
        setFailure({ message: describeApiError(err), retry: { text: message, evidenceId, detectiveId } });
      }
      if (code === 'offline' || code === 'not_configured') {
        confirmedOnline.current = false;
        rememberBackend(false);
        setOffline(true);
      }
      sfx('error');
    } finally {
      setPending(convKey, null);
    }
  }

  const submit = () => {
    if (!canSend) return;
    void ask(draft, attached, null);
    inputRef.current?.focus({ preventScroll: true });
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const retry = () => {
    if (!failure?.retry || inFlight) return;
    const { text, evidenceId, detectiveId } = failure.retry;
    void ask(text, evidenceId, detectiveId);
  };

  const onPick = (id: string | null) => {
    setAttached(id);
    if (id) {
      sfx('page');
      refocusInput.current = true;
      setPickerOpen(false);
    }
  };

  const nearLimit = draft.length >= MAX_LEN - 50;

  return (
    <main id="main" tabIndex={-1} className={styles.page}>
      <nav className={styles.topbar} aria-label={t('interro.room')}>
        <ButtonLink to={casePath(caseKey, 'suspects')} variant="ghost" data-testid="leave-room">
          {t('interro.leave')}
        </ButtonLink>
        {others.length > 0 && (
          <div className={styles.others}>
            <span className={styles.othersLabel} id={othersId}>
              {t('interro.bringIn')}
            </span>
            <ul className={styles.othersList} aria-labelledby={othersId}>
              {others.map((o) => (
                <li key={o.id}>
                  <Link
                    to={casePath(caseKey, `interrogate/${o.id}`)}
                    className={styles.otherLink}
                    data-testid={`switch-suspect-${o.id}`}
                    onClick={(e) => {
                      sfx('click');
                      // A plain activation navigates here; a modified click opens a new tab and keeps this room.
                      if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) focusHeadingOnMount = true;
                    }}
                  >
                    <Portrait
                      suspect={o}
                      size={30}
                      showInitials={false}
                      decorative
                      mood={progress.conversations[o.id]?.mood ?? null}
                      className={styles.otherThumb}
                    />
                    <span>{o.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      {offline && (
        <div className={styles.banner} data-testid="offline-banner" role="status">
          <span className={`stamp ${styles.bannerStamp}`} aria-hidden="true">
            {t('interro.lineDead')}
          </span>
          <p>
            <strong>{t('interro.unreachable')}</strong> {t('interro.unreachableText')}
          </p>
        </div>
      )}

      <div className={styles.layout}>
        <aside
          className={`${styles.dossier} scroll-area`}
          aria-labelledby={nameId}
          // On wide screens the dossier scrolls on its own; make it reachable from the keyboard.
          tabIndex={narrow ? undefined : 0}
        >
          <div className={styles.lamp} data-mood={conv.mood} aria-hidden="true" />
          <div className={styles.portraitSlot} data-mood={conv.mood}>
            <Portrait suspect={suspect} size={narrow ? 128 : 300} mood={conv.mood} />
            {/* The lamp over the table: it swings, and its light takes the colour of the mood. */}
            <div className={styles.hanging} aria-hidden="true">
              <span className={styles.cord} />
              <span className={styles.shade} />
              <span className={styles.beam} />
            </div>
            <div className={styles.wisps} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div className={styles.identity}>
            <p className={styles.kicker}>{t('interro.room')}</p>
            <h1 id={nameId} ref={headingRef} tabIndex={-1} className={styles.name}>
              {suspect.name}
            </h1>
            <p className={styles.role}>{suspect.role}</p>
          </div>
          <div className={styles.gauges}>
            <MoodIndicator mood={conv.mood} />
            <PatienceMeter used={conv.patienceUsed} max={conv.patienceMax} />
          </div>
          <details className={styles.claims} open={claimsOpen} onToggle={(e) => setClaimsOpen(e.currentTarget.open)}>
            <summary className={styles.claimsSummary}>{t('interro.onRecord')}</summary>
            <div className={styles.claimsBody}>
              <h2 className={styles.claimsHeading}>{t('interro.theirStory')}</h2>
              <blockquote className={styles.alibi} data-testid="suspect-alibi">
                <p>{suspect.alibi}</p>
              </blockquote>
              <h2 className={styles.claimsHeading}>{t('interro.fileSays')}</h2>
              <ul className={styles.factList}>
                {suspect.public_facts.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {noted.length > 0 && (
                <>
                  <h2 className={styles.claimsHeading}>{t('interro.notedFrom', { name: short })}</h2>
                  <ul className={styles.notedList}>
                    {noted.map((c) => (
                      <li key={c.clue_id}>{c.text}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </details>
        </aside>

        <section className={styles.room} aria-label={t('interro.questioning', { name: suspect.name })}>
          <div
            ref={logRef}
            className={`${styles.log} scroll-area`}
            role="log"
            aria-live="polite"
            // Held busy while a reply is pending, so the log speaks the finished reply once.
            aria-busy={inFlight || undefined}
            aria-label={t('interro.conversation', { name: suspect.name })}
            tabIndex={0}
            onScroll={onLogScroll}
            data-testid="chat-log"
          >
            <div ref={contentRef} className={`selectable ${styles.logContent}`}>
              {messages.length === 0 && (
                <p className={styles.opening}>
                  {t('interro.opening', { name: suspect.name })}
                </p>
              )}
              {messages.map((m) => (
                <MessageView
                  key={m.id}
                  message={m}
                  caseFile={caseFile}
                  speaker={short}
                  typed={typedIds.has(m.id)}
                  animate={m.id === newestSuspectId}
                  streaming={pending?.placeholderId === m.id}
                />
              ))}
            </div>
          </div>

          <div className={styles.waitingRegion} aria-live="polite">
            {pending && !pending.started && (
              <p className={styles.waiting} data-testid="waiting-indicator">
                {t('interro.thinking', { name: short })}
                <span className={styles.dots} aria-hidden="true">
                  {reduced ? (
                    '...'
                  ) : (
                    <>
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </>
                  )}
                </span>
              </p>
            )}
          </div>

          {silentNotice && (
            <div className={styles.notice} data-testid="silent-banner" role="status">
              <p>
                <strong>{t('interro.silent', { name: suspect.name })}</strong> {t('interro.silentText')}
              </p>
              <Button size="small" variant="ghost" onClick={() => setSilentNotice(false)}>
                {t('interro.dismiss')}
              </Button>
            </div>
          )}

          {failure && (
            <div className={styles.alert} role="alert" data-testid="interrogation-error">
              <p>{failure.message}</p>
              {failure.retry && !exhausted && (
                <Button size="small" variant="lamp" onClick={retry} disabled={inFlight}>
                  {t('interro.tryAgain')}
                </Button>
              )}
            </div>
          )}

          <form className={styles.composer} onSubmit={onSubmit} aria-label={t('interro.formLabel', { name: suspect.name })}>
            {exhausted && (
              <p className={styles.refusal} role="status" data-testid="refusal-line">
                {t('interro.refuses', { name: suspect.name })}
                <span className={styles.refusalNote}>{t('interro.refusesNote')}</span>
              </p>
            )}
            {attachedEvidence && (
              <div className={styles.attachedRow}>
                <span className={styles.attachedChip} data-testid="attached-evidence">
                  <span className={styles.attachedLabel}>{t('interro.showing')}</span>
                  <span>{attachedEvidence.name}</span>
                  <button
                    type="button"
                    className={styles.chipRemove}
                    onClick={() => {
                      setAttached(null);
                      inputRef.current?.focus({ preventScroll: true });
                    }}
                    aria-label={t('interro.putAway', { name: attachedEvidence.name })}
                    data-testid="remove-attached-evidence"
                  >
                    x
                  </button>
                </span>
              </div>
            )}
            <label htmlFor={questionId} className={styles.inputLabel}>
              {t('interro.yourQuestion')}
            </label>
            <textarea
              ref={inputRef}
              id={questionId}
              className={`textarea ${styles.question}`}
              data-testid="question-input"
              value={draft}
              maxLength={MAX_LEN}
              rows={3}
              disabled={exhausted}
              placeholder={exhausted ? '' : t('interro.placeholder', { name: short })}
              aria-describedby={`${hintId} ${counterId}`}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_LEN))}
              onKeyDown={onKeyDown}
            />
            <div className={styles.composerBar}>
              <p className={styles.meta}>
                <span id={counterId} className={`${styles.counter} ${nearLimit ? styles.counterNear : ''}`}>
                  {draft.length}/{MAX_LEN}
                  <span className="visually-hidden">{t('interro.characters')}</span>
                </span>
                <span id={hintId}>{t('interro.keys')}</span>
              </p>
              <div className={styles.actions}>
                <Button
                  data-testid="show-evidence-button"
                  onClick={() => setPickerOpen(true)}
                  aria-haspopup="dialog"
                  disabled={exhausted}
                >
                  {t('interro.showEvidence')}
                </Button>
                <Button type="submit" variant="primary" data-testid="send-question" disabled={!canSend}>
                  {t('interro.send')}
                </Button>
              </div>
            </div>
          </form>
        </section>
      </div>

      <EvidencePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        caseFile={caseFile}
        evidenceIds={progress.foundEvidence}
        selectedId={attached}
        shownIds={conv.shownEvidence}
        suspectName={short}
        onPick={onPick}
      />
    </main>
  );
}

// ---------------------------------------------------------------------------
// One line of the transcript

interface MessageViewProps {
  message: ChatMessage;
  caseFile: CaseFile;
  speaker: string;
  /** Render through the typewriter (replies that arrived while the screen was open). */
  typed: boolean;
  /** Only the newest reply animates. */
  animate: boolean;
  /** The reply is still streaming in. */
  streaming: boolean;
}

function MessageView({ message: m, caseFile, speaker, typed, animate, streaming }: MessageViewProps) {
  if (m.role === 'system') {
    return (
      <div className={`${styles.row} ${styles.rowSystem}`}>
        <p className={styles.system} data-testid="chat-message" data-role="system">
          {m.text}
        </p>
      </div>
    );
  }

  if (m.role === 'detective') {
    return (
      <div className={`${styles.row} ${styles.rowDetective}`}>
        <div className={`${styles.msg} ${styles.detective}`} data-testid="chat-message" data-role="detective">
          <p className={styles.speaker}>{t('interro.you')}</p>
          <p className={styles.text}>{m.text}</p>
          {m.shownEvidenceId && (
            <p className={styles.evidenceTag} data-testid="shown-evidence-tag">
              <span className={styles.tagHole} aria-hidden="true" />
              <span className={styles.tagLabel}>{t('interro.shown')}</span>
              <span>{evidenceName(caseFile, m.shownEvidenceId)}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  const clues = (m.revealedClueIds ?? [])
    .map((id) => clueById(caseFile, id)?.clue)
    .filter((c): c is RevealableClue => c !== undefined);

  return (
    <div className={`${styles.row} ${styles.rowSuspect}`}>
      <div
        className={`${styles.msg} ${styles.suspect} ${m.silent ? styles.silent : ''}`}
        data-testid="chat-message"
        data-role="suspect"
        data-silent={m.silent ? 'true' : undefined}
        aria-busy={streaming || undefined}
      >
        <p className={styles.speaker}>
          {speaker}
          {m.silent && <span className={styles.silentTag}>{t('interro.brushOff')}</span>}
        </p>
        <p className={styles.text}>
          {typed ? <Typewriter text={m.text} animate={animate} streaming={streaming} /> : m.text}
        </p>
        {clues.length > 0 && (
          <ul className={styles.clues} aria-label={t('interro.notedLabel')}>
            {clues.map((c) => (
              <li key={c.clue_id} className={styles.clueChip} data-testid="clue-chip">
                <span className={styles.clueLabel}>{t('interro.noted')}</span> {c.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
