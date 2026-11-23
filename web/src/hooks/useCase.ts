import { useOutletContext } from 'react-router-dom';
import type { CaseFile } from '@shared/caseSchema.ts';
import { getStoryCase, parseCaseKey } from '../engine/caseLoader.ts';
import { getGeneratedCase } from '../engine/generatedCases.ts';
import type { CaseProgress, CaseSource } from '../engine/types.ts';
import { useGame } from '../store/game.ts';

export interface ResolvedCase {
  caseFile: CaseFile;
  caseKey: string;
  source: CaseSource;
  /** The generated_cases row id for AI-written cases, null for story cases. */
  generatedId: string | null;
}

export interface CaseContextValue extends ResolvedCase {
  progress: CaseProgress;
}

export function resolveCase(caseKey: string): ResolvedCase | null {
  const { source, id } = parseCaseKey(caseKey);
  if (source === 'story') {
    const caseFile = getStoryCase(id);
    return caseFile ? { caseFile, caseKey, source, generatedId: null } : null;
  }
  const stored = getGeneratedCase(useGame.getState().storage, id);
  return stored ? { caseFile: stored.caseFile, caseKey, source, generatedId: id } : null;
}

/** Inside /case/:caseKey/* screens: the case file and the live progress for it. */
export function useCaseContext(): CaseContextValue {
  return useOutletContext<CaseContextValue>();
}

export function casePath(caseKey: string, sub = ''): string {
  return `/case/${encodeURIComponent(caseKey)}${sub ? `/${sub}` : ''}`;
}
