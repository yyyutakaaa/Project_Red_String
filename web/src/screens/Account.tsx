import { useEffect, useId, useState, type FormEvent } from 'react';
import { Button, ButtonLink } from '../components/Button.tsx';
import { LogoEye } from '../components/LogoEye.tsx';
import { RainBackdrop } from '../components/RainBackdrop.tsx';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { useAmbience } from '../hooks/useAmbience.ts';
import { listSlots } from '../engine/save.ts';
import { AccountError, PASSWORD_MAX, passwordProblem, usernameProblem } from '../lib/account.ts';
import { BACKEND_CONFIGURED } from '../lib/config.ts';
import { formatDate } from '../lib/format.ts';
import { SignOutBlocked, useAccount, type SyncState } from '../store/account.ts';
import { useGame } from '../store/game.ts';
import styles from './Account.module.css';

type Mode = 'signin' | 'signup';

const SYNC_TEXT: Record<SyncState, string> = {
  local: 'Saved on this device only.',
  syncing: 'Filing your saves...',
  synced: 'Every save is in your account.',
  offline: 'Offline. Saves wait on this device and go up when you are back.',
};

export function SyncBadge({ state, compact = false }: { state: SyncState; compact?: boolean }) {
  const label = compact ? { local: 'This device only', syncing: 'Syncing', synced: 'Synced', offline: 'Offline' }[state] : SYNC_TEXT[state];
  return (
    <span className={`${styles.sync} ${styles[`sync_${state}`]}`}>
      <span className={styles.dot} aria-hidden="true" />
      {label}
    </span>
  );
}

function SignedIn() {
  const user = useAccount((s) => s.user)!;
  const sync = useAccount((s) => s.sync);
  const lastSyncedAt = useAccount((s) => s.lastSyncedAt);
  const syncNow = useAccount((s) => s.syncNow);
  const signOut = useAccount((s) => s.signOut);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const doSignOut = async () => {
    setBusy(true);
    setError('');
    try {
      await signOut();
    } catch (err) {
      setError(err instanceof SignOutBlocked ? err.message : 'Could not sign out. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.panel} aria-labelledby="badge-heading">
      <div className={styles.badge}>
        <div className={styles.badgeLogo} aria-hidden="true">
          <LogoEye />
        </div>
        <div>
          <p className={styles.badgeKicker}>Detective</p>
          <h2 id="badge-heading" className={styles.badgeName}>
            {user.username}
          </h2>
          <SyncBadge state={sync} />
          {lastSyncedAt && sync === 'synced' && <p className={styles.small}>Last filed {formatDate(lastSyncedAt)}.</p>}
        </div>
      </div>
      <p className={styles.note}>
        Your three save slots live in your account. Sign in with this name on another computer, in the browser or in the
        desktop app, and you pick up where you left off.
      </p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <Button onClick={() => void syncNow()} disabled={busy || sync === 'syncing'}>
          Sync now
        </Button>
        <Button variant="ghost" onClick={() => void doSignOut()} disabled={busy} data-testid="account-signout">
          Sign out
        </Button>
      </div>
      <p className={styles.small}>Signing out takes your saves off this device. They stay safe in your account.</p>
    </section>
  );
}

function SignInForm() {
  const [mode, setMode] = useState<Mode>('signin');
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

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'signup') {
      const problem = usernameProblem(username) ?? passwordProblem(password);
      if (problem) return setError(problem);
      if (password !== confirm) return setError('The two passwords do not match.');
    } else if (!username.trim() || !password) {
      return setError('Fill in your name and password.');
    }
    setBusy(true);
    try {
      if (mode === 'signup') await signUp(username, password);
      else await signIn(username, password);
    } catch (err) {
      setError(err instanceof AccountError ? err.message : 'Something went wrong. Try again.');
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
      <div className={styles.tabs} role="tablist" aria-label="Account">
        <button type="button" role="tab" aria-selected={mode === 'signin'} className={styles.tab} onClick={() => switchMode('signin')}>
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signup'}
          className={styles.tab}
          onClick={() => switchMode('signup')}
          data-testid="account-tab-signup"
        >
          New detective
        </button>
      </div>
      <h2 id="form-heading" className="visually-hidden">
        {mode === 'signin' ? 'Sign in' : 'Create an account'}
      </h2>

      <form className={styles.form} onSubmit={(e) => void submit(e)} noValidate>
        <label htmlFor={ids.name} className={styles.label}>
          Detective name
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
            3 to 20 letters, digits or underscores. Other players never see it.
          </p>
        )}

        <label htmlFor={ids.pass} className={styles.label}>
          Password
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
              Password again
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
            <p className={styles.small}>There is no email, so there is no reset. Pick a password you will remember.</p>
          </>
        )}

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        {hasLocal && <p className={styles.small}>The saves on this device get filed under this account. Per slot, the newest one wins.</p>}

        <Button type="submit" variant="lamp" disabled={busy} data-testid="account-submit">
          {busy ? 'Checking the records...' : mode === 'signin' ? 'Sign in' : 'Open my file'}
        </Button>
      </form>
    </section>
  );
}

export function AccountScreen() {
  useAmbience('menu');
  const user = useAccount((s) => s.user);

  useEffect(() => {
    document.title = 'Account - Project Red String';
  }, []);

  return (
    <>
      <RainBackdrop lamp="left" intensity="soft" />
      <ScreenFrame
        title="Your badge"
        kicker="Records office"
        actions={
          <ButtonLink to="/" variant="ghost">
            Back to the menu
          </ButtonLink>
        }
      >
        {!BACKEND_CONFIGURED ? (
          <p className="muted">Accounts are not available in this build. Your progress is saved on this device.</p>
        ) : (
          <div className={styles.layout}>
            {user ? <SignedIn /> : <SignInForm />}
            <aside className={styles.aside}>
              <h2 className={styles.asideTitle}>{user ? 'How saving works' : 'Why sign in?'}</h2>
              <ul className={styles.list}>
                <li>
                  <strong>With an account</strong> every move is filed in your account. Play on any computer, in the
                  browser or the desktop app.
                </li>
                <li>
                  <strong>As a guest</strong> your progress stays on this device only. Clear the browser data and it is
                  gone.
                </li>
                <li>No email, no newsletter. Just a name and a password.</li>
              </ul>
            </aside>
          </div>
        )}
      </ScreenFrame>
    </>
  );
}
