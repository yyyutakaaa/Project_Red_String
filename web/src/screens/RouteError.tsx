import { useEffect } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { Button, ButtonLink } from '../components/Button.tsx';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import styles from './RouteError.module.css';

function describe(error: unknown): string | null {
  if (isRouteErrorResponse(error)) return `${error.status} ${error.statusText}`.trim();
  if (error instanceof Error) return error.message || error.name;
  if (typeof error === 'string') return error;
  return null;
}

/** Shown by the router when a screen fails to load or crashes while rendering. */
export function RouteError() {
  const error = useRouteError();
  const detail = describe(error);

  useEffect(() => {
    document.title = 'Could not open this file - Project Red String';
  }, []);

  return (
    <ScreenFrame title="Could not open this file" kicker="Records office">
      <p className={styles.lede}>
        The folder came apart in your hands. Maybe the rain got to it, maybe a page went missing on the way over. Your
        saved cases are still in the drawer.
      </p>
      <div className={styles.actions}>
        <Button variant="lamp" onClick={() => window.location.reload()} data-testid="route-error-reload">
          Reload
        </Button>
        {/* A full page load, so a broken screen does not come along for the ride. */}
        <ButtonLink to="/" reloadDocument variant="ghost" data-testid="route-error-menu">
          Main menu
        </ButtonLink>
      </div>
      {detail && (
        <details className={styles.details}>
          <summary>What the clerk wrote down</summary>
          <p className={styles.detailText}>{detail}</p>
        </details>
      )}
    </ScreenFrame>
  );
}
