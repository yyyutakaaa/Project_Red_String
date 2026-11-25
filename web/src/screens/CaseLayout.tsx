import { useEffect, useMemo } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { Hud } from '../components/Hud.tsx';
import { ScreenFrame } from '../components/ScreenFrame.tsx';
import { ButtonLink } from '../components/Button.tsx';
import { casePath, resolveCase, type CaseContextValue } from '../hooks/useCase.ts';
import { startCaseClock, stopCaseClock, useGame, useProgress } from '../store/game.ts';
import { STORY_ORDER, isStoryUnlocked, isTutorial, type StoryCaseId } from '../engine/caseLoader.ts';
import { TutorialGuide } from '../onboarding/TutorialGuide.tsx';
import { continueSlot } from '../engine/save.ts';
import { track } from '../lib/telemetry.ts';
import { useLanguage, useT } from '../i18n/index.ts';

/** Wraps every /case/:caseKey/* screen: resolves the case, ensures progress exists, renders the HUD. */
export function CaseLayout() {
  const { caseKey = '' } = useParams();
  const { t, language } = useT();
  // The case in the player's language: a new object when the language changes, the same one otherwise.
  const casesLoaded = useLanguage((s) => s.cases);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- resolveCase reads the language store; re-run it when that changes
  const resolved = useMemo(() => resolveCase(caseKey), [caseKey, language, casesLoaded]);
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

  // Which case screen the player is on (rooms, room, suspects, interrogate, board, notebook, accuse, ending).
  // Only a change of screen counts, not every save of the progress.
  const [screen = null, screenTarget = null] = location.pathname.slice(casePath(caseKey).length).split('/').filter(Boolean);
  const hasProgress = Boolean(progress);
  useEffect(() => {
    if (!screen || !hasProgress || locked) return;
    track('screen', caseKey, { screen, target: screenTarget });
  }, [caseKey, screen, screenTarget, hasProgress, locked]);

  if (!resolved) {
    return (
      <ScreenFrame title={t('layout.notFound')} kicker={t('common.recordsOffice')}>
        <p>{t('layout.notFoundText')}</p>
        <ButtonLink to="/cases">{t('layout.backToCases')}</ButtonLink>
      </ScreenFrame>
    );
  }
  if (locked) {
    return (
      <ScreenFrame title={t('layout.sealed')} kicker={resolved.caseFile.title}>
        <p>{t('layout.sealedText')}</p>
        <ButtonLink to="/cases" variant="lamp">
          {t('layout.backToFiles')}
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
      {isTutorial(caseKey) && <TutorialGuide caseKey={caseKey} progress={progress} />}
    </>
  );
}
