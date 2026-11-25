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
import { useT, type MessageKey } from '../i18n/index.ts';

type Mode = 'signin' | 'signup';

const SYNC_TEXT: Record<SyncState, MessageKey> = {
  local: 'account.syncLocal',
  syncing: 'account.syncSyncing',
  synced: 'account.syncSynced',
  offline: 'account.syncOffline',
};

const SYNC_BADGE: Record<SyncState, MessageKey> = {
  local: 'account.badgeLocal',
  syncing: 'account.badgeSyncing',
  synced: 'account.badgeSynced',
  offline: 'account.badgeOffline',
};

export function SyncBadge({ state, compact = false }: { state: SyncState; compact?: boolean }) {
  const { t } = useT();
  const label = t(compact ? SYNC_BADGE[state] : SYNC_TEXT[state]);
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
  const { t } = useT();

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

  return (
    <section className={styles.panel} aria-labelledby="badge-heading">
      <div className={styles.badge}>
        <div className={styles.badgeLogo} aria-hidden="true">
          <LogoEye />
        </div>
        <div>
          <p className={styles.badgeKicker}>{t('account.detective')}</p>
          <h2 id="badge-heading" className={styles.badgeName}>
            {user.username}
          </h2>
          <SyncBadge state={sync} />
          {lastSyncedAt && sync === 'synced' && <p className={styles.small}>{t('account.lastFiled', { date: formatDate(lastSyncedAt) })}</p>}
        </div>
      </div>
      <p className={styles.note}>{t('account.signedInNote')}</p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        <Button onClick={() => void syncNow()} disabled={busy || sync === 'syncing'}>
          {t('account.syncNow')}
        </Button>
        <Button variant="ghost" onClick={() => void doSignOut()} disabled={busy} data-testid="account-signout">
          {t('account.signOut')}
        </Button>
      </div>
      <p className={styles.small}>{t('account.signOutNote')}</p>
    </section>
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
      <RainBackdrop lamp="left" intensity="soft" />
      <ScreenFrame
        title={t('account.title')}
        kicker={t('common.recordsOffice')}
        actions={
          <ButtonLink to="/" variant="ghost">
            {t('common.backToMenu')}
          </ButtonLink>
        }
      >
        {!BACKEND_CONFIGURED ? (
          <p className="muted">{t('account.unavailable')}</p>
        ) : (
          <div className={styles.layout}>
            {user ? <SignedIn /> : <SignInForm />}
            <aside className={styles.aside}>
              <h2 className={styles.asideTitle}>{user ? t('account.howSaving') : t('account.whySignIn')}</h2>
              <ul className={styles.list}>
                <li>
                  <strong>{t('account.withAccount')}</strong> {t('account.withAccountText')}
                </li>
                <li>
                  <strong>{t('account.asGuest')}</strong> {t('account.asGuestText')}
                </li>
                <li>{t('account.noEmail')}</li>
              </ul>
            </aside>
          </div>
        )}
      </ScreenFrame>
    </>
  );
}
