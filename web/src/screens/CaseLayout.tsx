import { useEffect, useMemo } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { Hud } from '../components/Hud.tsx';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { ButtonLink } from '../components/Button.tsx';
import { casePath, resolveCase, type CaseContextValue } from '../hooks/useCase.ts';
import { startCaseClock, stopCaseClock, useGame, useProgress } from '../store/game.ts';
import { STORY_ORDER, isStoryUnlocked, type StoryCaseId } from '../engine/caseLoader.ts';
import { continueSlot } from '../engine/save.ts';

/** Wraps every /case/:caseKey/* screen: resolves the case, ensures progress exists, renders the HUD. */
export function CaseLayout() {
  const { caseKey = '' } = useParams();
  const resolved = useMemo(() => resolveCase(caseKey), [caseKey]);
  const ensureProgress = useGame((s) => s.ensureProgress);
  const slot = useGame((s) => s.slot);
  const progress = useProgress(resolved ? caseKey : undefined);
  const location = useLocation();

  // Story cases unlock in order: a sealed case cannot be opened by typing its URL.
  const storyIndex = resolved?.source === 'story' ? STORY_ORDER.indexOf(resolved.caseFile.id as StoryCaseId) : -1;
  const activeSlot = slot ?? continueSlot(useGame.getState().storage);
  const locked = storyIndex > 0 && !isStoryUnlocked(storyIndex, (id) => Boolean(activeSlot?.completions[id]));

  useEffect(() => {
    if (resolved && !progress && !locked) ensureProgress(caseKey, resolved.source);
  }, [resolved, progress, caseKey, ensureProgress, locked]);

  // The case clock runs while the case is open and not yet closed.
  const runId = progress?.runId;
  const closed = Boolean(progress?.accusation);
  useEffect(() => {
    if (!runId || closed || locked) return;
    startCaseClock(caseKey);
    return () => stopCaseClock();
  }, [caseKey, runId, closed, locked]);

  useEffect(() => {
    document.title = resolved ? `${resolved.caseFile.title} - Project Red String` : 'Project Red String';
  }, [resolved]);

  if (!resolved) {
    return (
      <ScreenFrame title="Case not found" kicker="Records office">
        <p>This case file is missing or could not be read.</p>
        <ButtonLink to="/cases">Back to cases</ButtonLink>
      </ScreenFrame>
    );
  }
  if (locked) {
    return (
      <ScreenFrame title="Case sealed" kicker={resolved.caseFile.title}>
        <p>This file stays sealed until you close the previous case.</p>
        <ButtonLink to="/cases" variant="lamp">
          Back to the case files
        </ButtonLink>
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
