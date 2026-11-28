import { useEffect, useId, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button, ButtonLink } from '../components/Button.tsx';
import { EvidenceCard } from '../components/EvidenceCard.tsx';
import { Modal } from '../components/Modal.tsx';
import { Portrait } from '../components/Portrait.tsx';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { useAmbience } from '../hooks/useAmbience.ts';
import { casePath, useCaseContext } from '../hooks/useCase.ts';
import { MAX_ACCUSATION_EVIDENCE, MIN_ACCUSATION_EVIDENCE, accusationSelectionError } from '../engine/scoring.ts';
import { accuse } from '../store/game.ts';
import { ambienceForBackground, sfx } from '../audio/audio.ts';
import styles from './Accusation.module.css';
import { useT } from '../i18n/index.ts';
import { rich } from '../i18n/rich.tsx';

export function Accusation() {
  const { caseFile, caseKey, progress } = useCaseContext();
  const navigate = useNavigate();
  const [culpritId, setCulpritId] = useState<string | null>(null);
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const validationId = useId();
  useAmbience(ambienceForBackground(caseFile.rooms[0]?.background));
  const { t, language } = useT();

  useEffect(() => {
    document.title = `${t('accuse.docTitle')} - ${caseFile.title} - Project Red String`;
  }, [caseFile.title, t, language]);

  if (progress.accusation) return <Navigate to={casePath(caseKey, 'ending')} replace />;

  const found = caseFile.evidence.filter((e) => progress.foundEvidence.includes(e.id));
  const error = accusationSelectionError(culpritId, evidenceIds);
  const culprit = caseFile.suspects.find((s) => s.id === culpritId) ?? null;
  const chosen = found.filter((e) => evidenceIds.includes(e.id));

  const toggleEvidence = (id: string) => {
    sfx('pin');
    setEvidenceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const submit = () => {
    if (!culpritId || error) return;
    accuse(caseFile, caseKey, culpritId, evidenceIds);
    setConfirmOpen(false);
    navigate(casePath(caseKey, 'ending'), { replace: true });
  };

  return (
    <ScreenFrame wide title={t('accuse.title')}>
      <p className={styles.lede}>{t('accuse.lede')}</p>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          if (!error) setConfirmOpen(true);
        }}
        aria-label={t('accuse.formLabel')}
      >
        <fieldset className={styles.step}>
          <legend className={styles.stepTitle}>
            <span className={styles.stepNo}>1</span> {t('accuse.who')}
          </legend>
          <div className={styles.suspects}>
            {caseFile.suspects.map((s) => {
              const selected = culpritId === s.id;
              return (
                <label key={s.id} className={`${styles.suspect} ${selected ? styles.suspectOn : ''}`} data-testid={`accuse-suspect-${s.id}`}>
                  <input
                    type="radio"
                    name="culprit"
                    value={s.id}
                    checked={selected}
                    onChange={() => {
                      sfx('click');
                      setCulpritId(s.id);
                    }}
                    className="visually-hidden"
                  />
                  <Portrait suspect={s} size={72} showInitials={false} decorative />
                  <span className={styles.suspectText}>
                    <span className={styles.suspectName}>{s.name}</span>
                    <span className={styles.suspectRole}>{s.role}</span>
                  </span>
                  {selected && (
                    <span className={styles.accusedTag} aria-hidden="true">
                      {t('accuse.accused')}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className={styles.step}>
          <legend className={styles.stepTitle}>
            <span className={styles.stepNo}>2</span> {t('accuse.what')}
          </legend>
          <p className={styles.stepNote}>{t('accuse.pickNote', { min: MIN_ACCUSATION_EVIDENCE, max: MAX_ACCUSATION_EVIDENCE })}</p>
          {found.length === 0 ? (
            <div className={styles.nothing}>
              <p>{t('accuse.bagEmpty')}</p>
              <ButtonLink to={casePath(caseKey, 'rooms')}>{t('room.backToScenes')}</ButtonLink>
            </div>
          ) : (
            <>
              <ul className={styles.evidence}>
                {found.map((e) => (
                  <li key={e.id} data-testid={`accuse-evidence-${e.id}`}>
                    <EvidenceCard evidence={e} caseFile={caseFile} compact selected={evidenceIds.includes(e.id)} onToggle={() => toggleEvidence(e.id)} />
                  </li>
                ))}
              </ul>
              {found.length < MIN_ACCUSATION_EVIDENCE && (
                <p className={styles.stepNote}>
                  {t('accuse.needMore')} <Link to={casePath(caseKey, 'rooms')}>{t('accuse.keepDigging')}</Link>
                </p>
              )}
            </>
          )}
        </fieldset>

        <div className={styles.bar}>
          <div className={styles.barText}>
            <p className={styles.tally}>
              <span>{culprit ? culprit.name : t('accuse.noSuspect')}</span>
              <span className={styles.dot} aria-hidden="true" />
              <span>{t('accuse.pieces', { n: evidenceIds.length, min: MIN_ACCUSATION_EVIDENCE, max: MAX_ACCUSATION_EVIDENCE })}</span>
            </p>
            <p id={validationId} className={`${styles.validation} ${error ? '' : styles.ready}`} aria-live="polite" data-testid="accusation-validation">
              {error ?? t('accuse.ready')}
            </p>
          </div>
          <Button type="submit" variant="primary" size="large" disabled={error !== null} aria-describedby={validationId} data-testid="submit-accusation">
            {t('accuse.submit')}
          </Button>
        </div>
      </form>

      <Modal
        open={confirmOpen}
        title={t('accuse.confirmTitle')}
        onClose={() => setConfirmOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              {t('accuse.notYet')}
            </Button>
            <Button variant="primary" onClick={submit} data-testid="confirm-accusation">
              {t('accuse.accuseName', { name: culprit?.name ?? t('accuse.them') })}
            </Button>
          </>
        }
      >
        <p className={styles.confirmLead}>
          {rich(t('accuse.confirmLead'), { name: <strong>{culprit?.name}</strong>, victim: caseFile.victim.name })}
        </p>
        <ul className={styles.confirmList}>
          {chosen.map((e) => (
            <li key={e.id}>{e.name}</li>
          ))}
        </ul>
        <p className={styles.confirmWarn}>{t('accuse.confirmWarn')}</p>
      </Modal>
    </ScreenFrame>
  );
}
