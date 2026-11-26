// Luna's remark: a small caption with her face in the corner of the case screens. It comes
// when she has something to say (store/partner.ts), stays long enough to read, and goes.
import { useEffect } from 'react';
import luna from '../assets/art/partner/luna.webp';
import { PARTNER_NAME } from '../engine/partner.ts';
import { usePartner } from '../store/partner.ts';
import { useT } from '../i18n/index.ts';
import styles from './PartnerBubble.module.css';

/** Long enough to read at a calm pace, never shorter than eight seconds. */
const readMs = (text: string) => Math.max(8000, 3000 + text.split(/\s+/).length * 450);

export function PartnerBubble({ caseKey }: { caseKey: string }) {
  const { t } = useT();
  const line = usePartner((s) => s.line);
  const dismiss = usePartner((s) => s.dismiss);
  const shown = line && line.caseKey === caseKey ? line : null;

  useEffect(() => {
    if (!shown) return;
    const id = shown.id;
    const timer = setTimeout(() => {
      if (usePartner.getState().line?.id === id) dismiss();
    }, readMs(shown.text));
    return () => clearTimeout(timer);
  }, [shown, dismiss]);

  return (
    <div className={styles.host} role="status" aria-live="polite">
      {shown && (
        <div key={shown.id} className={styles.bubble} data-testid="partner-line" data-kind={shown.kind}>
          <img className={styles.face} src={luna} alt="" width={52} height={52} />
          <p className={styles.text}>
            <span className={styles.name}>{PARTNER_NAME}</span>
            {shown.text}
          </p>
          <button type="button" className={styles.close} onClick={dismiss} aria-label={t('partner.dismiss')}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
