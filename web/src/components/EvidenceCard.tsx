import type { CaseFile, Evidence } from '@shared/caseSchema.ts';
import styles from './EvidenceCard.module.css';
import { sourceLabel } from '../lib/format.ts';
import { EvidencePhoto } from './EvidencePhoto.tsx';

interface EvidenceCardProps {
  evidence: Evidence;
  caseFile: CaseFile;
  compact?: boolean;
  selected?: boolean;
  /** When set the card renders as a toggle button. */
  onToggle?: () => void;
  disabled?: boolean;
  /** Exhibit number for the marker in the photograph. */
  exhibit?: number;
}


/** Paper evidence tag. Used in the notebook, the evidence picker and the accusation screen. */
export function EvidenceCard({ evidence, caseFile, compact, selected, onToggle, disabled, exhibit }: EvidenceCardProps) {
  const body = (
    <>
      <span className={styles.photo} aria-hidden="true">
        <EvidencePhoto name={evidence.name} marker={exhibit} />
      </span>
      <span className={styles.name}>{evidence.name}</span>
      {!compact && <span className={styles.desc}>{evidence.description}</span>}
      <span className={styles.source}>{sourceLabel(caseFile, evidence)}</span>
    </>
  );
  if (onToggle) {
    return (
      <button
        type="button"
        className={`${styles.card} ${compact ? styles.compact : ''} ${selected ? styles.selected : ''}`}
        aria-pressed={selected ?? false}
        onClick={onToggle}
        disabled={disabled}
        data-testid={`evidence-${evidence.id}`}
      >
        {body}
      </button>
    );
  }
  return (
    <article className={`${styles.card} ${compact ? styles.compact : ''}`} data-testid={`evidence-${evidence.id}`}>
      {body}
    </article>
  );
}
