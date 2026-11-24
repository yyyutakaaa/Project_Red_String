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

export function Accusation() {
  const { caseFile, caseKey, progress } = useCaseContext();
  const navigate = useNavigate();
  const [culpritId, setCulpritId] = useState<string | null>(null);
  const [evidenceIds, setEvidenceIds] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const validationId = useId();
  useAmbience(ambienceForBackground(caseFile.rooms[0]?.background));

  useEffect(() => {
    document.title = `Accusation - ${caseFile.title} - Project Red String`;
  }, [caseFile.title]);

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
    <ScreenFrame title="The accusation" kicker={caseFile.title}>
      <p className={styles.lede}>
        Name one person and back it with two to four pieces of proof. Once you say it out loud the case is closed, right or wrong.
      </p>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          if (!error) setConfirmOpen(true);
        }}
        aria-label="Accusation"
      >
        <fieldset className={styles.step}>
          <legend className={styles.stepTitle}>
            <span className={styles.stepNo}>1</span> Who did it?
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
                  <Portrait suspect={s} size={112} showInitials={false} decorative />
                  <span className={styles.suspectText}>
                    <span className={styles.suspectName}>{s.name}</span>
                    <span className={styles.suspectRole}>{s.role}</span>
                  </span>
                  {selected && (
                    <span className={styles.accusedTag} aria-hidden="true">
                      Accused
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className={styles.step}>
          <legend className={styles.stepTitle}>
            <span className={styles.stepNo}>2</span> What proves it?
          </legend>
          <p className={styles.stepNote}>
            Pick {MIN_ACCUSATION_EVIDENCE} to {MAX_ACCUSATION_EVIDENCE} pieces from what you have found. Motive, means, a broken alibi: a
            jury wants to see how it was done.
          </p>
          {found.length === 0 ? (
            <div className={styles.nothing}>
              <p>Your evidence bag is empty. Search the scenes before you accuse anyone.</p>
              <ButtonLink to={casePath(caseKey, 'rooms')}>Back to the scenes</ButtonLink>
            </div>
          ) : (
            <>
              <ul className={styles.evidence}>
                {found.map((e) => (
                  <li key={e.id} data-testid={`accuse-evidence-${e.id}`}>
                    <EvidenceCard evidence={e} caseFile={caseFile} selected={evidenceIds.includes(e.id)} onToggle={() => toggleEvidence(e.id)} />
                  </li>
                ))}
              </ul>
              {found.length < MIN_ACCUSATION_EVIDENCE && (
                <p className={styles.stepNote}>
                  You need more than you have. <Link to={casePath(caseKey, 'rooms')}>Keep digging.</Link>
                </p>
              )}
            </>
          )}
        </fieldset>

        <div className={styles.bar}>
          <div className={styles.barText}>
            <p className={styles.tally}>
              <span>{culprit ? culprit.name : 'No suspect chosen'}</span>
              <span className={styles.dot} aria-hidden="true" />
              <span>
                {evidenceIds.length} of {MIN_ACCUSATION_EVIDENCE} to {MAX_ACCUSATION_EVIDENCE} pieces
              </span>
            </p>
            <p id={validationId} className={`${styles.validation} ${error ? '' : styles.ready}`} aria-live="polite" data-testid="accusation-validation">
              {error ?? 'Ready. Say it to their face.'}
            </p>
          </div>
          <Button type="submit" variant="primary" size="large" disabled={error !== null} aria-describedby={validationId} data-testid="submit-accusation">
            Make the accusation
          </Button>
        </div>
      </form>

      <Modal
        open={confirmOpen}
        title="Close the case?"
        onClose={() => setConfirmOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Not yet
            </Button>
            <Button variant="primary" onClick={submit} data-testid="confirm-accusation">
              Accuse {culprit?.name ?? 'them'}
            </Button>
          </>
        }
      >
        <p className={styles.confirmLead}>
          You are naming <strong>{culprit?.name}</strong> for the death of {caseFile.victim.name}, on the strength of:
        </p>
        <ul className={styles.confirmList}>
          {chosen.map((e) => (
            <li key={e.id}>{e.name}</li>
          ))}
        </ul>
        <p className={styles.confirmWarn}>This closes the case. There is no going back.</p>
      </Modal>
    </ScreenFrame>
  );
}
