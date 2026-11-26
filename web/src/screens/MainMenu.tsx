import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { RainBackdrop } from '../components/RainBackdrop.tsx';
import { ComicBackdrop } from '../backdrop/ComicBackdrop.tsx';
import { useAmbience } from '../hooks/useAmbience.ts';
import { casePath, resolveCase } from '../hooks/useCase.ts';
import { continueSlot, type KeyValueStorage } from '../engine/save.ts';
import { useGame } from '../store/game.ts';
import { useAccount } from '../store/account.ts';
import { useLaunch } from '../boot/launch.ts';
import { SyncStamp } from './Account.tsx';
import { DetectiveAvatar } from '../components/DetectiveAvatar.tsx';
import { ShellNotice } from '../desktop/ShellNotice.tsx';
import { FirstRun } from '../onboarding/FirstRun.tsx';
import { useStartTutorial } from '../onboarding/useStartTutorial.ts';
import { sfx } from '../audio/audio.ts';
import { useT } from '../i18n/index.ts';
import styles from './MainMenu.module.css';

const hasSave = (storage: KeyValueStorage) => continueSlot(storage) !== null;

interface MenuItem {
  id: string;
  label: string;
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
  const [lastSave] = useState(() => hasSave(storage));
  const user = useAccount((s) => s.user);
  const sync = useAccount((s) => s.sync);
  const launch = useLaunch();
  const listRef = useRef<HTMLUListElement>(null);
  const { t } = useT();
  const startTutorial = useStartTutorial();

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
    { id: 'continue', label: t('menu.continue'), onSelect: handleContinue, disabled: !lastSave },
    {
      id: 'story-cases',
      label: t('menu.storyCases'),
      onSelect: () => {
        ensureActiveSlot();
        navigate('/cases');
      },
    },
    { id: 'tutorial', label: t('menu.tutorial'), onSelect: startTutorial },
    { id: 'save-slots', label: t('menu.saveSlots'), to: '/slots' },
    { id: 'account', label: t('menu.account'), to: '/account' },
    { id: 'settings', label: t('menu.settings'), to: '/settings' },
    { id: 'credits', label: t('menu.credits'), to: '/credits' },
  ];

  return (
    <div className={styles.screen}>
      <ComicBackdrop scene="street" dim="menu" fallback={<RainBackdrop lamp="right" />} />
      <ShellNotice />
      <FirstRun />
      <Link to="/account" className={styles.accountChip} data-testid="account-chip" onClick={() => sfx('click')}>
        {user ? (
          <>
            <DetectiveAvatar avatar={user.prefs.avatar} size="small" />
            <span className={styles.chipText}>
              <span className={styles.chipName}>{user.username}</span>
              <SyncStamp state={sync} />
            </span>
          </>
        ) : (
          <span className={styles.chipName}>{t('menu.guest')}</span>
        )}
      </Link>
      <main id="main" tabIndex={-1} className={styles.main}>
        <header className={styles.masthead}>
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
        </header>

        <nav className={styles.nav} aria-label={t('menu.navLabel')}>
          <ul ref={listRef} className={styles.menu} onKeyDown={onListKeyDown}>
            {items.map((item, index) => {
              const inner = <span className={styles.itemLabel}>{item.label}</span>;
              return (
                <li key={item.id} style={{ ['--i' as string]: index }}>
                  {item.to ? (
                    <Link
                      to={item.to}
                      className={styles.item}
                      data-menu-item=""
                      data-testid={`menu-${item.id}`}
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
      </main>
    </div>
  );
}
