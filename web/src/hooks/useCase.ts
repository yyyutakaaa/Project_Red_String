import { useOutletContext } from 'react-router-dom';
import type { CaseFile } from '@shared/caseSchema.ts';
import { getStoryCase, parseCaseKey } from '../engine/caseLoader.ts';
import type { CaseProgress, CaseSource } from '../engine/types.ts';
import { localizedCase } from '../i18n/index.ts';

export interface ResolvedCase {
  caseFile: CaseFile;
  caseKey: string;
  source: CaseSource;
}

export interface CaseContextValue extends ResolvedCase {
  progress: CaseProgress;
}

export function resolveCase(caseKey: string): ResolvedCase | null {
  const { source, id } = parseCaseKey(caseKey);
  // Only the hand-written story cases exist. Keys of old generated cases in a save resolve to nothing.
  if (source !== 'story') return null;
  const caseFile = getStoryCase(id);
  // In the player's language; ids and rules are the same in every language.
  return caseFile ? { caseFile: localizedCase(caseFile), caseKey, source } : null;
}

/** Inside /case/:caseKey/* screens: the case file and the live progress for it. */
export function useCaseContext(): CaseContextValue {
  return useOutletContext<CaseContextValue>();
}

export function casePath(caseKey: string, sub = ''): string {
  return `/case/${encodeURIComponent(caseKey)}${sub ? `/${sub}` : ''}`;
}
