// The popups of the first start, shown over the main menu one after another: the language, an
// account to keep the progress in, and the tutorial. See onboarding.ts for when each one shows.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Button } from '../components/Button.tsx';
import { SignInForm } from '../screens/Account.tsx';
import { BACKEND_CONFIGURED } from '../lib/config.ts';
import { useAccount } from '../store/account.ts';
import { sfx } from '../audio/audio.ts';
import { AVAILABLE_LANGUAGES, useT, type LanguageCode } from '../i18n/index.ts';
import { answerAccount, answerTutorial, chooseLanguage, firstRunStep, useOnboarding } from './onboarding.ts';
import { useStartTutorial } from './useStartTutorial.ts';
import styles from './FirstRun.module.css';

/** "Choose your language" in every language the game ships in, so nobody has to read English first. */
const CHOOSE: Record<LanguageCode, string> = {
  en: 'Choose your language',
  nl: 'Kies je taal',
  fr: 'Choisissez votre langue',
  de: 'Wähle deine Sprache',
};

function Sheet({ title, kicker, children, testId, wide = false }: { title: ReactNode; kicker: string; children: ReactNode; testId: string; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d || d.open) return;
    try {
      d.showModal();
    } catch {
      d.setAttribute('open', '');
    }
  }, []);
  return (
    // Escape does nothing: each popup asks for an answer, and every answer is one click.
    <dialog ref={ref} className={`${styles.dialog} ${wide ? styles.wide : ''}`} aria-labelledby={titleId} data-testid={testId} onCancel={(e) => e.preventDefault()}>
      <div className={`paper ${styles.sheet}`}>
        <p className={styles.kicker} aria-hidden="true">
          <span>{kicker}</span>
          <span>CALDER CITY P.D.</span>
        </p>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}

function LanguageStep() {
  const { language } = useT();
  const [picked, setPicked] = useState<LanguageCode | null>(null);
  const pick = (code: LanguageCode) => {
    sfx('click');
    setPicked(code);
    void chooseLanguage(code);
  };
  const others = AVAILABLE_LANGUAGES.filter((l) => l.code !== language).map((l) => CHOOSE[l.code]);
  return (
    <Sheet kicker="1 / 3" title={CHOOSE[language]} testId="first-run-language">
      <p className={styles.alsoTitle} aria-hidden="true">
        {others.join(' · ')}
      </p>
      <ul className={styles.languages}>
        {AVAILABLE_LANGUAGES.map((l) => (
          <li key={l.code}>
            <button
              type="button"
              className={styles.language}
              data-selected={(picked ?? language) === l.code || undefined}
              onClick={() => pick(l.code)}
              data-testid={`first-run-language-${l.code}`}
              lang={l.code}
            >
              <span className={styles.languageCode} aria-hidden="true">
                {l.code.toUpperCase()}
              </span>
              <span className={styles.languageName}>{l.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

function AccountStep() {
  const { t } = useT();
  return (
    <Sheet kicker="2 / 3" title={t('firstRun.accountTitle')} testId="first-run-account" wide>
      <div className={styles.accountLayout}>
        <div className={styles.accountText}>
          <p>{t('firstRun.accountText')}</p>
          <ul className={styles.points}>
            <li>{t('firstRun.accountPoint1')}</li>
            <li>{t('firstRun.accountPoint2')}</li>
            <li>{t('firstRun.accountPoint3')}</li>
          </ul>
          <Button
            onClick={() => {
              sfx('click');
              answerAccount();
            }}
            data-testid="first-run-guest"
          >
            {t('firstRun.asGuest')}
          </Button>
          <p className={styles.small}>{t('firstRun.accountLater')}</p>
        </div>
        <SignInForm initialMode="signup" />
      </div>
    </Sheet>
  );
}

function TutorialStep() {
  const { t } = useT();
  const start = useStartTutorial();
  return (
    <Sheet kicker="3 / 3" title={t('firstRun.tutorialTitle')} testId="first-run-tutorial">
      <p>{t('firstRun.tutorialText')}</p>
      <ol className={styles.steps}>
        <li>{t('firstRun.tutorialStep1')}</li>
        <li>{t('firstRun.tutorialStep2')}</li>
        <li>{t('firstRun.tutorialStep3')}</li>
      </ol>
      <div className={styles.actions}>
        <Button
          onClick={() => {
            sfx('click');
            answerTutorial();
          }}
          data-testid="first-run-skip-tutorial"
        >
          {t('firstRun.skip')}
        </Button>
        <Button
          variant="lamp"
          onClick={() => {
            answerTutorial();
            start();
          }}
          data-testid="first-run-play-tutorial"
        >
          {t('firstRun.play')}
        </Button>
      </div>
      <p className={styles.small}>{t('firstRun.tutorialLater')}</p>
    </Sheet>
  );
}

/** Shown on the main menu until the first-start questions are answered. */
export function FirstRun() {
  const state = useOnboarding();
  const user = useAccount((s) => s.user);
  const ready = useAccount((s) => s.ready);
  const step = ready ? firstRunStep(state, user, BACKEND_CONFIGURED) : null;
  // A new key for each step: every popup opens as its own dialog.
  if (step === 'language') return <LanguageStep key="language" />;
  if (step === 'account') return <AccountStep key="account" />;
  if (step === 'tutorial') return <TutorialStep key="tutorial" />;
  return null;
}
