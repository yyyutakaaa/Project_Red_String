// Asset keys understood by the web app's asset registry. Case authors and the case generator pick from
// these lists. Unknown keys still render (with a generic scene or silhouette), so they are not validator errors.

export const BACKGROUND_KEYS = [
  'dining-room',
  'study',
  'conservatory',
  'kitchen',
  'bedroom',
  'bathroom',
  'library',
  'hallway',
  'terrace',
  'garden',
  'stage',
  'bar',
  'office',
  'dressing-room',
  'alley',
  'lobby',
  'hotel-room',
  'warehouse',
  'dock',
  'archive',
  'cellar',
  'train-car',
] as const;

export const PORTRAIT_KEYS = [
  'man-hat',
  'man-bare',
  'man-glasses',
  'man-cap',
  'elder-man',
  'young-man',
  'woman-hat',
  'woman-bob',
  'woman-long',
  'woman-bun',
  'elder-woman',
  'young-woman',
] as const;

export type BackgroundKey = (typeof BACKGROUND_KEYS)[number];
export type PortraitKey = (typeof PORTRAIT_KEYS)[number];
