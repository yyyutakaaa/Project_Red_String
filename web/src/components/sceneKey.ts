// Which scene to draw for a room.
//
// A case file gives every room a `background` key from a short fixed list (assetKeys.ts), so a
// train's dining car has to call itself "dining-room" and a chemist's shop "lobby". The drawing
// can do better than that: it also looks at the room's own name, its description and the case's
// setting, and picks a more specific scene when one fits. The case files stay as they are.
export interface ScenePlace {
  /** The room's name, e.g. "Dining car". */
  name: string;
  description?: string;
  /** The case's setting, e.g. "Mercer's Pharmacy on Calloway Street". */
  setting?: string;
}

const TRAIN = /train|sleeper|railway|railroad|limited|express|pullman|carriage/;

export function sceneKeyFor(background: string, place?: ScenePlace | null): string {
  if (!place) return background;
  const name = place.name.toLowerCase();
  const about = `${place.description ?? ''} ${place.setting ?? ''}`.toLowerCase();
  const onTrain = TRAIN.test(about) || /\bcar\b/.test(name);

  if (/dining car|restaurant car|buffet car/.test(name)) return 'dining-car';
  if (/lounge car|club car|observation car|bar car|smoking car/.test(name)) return 'lounge-car';
  if (/corridor|vestibule|passage/.test(name) && onTrain) return 'train-corridor';

  if (/dispensary/.test(name)) return 'dispensary';
  if (/surgery|consulting|clinic|infirmary|examination/.test(name)) return 'surgery';
  if (/pharmacy|chemist|drugstore|apothecary/.test(name)) return 'pharmacy';
  if (/\b(shop|store|counter)\b/.test(name) && /pharmac|chemist|drugstore|apothecar/.test(about)) return 'pharmacy';

  if (/gatehouse|watchman|sentry|guard ?house|guardroom/.test(name)) return 'gatehouse';
  if (/courtyard|quadrangle|\bquad\b/.test(name)) return /snow|frost|ice\b|winter/.test(about) ? 'courtyard-snow' : 'courtyard';
  if (/rare book|manuscript|special collection/.test(name)) return 'rare-books';
  if (/studio/.test(name) && /radio|broadcast|microphone|on air|station/.test(about)) return 'radio-studio';
  if (/ballroom|dance hall|dance floor/.test(name)) return 'ballroom';
  if (/laundry|wash ?house|linen room/.test(name)) return 'laundry';
  if (/tunnel|boiler|furnace/.test(name)) return 'boiler-room';
  if (/records room|record room|file room|strong ?room|deed room|muniment/.test(name)) return 'records-room';

  return background;
}
