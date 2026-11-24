import { useEffect, useId, useLayoutEffect, useRef } from 'react';
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
  const doneId = `${useId()}-done`;
  const opener = useRef<HTMLElement | null>(null);

  // Remember the control that opened the picker. A layout effect runs before the dialog takes focus.
  useLayoutEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    opener.current = active instanceof HTMLElement && active !== document.body ? active : null;
  }, [open]);

  // When the picker closes and focus was left nowhere, hand it back to that control.
  useEffect(() => {
    if (open) return;
    const trigger = opener.current;
    opener.current = null;
    if (!trigger?.isConnected) return;
    const active = document.activeElement;
    if (!active || active === document.body || active.closest('dialog:not([open])')) trigger.focus({ preventScroll: true });
  }, [open]);

  const pick = (id: string | null) => {
    onPick(id);
    // If the dialog stays open, keep the keyboard in it: on Done after choosing an item, or when the
    // focused control went away ("Put it away" disappears once nothing is attached).
    requestAnimationFrame(() => {
      const done = document.getElementById(doneId);
      if (!done) return;
      const active = document.activeElement;
      if (id !== null || !active || !done.closest('dialog')?.contains(active)) done.focus();
    });
  };

  return (
    <Modal
      open={open}
      title="Show evidence"
      onClose={onClose}
      wide
      footer={
        <>
          {selectedId && (
            <Button variant="ghost" onClick={() => pick(null)}>
              Put it away
            </Button>
          )}
          <Button id={doneId} onClick={onClose}>
            Done
          </Button>
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
                      onToggle={() => pick(selected ? null : e.id)}
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
