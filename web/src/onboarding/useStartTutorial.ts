import { useCallback } from 'react';
import { useLaunch } from '../boot/launch.ts';
import { TUTORIAL_ID } from '../engine/caseLoader.ts';
import { casePath, resolveCase } from '../hooks/useCase.ts';
import { useGame } from '../store/game.ts';
import { t } from '../i18n/index.ts';

/** Open the tutorial case: where the player left it, or from the start if it was finished. */
export function useStartTutorial() {
  const launch = useLaunch();
  return useCallback(() => {
    const game = useGame.getState();
    const slot = game.ensureActiveSlot();
    const progress = slot.progress[TUTORIAL_ID];
    if (!progress || progress.accusation) game.restartCase(TUTORIAL_ID, 'story');
    else game.setActiveCase(TUTORIAL_ID);
    const title = resolveCase(TUTORIAL_ID)?.caseFile.title ?? '';
    void launch(casePath(TUTORIAL_ID), { kicker: t('tutorial.kicker'), title });
  }, [launch]);
}
