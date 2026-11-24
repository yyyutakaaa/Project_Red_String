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
import { useT } from '../i18n/index.ts';

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
  const { t } = useT();

  return (
    <ScreenFrame title={caseFile.title} kicker={t('briefing.kicker')}>
      <article className={`paper selectable ${styles.file}`} aria-labelledby="briefing-heading">
        <header className={styles.head}>
          <dl className={styles.headLines}>
            <div>
              <dt>{t('briefing.file')}</dt>
              <dd>{fileNumber(caseKey)}</dd>
            </div>
            <div>
              <dt>{t('briefing.date')}</dt>
              <dd>{caseFile.era}</dd>
            </div>
            <div>
              <dt>{t('briefing.re')}</dt>
              <dd>{t('briefing.death', { name: victim.name })}</dd>
            </div>
            <div>
              <dt>{t('briefing.to')}</dt>
              <dd>{t('briefing.toWho')}</dd>
            </div>
          </dl>
          <span className={`stamp ${styles.confidential}`}>
            {t('briefing.confidential')}
          </span>
        </header>

        <h2 id="briefing-heading" className={styles.tagline}>
          {caseFile.tagline}
        </h2>

        <div className={styles.columns}>
          <section className={styles.summary} aria-label={t('briefing.summary')}>
            {caseFile.intro_briefing.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </section>

          <aside className={styles.side}>
            <section className={styles.victim} aria-labelledby="victim-heading">
              <p className={styles.cardLabel}>{t('briefing.coroner')}</p>
              <h3 id="victim-heading" className={styles.victimName}>
                {victim.name}
              </h3>
              <p className={styles.victimAge}>{t('briefing.age', { age: victim.age })}</p>
              <p className={styles.victimDesc}>{victim.description}</p>
              <dl className={styles.facts}>
                <div>
                  <dt>{t('briefing.cause')}</dt>
                  <dd>{victim.cause_of_death}</dd>
                </div>
                <div>
                  <dt>{t('briefing.foundIn')}</dt>
                  <dd>{placeName(caseFile, victim.found_in)}</dd>
                </div>
                <div>
                  <dt>{t('briefing.found')}</dt>
                  <dd>{victim.found_at}</dd>
                </div>
              </dl>
            </section>

            <section className={styles.scene} aria-labelledby="scene-heading">
              <h3 id="scene-heading" className={styles.cardLabel}>
                {t('briefing.scene')}
              </h3>
              <p>{caseFile.setting}</p>
              <p className={styles.era}>{caseFile.era}</p>
            </section>
          </aside>
        </div>

        <section className={styles.persons} aria-labelledby="persons-heading">
          <h3 id="persons-heading" className={styles.sectionTitle}>
            {t('briefing.persons')}
          </h3>
          <ul className={styles.personList}>
            {caseFile.suspects.map((s) => (
              <li key={s.id} className={styles.person}>
                <Portrait suspect={s} size={68} showInitials={false} decorative />
                <div>
                  <p className={styles.personName}>{s.name}</p>
                  <p className={styles.personRole}>{s.role}</p>
                  <p className={styles.personAge}>{t('briefing.age', { age: s.age })}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <footer className={styles.foot}>
          <p className={styles.signoff}>{t('briefing.signoff')}</p>
          <Button variant="primary" size="large" onClick={begin} data-testid="begin-investigation">
            {seen ? t('briefing.return') : t('briefing.begin')}
          </Button>
        </footer>
      </article>
    </ScreenFrame>
  );
}
