import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CaseFile } from '@shared/caseSchema.ts';
import { Button } from '../components/Button.tsx';
import { Portrait } from '../components/Portrait.tsx';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { useAmbience } from '../hooks/useAmbience.ts';
import { casePath, useCaseContext } from '../hooks/useCase.ts';
import { STORY_ORDER } from '../engine/caseLoader.ts';
import { markBriefingSeen } from '../store/game.ts';
import { ambienceForBackground, sfx } from '../audio/audio.ts';
import styles from './Briefing.module.css';

function placeName(c: CaseFile, id: string): string {
  return c.rooms.find((r) => r.id === id)?.name ?? c.offstage_locations.find((o) => o.id === id)?.name ?? id;
}

function fileNumber(caseKey: string): string {
  const index = (STORY_ORDER as readonly string[]).indexOf(caseKey);
  return index >= 0 ? String(index + 1).padStart(3, '0') : caseKey.toUpperCase();
}

export function Briefing() {
  const { caseFile, caseKey, progress } = useCaseContext();
  const navigate = useNavigate();
  const played = useRef(false);
  useAmbience(ambienceForBackground(caseFile.rooms[0]?.background));

  useEffect(() => {
    if (played.current) return;
    played.current = true;
    sfx('page');
  }, []);

  const begin = () => {
    markBriefingSeen(caseKey);
    navigate(casePath(caseKey, 'rooms'));
  };

  const { victim } = caseFile;
  const seen = progress.briefingSeen;

  return (
    <ScreenFrame title={caseFile.title} kicker="Case briefing">
      <article className={`paper ${styles.file}`} aria-labelledby="briefing-heading">
        <header className={styles.head}>
          <dl className={styles.headLines}>
            <div>
              <dt>File</dt>
              <dd>{fileNumber(caseKey)}</dd>
            </div>
            <div>
              <dt>Date</dt>
              <dd>{caseFile.era}</dd>
            </div>
            <div>
              <dt>Re</dt>
              <dd>Death of {victim.name}</dd>
            </div>
            <div>
              <dt>To</dt>
              <dd>Detective on the night shift</dd>
            </div>
          </dl>
          <span className={`stamp ${styles.confidential}`}>
            Confidential
          </span>
        </header>

        <h2 id="briefing-heading" className={styles.tagline}>
          {caseFile.tagline}
        </h2>

        <div className={styles.columns}>
          <section className={styles.summary} aria-label="Summary">
            {caseFile.intro_briefing.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </section>

          <aside className={styles.side}>
            <section className={styles.victim} aria-labelledby="victim-heading">
              <p className={styles.cardLabel}>Coroner&apos;s card</p>
              <h3 id="victim-heading" className={styles.victimName}>
                {victim.name}
              </h3>
              <p className={styles.victimAge}>Age {victim.age}</p>
              <p className={styles.victimDesc}>{victim.description}</p>
              <dl className={styles.facts}>
                <div>
                  <dt>Cause of death</dt>
                  <dd>{victim.cause_of_death}</dd>
                </div>
                <div>
                  <dt>Found in</dt>
                  <dd>{placeName(caseFile, victim.found_in)}</dd>
                </div>
                <div>
                  <dt>Found</dt>
                  <dd>{victim.found_at}</dd>
                </div>
              </dl>
            </section>

            <section className={styles.scene} aria-labelledby="scene-heading">
              <h3 id="scene-heading" className={styles.cardLabel}>
                The scene
              </h3>
              <p>{caseFile.setting}</p>
              <p className={styles.era}>{caseFile.era}</p>
            </section>
          </aside>
        </div>

        <section className={styles.persons} aria-labelledby="persons-heading">
          <h3 id="persons-heading" className={styles.sectionTitle}>
            Persons present
          </h3>
          <ul className={styles.personList}>
            {caseFile.suspects.map((s) => (
              <li key={s.id} className={styles.person}>
                <Portrait suspect={s} size={68} showInitials={false} decorative />
                <div>
                  <p className={styles.personName}>{s.name}</p>
                  <p className={styles.personRole}>{s.role}</p>
                  <p className={styles.personAge}>Age {s.age}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <footer className={styles.foot}>
          <p className={styles.signoff}>Walk the rooms, question the people in them, and bring back proof.</p>
          <Button variant="primary" size="large" onClick={begin} data-testid="begin-investigation">
            {seen ? 'Return to the investigation' : 'Begin investigation'}
          </Button>
        </footer>
      </article>
    </ScreenFrame>
  );
}
