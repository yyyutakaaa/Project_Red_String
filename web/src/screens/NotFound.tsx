import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { ButtonLink } from '../components/Button.tsx';

export function NotFound() {
  return (
    <ScreenFrame title="Wrong address" kicker="Dead end">
      <p className="muted">Nothing here but rain on the pavement.</p>
      <ButtonLink to="/" variant="lamp">
        Back to the main menu
      </ButtonLink>
    </ScreenFrame>
  );
}
