import { useEffect, useId, useRef, type ReactNode } from 'react';
import styles from './Modal.module.css';
import { Button } from './Button.tsx';
import { t } from '../i18n/index.ts';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

/** Accessible modal built on the native <dialog> element (focus trap and Escape come for free). */
export function Modal({ open, title, onClose, children, footer, wide }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      try {
        d.showModal();
      } catch {
        d.setAttribute('open', '');
      }
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${wide ? styles.wide : ''}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <>
          <div className={styles.header}>
            <h2 id={titleId}>{title}</h2>
            <Button variant="ghost" size="small" onClick={onClose} aria-label={t('modal.close')}>
              {t('common.close')}
            </Button>
          </div>
          <div className={styles.body}>{children}</div>
          {footer && <div className={styles.footer}>{footer}</div>}
        </>
      )}
    </dialog>
  );
}
