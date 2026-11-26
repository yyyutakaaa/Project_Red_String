import { useEffect, useId, useMemo, useState, type FormEvent } from 'react';
import { Button, ButtonLink } from '../components/Button.tsx';
import { DetectiveAvatar } from '../components/DetectiveAvatar.tsx';
import { Modal } from '../components/Modal.tsx';
import { RainBackdrop } from '../components/RainBackdrop.tsx';
import { ComicBackdrop } from '../backdrop/ComicBackdrop.tsx';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { useAmbience } from '../hooks/useAmbience.ts';
import { getStoryCase } from '../engine/caseLoader.ts';
import { listSlots } from '../engine/save.ts';
import { playerStats, type CaseStanding, type PlayerStats } from '../engine/stats.ts';
import { AccountError, PASSWORD_MAX, normalizeUsername, passwordProblem, usernameProblem } from '../lib/account.ts';
import { avatarChoices } from '../lib/avatars.ts';
import { BACKEND_CONFIGURED } from '../lib/config.ts';
import { formatDuration } from '../lib/format.ts';
import { SignOutBlocked, useAccount, type SyncState } from '../store/account.ts';
import { useGame } from '../store/game.ts';
import styles from './Account.module.css';
import { formatNumber, localizedCase, t, useLanguage, useT, type MessageKey } from '../i18n/index.ts';

type Mode = 'signin' | 'signup';

/** While the saves are on their way or stuck, a rubber stamp says so. Nothing shows once they are filed. */
export function SyncStamp({ state }: { state: SyncState }) {
  const { t } = useT();
  if (state !== 'syncing' && state !== 'offline') return null;
  return (
    <span className={`${styles.stamp} ${state === 'offline' ? styles.stampRed : ''}`} role="status">
      {t(state === 'offline' ? 'account.badgeOffline' : 'account.badgeSyncing')}
    </span>
  );
}

function hoursMinutes(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  return t('account.hoursMinutes', { h: Math.floor(minutes / 60), m: minutes % 60 });
}

function formatMonth(ts: number): string {
  try {
    return new Date(ts).toLocaleDateString(useLanguage.getState().language, { month: 'short', year: 'numeric' });
  } catch {
    return new Date(ts).toISOString().slice(0, 7);
  }
}

function Stat({ label, value, rank = false }: { label: string; value: string; rank?: boolean }) {
  return (
    <div className={styles.stat}>
      <dd className={rank ? styles.statRank : styles.statValue}>{value}</dd>
      <dt className={styles.statLabel}>{label}</dt>
    </div>
  );
}

function Record({ stats, since }: { stats: PlayerStats; since: number | null }) {
  const { t } = useT();
  const dash = '—';
  const accused = stats.accusationsRight + stats.accusationsWrong;
  return (
    <section className={styles.section} aria-labelledby="record-heading">
      <h2 id="record-heading" className={styles.caption}>
        {t('account.record')}
      </h2>
      <dl className={styles.stats} data-testid="account-stats">
        <Stat label={t('account.statSolved')} value={`${stats.solved}/${stats.storyTotal}`} />
        <Stat label={t('account.statPlayTime')} value={hoursMinutes(stats.playMs)} />
        <Stat label={t('account.statBestRank')} value={stats.bestRank ?? dash} rank={stats.bestRank !== null} />
        <Stat label={t('account.statBestScore')} value={stats.bestScore !== null ? formatNumber(stats.bestScore) : dash} />
        <Stat label={t('account.statFastest')} value={stats.fastestSolveMs !== null ? formatDuration(stats.fastestSolveMs) : dash} />
        <Stat label={t('account.statAccusations')} value={accused > 0 ? `${stats.accusationsRight}/${accused}` : dash} />
        <Stat label={t('account.statSuspects')} value={formatNumber(stats.suspectsQuestioned)} />
        <Stat label={t('account.statQuestions')} value={formatNumber(stats.questionsAsked)} />
        <Stat label={t('account.statLies')} value={formatNumber(stats.liesCaught)} />
        <Stat label={t('account.statEvidence')} value={formatNumber(stats.evidenceFound)} />
        <Stat label={t('account.statHints')} value={formatNumber(stats.hintsUsed)} />
        <Stat label={t('account.statSince')} value={since ? formatMonth(since) : dash} />
      </dl>
    </section>
  );
}

const STANDING: Record<CaseStanding, MessageKey | null> = {
  solved: 'account.standingSolved',
  closed: 'account.standingClosed',
  open: 'account.standingOpen',
  untouched: null,
};

function CaseFiles({ stats }: { stats: PlayerStats }) {
  const { t } = useT();
  return (
    <section className={styles.section} aria-labelledby="files-heading">
      <h2 id="files-heading" className={styles.caption}>
        {t('account.files')}
      </h2>
      <div className={styles.filesPanel}>
        <table className={styles.files}>
          <thead>
            <tr>
              <th scope="col" className={styles.colNum}>
                <span className="visually-hidden">#</span>
              </th>
              <th scope="col">{t('account.colCase')}</th>
              <th scope="col" className={styles.colStanding}>
                <span className="visually-hidden">{t('account.statSolved')}</span>
              </th>
              <th scope="col" className={styles.colRank}>{t('account.colRank')}</th>
              <th scope="col" className={styles.colNumber}>{t('account.colScore')}</th>
              <th scope="col" className={styles.colNumber}>{t('account.colTime')}</th>
            </tr>
          </thead>
          <tbody>
            {stats.cases.map((c, i) => {
              const file = getStoryCase(c.id);
              const standing = STANDING[c.standing];
              return (
                <tr key={c.id} data-standing={c.standing}>
                  <td className={styles.colNum}>{String(i + 1).padStart(2, '0')}</td>
                  <th scope="row" className={styles.caseTitle}>
                    {file ? localizedCase(file).title : c.id}
                  </th>
                  <td className={styles.colStanding}>
                    {standing && <span className={`${styles.miniStamp} ${styles[`mini_${c.standing}`]}`}>{t(standing)}</span>}
                  </td>
                  <td className={styles.colRank}>{c.bestRank ? <span className={styles.rank}>{c.bestRank}</span> : '—'}</td>
                  <td className={styles.colNumber}>{c.bestScore !== null ? formatNumber(c.bestScore) : '—'}</td>
                  <td className={styles.colNumber}>{c.bestTimeMs !== null ? formatDuration(c.bestTimeMs) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RenameForm() {
  const user = useAccount((s) => s.user)!;
  const rename = useAccount((s) => s.rename);
  const [name, setName] = useState(user.username);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const id = useId();
  const { t } = useT();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setDone(false);
    const problem = usernameProblem(name);
    if (problem) return setError(problem);
    if (normalizeUsername(name) === user.username) return;
    setBusy(true);
    try {
      await rename(name);
      setDone(true);
    } catch (err) {
      setError(err instanceof AccountError ? err.message : t('account.genericError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={(e) => void submit(e)} noValidate>
      <label htmlFor={id} className={styles.label}>
        {t('account.newName')}
      </label>
      <input
        id={id}
        className="input"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={20}
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          setDone(false);
        }}
        data-testid="account-new-name"
      />
      <FormStatus error={error} done={done} />
      <Button type="submit" disabled={busy || normalizeUsername(name) === user.username} data-testid="account-rename">
        {busy ? t('account.saving') : t('account.saveName')}
      </Button>
    </form>
  );
}

function PasswordForm() {
  const changePassword = useAccount((s) => s.changePassword);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const ids = { current: useId(), next: useId(), again: useId() };
  const { t } = useT();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setDone(false);
    if (!current) return setError(t('account.errCurrentPass'));
    const problem = passwordProblem(next);
    if (problem) return setError(problem);
    if (next !== again) return setError(t('account.mismatch'));
    setBusy(true);
    try {
      await changePassword(current, next);
      setCurrent('');
      setNext('');
      setAgain('');
      setDone(true);
    } catch (err) {
      setError(err instanceof AccountError ? err.message : t('account.genericError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={styles.form} onSubmit={(e) => void submit(e)} noValidate>
      <label htmlFor={ids.current} className={styles.label}>
        {t('account.currentPassword')}
      </label>
      <input
        id={ids.current}
        type="password"
        className="input"
        autoComplete="current-password"
        maxLength={PASSWORD_MAX}
        value={current}
        onChange={(e) => setCurrent(e.target.value)}
      />
      <label htmlFor={ids.next} className={styles.label}>
        {t('account.newPassword')}
      </label>
      <input
        id={ids.next}
        type="password"
        className="input"
        autoComplete="new-password"
        maxLength={PASSWORD_MAX}
        value={next}
        onChange={(e) => setNext(e.target.value)}
      />
      <label htmlFor={ids.again} className={styles.label}>
        {t('account.passwordAgain')}
      </label>
      <input
        id={ids.again}
        type="password"
        className="input"
        autoComplete="new-password"
        maxLength={PASSWORD_MAX}
        value={again}
        onChange={(e) => setAgain(e.target.value)}
      />
      <FormStatus error={error} done={done} />
      <Button type="submit" disabled={busy}>
        {busy ? t('account.saving') : t('account.savePassword')}
      </Button>
    </form>
  );
}

function FormStatus({ error, done }: { error: string; done: boolean }) {
  const { t } = useT();
  if (error) {
    return (
      <p className={styles.error} role="alert">
        {error}
      </p>
    );
  }
  return done ? (
    <p className={styles.saved} role="status">
      {t('account.saved')}
    </p>
  ) : null;
}

function PhotoPicker({ open, current, onPick, onClose }: { open: boolean; current?: string; onPick: (key: string) => void; onClose: () => void }) {
  const { t } = useT();
  const choices = useMemo(() => (open ? avatarChoices() : []), [open]);
  return (
    <Modal open={open} title={t('account.pickPhoto')} onClose={onClose} wide>
      <ul className={styles.picker} data-testid="avatar-picker">
        {choices.map((c) => {
          const label = c.name ?? t('account.strangerFace');
          return (
            <li key={c.key}>
              <button
                type="button"
                className={styles.pick}
                aria-pressed={c.key === current}
                aria-label={label}
                title={label}
                onClick={() => onPick(c.key)}
                data-avatar={c.key}
              >
                <img src={c.url} alt="" loading="lazy" draggable={false} />
                {c.name && <span className={styles.pickName}>{c.name}</span>}
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}

function SignedIn() {
  const user = useAccount((s) => s.user)!;
  const sync = useAccount((s) => s.sync);
  const syncNow = useAccount((s) => s.syncNow);
  const signOut = useAccount((s) => s.signOut);
  const savePrefs = useAccount((s) => s.savePrefs);
  const storage = useGame((s) => s.storage);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [picking, setPicking] = useState(false);
  const { t } = useT();
  // The slots change when a sync merges in saves from another device.
  const stats = useMemo(() => playerStats(listSlots(storage)), [storage, sync]); // eslint-disable-line react-hooks/exhaustive-deps

  const doSignOut = async () => {
    setBusy(true);
    setError('');
    try {
      await signOut();
    } catch (err) {
      setError(err instanceof SignOutBlocked ? err.message : t('account.signOutFailed'));
    } finally {
      setBusy(false);
    }
  };

  const pick = (key: string) => {
    setPicking(false);
    void savePrefs({ avatar: key });
  };

  return (
    <div className={styles.page}>
      <section className={styles.profile} aria-labelledby="badge-heading">
        <button type="button" className={styles.portrait} onClick={() => setPicking(true)} data-testid="account-photo">
          <DetectiveAvatar avatar={user.prefs.avatar} />
          <span className={styles.changePhoto}>{t('account.changePhoto')}</span>
        </button>
        <h2 id="badge-heading" className={styles.name} data-testid="account-name">
          {user.username}
        </h2>
        <SyncStamp state={sync} />
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.profileActions}>
          {sync === 'offline' && (
            <Button onClick={() => void syncNow()} disabled={busy}>
              {t('account.syncNow')}
            </Button>
          )}
          <Button variant="ghost" onClick={() => void doSignOut()} disabled={busy} data-testid="account-signout">
            {t('account.signOut')}
          </Button>
        </div>
      </section>

      <div className={styles.main}>
        <Record stats={stats} since={user.createdAt} />
        <CaseFiles stats={stats} />
        <section className={styles.section} aria-labelledby="details-heading">
          <h2 id="details-heading" className={styles.caption}>
            {t('account.details')}
          </h2>
          <div className={styles.forms}>
            <RenameForm />
            <PasswordForm />
          </div>
        </section>
      </div>

      <PhotoPicker open={picking} current={user.prefs.avatar} onPick={pick} onClose={() => setPicking(false)} />
    </div>
  );
}

/** Sign in or open a new account. Also used by the first-start popup (onboarding/FirstRun.tsx). */
export function SignInForm({ initialMode = 'signin' }: { initialMode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const signIn = useAccount((s) => s.signIn);
  const signUp = useAccount((s) => s.signUp);
  const storage = useGame((s) => s.storage);
  const [hasLocal] = useState(() => listSlots(storage).some(Boolean));
  const ids = { name: useId(), pass: useId(), confirm: useId(), hint: useId() };
  const { t } = useT();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'signup') {
      const problem = usernameProblem(username) ?? passwordProblem(password);
      if (problem) return setError(problem);
      if (password !== confirm) return setError(t('account.mismatch'));
    } else if (!username.trim() || !password) {
      return setError(t('account.fillIn'));
    }
    setBusy(true);
    try {
      if (mode === 'signup') await signUp(username, password);
      else await signIn(username, password);
    } catch (err) {
      setError(err instanceof AccountError ? err.message : t('account.genericError'));
      setBusy(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setConfirm('');
  };

  return (
    <section className={styles.panel} aria-labelledby="form-heading">
      <div className={styles.tabs} role="tablist" aria-label={t('account.tabs')}>
        <button type="button" role="tab" aria-selected={mode === 'signin'} className={styles.tab} onClick={() => switchMode('signin')}>
          {t('account.signIn')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signup'}
          className={styles.tab}
          onClick={() => switchMode('signup')}
          data-testid="account-tab-signup"
        >
          {t('account.newDetective')}
        </button>
      </div>
      <h2 id="form-heading" className="visually-hidden">
        {mode === 'signin' ? t('account.signIn') : t('account.create')}
      </h2>

      <form className={styles.form} onSubmit={(e) => void submit(e)} noValidate>
        <label htmlFor={ids.name} className={styles.label}>
          {t('account.name')}
        </label>
        <input
          id={ids.name}
          className="input"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={20}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          aria-describedby={mode === 'signup' ? ids.hint : undefined}
          data-testid="account-username"
        />
        {mode === 'signup' && (
          <p id={ids.hint} className={styles.small}>
            {t('account.nameHint')}
          </p>
        )}

        <label htmlFor={ids.pass} className={styles.label}>
          {t('account.password')}
        </label>
        <input
          id={ids.pass}
          type="password"
          className="input"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          maxLength={PASSWORD_MAX}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          data-testid="account-password"
        />

        {mode === 'signup' && (
          <>
            <label htmlFor={ids.confirm} className={styles.label}>
              {t('account.passwordAgain')}
            </label>
            <input
              id={ids.confirm}
              type="password"
              className="input"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              data-testid="account-confirm"
            />
            <p className={styles.small}>{t('account.noReset')}</p>
          </>
        )}

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {hasLocal && <p className={styles.small}>{t('account.mergeNote')}</p>}

        <Button type="submit" variant="lamp" disabled={busy} data-testid="account-submit">
          {busy ? t('account.checking') : mode === 'signin' ? t('account.signIn') : t('account.openFile')}
        </Button>
      </form>
    </section>
  );
}

export function AccountScreen() {
  useAmbience('menu');
  const user = useAccount((s) => s.user);
  const { t, language } = useT();

  useEffect(() => {
    document.title = `${t('account.docTitle')} - Project Red String`;
  }, [t, language]);

  return (
    <>
      <ComicBackdrop scene="rooftop" dim="page" fallback={<RainBackdrop lamp="left" intensity="soft" />} />
      <ScreenFrame
        title={t('account.title')}
        wide={Boolean(user)}
        actions={
          <ButtonLink to="/" variant="ghost">
            {t('common.backToMenu')}
          </ButtonLink>
        }
      >
        {!BACKEND_CONFIGURED ? (
          <p className={`comic-panel ${styles.unavailable}`}>{t('account.unavailable')}</p>
        ) : user ? (
          <SignedIn />
        ) : (
          <div className={styles.signInWrap}>
            <SignInForm />
          </div>
        )}
      </ScreenFrame>
    </>
  );
}
