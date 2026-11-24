import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { ButtonLink } from '../components/Button.tsx';
import { useT } from '../i18n/index.ts';

export function NotFound() {
  const { t } = useT();
  return (
    <ScreenFrame title={t('notFound.title')} kicker={t('notFound.kicker')}>
      <p className="muted">{t('notFound.text')}</p>
      <ButtonLink to="/" variant="lamp">
        {t('notFound.back')}
      </ButtonLink>
    </ScreenFrame>
  );
}
