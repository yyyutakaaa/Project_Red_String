import type { CaseFile, Evidence } from '@shared/caseSchema.ts';
import { Button } from './Button.tsx';
import { EvidenceCard } from './EvidenceCard.tsx';
import { Modal } from './Modal.tsx';
import styles from './Interrogation.parts.module.css';

interface EvidencePickerProps {
  open: boolean;
  onClose: () => void;
  caseFile: CaseFile;
  /** Evidence the detective has found, in the order it was found. */
  evidenceIds: readonly string[];
  /** The item currently attached to the next question. */
  selectedId: string | null;
  /** Items this suspect has already been shown. */
  shownIds?: readonly string[];
  /** Short name of the person across the table, for the notes. */
  suspectName: string;
  /** Called with an evidence id to attach it, or null to put the attached item away. */
  onPick: (id: string | null) => void;
}

/** Modal that lets the detective slide one piece of found evidence across the table. */
export function EvidencePicker({
  open,
  onClose,
  caseFile,
  evidenceIds,
  selectedId,
  shownIds = [],
  suspectName,
  onPick,
}: EvidencePickerProps) {
  const items = evidenceIds
    .map((id) => caseFile.evidence.find((e) => e.id === id))
    .filter((e): e is Evidence => e !== undefined);

  return (
    <Modal
      open={open}
      title="Show evidence"
      onClose={onClose}
      wide
      footer={
        <>
          {selectedId && (
            <Button variant="ghost" onClick={() => onPick(null)}>
              Put it away
            </Button>
          )}
          <Button onClick={onClose}>Done</Button>
        </>
      }
    >
      {items.length === 0 ? (
        <p className={styles.pickerEmpty}>Your evidence bag is empty. Search the scenes first.</p>
      ) : (
        <>
          <p className={styles.pickerIntro}>
            Pick one item to slide across the table with your next question. Watch how {suspectName} takes it.
          </p>
          <ul className={styles.pickerList} aria-label="Evidence you have found">
            {items.map((e) => {
              const selected = e.id === selectedId;
              const shown = shownIds.includes(e.id);
              return (
                <li key={e.id} className={styles.pickerItem}>
                  <div className={styles.pickerCard} data-testid={`pick-evidence-${e.id}`} data-selected={selected || undefined}>
                    <EvidenceCard
                      evidence={e}
                      caseFile={caseFile}
                      selected={selected}
                      onToggle={() => onPick(selected ? null : e.id)}
                    />
                  </div>
                  {(selected || shown) && (
                    <p className={`${styles.pickerNote} ${selected ? styles.pickerNoteSelected : ''}`}>
                      {selected ? 'On the table for your next question.' : `${suspectName} has seen this already.`}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Modal>
  );
}
