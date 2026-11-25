import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RainBackdrop } from '../components/RainBackdrop.tsx';
import { useAmbience } from '../hooks/useAmbience.ts';
import { casePath, resolveCase } from '../hooks/useCase.ts';
import { continueSlot, type KeyValueStorage } from '../engine/save.ts';
import { useGame } from '../store/game.ts';
import { resolveTheme, useSettings } from '../store/settings.ts';
import { useAccount } from '../store/account.ts';
import { useLaunch } from '../boot/launch.ts';
import { SyncBadge } from './Account.tsx';
import { ShellNotice } from '../desktop/ShellNotice.tsx';
import { FirstRun } from '../onboarding/FirstRun.tsx';
import { useOnboarding } from '../onboarding/onboarding.ts';
import { useStartTutorial } from '../onboarding/useStartTutorial.ts';
import { sfx } from '../audio/audio.ts';
import { useT } from '../i18n/index.ts';
import styles from './MainMenu.module.css';

interface ContinueInfo {
  slot: number;
  caseTitle: string | null;
}

function describeContinue(storage: KeyValueStorage): ContinueInfo | null {
  const slot = continueSlot(storage);
  if (!slot) return null;
  const resolved = slot.activeCaseKey ? resolveCase(slot.activeCaseKey) : null;
  return { slot: slot.slot, caseTitle: resolved?.caseFile.title ?? null };
}

interface MenuItem {
  id: string;
  label: string;
  sub: string;
  to?: string;
  onSelect?: () => void;
  disabled?: boolean;
}

const ITEM_SELECTOR = '[data-menu-item]:not(:disabled)';

export function MainMenu() {
  useAmbience('menu');
  const navigate = useNavigate();
  const storage = useGame((s) => s.storage);
  const continueLast = useGame((s) => s.continueLast);
  const ensureActiveSlot = useGame((s) => s.ensureActiveSlot);
  const [lastSave] = useState(() => describeContinue(storage));
  const user = useAccount((s) => s.user);
  const sync = useAccount((s) => s.sync);
  const launch = useLaunch();
  const theme = resolveTheme(useSettings((s) => s.theme));
  const listRef = useRef<HTMLUListElement>(null);
  const { t } = useT();
  const startTutorial = useStartTutorial();
  const tutorialDone = useOnboarding((s) => s.tutorialDone);

  useEffect(() => {
    document.title = 'Project Red String';
  }, []);

  // Arrow keys pick up the menu even before anything has focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const list = listRef.current;
      const active = document.activeElement;
      if (!list || (active && active !== document.body && active.id !== 'main')) return;
      const items = Array.from(list.querySelectorAll<HTMLElement>(ITEM_SELECTOR));
      const target = e.key === 'ArrowDown' ? items[0] : items[items.length - 1];
      if (target) {
        e.preventDefault();
        target.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onListKeyDown = (e: ReactKeyboardEvent<HTMLUListElement>) => {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(ITEM_SELECTOR));
    if (items.length === 0) return;
    const index = items.indexOf(document.activeElement as HTMLElement);
    let next: number;
    if (e.key === 'ArrowDown') next = index < 0 ? 0 : (index + 1) % items.length;
    else if (e.key === 'ArrowUp') next = index < 0 ? items.length - 1 : (index - 1 + items.length) % items.length;
    else if (e.key === 'Home') next = 0;
    else next = items.length - 1;
    e.preventDefault();
    items[next]?.focus();
  };

  const handleContinue = () => {
    const slot = continueLast();
    if (!slot) {
      navigate('/cases');
      return;
    }
    const key = slot.activeCaseKey;
    const resolved = key ? resolveCase(key) : null;
    if (key && resolved) {
      const closed = Boolean(slot.progress[key]?.accusation);
      void launch(casePath(key, closed ? 'ending' : ''), { kicker: t('common.slot', { n: slot.slot }), title: resolved.caseFile.title });
    } else {
      void launch('/cases', { kicker: t('common.slot', { n: slot.slot }), title: t('menu.caseFilesTitle') });
    }
  };

  const items: MenuItem[] = [
    {
      id: 'continue',
      label: t('menu.continue'),
      sub: lastSave ? t('menu.continueSub', { n: lastSave.slot, case: lastSave.caseTitle ?? t('menu.noCaseOpen') }) : t('menu.noSave'),
      onSelect: handleContinue,
      disabled: !lastSave,
    },
    {
      id: 'story-cases',
      label: t('menu.storyCases'),
      sub: t('menu.storyCasesSub'),
      onSelect: () => {
        ensureActiveSlot();
        navigate('/cases');
      },
    },
    {
      id: 'tutorial',
      label: t('menu.tutorial'),
      sub: tutorialDone ? t('menu.tutorialAgain') : t('menu.tutorialSub'),
      onSelect: startTutorial,
    },
    { id: 'save-slots', label: t('menu.saveSlots'), sub: t('menu.saveSlotsSub'), to: '/slots' },
    {
      id: 'account',
      label: t('menu.account'),
      sub: user ? t('menu.accountSignedIn', { name: user.username }) : t('menu.accountGuest'),
      to: '/account',
    },
    { id: 'settings', label: t('menu.settings'), sub: t('menu.settingsSub'), to: '/settings' },
    { id: 'credits', label: t('menu.credits'), sub: t('menu.creditsSub'), to: '/credits' },
  ];

  return (
    <div className={styles.screen}>
      <RainBackdrop lamp="right" />
      <ShellNotice />
      <FirstRun />
      <Link to="/account" className={styles.accountChip} data-testid="account-chip" onClick={() => sfx('click')}>
        {user ? (
          <>
            <span className={styles.chipName}>{user.username}</span>
            <SyncBadge state={sync} compact />
          </>
        ) : (
          <>
            <span className={styles.chipName}>{t('menu.guest')}</span>
            <span className={styles.chipNote}>{t('menu.guestNote')}</span>
          </>
        )}
      </Link>
      <main id="main" tabIndex={-1} className={styles.main}>
        <header className={styles.masthead}>
          <p className={styles.kicker}>{theme === 'light' ? t('menu.kickerDay') : t('menu.kickerNight')}</p>
          <h1 className={styles.title}>
            <span className={styles.titleSmall}>Project</span>
            <span className={styles.titleBig}>Red String</span>
          </h1>
          <svg className={styles.string} viewBox="0 0 520 60" aria-hidden="true" focusable="false">
            <path className={styles.thread} d="M12 14 C 140 52, 300 54, 508 22" pathLength={1} />
            <circle className={styles.pinHead} cx="12" cy="14" r="6" />
            <circle className={styles.pinShine} cx="10" cy="12" r="1.8" />
            <circle className={styles.pinHead} cx="508" cy="22" r="6" />
            <circle className={styles.pinShine} cx="506" cy="20" r="1.8" />
          </svg>
          <p className={styles.pitch}>
            {t('menu.pitch')} <span className={styles.pitchTail}>{t('menu.pitchTail')}</span>
          </p>
        </header>

        <nav className={styles.nav} aria-label={t('menu.navLabel')}>
          <ul ref={listRef} className={styles.menu} onKeyDown={onListKeyDown}>
            {items.map((item, index) => {
              const subId = `menu-sub-${item.id}`;
              const inner = (
                <>
                  <span className={styles.itemLabel} aria-hidden="true">
                    {item.label}
                  </span>
                  <span id={subId} className={styles.itemSub}>
                    {item.sub}
                  </span>
                </>
              );
              return (
                <li key={item.id} style={{ ['--i' as string]: index }}>
                  {item.to ? (
                    <Link
                      to={item.to}
                      className={styles.item}
                      data-menu-item=""
                      data-testid={`menu-${item.id}`}
                      aria-label={item.label}
                      aria-describedby={subId}
                      onClick={() => sfx('click')}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={styles.item}
                      data-menu-item=""
                      data-testid={`menu-${item.id}`}
                      aria-label={item.label}
                      aria-describedby={subId}
                      disabled={item.disabled}
                      onClick={() => {
                        sfx('click');
                        item.onSelect?.();
                      }}
                    >
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <footer className={styles.footer}>
          <p>{t('menu.footerKeys')}</p>
          <p>{t('menu.footerRain')}</p>
        </footer>
      </main>
    </div>
  );
}
