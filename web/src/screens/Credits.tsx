import { useEffect } from 'react';
import { ButtonLink } from '../components/Button.tsx';
import { RainBackdrop } from '../components/RainBackdrop.tsx';
import { ComicBackdrop } from '../backdrop/ComicBackdrop.tsx';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { useAmbience } from '../hooks/useAmbience.ts';
import styles from './Credits.module.css';
import { useT, type MessageKey } from '../i18n/index.ts';

const FONTS: Array<{ name: string; author: string; use: MessageKey; family: string }> = [
  { name: 'Limelight', author: 'Eduardo Tunni', use: 'credits.useTitles', family: 'var(--font-display)' },
  { name: 'Libre Baskerville', author: 'Impallari Type', use: 'credits.useProse', family: 'var(--font-body)' },
  { name: 'Courier Prime', author: 'Alan Dague-Greene', use: 'credits.useFiles', family: 'var(--font-type)' },
];

const LIBRARIES = ['React', 'React Router', 'Zustand', 'Zod', 'Vite'];

export function Credits() {
  useAmbience('menu');
  const { t, language } = useT();

  useEffect(() => {
    document.title = `${t('credits.title')} - Project Red String`;
  }, [t, language]);

  return (
    <>
      <ComicBackdrop scene="rooftop" dim="page" fallback={<RainBackdrop lamp="left" intensity="soft" />} />
      <ScreenFrame
        title={t('credits.title')}
        actions={
          <ButtonLink to="/" variant="ghost">
            {t('common.backToMenu')}
          </ButtonLink>
        }
      >
        <article className={`paper ${styles.file}`} aria-labelledby="credits-title">
          <header className={styles.head}>
            <p className={styles.fileNo}>{t('credits.fileNo')}</p>
            <h2 id="credits-title" className={styles.title}>
              Project Red String
            </h2>
            <p className={styles.pitch}>{t('credits.pitch')}</p>
          </header>

          <section className={styles.block} aria-labelledby="credits-art">
            <h3 id="credits-art" className={styles.blockTitle}>
              {t('credits.art')}
            </h3>
            <p>{t('credits.artDrawings')}</p>
            <p>{t('credits.artSound')}</p>
            <p className={styles.emphasis}>{t('credits.artNone')}</p>
          </section>

          <section className={styles.block} aria-labelledby="credits-words">
            <h3 id="credits-words" className={styles.blockTitle}>
              {t('credits.words')}
            </h3>
            <p>{t('credits.wordsCases')}</p>
            <p>{t('credits.wordsAi')}</p>
            <p>{t('credits.wordsTranslated')}</p>
          </section>

          <section className={styles.block} aria-labelledby="credits-fonts">
            <h3 id="credits-fonts" className={styles.blockTitle}>
              {t('credits.type')}
            </h3>
            <p className={styles.small}>{t('credits.typeLicense')}</p>
            <ul className={styles.fonts}>
              {FONTS.map((f) => (
                <li key={f.name}>
                  <span className={styles.fontName} style={{ fontFamily: f.family }}>
                    {f.name}
                  </span>
                  <span className={styles.fontBy}>{t('credits.by', { author: f.author })}</span>
                  <span className={styles.fontUse}>{t(f.use)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.block} aria-labelledby="credits-code">
            <h3 id="credits-code" className={styles.blockTitle}>
              {t('credits.code')}
            </h3>
            <p className={styles.small}>{t('credits.codeLicense')}</p>
            <ul className={styles.libs}>
              {LIBRARIES.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </section>

          <footer className={styles.foot}>
            <span className={`stamp ${styles.stamp}`}>{t('credits.filed')}</span>
            <p>{t('credits.foot')}</p>
          </footer>
        </article>
      </ScreenFrame>
    </>
  );
}
