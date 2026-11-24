import { useEffect } from 'react';
import { ButtonLink } from '../components/Button.tsx';
import { RainBackdrop } from '../components/RainBackdrop.tsx';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { useAmbience } from '../hooks/useAmbience.ts';
import styles from './Credits.module.css';

const FONTS = [
  { name: 'Limelight', author: 'Eduardo Tunni', use: 'Titles', family: 'var(--font-display)' },
  { name: 'Libre Baskerville', author: 'Impallari Type', use: 'Prose', family: 'var(--font-body)' },
  { name: 'Courier Prime', author: 'Alan Dague-Greene', use: 'Case files and notes', family: 'var(--font-type)' },
];

const LIBRARIES = ['React', 'React Router', 'Zustand', 'Zod', 'Vite'];

export function Credits() {
  useAmbience('menu');

  useEffect(() => {
    document.title = 'Credits - Project Red String';
  }, []);

  return (
    <>
      <RainBackdrop lamp="left" intensity="soft" />
      <ScreenFrame
        title="Credits"
        kicker="For the record"
        actions={
          <ButtonLink to="/" variant="ghost">
            Back to the menu
          </ButtonLink>
        }
      >
        <article className={`paper ${styles.file}`} aria-labelledby="credits-title">
          <header className={styles.head}>
            <p className={styles.fileNo}>File No. 000. Closed.</p>
            <h2 id="credits-title" className={styles.title}>
              Project Red String
            </h2>
            <p className={styles.pitch}>Question suspects in your own words. They can lie. You have to prove it.</p>
          </header>

          <section className={styles.block} aria-labelledby="credits-art">
            <h3 id="credits-art" className={styles.blockTitle}>
              Pictures and sound
            </h3>
            <p>All room scenes, portraits and props are original procedural SVG drawings.</p>
            <p>All music and sound effects are synthesised at runtime with the Web Audio API.</p>
            <p className={styles.emphasis}>No external art or audio assets are used.</p>
          </section>

          <section className={styles.block} aria-labelledby="credits-words">
            <h3 id="credits-words" className={styles.blockTitle}>
              Words
            </h3>
            <p>Story cases are hand-authored.</p>
            <p>Interrogations are voiced by an AI language model, briefed on what each suspect knows, what they hide and what they will lie about.</p>
          </section>

          <section className={styles.block} aria-labelledby="credits-fonts">
            <h3 id="credits-fonts" className={styles.blockTitle}>
              Type
            </h3>
            <p className={styles.small}>From Google Fonts, under the SIL Open Font License 1.1.</p>
            <ul className={styles.fonts}>
              {FONTS.map((f) => (
                <li key={f.name}>
                  <span className={styles.fontName} style={{ fontFamily: f.family }}>
                    {f.name}
                  </span>
                  <span className={styles.fontBy}>by {f.author}</span>
                  <span className={styles.fontUse}>{f.use}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.block} aria-labelledby="credits-code">
            <h3 id="credits-code" className={styles.blockTitle}>
              Code
            </h3>
            <p className={styles.small}>Built with open-source libraries under the MIT License.</p>
            <ul className={styles.libs}>
              {LIBRARIES.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </section>

          <footer className={styles.foot}>
            <span className={`stamp ${styles.stamp}`}>Filed</span>
            <p>No real people were harmed. The rain was all synthetic.</p>
          </footer>
        </article>
      </ScreenFrame>
    </>
  );
}
