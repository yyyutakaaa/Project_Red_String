import { useEffect, useMemo } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { Hud } from '../components/Hud.tsx';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { ButtonLink } from '../components/Button.tsx';
import { casePath, resolveCase, type CaseContextValue } from '../hooks/useCase.ts';
import { useGame, useProgress } from '../store/game.ts';

/** Wraps every /case/:caseKey/* screen: resolves the case, ensures progress exists, renders the HUD. */
export function CaseLayout() {
  const { caseKey = '' } = useParams();
  const resolved = useMemo(() => resolveCase(caseKey), [caseKey]);
  const ensureProgress = useGame((s) => s.ensureProgress);
  const progress = useProgress(resolved ? caseKey : undefined);
  const location = useLocation();

  useEffect(() => {
    if (resolved && !progress) ensureProgress(caseKey, resolved.source);
  }, [resolved, progress, caseKey, ensureProgress]);

  useEffect(() => {
    document.title = resolved ? `${resolved.caseFile.title} - Project Red String` : 'Project Red String';
  }, [resolved]);

  if (!resolved) {
    return (
      <ScreenFrame title="Case not found" kicker="Records office">
        <p>This case file is missing or could not be read. Generated cases live only on the device that created them.</p>
        <ButtonLink to="/cases">Back to cases</ButtonLink>
      </ScreenFrame>
    );
  }
  if (!progress) return null;

  const base = casePath(caseKey);
  if (location.pathname === base || location.pathname === `${base}/`) {
    return <Navigate to={casePath(caseKey, progress.briefingSeen ? 'rooms' : 'briefing')} replace />;
  }

  const ctx: CaseContextValue = { ...resolved, progress };
  return (
    <>
      <Hud caseFile={resolved.caseFile} caseKey={caseKey} progress={progress} />
      <Outlet context={ctx} />
    </>
  );
}
