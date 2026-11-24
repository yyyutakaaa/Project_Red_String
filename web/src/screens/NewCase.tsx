import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateCase } from '@shared/validator.ts';
import { Button, ButtonLink } from '../components/Button.tsx';
import { RainBackdrop } from '../components/RainBackdrop.tsx';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { useAmbience } from '../hooks/useAmbience.ts';
import { casePath } from '../hooks/useCase.ts';
import { caseKeyFor } from '../engine/caseLoader.ts';
import { listGeneratedCases, saveGeneratedCase } from '../engine/generatedCases.ts';
import { ApiError, checkBackend, describeApiError, generateCase, type GenerateCaseRequest } from '../lib/api.ts';
import { BACKEND_CONFIGURED } from '../lib/config.ts';
import { formatDate } from '../lib/format.ts';
import { useGame } from '../store/game.ts';
import { useReducedMotion } from '../store/settings.ts';
import { sfx } from '../audio/audio.ts';
import styles from './NewCase.module.css';

type Difficulty = NonNullable<GenerateCaseRequest['preferences']['difficulty']>;

const SETTING_MAX = 80;
/** The server normally answers within two minutes; give up a little after that. */
const CLIENT_TIMEOUT_MS = 180_000;
const LINE_INTERVAL_MS = 5200;
const TYPE_CPS = 26;

const SUGGESTIONS = ['a snowed-in mountain lodge', 'a 1920s ocean liner', 'a film studio backlot', 'a night train to the border'];

const DIFFICULTIES: Array<{ value: Difficulty; label: string; note: string }> = [
  { value: 'gentle', label: 'Gentle', note: 'A forgiving file for a first night.' },
  { value: 'standard', label: 'Standard', note: 'The usual grind.' },
  { value: 'hard', label: 'Hard', note: 'Tighter lips. Colder trail.' },
];

const STATUS_LINES = [
  "Pulling the coroner's report",
  'Interviewing the neighbours',
  'Typing up the case file',
  'Checking the alibis twice',
];

type Phase =
  | { kind: 'form' }
  | { kind: 'loading'; startedAt: number }
  | { kind: 'error'; message: string; canRetry: boolean };

/** Reveal `text` a character at a time. Instant when motion is reduced. */
function useTypewriter(text: string, cps: number, instant: boolean): string {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (instant) return;
    setCount(0);
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const n = Math.min(text.length, Math.floor(((t - start) / 1000) * cps));
      setCount(n);
      if (n < text.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, cps, instant]);
  return instant ? text : text.slice(0, count);
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function LoadingFile({ startedAt, attempt, onCancel }: { startedAt: number; attempt: number; onCancel: () => void }) {
  const reduced = useReducedMotion();
  const [lineIndex, setLineIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const line = STATUS_LINES[lineIndex % STATUS_LINES.length] ?? '';
  const typed = useTypewriter(line, TYPE_CPS, reduced);

  useEffect(() => {
    const id = window.setInterval(() => setLineIndex((i) => i + 1), LINE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000))), 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);

  // The two lines before the current one, oldest first.
  const done = [lineIndex - 2, lineIndex - 1]
    .filter((i) => i >= 0)
    .map((i) => STATUS_LINES[i % STATUS_LINES.length] ?? '');

  return (
    <section className={styles.loading} aria-labelledby="loading-title" data-testid="new-case-loading">
      <div className={`paper ${styles.sheet}`}>
        <p className={styles.sheetHead}>Case office. Night desk.</p>
        <h2 id="loading-title" className={styles.loadingTitle}>
          Typing up your case
        </h2>
        <ul className={styles.doneLines} aria-hidden="true">
          {done.map((l, i) => (
            <li key={`${lineIndex}-${i}`}>{l}. Done.</li>
          ))}
        </ul>
        <p className={styles.typeLine} aria-hidden="true">
          {typed}
          <span className={styles.caret} />
        </p>
        {attempt > 1 && (
          <p className={styles.redraft} data-testid="generation-attempt">
            Draft {attempt}. The last one had holes in it. The office is rewriting.
          </p>
        )}
        <p className="visually-hidden" role="status" aria-live="polite">
          {attempt > 1 ? `Draft ${attempt}. ${line}.` : `${line}.`}
        </p>
        <p className={styles.timer}>
          <span className={styles.timerLabel}>Elapsed</span>{' '}
          <span role="timer" aria-live="off" aria-label={`${elapsed} seconds elapsed`}>
            {formatElapsed(elapsed)}
          </span>
        </p>
        <p className={styles.loadingNote}>A full case takes the office one to two minutes. Keep this page open.</p>
        <Button onClick={onCancel} autoFocus data-testid="cancel-generation">
          Cancel
        </Button>
      </div>
    </section>
  );
}

export function NewCase() {
  useAmbience('menu');
  const navigate = useNavigate();
  const storage = useGame((s) => s.storage);
  const deviceId = useGame((s) => s.deviceId);
  const ensureProgress = useGame((s) => s.ensureProgress);
  const pushToast = useGame((s) => s.pushToast);
  const [setting, setSetting] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('standard');
  const [phase, setPhase] = useState<Phase>({ kind: 'form' });
  const [attempt, setAttempt] = useState(1);
  const [online, setOnline] = useState<boolean | null>(null);
  const [probe, setProbe] = useState(0);
  const [notice, setNotice] = useState('');
  const [previous] = useState(() => listGeneratedCases(storage).slice(0, 5));
  const [focusGenerate, setFocusGenerate] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const settingId = useId();
  const countId = useId();

  useEffect(() => {
    document.title = 'New case - Project Red String';
  }, []);

  useEffect(() => {
    let alive = true;
    setOnline(null);
    void checkBackend().then((ok) => {
      if (alive) setOnline(ok);
    });
    return () => {
      alive = false;
    };
  }, [probe]);

  // Abandon any request in flight when leaving the page.
  useEffect(() => () => controllerRef.current?.abort(), []);

  const run = async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    let timedOut = false;
    const timer = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, CLIENT_TIMEOUT_MS);
    const trimmed = setting.trim();
    const preferences: GenerateCaseRequest['preferences'] = { difficulty };
    if (trimmed) preferences.setting = trimmed.slice(0, SETTING_MAX);
    setNotice('');
    setFocusGenerate(false);
    setAttempt(1);
    setPhase({ kind: 'loading', startedAt: Date.now() });
    try {
      const res = await generateCase({ device_id: deviceId, preferences }, controller.signal, (p) => {
        if (!controller.signal.aborted) setAttempt(p.attempt);
      });
      if (controller.signal.aborted) return;
      const checked = validateCase(res.case);
      if (!checked.ok) throw new ApiError('invalid_case', 'The case office sent a file that does not hold together. Try again.');
      try {
        saveGeneratedCase(storage, res.generated_case_id, checked.case);
      } catch {
        throw new ApiError('server_error', 'The file came in, but this device has no room to keep it. Delete an old generated case and try again.');
      }
      const key = caseKeyFor('generated', res.generated_case_id);
      ensureProgress(key, 'generated');
      const left = Math.max(0, res.remaining_today);
      pushToast(`Case file ready: ${checked.case.title}. ${left === 1 ? '1 new case file' : `${left} new case files`} left today.`, 'info');
      sfx('page');
      navigate(casePath(key, 'briefing'));
    } catch (err) {
      if (timedOut) {
        setPhase({ kind: 'error', message: 'The case office took too long to answer. Try again.', canRetry: true });
        sfx('error');
        return;
      }
      if (controller.signal.aborted) return;
      const code = err instanceof ApiError ? err.code : null;
      setPhase({ kind: 'error', message: describeApiError(err), canRetry: code !== 'generation_limit' && code !== 'not_configured' });
      sfx('error');
    } finally {
      window.clearTimeout(timer);
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  };

  const cancel = () => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setPhase({ kind: 'form' });
    setNotice('Cancelled. Nothing was filed.');
    setFocusGenerate(true);
  };

  if (phase.kind === 'loading') {
    return (
      <main id="main" tabIndex={-1} className={styles.loadingMain}>
        <RainBackdrop lamp="left" />
        <LoadingFile startedAt={phase.startedAt} attempt={attempt} onCancel={cancel} />
      </main>
    );
  }

  const offline = online === false;
  const remaining = SETTING_MAX - setting.length;

  return (
    <>
      <RainBackdrop lamp="left" intensity="soft" />
      <ScreenFrame
        title="New case"
        kicker="Case office"
        actions={
          <ButtonLink to="/" variant="ghost">
            Back to the menu
          </ButtonLink>
        }
      >
        <div className={styles.layout}>
          <div className={styles.formColumn}>
            <div className={styles.intro}>
              <p>The case office types up a murder nobody has solved before: new victim, new suspects, new lies.</p>
              <p>Tell them where it happened if you like. Leave it blank and they pick.</p>
            </div>

            {offline && (
              <div className={styles.offline} role="status" data-testid="new-case-offline">
                <p>
                  {BACKEND_CONFIGURED
                    ? 'The line to the case office is dead. Generating a case needs a connection.'
                    : 'This build has no case office wired up. Generating a case needs one.'}{' '}
                  Story cases and generated cases already on this device still play offline.
                </p>
                {BACKEND_CONFIGURED && (
                  <Button size="small" onClick={() => setProbe((n) => n + 1)}>
                    Check the line again
                  </Button>
                )}
              </div>
            )}

            {phase.kind === 'error' && (
              <div className={styles.error} role="alert" data-testid="new-case-error">
                <p className={styles.errorLabel}>The office sent it back</p>
                <p>{phase.message}</p>
                <div className={styles.errorActions}>
                  {phase.canRetry && (
                    <Button variant="lamp" autoFocus onClick={() => void run()} data-testid="retry-generation">
                      Try again
                    </Button>
                  )}
                  <Button variant="ghost" autoFocus={!phase.canRetry} onClick={() => setPhase({ kind: 'form' })}>
                    Change the request
                  </Button>
                </div>
              </div>
            )}

            <form
              className={styles.form}
              onSubmit={(e) => {
                e.preventDefault();
                if (!offline) void run();
              }}
              aria-labelledby="request-heading"
            >
              <h2 id="request-heading" className={styles.formTitle}>
                Request form
              </h2>

              <div className={styles.field}>
                <label htmlFor={settingId} className={styles.label}>
                  Setting <span className={styles.optional}>(optional)</span>
                </label>
                <input
                  id={settingId}
                  className="input"
                  type="text"
                  value={setting}
                  maxLength={SETTING_MAX}
                  placeholder="Where did it happen?"
                  autoComplete="off"
                  aria-describedby={countId}
                  onChange={(e) => setSetting(e.target.value.slice(0, SETTING_MAX))}
                  data-testid="new-case-setting"
                />
                <p id={countId} className={styles.count}>
                  {remaining} of {SETTING_MAX} characters left
                </p>
                <div className={styles.chips} role="group" aria-label="Suggestions">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={styles.chip}
                      aria-pressed={setting === s}
                      onClick={() => {
                        sfx('click');
                        setSetting(setting === s ? '' : s);
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <fieldset className={styles.fieldset}>
                <legend className={styles.label}>Difficulty</legend>
                <div className={styles.options}>
                  {DIFFICULTIES.map((d) => (
                    <label key={d.value} className={`${styles.option} ${difficulty === d.value ? styles.optionOn : ''}`}>
                      <input
                        type="radio"
                        name="difficulty"
                        value={d.value}
                        checked={difficulty === d.value}
                        onChange={() => setDifficulty(d.value)}
                        className="visually-hidden"
                        data-testid={`difficulty-${d.value}`}
                      />
                      <span className={styles.optionLabel}>{d.label}</span>
                      <span className={styles.optionNote}>{d.note}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className={styles.submitRow}>
                <Button
                  type="submit"
                  variant="primary"
                  size="large"
                  disabled={offline}
                  autoFocus={focusGenerate}
                  data-testid="generate-case"
                >
                  Generate case
                </Button>
                <p className={styles.submitNote}>
                  {online === null ? 'Checking the line to the case office.' : offline ? 'Needs a connection.' : 'Takes one to two minutes.'}
                </p>
              </div>
              <p className="visually-hidden" role="status" aria-live="polite">
                {notice}
              </p>
              {notice && (
                <p className={styles.notice} aria-hidden="true">
                  {notice}
                </p>
              )}
            </form>
          </div>

          <aside className={styles.previous} aria-labelledby="previous-heading">
            <h2 id="previous-heading" className={styles.previousTitle}>
              On the shelf
            </h2>
            {previous.length === 0 ? (
              <p className={styles.previousEmpty}>No generated cases on this device yet.</p>
            ) : (
              <ul className={styles.previousList}>
                {previous.map((g) => (
                  <li key={g.id}>
                    <div>
                      <p className={styles.previousName}>{g.title}</p>
                      <p className={styles.previousMeta}>Filed {formatDate(g.createdAt)}</p>
                    </div>
                    <ButtonLink
                      size="small"
                      to={casePath(caseKeyFor('generated', g.id))}
                      aria-label={`Replay ${g.title}`}
                      data-testid={`replay-generated-${g.id}`}
                    >
                      Replay
                    </ButtonLink>
                  </li>
                ))}
              </ul>
            )}
            <ButtonLink to="/cases" variant="ghost" size="small">
              All case files
            </ButtonLink>
          </aside>
        </div>
      </ScreenFrame>
    </>
  );
}
