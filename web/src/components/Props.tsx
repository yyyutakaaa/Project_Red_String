// Prop silhouettes for the room scenes.
// Each prop is drawn in a normalised 100 x 100 box (the ground line is y = 100) and scaled into its hotspot
// rectangle. Props are dark silhouettes with lamp-coloured rim light so they sit inside the scene.
// The drawing is picked from the hotspot label: the last recognised noun wins ("Medicine cabinet" is a
// cabinet, "Brandy glass" is a glass), so hand-written and generated labels both land somewhere sensible.
// This file only exports plain functions (no components) so fast refresh stays happy.
import type { ReactElement, ReactNode } from 'react';
import styles from './RoomScene.module.css';
import { NS, halo, rim, stroke, type Draw, type PropPaint } from './propKit.tsx';
import { OBJECT_DRAW, type ObjectKind } from './PropsObjects.tsx';
import { FIXTURE_DRAW, VARIANT_DRAW, type FixtureKind } from './PropsFixtures.tsx';

export type { PropPaint } from './propKit.tsx';

export type PropKind =
  | 'desk'
  | 'cabinet'
  | 'glass'
  | 'decanter'
  | 'bottle'
  | 'letter'
  | 'coat'
  | 'window'
  | 'door'
  | 'painting'
  | 'piano'
  | 'phone'
  | 'bed'
  | 'bookshelf'
  | 'fireplace'
  | 'plant'
  | 'chair'
  | 'sofa'
  | 'case'
  | 'safe'
  | 'lamp'
  | 'mirror'
  | 'typewriter'
  | 'barrel'
  | 'crate'
  | 'book'
  | 'stairs'
  | 'sink'
  | 'bathtub'
  | 'table'
  | 'counter'
  | 'clock'
  | 'gramophone'
  | 'microphone'
  | 'rope'
  | 'hat'
  | 'bin'
  | 'rug'
  | 'ashtray'
  | 'gun'
  | 'knife'
  | 'key'
  | 'vase'
  | 'umbrella'
  | 'radio'
  | 'curtain'
  | 'candle'
  | 'item'
  // the second library: PropsObjects.tsx and PropsFixtures.tsx
  | ObjectKind
  | FixtureKind;

/** A rectangle in scene units (the scene viewBox is 1000 x 600). */
export interface PropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PropLight {
  x: number;
  y: number;
  kind: 'lamp' | 'fire' | 'candle';
  /** Rough size of the glow in scene units. */
  radius: number;
}

export interface PropInfo {
  kind: PropKind;
  variant: string;
  /** The preserveAspectRatio used to fit the 100 x 100 drawing into the box. */
  fit: string;
  /** Where the drawing actually lands, in scene units. */
  drawn: PropBox;
  light: PropLight | null;
}

export interface PropRenderOptions {
  label: string;
  box: PropBox;
  paint: PropPaint;
  /** Mirror the drawing so the rim light faces a lamp on the left. */
  flip?: boolean;
  animated?: boolean;
  seed?: number;
}

// ---------------------------------------------------------------------------
// Small deterministic helpers (also used by the scene)

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32: a tiny seeded random generator, so every scene draws the same way each time. */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One path of slanted rain streaks that tiles vertically every `period` units (for a looping fall). */
export function rainPath(r: () => number, width: number, height: number, count: number, period: number, length: number): string {
  const drops: Array<[number, number, number]> = [];
  for (let i = 0; i < count; i++) drops.push([r() * width, r() * period, length * (0.5 + r())]);
  const tiles = Math.ceil(height / period) + 1;
  let d = '';
  for (let k = -1; k < tiles; k++) {
    for (const [x, y, l] of drops) {
      d += `M${x.toFixed(1)} ${(y + k * period).toFixed(1)}l${(-l * 0.16).toFixed(1)} ${l.toFixed(1)}`;
    }
  }
  return d;
}

// ---------------------------------------------------------------------------
// Label matching

const WORDS: Record<string, PropKind> = {
  desk: 'desk', bureau: 'desk', escritoire: 'desk', secretaire: 'desk', lectern: 'desk', podium: 'desk',
  cabinet: 'cabinet', cupboard: 'cabinet', wardrobe: 'cabinet', armoire: 'cabinet', dresser: 'cabinet',
  drawer: 'cabinet', locker: 'cabinet', sideboard: 'cabinet', closet: 'cabinet', dumbwaiter: 'cabinet',
  glass: 'glass', tumbler: 'glass', snifter: 'glass', goblet: 'glass', cup: 'glass', teacup: 'glass',
  mug: 'glass', wineglass: 'glass', flute: 'glass', chalice: 'glass', cocktail: 'glass', coupe: 'glass',
  decanter: 'decanter', carafe: 'decanter', jug: 'decanter', pitcher: 'decanter', flask: 'decanter',
  teapot: 'decanter', siphon: 'decanter', kettle: 'decanter', shaker: 'decanter',
  bottle: 'bottle', vial: 'bottle', phial: 'bottle', medicine: 'bottle', poison: 'bottle', magnum: 'bottle',
  tonic: 'bottle', drop: 'bottle', perfume: 'bottle', inkwell: 'bottle', digitalis: 'bottle', laudanum: 'bottle',
  whisky: 'bottle', whiskey: 'bottle', gin: 'bottle', wine: 'bottle', champagne: 'bottle', bourbon: 'bottle',
  rum: 'bottle',
  letter: 'letter', envelope: 'letter', note: 'letter', telegram: 'letter', newspaper: 'letter', paper: 'letter',
  document: 'letter', will: 'letter', codicil: 'letter', receipt: 'letter', ticket: 'letter', card: 'letter',
  memo: 'letter', page: 'letter', pad: 'letter', notepad: 'letter', invoice: 'letter', bill: 'letter',
  contract: 'letter', deed: 'letter', postcard: 'letter', blotter: 'letter', file: 'letter', folder: 'letter',
  dossier: 'letter', cheque: 'letter', stub: 'letter', programme: 'letter', program: 'letter', menu: 'letter',
  clipping: 'letter', scrap: 'letter', telex: 'letter', wire: 'letter', script: 'letter', sheet: 'letter',
  coat: 'coat', overcoat: 'coat', raincoat: 'coat', jacket: 'coat', mackintosh: 'coat', trenchcoat: 'coat',
  cloak: 'coat', scarf: 'coat', shawl: 'coat', costume: 'coat', dress: 'coat', gown: 'coat', uniform: 'coat',
  window: 'window', skylight: 'window', porthole: 'window', pane: 'window', roof: 'window', shutter: 'window',
  blind: 'window', casement: 'window', windowsill: 'window', sill: 'window',
  door: 'door', doorway: 'door', gate: 'door', hatch: 'door', trapdoor: 'door', entrance: 'door', exit: 'door',
  painting: 'painting', portrait: 'painting', picture: 'painting', photograph: 'painting', photo: 'painting',
  frame: 'painting', poster: 'painting', map: 'painting', chart: 'painting', calendar: 'painting',
  notice: 'painting', noticeboard: 'painting', canvas: 'painting', print: 'painting', sketch: 'painting',
  mural: 'painting', certificate: 'painting', diploma: 'painting', board: 'painting', blackboard: 'painting',
  piano: 'piano', pianola: 'piano', organ: 'piano', harpsichord: 'piano',
  telephone: 'phone', phone: 'phone', receiver: 'phone',
  bed: 'bed', cot: 'bed', bunk: 'bed', berth: 'bed', mattress: 'bed', bedstead: 'bed', hammock: 'bed',
  bookshelf: 'bookshelf', bookcase: 'bookshelf', shelf: 'bookshelf', shelving: 'bookshelf', rack: 'bookshelf',
  fireplace: 'fireplace', hearth: 'fireplace', mantel: 'fireplace', mantelpiece: 'fireplace', grate: 'fireplace',
  fire: 'fireplace', stove: 'fireplace', range: 'fireplace', oven: 'fireplace',
  brazier: 'fireplace', incinerator: 'fireplace',
  planter: 'plant', plant: 'plant', fern: 'plant', palm: 'plant', pot: 'plant', orchid: 'plant', tree: 'plant',
  shrub: 'plant', bush: 'plant', hedge: 'plant', aspidistra: 'plant', flowerbed: 'plant', rosebush: 'plant',
  ivy: 'plant', topiary: 'plant', foxglove: 'plant', seedling: 'plant',
  chair: 'chair', armchair: 'chair', seat: 'chair', stool: 'chair', bench: 'chair', throne: 'chair',
  recliner: 'chair', rocker: 'chair', pew: 'chair',
  sofa: 'sofa', couch: 'sofa', settee: 'sofa', chaise: 'sofa', divan: 'sofa', chesterfield: 'sofa',
  loveseat: 'sofa', ottoman: 'sofa', banquette: 'sofa', booth: 'sofa',
  trunk: 'case', suitcase: 'case', briefcase: 'case', valise: 'case', satchel: 'case', bag: 'case',
  handbag: 'case', purse: 'case', luggage: 'case', chest: 'case', case: 'case', holdall: 'case',
  attache: 'case', portmanteau: 'case', carpetbag: 'case', footlocker: 'case',
  safe: 'safe', strongbox: 'safe', vault: 'safe', lockbox: 'safe', cashbox: 'safe',
  lamp: 'lamp', lampshade: 'lamp', lantern: 'lamp', sconce: 'lamp', chandelier: 'lamp', lamppost: 'lamp',
  streetlamp: 'lamp', streetlight: 'lamp', light: 'lamp', torch: 'lamp', flashlight: 'lamp', spotlight: 'lamp',
  mirror: 'mirror', vanity: 'mirror',
  typewriter: 'typewriter',
  barrel: 'barrel', cask: 'barrel', keg: 'barrel', drum: 'barrel', vat: 'barrel', hogshead: 'barrel',
  crate: 'crate', box: 'crate', carton: 'crate', parcel: 'crate', package: 'crate', pallet: 'crate',
  ledger: 'book', book: 'book', diary: 'book', journal: 'book', notebook: 'book', register: 'book',
  logbook: 'book', log: 'book', album: 'book', scrapbook: 'book', bible: 'book', account: 'book',
  guestbook: 'book', manifest: 'book', record: 'book', almanac: 'book', novel: 'book',
  psalter: 'book', hymnal: 'book', missal: 'book', volume: 'book', tome: 'book',
  stair: 'stairs', staircase: 'stairs', stairway: 'stairs', step: 'stairs', stairwell: 'stairs',
  banister: 'stairs', landing: 'stairs', gangway: 'stairs', gangplank: 'stairs',
  sink: 'sink', basin: 'sink', washbasin: 'sink', washstand: 'sink', tap: 'sink', faucet: 'sink',
  bath: 'bathtub', bathtub: 'bathtub', tub: 'bathtub', shower: 'bathtub',
  table: 'table', nightstand: 'table', workbench: 'table', altar: 'table',
  buffet: 'table', worktop: 'table',
  counter: 'counter', bar: 'counter', till: 'counter', reception: 'counter', kiosk: 'counter',
  clock: 'clock', timepiece: 'clock', watch: 'clock', stopwatch: 'clock', dial: 'clock', wristwatch: 'clock',
  gramophone: 'gramophone', phonograph: 'gramophone', jukebox: 'gramophone', turntable: 'gramophone',
  microphone: 'microphone', mic: 'microphone',
  rope: 'rope', cord: 'rope', noose: 'rope', cable: 'rope', chain: 'rope', hawser: 'rope', mooring: 'rope',
  hook: 'rope', flex: 'rope',
  hat: 'hat', fedora: 'hat', cap: 'hat', bowler: 'hat', trilby: 'hat', homburg: 'hat', bonnet: 'hat', beret: 'hat',
  bin: 'bin', basket: 'bin', wastebasket: 'bin', wastepaper: 'bin', bucket: 'bin', can: 'bin', hamper: 'bin',
  pail: 'bin', dustbin: 'bin', trashcan: 'bin', ashcan: 'bin',
  rug: 'rug', carpet: 'rug', mat: 'rug', doormat: 'rug', runner: 'rug',
  ashtray: 'ashtray', cigar: 'ashtray', cigarette: 'ashtray', butt: 'ashtray', ash: 'ashtray', match: 'ashtray',
  matchbook: 'ashtray', lighter: 'ashtray',
  gun: 'gun', revolver: 'gun', pistol: 'gun', rifle: 'gun', shotgun: 'gun', derringer: 'gun', firearm: 'gun',
  holster: 'gun', bullet: 'gun', cartridge: 'gun', casing: 'gun',
  knife: 'knife', knives: 'knife', dagger: 'knife', blade: 'knife', razor: 'knife', opener: 'knife',
  scissors: 'knife', poker: 'knife', cleaver: 'knife', scalpel: 'knife', sword: 'knife',
  key: 'key', keyring: 'key', padlock: 'key', lock: 'key',
  vase: 'vase', urn: 'vase', flower: 'vase', bouquet: 'vase', rose: 'vase', lily: 'vase', lilies: 'vase', wreath: 'vase',
  umbrella: 'umbrella', parasol: 'umbrella', cane: 'umbrella', stick: 'umbrella',
  radio: 'radio', wireless: 'radio', transmitter: 'radio',
  curtain: 'curtain', drape: 'curtain', drapery: 'curtain', tapestry: 'curtain', screen: 'curtain',
  candle: 'candle', candlestick: 'candle', candelabra: 'candle', candelabrum: 'candle',

  // ---- the second library ----
  // paper that used to be a nameless item
  statement: 'letter', affidavit: 'letter', testimony: 'letter', confession: 'letter', sighting: 'letter',
  summary: 'letter', report: 'letter', form: 'letter', list: 'letter', inventory: 'letter', schedule: 'letter',
  slip: 'letter', chit: 'letter', iou: 'letter', carbon: 'letter', demand: 'letter', policy: 'letter',
  warrant: 'letter', licence: 'letter', license: 'letter', passport: 'letter', prescription: 'letter',
  tape: 'letter', spike: 'letter', invitation: 'letter', bond: 'letter',
  directory: 'painting',
  // things you wear and carry
  shoe: 'shoes', slipper: 'shoes', boot: 'shoes', heel: 'shoes', pump: 'shoes', sandal: 'shoes', galosh: 'shoes',
  glove: 'glove', gloves: 'glove', mitten: 'glove', gauntlet: 'glove',
  earring: 'jewel', cufflink: 'jewel', ring: 'jewel', necklace: 'jewel', bracelet: 'jewel', brooch: 'jewel',
  pearl: 'jewel', jewel: 'jewel', jewelry: 'jewel', jewellery: 'jewel', diamond: 'jewel', locket: 'jewel',
  pendant: 'jewel', tiepin: 'jewel', gem: 'jewel', ruby: 'jewel', emerald: 'jewel', tiara: 'jewel',
  wallet: 'wallet', billfold: 'wallet', pocketbook: 'wallet',
  spectacles: 'spectacles', eyeglasses: 'spectacles', monocle: 'spectacles', lorgnette: 'spectacles',
  handkerchief: 'cloth', hanky: 'cloth', napkin: 'cloth', rag: 'cloth', towel: 'cloth', bandage: 'cloth',
  cloth: 'cloth', tablecloth: 'cloth', apron: 'cloth',
  lipstick: 'cosmetic', compact: 'cosmetic', powder: 'cosmetic', rouge: 'cosmetic', comb: 'cosmetic',
  hairbrush: 'cosmetic', mascara: 'cosmetic',
  pipe: 'pipe', meerschaum: 'pipe',
  // money and marks
  money: 'money', cash: 'money', banknote: 'money', dollar: 'money', wad: 'money', bankroll: 'money',
  coin: 'money', chip: 'money', ransom: 'money', winnings: 'money',
  tag: 'tag', label: 'tag', badge: 'tag', medal: 'tag', token: 'tag', shield: 'tag',
  // weapons, tools, traces
  mallet: 'mallet', gavel: 'mallet', club: 'mallet', bat: 'mallet', truncheon: 'mallet', cosh: 'mallet',
  wrench: 'tool', spanner: 'tool', crowbar: 'tool', jemmy: 'tool', shovel: 'tool', spade: 'tool', axe: 'tool',
  hatchet: 'tool', hammer: 'tool', pliers: 'tool', screwdriver: 'tool', chisel: 'tool', pickaxe: 'tool', tool: 'tool',
  handcuffs: 'handcuffs', handcuff: 'handcuffs', cuffs: 'handcuffs', manacle: 'handcuffs', shackle: 'handcuffs',
  footprint: 'footprints', footstep: 'footprints', track: 'footprints', bootprint: 'footprints', trail: 'footprints',
  stain: 'stain', blood: 'stain', bloodstain: 'stain', spill: 'stain', smear: 'stain', outline: 'stain', scorch: 'stain',
  fingerprint: 'fingerprint', thumbprint: 'fingerprint', dabs: 'fingerprint',
  statuette: 'statuette', statue: 'statuette', bust: 'statuette', figurine: 'statuette', trophy: 'statuette',
  paperweight: 'statuette', bookend: 'statuette', idol: 'statuette', sculpture: 'statuette', ornament: 'statuette',
  // the detective's and the doctor's kit
  magnifier: 'magnifier', loupe: 'magnifier', lens: 'magnifier',
  binoculars: 'binoculars', binocular: 'binoculars', telescope: 'binoculars', spyglass: 'binoculars',
  camera: 'camera',
  syringe: 'medical', needle: 'medical', hypodermic: 'medical', pill: 'medical', tablet: 'medical',
  capsule: 'medical', stethoscope: 'medical', thermometer: 'medical',
  scale: 'scale', scales: 'scale', balance: 'scale', mortar: 'scale', pestle: 'scale',
  // music, games, pictures
  trumpet: 'instrument', horn: 'instrument', saxophone: 'instrument', sax: 'instrument', cornet: 'instrument',
  trombone: 'instrument', clarinet: 'instrument', violin: 'instrument', cello: 'instrument', fiddle: 'instrument',
  bass: 'instrument', guitar: 'instrument', banjo: 'instrument', snare: 'instrument', drums: 'instrument',
  cymbal: 'instrument',
  dice: 'cards', die: 'cards', domino: 'cards', ace: 'cards',
  snapshot: 'photo', negative: 'photo', polaroid: 'photo', photostat: 'photo',
  reel: 'reel', film: 'reel', spool: 'reel',
  sleeve: 'sleeve', disc: 'sleeve', disk: 'sleeve',
  press: 'press', vise: 'press', vice: 'press', clamp: 'press',
  // the harbour
  anchor: 'nautical', buoy: 'nautical', lifebuoy: 'nautical', lifebelt: 'nautical', helm: 'nautical', wheel: 'nautical',
  // bigger things in a room
  sack: 'sack', bait: 'sack', grain: 'sack', flour: 'sack',
  bell: 'bell', buzzer: 'bell', gong: 'bell', chime: 'bell', doorbell: 'bell',
  ladder: 'ladder', stepladder: 'ladder',
  tray: 'tray', salver: 'tray',
  bicycle: 'bicycle', bike: 'bicycle', cycle: 'bicycle', tricycle: 'bicycle',
  elevator: 'elevator', lift: 'elevator',
  bandstand: 'bandstand', dais: 'bandstand', rostrum: 'bandstand',
  grating: 'grating', grille: 'grating', grill: 'grating', drain: 'grating', vent: 'grating', manhole: 'grating',
  reed: 'reeds', rushes: 'reeds', cattail: 'reeds', bulrush: 'reeds',
  pond: 'pond', pool: 'pond', fountain: 'pond', birdbath: 'pond',
  soda: 'fountain',
  wall: 'wall', brick: 'wall', brickwork: 'wall', masonry: 'wall',
  boiler: 'boiler', furnace: 'boiler',
  switchboard: 'switchboard', exchange: 'switchboard',
  keyboard: 'keyrack', keyrack: 'keyrack',
  cart: 'cart', trolley: 'cart', barrow: 'cart', wheelbarrow: 'cart',
  icebox: 'icebox', refrigerator: 'icebox', fridge: 'icebox', freezer: 'icebox',
};

const PAIRS: Record<string, PropKind> = {
  'record player': 'gramophone',
  'looking glass': 'mirror',
  'coat stand': 'coat',
  'hat stand': 'coat',
  'coat rack': 'coat',
  'hat rack': 'coat',
  'coat hook': 'coat',
  'letter opener': 'knife',
  'dressing table': 'mirror',
  'cash register': 'counter',
  'top hat': 'hat',
  'walking stick': 'umbrella',
  'umbrella stand': 'umbrella',
  'flower bed': 'plant',
  'flower pot': 'plant',
  'night stand': 'table',
  'fire escape': 'stairs',
  'fire place': 'fireplace',
  'wine rack': 'bookshelf',
  'tea chest': 'crate',
  'phone book': 'book',
  'telephone book': 'book',
  'ice bucket': 'bin',
  'waste basket': 'bin',
  'cigarette case': 'case',
  'cigar box': 'ashtray',
  'match box': 'ashtray',
  'glass case': 'cabinet',
  'display case': 'cabinet',
  'book case': 'bookshelf',

  // ---- the second library ----
  'key board': 'keyrack',
  'key rack': 'keyrack',
  'key cabinet': 'keyrack',
  'ice box': 'icebox',
  'soda fountain': 'fountain',
  'lily pond': 'pond',
  'music stand': 'musicstand',
  'script stand': 'musicstand',
  'sheet music': 'musicstand',
  'control booth': 'booth',
  'projection booth': 'booth',
  'sound booth': 'booth',
  'croquet rack': 'mallet',
  'mallet rack': 'mallet',
  'camera case': 'camera',
  'cable reel': 'rope',
  'cash box': 'crate',
  'cufflink box': 'jewel',
  'jewel box': 'jewel',
  'jewelry box': 'jewel',
  'jewellery box': 'jewel',
  'ring box': 'jewel',
  'trinket box': 'jewel',
  'playing cards': 'cards',
  'playing card': 'cards',
  'magnifying glass': 'magnifier',
  'opera glasses': 'binoculars',
  'field glasses': 'binoculars',
  'reading glasses': 'spectacles',
  'fire bucket': 'bin',
  'chalk outline': 'stain',
  'pocket watch': 'clock',
  'pill box': 'medical',
  'pill bottle': 'medical',
};

function singular(w: string): string {
  if (w.length > 4 && w.endsWith('ves')) return `${w.slice(0, -3)}f`;
  if (w.length > 4 && /(ches|shes|xes|sses)$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

function tokens(label: string): string[] {
  return label
    .toLowerCase()
    .replace(/[^a-z\s-]/g, ' ')
    .replace(/-/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** Pick a prop drawing for a hotspot label. Unknown labels fall back to a generic item. */
export function propKindFor(label: string): PropKind {
  const t = tokens(label);
  for (let i = t.length - 1; i >= 0; i--) {
    const w = t[i]!;
    const prev = i > 0 ? t[i - 1] : undefined;
    if (prev) {
      const pair = PAIRS[`${prev} ${w}`] ?? PAIRS[`${prev} ${singular(w)}`];
      if (pair) return pair;
    }
    const kind = WORDS[w] ?? WORDS[singular(w)];
    if (kind) return kind;
  }
  return 'item';
}

function variantFor(kind: PropKind, l: string, box: PropBox): string {
  const tall = box.h > box.w * 1.5;
  switch (kind) {
    case 'chair':
      if (/bench|pew|settle/.test(l)) return 'bench';
      if (/wicker|cane|rattan/.test(l)) return 'wicker';
      if (/stool/.test(l)) return 'stool';
      if (/arm|easy|club|wing|lounge|recliner|leather|reading/.test(l)) return 'arm';
      return 'side';
    case 'lamp':
      if (/chandelier/.test(l)) return 'chandelier';
      if (/street|post|gas/.test(l)) return 'street';
      if (/floor|standard|standing/.test(l)) return 'floor';
      if (/desk|banker|reading|green/.test(l)) return 'banker';
      if (/lantern|oil|hurricane|torch|flashlight/.test(l)) return 'lantern';
      return tall && box.h > 200 ? 'floor' : 'table';
    case 'clock':
      if (/dial/.test(l)) return 'dial';
      if (/pocket|watch|stopwatch|wrist/.test(l)) return 'pocket';
      return tall || /grandfather|hall|long|tall|longcase/.test(l) ? 'tall' : 'wall';
    case 'table':
      if (/dining|banquet|dinner|supper/.test(l)) return 'dining';
      if (/potting|work|kitchen|garden|bench/.test(l)) return 'work';
      if (/card|cribbage|poker|games|round|side|bedside|night|tea|coffee|occasional|phone|telephone/.test(l)) return 'round';
      return 'plain';
    case 'case':
      if (/\bbag\b|satchel|purse|handbag|holdall|carpetbag/.test(l)) return 'bag';
      if (/trunk|chest|steamer|footlocker/.test(l)) return 'trunk';
      if (/suitcase|valise|luggage|portmanteau|holdall/.test(l)) return 'suitcase';
      return 'brief';
    case 'painting':
      if (/directory/.test(l)) return 'directory';
      if (/map|chart|plan/.test(l)) return 'map';
      if (/poster|notice|calendar|bill|board|certificate|diploma/.test(l)) return 'notice';
      if (/landscape|sea|ship|seascape|harbor|harbour|river|view/.test(l)) return 'landscape';
      return 'portrait';
    case 'fireplace':
      return /stove|range|oven|boiler|furnace|incinerator/.test(l) ? 'stove' : 'hearth';
    case 'cabinet':
      if (/drawer/.test(l)) return 'drawer';
      if (/medicine|bathroom|glass|display|curio|china|vitrine/.test(l)) return 'glazed';
      if (/filing|file|card/.test(l)) return 'filing';
      return 'plain';
    case 'letter':
      if (/torn|ripped|burnt|burned|charred|scrap|half/.test(l)) return 'torn';
      if (/crumpled|balled|screwed/.test(l)) return 'crumpled';
      if (/newspaper|gazette|times|herald|clipping/.test(l)) return 'news';
      if (/telegram|telex|\bwire\b/.test(l)) return 'telegram';
      if (/ticket|stub/.test(l)) return 'ticket';
      if (/\btape\b/.test(l)) return 'tape';
      if (/envelope/.test(l)) return 'envelope';
      if (/blotter/.test(l)) return 'blotter';
      if (/spike/.test(l)) return 'spike';
      if (/passport/.test(l)) return 'passport';
      if (/folder|dossier|\bfile\b/.test(l)) return 'folder';
      if (/policy|deed|certificate|warrant|licen[cs]e|\bbond\b/.test(l)) return 'policy';
      if (/statement|affidavit|testimony|confession|sighting|report|summary|\bform\b/.test(l)) return 'form';
      if (/\blist\b|inventory|schedule|roster/.test(l)) return 'list';
      if (/slip|chit|iou|receipt|carbon|cheque|invoice|prescription/.test(l)) return 'slip';
      if (/pages?\b|sheets\b|leaves/.test(l)) return 'pages';
      if (/program|programme|menu|\bcard\b|invitation/.test(l)) return 'card';
      if (/note|pad|memo|postcard/.test(l)) return 'note';
      return 'letter';
    case 'book':
      if (/psalter|bible|hymnal|missal|volume\b|tome|novel|pocket|prayer/.test(l)) return 'closed';
      if (/books|stack|pile|volumes|cradle/.test(l)) return 'stack';
      return 'open';
    case 'crate':
      if (/cash|money|petty|strong/.test(l)) return 'cashbox';
      if (/parcel|package/.test(l)) return 'parcel';
      return /box|carton/.test(l) ? 'box' : 'crate';
    case 'bottle':
      if (/champagne|magnum/.test(l)) return 'champagne';
      return /vial|phial|medicine|pill|poison|tonic|drop|perfume|ink|digitalis|laudanum|syringe/.test(l) ? 'vial' : 'wine';
    case 'window':
      if (/barred|\bbars\b|grille/.test(l)) return 'barred';
      if (/ticket|booking|dispensary|teller|cashier|\bpay\b/.test(l)) return 'ticket';
      if (/porthole/.test(l)) return 'porthole';
      if (/roof|sky/.test(l)) return 'roof';
      return 'sash';
    case 'mirror':
      if (/vanity|dressing/.test(l)) return 'vanity';
      return box.w > box.h * 1.3 ? 'wide' : 'oval';
    case 'plant':
      return /fern|ivy|foxglove/.test(l) ? 'fern' : 'palm';
    case 'phone':
      if (/wall/.test(l)) return 'wall';
      return box.h > box.w * 1.15 ? 'table' : 'desk';
    case 'bin':
      return /bucket|pail/.test(l) && !/ice/.test(l) ? 'bucket' : '';
    case 'rope':
      if (/hook/.test(l)) return 'hooks';
      if (/chain/.test(l)) return 'chain';
      if (/cable|cord|flex|\blead\b/.test(l)) return 'cable';
      return '';
    case 'door':
      if (/hatch|serving/.test(l)) return 'hatch';
      if (/revolving/.test(l)) return 'revolving';
      return '';
    case 'gun':
      return /bullet|cartridge|casing|shell/.test(l) ? 'bullet' : '';
    // ---- the second library ----
    case 'jewel':
      if (/\bbox\b|case/.test(l)) return 'box';
      if (/earring|pendant|\bdrop\b|brooch|locket/.test(l)) return 'earring';
      if (/cufflink|tiepin/.test(l)) return 'cufflink';
      if (/necklace|pearls|bracelet|tiara/.test(l)) return 'necklace';
      if (/\bring\b|diamond|gem|ruby|emerald/.test(l)) return 'ring';
      return 'earring';
    case 'mallet':
      return /rack|stand|\bset\b/.test(l) ? 'rack' : '';
    case 'tag':
      if (/badge|shield|medal/.test(l)) return 'badge';
      return /coin|token/.test(l) ? 'coin' : '';
    case 'money':
      if (/coin|change|silver/.test(l)) return 'coins';
      return /chip/.test(l) ? 'chips' : '';
    case 'tool':
      if (/crowbar|jemmy|\bbar\b/.test(l)) return 'crowbar';
      if (/shovel|spade/.test(l)) return 'shovel';
      if (/axe|hatchet/.test(l)) return 'axe';
      if (/hammer/.test(l)) return 'hammer';
      return 'wrench';
    case 'instrument':
      if (/violin|cello|fiddle|bass|guitar|banjo/.test(l)) return 'violin';
      return /drum|snare|cymbal/.test(l) ? 'drum' : 'horn';
    case 'cards':
      return /dice|\bdie\b|domino/.test(l) ? 'dice' : '';
    case 'medical':
      if (/pill|tablet|capsule/.test(l)) return 'pills';
      return /stethoscope/.test(l) ? 'stethoscope' : 'syringe';
    case 'statuette':
      return /trophy|\bcup\b|prize/.test(l) ? 'trophy' : 'bust';
    case 'scale':
      return /mortar|pestle/.test(l) ? 'mortar' : 'balance';
    case 'nautical':
      if (/buoy|lifebelt/.test(l)) return 'buoy';
      return /wheel|helm/.test(l) ? 'wheel' : 'anchor';
    case 'cosmetic':
      return /compact|powder|rouge/.test(l) ? 'compact' : 'lipstick';
    case 'stain':
      return /outline|chalk/.test(l) ? 'outline' : 'blood';
    case 'cart':
      return /trolley|drinks|\btea\b|serving|dessert/.test(l) ? 'trolley' : 'linen';
    case 'tray':
      if (/champagne|glass|drinks|cocktail/.test(l)) return 'glasses';
      return /silver|salver|\bcard\b|calling/.test(l) ? 'silver' : 'letter';
    default:
      return '';
  }
}

const STRETCH = new Set<PropKind>([
  'desk',
  'cabinet',
  'door',
  'painting',
  'bed',
  'bookshelf',
  'fireplace',
  'stairs',
  'table',
  'rug',
  'counter',
  'curtain',
  'sofa',
  'elevator',
  'bandstand',
  'grating',
  'pond',
  'fountain',
  'wall',
  'keyrack',
  'icebox',
  'booth',
]);

/** Things that lie on a table rather than stand on the floor: drawn around the middle of the box. */
const LYING = new Set<PropKind>([
  'letter',
  'key',
  'gun',
  'knife',
  'glove',
  'jewel',
  'wallet',
  'photo',
  'footprints',
  'sleeve',
  'tag',
  'money',
  'spectacles',
  'tool',
  'cards',
  'handcuffs',
  'magnifier',
  'medical',
  'pipe',
  'reel',
  'nautical',
  'cloth',
  'stain',
  'fingerprint',
]);

function fitFor(kind: PropKind, variant: string): string {
  if (STRETCH.has(kind)) return 'none';
  if (kind === 'window') return variant === 'porthole' ? 'xMidYMid meet' : 'none';
  if (kind === 'clock') return variant === 'tall' ? 'none' : 'xMidYMid meet';
  if (kind === 'mirror') return variant === 'oval' ? 'xMidYMid meet' : 'none';
  if (kind === 'lamp' && variant === 'chandelier') return 'xMidYMin meet';
  if (kind === 'tool' && variant === 'shovel') return 'xMidYMax meet';
  if (kind === 'instrument') return variant === 'drum' ? 'xMidYMax meet' : 'xMidYMid meet';
  if (kind === 'medical' && variant === 'pills') return 'xMidYMax meet';
  if (kind === 'rope' && variant === 'hooks') return 'xMidYMin meet';
  if (LYING.has(kind)) return 'xMidYMid meet';
  return 'xMidYMax meet';
}

/** Where light-emitting props glow from, in the 100 x 100 drawing box. */
function emitterFor(kind: PropKind, variant: string): [number, number, PropLight['kind'], number] | null {
  if (kind === 'lamp') {
    const at: Record<string, [number, number]> = {
      table: [50, 26],
      floor: [50, 10],
      banker: [50, 40],
      street: [50, 16],
      lantern: [50, 52],
      chandelier: [50, 46],
    };
    const p = at[variant] ?? [50, 26];
    return [p[0], p[1], 'lamp', 1];
  }
  if (kind === 'fireplace') return variant === 'stove' ? [42, 70, 'fire', 0.6] : [50, 84, 'fire', 1];
  if (kind === 'candle') return [50, 22, 'candle', 0.5];
  return null;
}

/** Resolve the drawing, variant, fitted rectangle and any light a prop gives off. */
export function describeProp(label: string, box: PropBox): PropInfo {
  const kind = propKindFor(label);
  const variant = variantFor(kind, label.toLowerCase(), box);
  const fit = fitFor(kind, variant);
  let sx: number;
  let sy: number;
  let ox: number;
  let oy: number;
  if (fit === 'none') {
    sx = box.w / 100;
    sy = box.h / 100;
    ox = box.x;
    oy = box.y;
  } else {
    const s = Math.min(box.w, box.h) / 100;
    sx = s;
    sy = s;
    ox = box.x + (box.w - 100 * s) / 2;
    oy = fit.includes('YMax') ? box.y + box.h - 100 * s : fit.includes('YMin') ? box.y : box.y + (box.h - 100 * s) / 2;
  }
  const em = emitterFor(kind, variant);
  const size = Math.max(100 * sx, 100 * sy);
  return {
    kind,
    variant,
    fit,
    drawn: { x: ox, y: oy, w: 100 * sx, h: 100 * sy },
    light: em ? { x: ox + em[0] * sx, y: oy + em[1] * sy, kind: em[2], radius: Math.max(60, size * 1.4) * em[3] } : null,
  };
}

// ---------------------------------------------------------------------------
// Drawing

function flame(p: PropPaint, cx: number, cy: number, s: number, animated: boolean): ReactElement {
  return (
    <g className={animated ? styles.flicker : undefined}>
      {halo(p, cx, cy, 12 * s)}
      <path
        d={`M${cx} ${cy - 5 * s} C${cx + 2.4 * s} ${cy - 1.5 * s} ${cx + 2.2 * s} ${cy + 2 * s} ${cx} ${cy + 2.4 * s} C${cx - 2.2 * s} ${cy + 2 * s} ${cx - 2.4 * s} ${cy - 1.5 * s} ${cx} ${cy - 5 * s} Z`}
        fill="#f8e2ae"
      />
    </g>
  );
}

const desk: Draw = ({ p }) => (
  <>
    <rect x="1" y="38" width="98" height="7" fill={p.body} />
    <rect x="4" y="45" width="31" height="55" fill={p.body} />
    <rect x="86" y="45" width="9" height="55" fill={p.body} />
    <rect x="35" y="45" width="51" height="15" fill={p.mid} />
    {stroke(p.edge, 'M7 59 H32 M7 73 H32 M7 87 H32', 0.9)}
    <g fill={p.metal} opacity="0.8">
      <rect x="17" y="51" width="5" height="1.6" />
      <rect x="17" y="65" width="5" height="1.6" />
      <rect x="17" y="79" width="5" height="1.6" />
      <rect x="17" y="93" width="5" height="1.6" />
    </g>
    <rect x="48" y="33" width="22" height="5" fill={p.paper} opacity="0.5" transform="rotate(-3 59 35)" />
    <rect x="53" y="31.5" width="19" height="4" fill={p.paper} opacity="0.38" transform="rotate(4 62 33)" />
    <rect x="80" y="29" width="6" height="9" rx="1" fill={p.glass} />
    {stroke(p.paper, 'M83 29 L90 14', 0.45, 1)}
    {rim(p, 'M1 38 H99')}
    {rim(p, 'M35 45 V100', 0.35, 1.2)}
    {rim(p, 'M95 45 V100', 0.6, 1.2)}
  </>
);

const cabinet: Draw = ({ p, v }) => {
  if (v === 'filing') {
    return (
      <>
        <rect x="14" y="4" width="72" height="96" fill={p.body} />
        {[8, 31, 54, 77].map((y) => (
          <g key={y}>
            <rect x="19" y={y} width="62" height="19" fill={p.mid} />
            <rect x="42" y={y + 8} width="16" height="3" rx="1" fill={p.metal} opacity="0.85" />
            <rect x="45" y={y + 3} width="10" height="4" fill={p.paper} opacity="0.4" />
          </g>
        ))}
        {rim(p, 'M14 4 H86')}
        {rim(p, 'M86 4 V100', 0.6, 1.2)}
      </>
    );
  }
  const glazed = v === 'glazed';
  return (
    <>
      <rect x="4" y="2" width="92" height="6" fill={p.body} />
      <rect x="8" y="8" width="84" height="88" fill={p.body} />
      <rect x="13" y="13" width="35" height="78" fill={glazed ? p.glass : p.mid} />
      <rect x="52" y="13" width="35" height="78" fill={glazed ? p.glass : p.mid} />
      {glazed ? (
        <>
          <rect x="13" y="38" width="74" height="2" fill={p.body} />
          <rect x="13" y="63" width="74" height="2" fill={p.body} />
          <g fill={p.body}>
            <rect x="18" y="26" width="5" height="12" rx="1" />
            <rect x="26" y="30" width="4" height="8" rx="1" />
            <rect x="58" y="27" width="6" height="11" rx="1" />
            <rect x="68" y="29" width="4" height="9" rx="1" />
            <rect x="20" y="51" width="6" height="12" rx="1" />
            <rect x="72" y="53" width="5" height="10" rx="1" />
            <rect x="34" y="78" width="7" height="10" rx="1" />
          </g>
          <path d="M16 16 L34 16 L18 50 Z" fill="#ffffff" opacity="0.05" />
          <path d="M56 16 L66 16 L56 34 Z" fill="#ffffff" opacity="0.05" />
        </>
      ) : (
        <g fill="none" stroke={p.edge} strokeOpacity="0.8" vectorEffect={NS}>
          <rect x="17" y="18" width="27" height="32" />
          <rect x="17" y="56" width="27" height="30" />
          <rect x="56" y="18" width="27" height="32" />
          <rect x="56" y="56" width="27" height="30" />
        </g>
      )}
      <rect x="46" y="48" width="2.4" height="8" rx="1" fill={p.metal} />
      <rect x="51.6" y="48" width="2.4" height="8" rx="1" fill={p.metal} />
      <rect x="10" y="96" width="6" height="4" fill={p.body} />
      <rect x="84" y="96" width="6" height="4" fill={p.body} />
      {rim(p, 'M4 2 H96')}
      {rim(p, 'M92 8 V96', 0.6, 1.2)}
      {glazed && rim(p, 'M87 13 V91', 0.3, 1)}
    </>
  );
};

const glass: Draw = ({ p }) => (
  <>
    <ellipse cx="50" cy="97" rx="17" ry="3" fill={p.body} />
    <rect x="48.4" y="78" width="3.2" height="19" fill={p.glass} />
    <path d="M30 40 C20 60 28 80 50 80 C72 80 80 60 70 40 Z" fill={p.glass} opacity="0.8" />
    <path d="M25.6 62 C27 74 37 80 50 80 C63 80 73 74 74.4 62 C66 64 34 64 25.6 62 Z" fill={p.glow} opacity="0.6" />
    {rim(p, 'M30 40 C20 60 28 80 50 80 C72 80 80 60 70 40', 0.75)}
    <ellipse cx="50" cy="40" rx="20" ry="2.4" fill="none" stroke={p.rim} strokeOpacity="0.5" vectorEffect={NS} />
    {stroke('#ffffff', 'M36 46 C31 56 32 66 37 72', 0.35, 1.5)}
    {halo(p, 50, 68, 26, 0.7)}
  </>
);

const decanter: Draw = ({ p }) => (
  <>
    <path d="M30 98 C14 92 14 64 32 54 L42 48 L42 28 L58 28 L58 48 L68 54 C86 64 86 92 70 98 Z" fill={p.glass} opacity="0.88" />
    <path d="M18.6 74 C19 88 25 96 31 98 L69 98 C75 96 81 88 81.4 74 C70 77 30 77 18.6 74 Z" fill={p.glow} opacity="0.5" />
    <rect x="39" y="24" width="22" height="5" rx="1.5" fill={p.body} />
    <path d="M44 24 C40 16 44 8 50 8 C56 8 60 16 56 24 Z" fill={p.glass} />
    {rim(p, 'M58 30 L58 48 L68 54 C86 64 86 92 70 98')}
    {rim(p, 'M56 10 C59 14 59 20 56 24', 0.6, 1.2)}
    {stroke('#ffffff', 'M28 64 C23 72 23 82 27 90', 0.3, 1.6)}
    {halo(p, 50, 82, 30, 0.5)}
  </>
);

const bottle: Draw = ({ p, v }) =>
  v === 'vial' ? (
    <>
      <path d="M32 100 L32 64 C32 57 39 55 41 52 L41 42 L59 42 L59 52 C61 55 68 57 68 64 L68 100 Z" fill={p.glass} />
      <rect x="40" y="33" width="20" height="10" rx="2" fill={p.mid} />
      <path d="M33 84 H67 V99 H33 Z" fill={p.glow} opacity="0.25" />
      <rect x="37" y="66" width="26" height="15" fill={p.paper} opacity="0.55" />
      {stroke(p.edge, 'M41 71 H59 M41 76 H54', 0.7)}
      {rim(p, 'M59 44 L59 52 C61 55 68 57 68 64 L68 100')}
      {stroke('#ffffff', 'M36 62 V96', 0.22, 1.4)}
    </>
  ) : (
    <>
      <path d="M40 100 L40 54 C40 44 45 40 46 34 L46 12 L54 12 L54 34 C55 40 60 44 60 54 L60 100 Z" fill={p.body} />
      <rect x="45" y="9" width="10" height="5" fill={p.metal} opacity="0.7" />
      <rect x="41.5" y="64" width="17" height="18" fill={p.paper} opacity="0.45" />
      {stroke(p.edge, 'M44 70 H56 M44 75 H53', 0.7)}
      {rim(p, 'M54 14 L54 34 C55 40 60 44 60 54 L60 100')}
      {stroke('#ffffff', 'M43 52 V96', 0.15, 1.4)}
    </>
  );

const letter: Draw = ({ p, v }) => {
  if (v === 'news') {
    return (
      <g transform="rotate(-6 50 50)">
        <rect x="12" y="20" width="76" height="60" fill={p.paper} opacity="0.72" />
        <rect x="16" y="24" width="68" height="9" fill={p.edge} opacity="0.55" />
        <g stroke={p.edge} strokeOpacity="0.45" vectorEffect={NS}>
          {[40, 46, 52, 58, 64, 70].map((y) => (
            <path key={y} d={`M16 ${y} H46 M54 ${y} H84`} />
          ))}
        </g>
        <rect x="54" y="38" width="30" height="16" fill={p.edge} opacity="0.3" />
        {rim(p, 'M12 20 H88', 0.5, 1.2)}
      </g>
    );
  }
  if (v === 'note') {
    return (
      <g transform="rotate(5 50 50)">
        <rect x="22" y="30" width="56" height="40" fill={p.paper} opacity="0.78" />
        <g stroke={p.edge} strokeOpacity="0.5" vectorEffect={NS}>
          <path d="M28 40 H70 M28 47 H66 M28 54 H60 M28 61 H52" />
        </g>
        {rim(p, 'M22 30 H78', 0.5, 1.2)}
      </g>
    );
  }
  if (v === 'torn') {
    return (
      <g transform="rotate(-8 50 50)">
        <path d="M24 16 H76 V66 L70 70 L64 64 L57 72 L50 65 L43 74 L36 66 L30 71 L24 64 Z" fill={p.paper} opacity="0.78" />
        <path d="M24 60 L30 66 L36 61 L43 69 L50 60 L57 67 L64 59 L70 65 L76 61 V66 L70 70 L64 64 L57 72 L50 65 L43 74 L36 66 L30 71 L24 64 Z" fill={p.edge} opacity="0.55" />
        <g stroke={p.edge} strokeOpacity="0.5" vectorEffect={NS}>
          <path d="M30 26 H70 M30 33 H68 M30 40 H62 M30 47 H69 M30 54 H56" />
        </g>
        {rim(p, 'M24 16 H76', 0.5, 1.2)}
      </g>
    );
  }
  return (
    <>
      <g transform="rotate(-5 50 70)">
        <rect x="14" y="52" width="72" height="38" fill={p.paper} opacity="0.5" />
        {stroke(p.edge, 'M14 52 L50 74 L86 52', 0.6, 1)}
      </g>
      <g transform="rotate(7 50 46)">
        <rect x="28" y="14" width="44" height="58" fill={p.paper} opacity="0.8" />
        <g stroke={p.edge} strokeOpacity="0.5" vectorEffect={NS}>
          <path d="M33 24 H64 M33 30 H66 M33 36 H60 M33 42 H66 M33 48 H58 M33 54 H63 M33 62 H48" />
        </g>
      </g>
      {rim(p, 'M28 14 H72', 0.4, 1.2)}
    </>
  );
};

const coat: Draw = ({ p }) => (
  <>
    <rect x="48" y="8" width="4" height="86" fill={p.body} />
    <circle cx="50" cy="7" r="3.2" fill={p.body} />
    <path d="M50 92 L30 100 M50 92 L70 100 M50 92 L50 100" stroke={p.body} strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M50 16 C40 13 36 17 36 22 M50 16 C60 13 64 17 64 22" stroke={p.body} strokeWidth="2.4" fill="none" strokeLinecap="round" />
    <ellipse cx="62" cy="21" rx="13" ry="3" fill={p.body} />
    <path d="M53 21 C53 12 57 9 62 9 C67 9 71 12 71 21 Z" fill={p.body} />
    <path d="M36 20 C27 24 22 36 22 52 L20 84 C29 88 43 88 50 84 L50 32 C46 24 41 20 36 20 Z" fill={p.mid} />
    <path d="M36 20 C33 30 32 44 33 58 L30 84" stroke={p.edge} strokeOpacity="0.7" fill="none" vectorEffect={NS} />
    {rim(p, 'M52 10 V92')}
    {rim(p, 'M62 9 C67 9 71 12 71 21', 0.7, 1.3)}
    {rim(p, 'M36 20 C41 20 46 24 50 32', 0.5, 1.2)}
  </>
);

const windowProp: Draw = ({ p, v, r, animated }) => {
  if (v === 'porthole') {
    return (
      <>
        <circle cx="50" cy="50" r="46" fill={p.body} />
        <circle cx="50" cy="50" r="36" fill={p.glass} />
        <circle cx="62" cy="38" r="14" fill="#8fb3e0" opacity="0.1" />
        <svg x="14" y="14" width="72" height="72" overflow="hidden">
          <g className={animated ? styles.rainProp : undefined}>
            <path d={rainPath(r, 80, 72, 10, 30, 12)} stroke="#a9c1e0" strokeOpacity="0.4" strokeWidth="1" vectorEffect={NS} />
          </g>
        </svg>
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <circle key={a} cx={50 + 41 * Math.cos((a * Math.PI) / 180)} cy={50 + 41 * Math.sin((a * Math.PI) / 180)} r="2.2" fill={p.metal} />
        ))}
        {rim(p, 'M82 22 A46 46 0 0 1 82 78')}
      </>
    );
  }
  if (v === 'roof') {
    return (
      <>
        <path d="M0 100 L12 0 H88 L100 100 Z" fill={p.body} />
        <path d="M6 96 L16 4 H84 L94 96 Z" fill={p.glass} />
        <ellipse cx="66" cy="26" rx="18" ry="12" fill="#8fb3e0" opacity="0.12" />
        <svg x="6" y="4" width="88" height="92" overflow="hidden">
          <g className={animated ? styles.rainProp : undefined}>
            <path d={rainPath(r, 96, 92, 20, 30, 10)} stroke="#a9c1e0" strokeOpacity="0.45" strokeWidth="1" vectorEffect={NS} />
          </g>
        </svg>
        <g stroke={p.body} strokeWidth="2.4" vectorEffect={NS}>
          <path d="M33 4 L28 96 M50 4 V96 M67 4 L72 96 M10 50 H90" />
        </g>
        {rim(p, 'M12 0 H88 L100 100', 0.7)}
      </>
    );
  }
  return (
    <>
      <rect x="0" y="0" width="100" height="92" fill={p.body} />
      <rect x="6" y="6" width="88" height="80" fill={p.glass} />
      <rect x="6" y="6" width="88" height="34" fill="#000000" opacity="0.25" />
      <ellipse cx="70" cy="24" rx="20" ry="14" fill="#8fb3e0" opacity="0.12" />
      <path d="M6 86 V72 H14 V66 H24 V76 H33 V62 H42 V74 H52 V68 H60 V78 H70 V64 H80 V74 H94 V86 Z" fill="#05070c" opacity="0.85" />
      <g fill={p.glow} opacity="0.7">
        <rect x="36" y="66" width="2" height="2" />
        <rect x="73" y="68" width="2" height="2" />
        <rect x="17" y="70" width="2" height="2" />
      </g>
      <svg x="6" y="6" width="88" height="80" overflow="hidden">
        <g className={animated ? styles.rainProp : undefined}>
          <path d={rainPath(r, 96, 80, 18, 30, 11)} stroke="#a9c1e0" strokeOpacity="0.42" strokeWidth="1" vectorEffect={NS} />
        </g>
      </svg>
      <rect x="48.5" y="6" width="3" height="80" fill={p.body} />
      <rect x="6" y="44" width="88" height="3.5" fill={p.body} />
      <path d="M12 12 L30 12 L12 40 Z" fill="#ffffff" opacity="0.04" />
      <rect x="-4" y="89" width="108" height="6" fill={p.body} />
      {rim(p, 'M-4 89 H104')}
      {rim(p, 'M100 0 V89', 0.55, 1.2)}
    </>
  );
};

const door: Draw = ({ p }) => (
  <>
    <rect x="6" y="0" width="88" height="100" fill={p.body} />
    <rect x="14" y="5" width="72" height="95" fill={p.mid} />
    <g fill="none" stroke={p.edge} strokeOpacity="0.85" vectorEffect={NS}>
      <rect x="20" y="10" width="26" height="36" />
      <rect x="54" y="10" width="26" height="36" />
      <rect x="20" y="54" width="26" height="38" />
      <rect x="54" y="54" width="26" height="38" />
    </g>
    <circle cx="78" cy="52" r="2.6" fill={p.metal} />
    <rect x="76" y="56" width="4" height="5" fill={p.edge} />
    <rect x="15" y="98.4" width="70" height="1.6" fill={p.glow} opacity="0.75" />
    {rim(p, 'M94 0 V100')}
    {rim(p, 'M86 5 V100', 0.45, 1.2)}
  </>
);

const painting: Draw = ({ p, v }) => {
  const frame = (
    <>
      <rect x="0" y="0" width="100" height="100" fill={p.body} />
      <rect x="2.5" y="2.5" width="95" height="95" fill={p.metal} opacity="0.32" />
      <rect x="8" y="8" width="84" height="84" fill="#0b0f17" />
    </>
  );
  let inner: ReactNode;
  if (v === 'map') {
    inner = (
      <>
        <rect x="8" y="8" width="84" height="84" fill={p.paper} opacity="0.55" />
        <path d="M14 70 C24 60 30 66 38 54 C46 42 58 50 64 38 C70 28 80 34 86 24" stroke={p.edge} strokeOpacity="0.6" fill="none" vectorEffect={NS} />
        <path d="M18 30 C28 26 34 34 44 28 M50 74 C60 70 70 78 84 72" stroke={p.edge} strokeOpacity="0.4" fill="none" vectorEffect={NS} />
        <circle cx="62" cy="44" r="2.5" fill={p.edge} opacity="0.7" />
      </>
    );
  } else if (v === 'notice') {
    inner = (
      <>
        <rect x="8" y="8" width="84" height="84" fill={p.paper} opacity="0.6" />
        <rect x="16" y="16" width="68" height="12" fill={p.edge} opacity="0.5" />
        <g stroke={p.edge} strokeOpacity="0.45" vectorEffect={NS}>
          <path d="M16 40 H84 M16 48 H78 M16 56 H82 M16 64 H70 M16 72 H76 M16 80 H58" />
        </g>
      </>
    );
  } else if (v === 'landscape') {
    inner = (
      <>
        <rect x="8" y="8" width="84" height="54" fill="#18243a" opacity="0.9" />
        <circle cx="68" cy="26" r="7" fill={p.paper} opacity="0.35" />
        <rect x="8" y="58" width="84" height="34" fill="#0d1624" />
        <path d="M26 58 L32 44 L38 58 Z M30 44 V36 M24 52 H40" stroke={p.paper} strokeOpacity="0.25" fill={p.edge} vectorEffect={NS} />
        {stroke(p.paper, 'M14 66 H34 M50 72 H80 M20 80 H44', 0.18)}
      </>
    );
  } else {
    inner = (
      <>
        <rect x="8" y="8" width="84" height="84" fill={p.fabric} opacity="0.35" />
        <ellipse cx="50" cy="42" rx="13" ry="16" fill={p.body} />
        <path d="M22 92 C24 70 36 60 50 60 C64 60 76 70 78 92 Z" fill={p.body} />
        <path d="M58 30 C64 36 64 50 58 56" stroke={p.paper} strokeOpacity="0.25" strokeWidth="1.4" fill="none" vectorEffect={NS} />
      </>
    );
  }
  return (
    <>
      {frame}
      {inner}
      {rim(p, 'M0 0 H100 V100', 0.75)}
      {rim(p, 'M8 92 H92 V8', 0.25, 1)}
    </>
  );
};

const piano: Draw = ({ p }) => (
  <>
    <path d="M8 44 L60 8 L66 13 L30 42 Z" fill={p.body} />
    {stroke(p.edge, 'M40 40 L54 18', 1, 1.6)}
    <path d="M4 48 L30 42 L70 36 C86 34 97 41 97 50 C97 58 87 64 70 64 L4 64 Z" fill={p.body} />
    <rect x="2" y="50" width="22" height="6" fill={p.paper} opacity="0.55" />
    <g fill={p.edge}>
      {[5, 8, 13, 16, 19].map((x) => (
        <rect key={x} x={x} y="50" width="1.6" height="3.6" />
      ))}
    </g>
    <rect x="8" y="64" width="4.5" height="34" fill={p.body} />
    <rect x="60" y="64" width="4.5" height="34" fill={p.body} />
    <rect x="86" y="58" width="4.5" height="38" fill={p.body} />
    <rect x="38" y="64" width="6" height="22" fill={p.body} />
    <rect x="36" y="86" width="10" height="2" fill={p.metal} />
    {rim(p, 'M8 44 L60 8 L66 13')}
    {rim(p, 'M70 36 C86 34 97 41 97 50 C97 58 87 64 70 64', 0.7)}
  </>
);

const phoneBody = (p: PropPaint): ReactElement => (
  <>
    <path d="M30 100 C30 91 39 87 50 87 C61 87 70 91 70 100 Z" fill={p.body} />
    <rect x="47" y="30" width="6" height="58" fill={p.body} />
    <ellipse cx="50" cy="18" rx="11" ry="3.2" fill={p.body} />
    <path d="M39 18 L61 18 L56 31 L44 31 Z" fill={p.body} />
    {stroke(p.body, 'M53 41 L64 36', 1, 2.4)}
    <path d="M62 30 C59 30 58 34 60 40 L66 60 C68 64 72 64 74 62 L76 56 C72 48 70 38 68 32 C67 30 65 29 62 30 Z" fill={p.body} />
    <path d="M70 62 C82 80 78 96 62 98" fill="none" stroke={p.body} strokeWidth="1.6" vectorEffect={NS} />
    {rim(p, 'M53 31 V87')}
    {rim(p, 'M61 18 L56 31', 0.7, 1.2)}
    {rim(p, 'M68 32 C70 38 72 48 76 56', 0.6, 1.2)}
    <circle cx="50" cy="96" r="2" fill={p.metal} opacity="0.7" />
  </>
);

const phone: Draw = ({ p, v }) =>
  v === 'table' ? (
    <>
      <g transform="translate(20 0) scale(0.6)">{phoneBody(p)}</g>
      <rect x="16" y="60" width="68" height="5" fill={p.body} />
      <rect x="21" y="65" width="4" height="35" fill={p.body} />
      <rect x="75" y="65" width="4" height="35" fill={p.body} />
      <rect x="21" y="84" width="58" height="3" fill={p.body} />
      <rect x="30" y="56" width="18" height="4" fill={p.paper} opacity="0.45" />
      {rim(p, 'M16 60 H84')}
      {rim(p, 'M79 65 V100', 0.5, 1.2)}
    </>
  ) : (
    phoneBody(p)
  );

const bed: Draw = ({ p }) => (
  <>
    <path d="M12 56 V22 C12 14 30 10 50 10 C70 10 88 14 88 22 V56 Z" fill={p.body} />
    <ellipse cx="34" cy="48" rx="15" ry="6" fill={p.paper} opacity="0.4" />
    <ellipse cx="66" cy="48" rx="15" ry="6" fill={p.paper} opacity="0.36" />
    <path d="M16 54 H84 L97 82 H3 Z" fill={p.mid} />
    <path d="M14 58 H86 L88 64 H12 Z" fill={p.paper} opacity="0.35" />
    <path d="M20 70 C40 74 60 74 80 70" stroke={p.edge} strokeOpacity="0.6" fill="none" vectorEffect={NS} />
    <rect x="1" y="80" width="98" height="14" fill={p.body} />
    <rect x="1" y="76" width="5" height="24" fill={p.body} />
    <rect x="94" y="76" width="5" height="24" fill={p.body} />
    {rim(p, 'M12 22 C12 14 30 10 50 10 C70 10 88 14 88 22', 0.7)}
    {rim(p, 'M84 54 L97 82', 0.55, 1.2)}
    {rim(p, 'M1 80 H99', 0.6)}
  </>
);

const BOOK_COLORS = ['#3b2a1c', '#22303d', '#2f3b25', '#3a2424', '#3a331f', '#2a2533', '#1f2a2a', '#40301f'];

function booksPaths(r: () => number, rows: number[], x0: number, x1: number, rowH: number): ReactNode {
  const byColor: string[] = BOOK_COLORS.map(() => '');
  let bands = '';
  for (const yb of rows) {
    let x = x0 + r() * 2;
    while (x < x1 - 2) {
      const w = 2.4 + r() * 3.8;
      if (x + w > x1) break;
      const h = rowH * (0.62 + r() * 0.32);
      const ci = Math.floor(r() * BOOK_COLORS.length);
      if (r() < 0.08) {
        x += w + 1.5;
        continue;
      }
      byColor[ci] += `M${x.toFixed(1)} ${yb.toFixed(1)}h${w.toFixed(1)}v${(-h).toFixed(1)}h${(-w).toFixed(1)}Z`;
      if (r() < 0.5) bands += `M${x.toFixed(1)} ${(yb - h * 0.8).toFixed(1)}h${w.toFixed(1)}`;
      x += w + (r() < 0.2 ? 0.8 : 0.2);
    }
  }
  return (
    <>
      {byColor.map((d, i) => (d ? <path key={i} d={d} fill={BOOK_COLORS[i]} /> : null))}
      <path d={bands} stroke="#d9a23a" strokeOpacity="0.28" strokeWidth="0.8" vectorEffect={NS} />
    </>
  );
}

const bookshelf: Draw = ({ p, r }) => {
  const rows = [24, 47, 70, 93];
  return (
    <>
      <rect x="0" y="0" width="100" height="100" fill={p.body} />
      <rect x="5" y="4" width="90" height="92" fill="#05070c" opacity="0.85" />
      {booksPaths(r, rows, 6, 94, 19)}
      {rows.map((y) => (
        <rect key={y} x="5" y={y} width="90" height="3" fill={p.body} />
      ))}
      {rows.map((y) => (
        <g key={`r${y}`}>{rim(p, `M5 ${y} H95`, 0.35, 1)}</g>
      ))}
      {rim(p, 'M0 0 H100')}
      {rim(p, 'M100 0 V100', 0.6, 1.2)}
    </>
  );
};

const fireplace: Draw = ({ p, v, animated }) => {
  if (v === 'stove') {
    return (
      <>
        <rect x="80" y="0" width="8" height="28" fill={p.body} />
        <rect x="2" y="26" width="96" height="6" fill={p.body} />
        <rect x="6" y="32" width="88" height="62" fill={p.body} />
        <rect x="12" y="40" width="34" height="44" fill={p.mid} />
        <rect x="54" y="40" width="34" height="44" fill={p.mid} />
        <rect x="20" y="58" width="18" height="10" fill="#050302" />
        <g className={animated ? styles.flicker : undefined}>
          <rect x="21" y="61" width="16" height="6" fill={p.glow} opacity="0.65" />
          {halo(p, 29, 64, 24, 0.8)}
        </g>
        <rect x="60" y="48" width="22" height="3" rx="1" fill={p.metal} />
        <path d="M30 26 C30 18 36 14 44 14 C52 14 58 18 58 26 Z" fill={p.body} />
        {stroke(p.body, 'M58 20 L66 16', 1, 2)}
        <rect x="8" y="94" width="6" height="6" fill={p.body} />
        <rect x="86" y="94" width="6" height="6" fill={p.body} />
        {rim(p, 'M2 26 H98')}
        {rim(p, 'M94 32 V94', 0.6, 1.2)}
      </>
    );
  }
  return (
    <>
      <rect x="-2" y="18" width="104" height="6" fill={p.body} />
      <rect x="44" y="7" width="12" height="11" rx="1.5" fill={p.body} />
      <rect x="14" y="5" width="3" height="13" fill={p.body} />
      <rect x="83" y="5" width="3" height="13" fill={p.body} />
      {flame(p, 15.5, 3, 0.7, animated)}
      {flame(p, 84.5, 3, 0.7, animated)}
      <rect x="4" y="24" width="92" height="76" fill={p.mid} />
      <rect x="15" y="33" width="70" height="67" fill={p.body} />
      <path d="M24 100 V52 C24 44 30 40 38 40 H62 C70 40 76 44 76 52 V100 Z" fill="#040302" />
      <g className={animated ? styles.flicker : undefined}>
        <ellipse cx="50" cy="93" rx="27" ry="12" fill={p.glow} opacity="0.2" />
        <ellipse cx="50" cy="95" rx="18" ry="6" fill="#d9772b" opacity="0.5" />
        <ellipse cx="50" cy="96" rx="10" ry="3" fill={p.glow} opacity="0.8" />
        <circle cx="40" cy="95" r="1.2" fill="#f8e2ae" />
        <circle cx="57" cy="94" r="1" fill="#f8e2ae" />
        <ellipse cx="50" cy="104" rx="48" ry="5" fill={p.glow} opacity="0.12" />
      </g>
      <path d="M30 97 H70 M33 89 V99 M41 89 V99 M50 89 V99 M59 89 V99 M67 89 V99" stroke={p.body} strokeWidth="1.8" fill="none" vectorEffect={NS} />
      <rect x="-2" y="97" width="104" height="3" fill={p.body} />
      {rim(p, 'M-2 18 H102')}
      {rim(p, 'M96 24 V100', 0.55, 1.2)}
      {rim(p, 'M62 40 C70 40 76 44 76 52 V96', 0.5, 1.2)}
    </>
  );
};

function frond(cx: number, cy: number, angle: number, len: number, width: number): string {
  const a = (angle * Math.PI) / 180;
  const spread = Math.abs(Math.cos(a));
  const tx = cx + Math.cos(a) * len * 0.78;
  const ty = cy + Math.sin(a) * len + len * 0.22 * spread;
  const mx = cx + Math.cos(a) * len * 0.42;
  const my = cy + Math.sin(a) * len * 0.55 - len * 0.1 * spread;
  const nx = -Math.sin(a) * width;
  const ny = Math.cos(a) * width;
  return `M${cx} ${cy} Q${(mx + nx).toFixed(1)} ${(my + ny).toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)} Q${(mx - nx).toFixed(1)} ${(my - ny).toFixed(1)} ${cx} ${cy}Z`;
}

const plant: Draw = ({ p, v }) => {
  const fern = v === 'fern';
  const angles = fern ? [-170, -150, -128, -108, -90, -72, -52, -30, -10] : [-165, -140, -115, -92, -68, -42, -16];
  const len = fern ? 44 : 64;
  const leaves = angles.map((a, i) => frond(50, 74, a, len * (0.8 + ((i * 37) % 10) / 40), fern ? 4 : 7)).join('');
  return (
    <>
      <path d={leaves} fill={p.body} />
      {rim(p, frond(50, 74, angles[angles.length - 2] ?? -40, len, fern ? 4 : 7), 0.45, 1)}
      {rim(p, frond(50, 74, angles[3] ?? -90, len * 0.9, fern ? 4 : 7), 0.3, 1)}
      <path d="M33 78 H67 L63 100 H37 Z" fill={p.body} />
      <rect x="30" y="73" width="40" height="6" rx="1" fill={p.mid} />
      {rim(p, 'M30 73 H70')}
      {rim(p, 'M67 79 L63 100', 0.55, 1.2)}
    </>
  );
};

const chair: Draw = ({ p, v }) => {
  if (v === 'side' || v === 'stool') {
    if (v === 'stool') {
      return (
        <>
          <ellipse cx="50" cy="56" rx="22" ry="5" fill={p.mid} />
          <rect x="28" y="56" width="44" height="5" fill={p.body} />
          <path d="M32 60 L26 100 M68 60 L74 100 M42 61 L40 96 M58 61 L60 96 M30 84 H70" stroke={p.body} strokeWidth="3" fill="none" />
          {rim(p, 'M28 56 C36 52 64 52 72 56')}
        </>
      );
    }
    return (
      <>
        <rect x="30" y="4" width="5" height="60" fill={p.body} />
        <rect x="65" y="4" width="5" height="60" fill={p.body} />
        <rect x="28" y="4" width="44" height="8" rx="2" fill={p.body} />
        <rect x="45" y="12" width="10" height="44" fill={p.body} />
        <path d="M24 58 H76 L80 67 H20 Z" fill={p.mid} />
        <rect x="22" y="67" width="4" height="33" fill={p.body} />
        <rect x="74" y="67" width="4" height="33" fill={p.body} />
        <rect x="32" y="67" width="3" height="26" fill={p.body} />
        <rect x="65" y="67" width="3" height="26" fill={p.body} />
        {rim(p, 'M70 4 V58')}
        {rim(p, 'M76 58 L80 67', 0.6, 1.2)}
        {rim(p, 'M28 4 H72', 0.5, 1.2)}
      </>
    );
  }
  const wicker = v === 'wicker';
  return (
    <>
      <path d="M18 66 L15 24 C15 12 28 7 50 7 C72 7 85 12 85 24 L82 66 Z" fill={p.body} />
      {wicker ? (
        <g stroke={p.rim} strokeOpacity="0.14" fill="none" vectorEffect={NS}>
          {[16, 24, 32, 40, 48, 56].map((y) => (
            <path key={y} d={`M19 ${y} C35 ${y + 3} 65 ${y + 3} 81 ${y}`} />
          ))}
          {[28, 38, 50, 62, 72].map((x) => (
            <path key={x} d={`M${x} 10 V62`} />
          ))}
        </g>
      ) : (
        <g fill={p.edge} opacity="0.7">
          {[30, 42, 54, 66].flatMap((x) =>
            [20, 32, 44].map((y) => <circle key={`${x}-${y}`} cx={x + (y === 32 ? 6 : 0)} cy={y} r="1.1" />),
          )}
        </g>
      )}
      <path d="M22 58 H78 L80 72 H20 Z" fill={p.mid} />
      <path d="M34 64 C42 68 58 68 66 64" stroke={p.edge} strokeOpacity="0.7" fill="none" vectorEffect={NS} />
      <path d="M4 48 C4 39 10 36 16 36 C22 36 27 40 27 48 L27 90 H6 Z" fill={p.body} />
      <path d="M73 48 C73 40 78 36 84 36 C90 36 96 39 96 48 L94 90 H73 Z" fill={p.body} />
      <rect x="6" y="74" width="88" height="16" fill={p.body} />
      <rect x="10" y="90" width="5" height="10" fill={p.body} />
      <rect x="85" y="90" width="5" height="10" fill={p.body} />
      {rim(p, 'M73 46 C74 39 80 36 85 36 C91 36 96 40 96 48')}
      {rim(p, 'M85 24 L83 40', 0.55, 1.2)}
      {rim(p, 'M96 48 L94 90', 0.45, 1.2)}
      {rim(p, 'M15 24 C15 12 28 7 50 7 C72 7 85 12 85 24', 0.35, 1.2)}
    </>
  );
};

const sofa: Draw = ({ p }) => (
  <>
    <path d="M6 62 V28 C6 20 14 16 24 16 H76 C86 16 94 20 94 28 V62 Z" fill={p.body} />
    <g fill={p.edge} opacity="0.65">
      {[20, 32, 44, 56, 68, 80].map((x) => (
        <circle key={x} cx={x} cy="30" r="1" />
      ))}
      {[26, 38, 50, 62, 74].map((x) => (
        <circle key={x} cx={x} cy="42" r="1" />
      ))}
    </g>
    <rect x="14" y="54" width="24" height="14" fill={p.mid} />
    <rect x="38.5" y="54" width="23" height="14" fill={p.mid} />
    <rect x="62" y="54" width="24" height="14" fill={p.mid} />
    <path d="M0 46 C0 38 4 34 10 34 C16 34 18 38 18 46 V86 H0 Z" fill={p.body} />
    <path d="M82 46 C82 38 84 34 90 34 C96 34 100 38 100 46 V86 H82 Z" fill={p.body} />
    <rect x="0" y="68" width="100" height="18" fill={p.body} />
    <rect x="4" y="86" width="5" height="14" fill={p.body} />
    <rect x="91" y="86" width="5" height="14" fill={p.body} />
    {rim(p, 'M82 44 C82 38 84 34 90 34 C96 34 100 38 100 46 V86')}
    {rim(p, 'M24 16 H76 C86 16 94 20 94 28', 0.45, 1.2)}
  </>
);

const caseProp: Draw = ({ p, v }) => {
  if (v === 'trunk') {
    return (
      <>
        <path d="M6 42 C6 26 20 22 50 22 C80 22 94 26 94 42 Z" fill={p.body} />
        <rect x="6" y="42" width="88" height="56" fill={p.body} />
        <rect x="6" y="40" width="88" height="4" fill={p.mid} />
        <rect x="24" y="24" width="6" height="74" fill={p.mid} />
        <rect x="70" y="24" width="6" height="74" fill={p.mid} />
        <rect x="45" y="38" width="10" height="12" rx="1" fill={p.metal} />
        <g fill={p.metal} opacity="0.75">
          <rect x="6" y="88" width="8" height="10" />
          <rect x="86" y="88" width="8" height="10" />
        </g>
        {rim(p, 'M6 42 C6 26 20 22 50 22 C80 22 94 26 94 42')}
        {rim(p, 'M94 42 V98', 0.6, 1.2)}
      </>
    );
  }
  if (v === 'suitcase') {
    return (
      <>
        <path d="M40 30 V22 C40 18 42 16 46 16 H54 C58 16 60 18 60 22 V30" stroke={p.body} strokeWidth="4" fill="none" />
        <rect x="12" y="30" width="76" height="68" rx="5" fill={p.body} />
        <rect x="28" y="30" width="5" height="68" fill={p.mid} />
        <rect x="67" y="30" width="5" height="68" fill={p.mid} />
        <rect x="40" y="50" width="16" height="11" fill={p.paper} opacity="0.4" transform="rotate(-8 48 55)" />
        <circle cx="50" cy="78" r="5" fill={p.paper} opacity="0.25" />
        {rim(p, 'M17 30 H83 C86 30 88 32 88 35 V93')}
      </>
    );
  }
  return (
    <>
      <path d="M40 42 V33 C40 29 42 27 46 27 H54 C58 27 60 29 60 33 V42" stroke={p.body} strokeWidth="4" fill="none" />
      <rect x="10" y="41" width="80" height="55" rx="4" fill={p.body} />
      <rect x="10" y="41" width="80" height="16" rx="4" fill={p.mid} />
      <rect x="27" y="53" width="8" height="6" rx="1" fill={p.metal} />
      <rect x="65" y="53" width="8" height="6" rx="1" fill={p.metal} />
      {rim(p, 'M14 41 H86 C88 41 90 43 90 45 V92')}
      {rim(p, 'M40 33 C40 29 42 27 46 27 H54', 0.5, 1.2)}
    </>
  );
};

const safe: Draw = ({ p }) => (
  <>
    <rect x="12" y="10" width="76" height="82" rx="3" fill={p.body} />
    <rect x="20" y="18" width="60" height="66" rx="2" fill={p.mid} />
    <circle cx="50" cy="44" r="11" fill={p.body} stroke={p.metal} strokeOpacity="0.8" vectorEffect={NS} />
    <circle cx="50" cy="44" r="3" fill={p.metal} />
    <g stroke={p.metal} strokeOpacity="0.7" vectorEffect={NS}>
      <path d="M50 33 V35 M61 44 H59 M50 55 V53 M39 44 H41 M57.8 36.2 L56.4 37.6 M42.2 36.2 L43.6 37.6" />
    </g>
    <path d="M50 62 V74 M43 74 H57" stroke={p.metal} strokeWidth="3" strokeLinecap="round" fill="none" />
    <rect x="38" y="23" width="24" height="5" fill={p.metal} opacity="0.4" />
    <rect x="16" y="92" width="8" height="8" fill={p.body} />
    <rect x="76" y="92" width="8" height="8" fill={p.body} />
    {rim(p, 'M12 10 H88 V90')}
    {rim(p, 'M58 36 A11 11 0 0 1 58 52', 0.7, 1.2)}
  </>
);

const lamp: Draw = ({ p, v, animated }) => {
  const lit = animated ? styles.flicker : undefined;
  switch (v) {
    case 'floor':
      return (
        <>
          <g className={lit}>{halo(p, 50, 10, 44)}</g>
          <path d="M38 0 H62 L71 19 H29 Z" fill="#f2cd7a" opacity="0.82" />
          <path d="M38 0 H62 L64 5 H36 Z" fill={p.edge} opacity="0.35" />
          <ellipse cx="50" cy="19.5" rx="21" ry="2.4" fill={p.glow} opacity="0.7" />
          <rect x="48.6" y="19" width="2.8" height="75" fill={p.body} />
          <path d="M50 92 L34 100 M50 92 L66 100 M50 92 V100" stroke={p.body} strokeWidth="3" strokeLinecap="round" fill="none" />
          {rim(p, 'M51.4 22 V92', 0.55, 1.2)}
        </>
      );
    case 'banker':
      return (
        <>
          <g className={lit}>{halo(p, 50, 44, 34, 0.8)}</g>
          <path d="M48 60 C46 52 46 46 50 42" stroke={p.metal} strokeWidth="3" fill="none" />
          <path d="M20 42 C20 31 33 26 50 26 C67 26 80 31 80 42 Z" fill="#1f3a2a" />
          <path d="M24 34 C30 30 40 28 50 28" stroke="#7fbf8e" strokeOpacity="0.3" strokeWidth="1.4" fill="none" vectorEffect={NS} />
          <ellipse cx="50" cy="42.5" rx="29" ry="2.6" fill={p.glow} opacity="0.85" />
          <rect x="47.6" y="58" width="4.8" height="30" fill={p.metal} opacity="0.85" />
          <path d="M28 100 C28 92 36 88 50 88 C64 88 72 92 72 100 Z" fill={p.body} />
          {stroke(p.metal, 'M64 42 V52', 0.8, 1)}
          {rim(p, 'M50 26 C67 26 80 31 80 42', 0.6)}
          {rim(p, 'M64 89 C69 91 72 95 72 100', 0.6, 1.2)}
        </>
      );
    case 'street':
      return (
        <>
          <g className={lit}>{halo(p, 50, 16, 46)}</g>
          <rect x="47" y="28" width="6" height="70" fill={p.body} />
          <rect x="41" y="92" width="18" height="8" fill={p.body} />
          <path d="M38 28 H62 L58 6 H42 Z" fill="#f2cd7a" opacity="0.8" />
          <path d="M36 6 H64 L50 -2 Z" fill={p.body} />
          <path d="M38 28 H62 M42 6 L38 28 M58 6 L62 28 M50 6 V28" stroke={p.body} strokeWidth="1.6" fill="none" vectorEffect={NS} />
          {rim(p, 'M53 30 V92', 0.6, 1.2)}
        </>
      );
    case 'lantern':
      return (
        <>
          <g className={lit}>{halo(p, 50, 54, 40)}</g>
          <path d="M40 22 C40 10 60 10 60 22" stroke={p.body} strokeWidth="2.4" fill="none" />
          <rect x="34" y="22" width="32" height="8" rx="2" fill={p.body} />
          <ellipse cx="50" cy="56" rx="15" ry="22" fill="#f2cd7a" opacity="0.72" />
          <ellipse cx="50" cy="60" rx="4" ry="7" fill="#faf6ec" opacity="0.9" />
          <path d="M36 30 V84 M64 30 V84 M50 30 V84" stroke={p.body} strokeWidth="1.8" fill="none" vectorEffect={NS} />
          <rect x="32" y="82" width="36" height="16" rx="3" fill={p.body} />
          {rim(p, 'M66 30 V82', 0.6, 1.2)}
        </>
      );
    case 'chandelier':
      return (
        <>
          <g className={lit}>{halo(p, 50, 46, 48, 0.9)}</g>
          {stroke(p.body, 'M50 0 V30', 1, 2)}
          <ellipse cx="50" cy="40" rx="8" ry="10" fill={p.body} />
          <path d="M50 44 C36 56 20 52 14 40 M50 44 C64 56 80 52 86 40 M50 46 C42 60 32 60 28 50 M50 46 C58 60 68 60 72 50" stroke={p.body} strokeWidth="2.4" fill="none" />
          {[14, 28, 72, 86].map((x) => (
            <rect key={x} x={x - 1.5} y={x === 28 || x === 72 ? 44 : 34} width="3" height="6" fill={p.paper} opacity="0.6" />
          ))}
          {flame(p, 14, 31, 0.8, animated)}
          {flame(p, 28, 41, 0.8, animated)}
          {flame(p, 72, 41, 0.8, animated)}
          {flame(p, 86, 31, 0.8, animated)}
          {rim(p, 'M58 40 C58 46 55 50 50 50', 0.5, 1.2)}
        </>
      );
    default:
      return (
        <>
          <g className={lit}>{halo(p, 50, 26, 42)}</g>
          <path d="M34 8 H66 L77 40 H23 Z" fill="#f2cd7a" opacity="0.82" />
          <path d="M34 8 H66 L68 14 H32 Z" fill={p.edge} opacity="0.3" />
          <g stroke={p.edge} strokeOpacity="0.15" vectorEffect={NS}>
            <path d="M40 8 L34 40 M50 8 V40 M60 8 L66 40" />
          </g>
          <ellipse cx="50" cy="40.5" rx="27" ry="2.8" fill={p.glow} opacity="0.8" />
          <rect x="48" y="40" width="4" height="44" fill={p.body} />
          <circle cx="50" cy="60" r="4" fill={p.body} />
          <path d="M35 100 C35 90 41 84 50 84 C59 84 65 90 65 100 Z" fill={p.body} />
          {rim(p, 'M52 44 V82', 0.6, 1.2)}
          {rim(p, 'M58 85 C62 88 65 93 65 100', 0.7, 1.3)}
        </>
      );
  }
};

const mirror: Draw = ({ p, v, animated }) => {
  if (v === 'vanity') {
    return (
      <>
        <rect x="8" y="2" width="84" height="74" rx="2" fill={p.body} />
        <rect x="16" y="10" width="68" height="58" fill={p.glass} />
        <path d="M22 14 L44 14 L22 44 Z" fill="#ffffff" opacity="0.06" />
        <g className={animated ? styles.flicker : undefined}>
          {[16, 32, 50, 68, 84].map((x) => (
            <g key={x}>
              {halo(p, x, 6, 8, 0.8)}
              <circle cx={x} cy="6" r="2.6" fill="#f8e2ae" />
            </g>
          ))}
          {[22, 38, 54].map((y) => (
            <g key={y}>
              <circle cx="12" cy={y} r="2.6" fill="#f8e2ae" />
              <circle cx="88" cy={y} r="2.6" fill="#f8e2ae" />
            </g>
          ))}
        </g>
        <rect x="0" y="78" width="100" height="6" fill={p.body} />
        <rect x="4" y="84" width="5" height="16" fill={p.body} />
        <rect x="91" y="84" width="5" height="16" fill={p.body} />
        <rect x="30" y="72" width="8" height="6" rx="1" fill={p.glass} />
        <rect x="60" y="73" width="12" height="5" rx="2" fill={p.metal} opacity="0.6" />
        {rim(p, 'M0 78 H100')}
        {rim(p, 'M92 2 V76', 0.5, 1.2)}
      </>
    );
  }
  if (v === 'wide') {
    return (
      <>
        <rect x="0" y="0" width="100" height="100" rx="3" fill={p.body} />
        <rect x="6" y="8" width="88" height="84" fill={p.glass} />
        <path d="M12 12 L40 12 L12 60 Z" fill="#ffffff" opacity="0.06" />
        <path d="M60 88 L88 40 V60 L72 88 Z" fill="#ffffff" opacity="0.04" />
        {rim(p, 'M0 0 H100 V100', 0.65)}
      </>
    );
  }
  return (
    <>
      <ellipse cx="50" cy="52" rx="38" ry="44" fill={p.body} />
      <path d="M40 9 C44 2 56 2 60 9 Z" fill={p.body} />
      <ellipse cx="50" cy="52" rx="31" ry="37" fill={p.glass} />
      <path d="M30 34 L44 20 L48 24 L34 40 Z" fill="#ffffff" opacity="0.08" />
      <path d="M58 82 L72 62 L74 66 L62 84 Z" fill="#ffffff" opacity="0.05" />
      {rim(p, 'M76 22 A38 44 0 0 1 76 82')}
    </>
  );
};

const typewriter: Draw = ({ p }) => (
  <>
    <rect x="30" y="4" width="40" height="38" fill={p.paper} opacity="0.82" />
    <g stroke={p.edge} strokeOpacity="0.5" vectorEffect={NS}>
      <path d="M34 12 H64 M34 18 H66 M34 24 H58 M34 30 H62" />
    </g>
    <rect x="12" y="38" width="76" height="9" rx="4" fill={p.body} />
    <circle cx="11" cy="42" r="4.5" fill={p.body} />
    <circle cx="89" cy="42" r="4.5" fill={p.body} />
    {stroke(p.body, 'M14 38 L3 29', 1, 2.6)}
    <path d="M18 47 H82 L93 93 H7 Z" fill={p.body} />
    <g fill={p.mid}>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <circle key={`a${i}`} cx={26 + i * 6} cy="60" r="2" />
      ))}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <circle key={`b${i}`} cx={22 + i * 6.2} cy="70" r="2.1" />
      ))}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
        <circle key={`c${i}`} cx={18 + i * 6.4} cy="80" r="2.2" />
      ))}
      <rect x="32" y="86" width="36" height="3.4" rx="1.5" />
    </g>
    {rim(p, 'M18 47 H82 L93 93')}
    {rim(p, 'M12 38 H88', 0.5, 1.2)}
  </>
);

const barrel: Draw = ({ p }) => (
  <>
    <path d="M24 8 C13 30 13 76 24 98 H76 C87 76 87 30 76 8 Z" fill={p.body} />
    <ellipse cx="50" cy="8" rx="26" ry="4" fill={p.mid} />
    <g stroke={p.edge} strokeOpacity="0.55" fill="none" vectorEffect={NS}>
      <path d="M38 10 C33 40 33 66 38 96 M62 10 C67 40 67 66 62 96 M50 12 V96" />
    </g>
    <g stroke={p.metal} strokeOpacity="0.55" strokeWidth="2.4" fill="none">
      <path d="M20 22 C40 26 60 26 80 22" />
      <path d="M17 36 C39 40 61 40 83 36" />
      <path d="M17 72 C39 76 61 76 83 72" />
      <path d="M20 86 C40 90 60 90 80 86" />
    </g>
    {rim(p, 'M76 8 C87 30 87 76 76 98')}
    {rim(p, 'M24 8 C30 5 70 5 76 8', 0.5, 1.2)}
  </>
);

const crate: Draw = ({ p, v }) => {
  if (v === 'box') {
    return (
      <>
        <path d="M14 34 L4 22 L30 22 L36 34 Z M86 34 L96 22 L70 22 L64 34 Z" fill={p.mid} />
        <rect x="14" y="34" width="72" height="64" fill={p.body} />
        <rect x="44" y="34" width="12" height="30" fill={p.paper} opacity="0.2" />
        {stroke(p.edge, 'M14 52 H86', 0.5)}
        {rim(p, 'M14 34 H86 V98')}
      </>
    );
  }
  return (
    <>
      <path d="M10 30 L20 20 H96 L90 30 Z" fill={p.mid} />
      <path d="M90 30 L96 20 V88 L90 98 Z" fill="#05070c" />
      <rect x="10" y="30" width="80" height="68" fill={p.body} />
      <g stroke={p.edge} strokeOpacity="0.85" vectorEffect={NS}>
        <path d="M10 47 H90 M10 64 H90 M10 81 H90" />
      </g>
      <path d="M14 94 L86 34" stroke={p.mid} strokeWidth="6" />
      <rect x="10" y="30" width="6" height="68" fill={p.mid} />
      <rect x="84" y="30" width="6" height="68" fill={p.mid} />
      {rim(p, 'M10 30 H90 L96 20')}
      {rim(p, 'M90 30 V98', 0.55, 1.2)}
    </>
  );
};

const book: Draw = ({ p, v }) =>
  v === 'open' ? (
    <>
      <path d="M4 94 L17 70 H83 L96 94 Z" fill={p.body} />
      <path d="M9 91 L20 72 H50 V93 Z" fill={p.paper} opacity="0.78" />
      <path d="M50 93 V72 H80 L91 91 Z" fill={p.paper} opacity="0.7" />
      <g stroke={p.edge} strokeOpacity="0.4" vectorEffect={NS}>
        <path d="M22 76 H46 M20 80 H46 M18 84 H46 M16 88 H46 M54 76 H78 M54 80 H80 M54 84 H82 M54 88 H84" />
      </g>
      {stroke(p.edge, 'M50 72 V93', 0.8, 1.2)}
      {rim(p, 'M17 70 H83 L96 94', 0.6)}
    </>
  ) : (
    <>
      <rect x="14" y="82" width="72" height="14" fill={p.body} />
      <rect x="20" y="68" width="62" height="14" fill={p.mid} />
      <rect x="18" y="56" width="58" height="12" fill={p.body} transform="rotate(-3 47 62)" />
      <path d="M14 86 H86 M14 92 H86" stroke={p.paper} strokeOpacity="0.25" vectorEffect={NS} />
      <rect x="24" y="72" width="14" height="6" fill={p.metal} opacity="0.4" />
      {rim(p, 'M14 82 H86 V96')}
      {rim(p, 'M20 68 H82', 0.5, 1.2)}
    </>
  );

const stairs: Draw = ({ p }) => {
  const n = 8;
  let d = 'M0 100';
  let nosing = '';
  let balusters = '';
  for (let i = 0; i < n; i++) {
    const y = 100 - ((i + 1) * 84) / n;
    const x0 = (i * 100) / n;
    const x1 = ((i + 1) * 100) / n;
    d += ` V${y.toFixed(1)} H${x1.toFixed(1)}`;
    nosing += `M${x0.toFixed(1)} ${y.toFixed(1)}H${x1.toFixed(1)}`;
    const bx = x0 + 100 / n / 2;
    // The handrail runs from (2, 74) to (100, -8).
    const railY = 74 - ((bx - 2) * 82) / 98;
    balusters += `M${bx.toFixed(1)} ${y.toFixed(1)}V${railY.toFixed(1)}`;
  }
  d += ' V100 Z';
  return (
    <>
      <path d={d} fill={p.body} />
      <path d={balusters} stroke={p.body} strokeWidth="1.6" vectorEffect={NS} />
      <path d="M2 74 L100 -8" stroke={p.body} strokeWidth="3.4" vectorEffect={NS} />
      <rect x="0" y="62" width="6" height="38" fill={p.body} />
      <rect x="-1" y="58" width="8" height="5" fill={p.mid} />
      {rim(p, nosing, 0.4, 1.2)}
      {rim(p, 'M2 73 L100 -9', 0.7, 1.4)}
    </>
  );
};

const sink: Draw = ({ p }) => (
  <>
    <rect x="36" y="18" width="4" height="12" fill={p.metal} opacity="0.8" />
    <rect x="60" y="18" width="4" height="12" fill={p.metal} opacity="0.8" />
    <path d="M50 30 V20 H57" stroke={p.metal} strokeOpacity="0.8" strokeWidth="2.4" fill="none" />
    <rect x="12" y="30" width="76" height="5" rx="2" fill={p.mid} />
    <path d="M14 35 H86 C86 47 74 55 50 55 C26 55 14 47 14 35 Z" fill={p.body} />
    <path d="M40 55 H60 L64 96 H36 Z" fill={p.body} />
    <rect x="32" y="96" width="36" height="4" fill={p.body} />
    {rim(p, 'M12 30 H88')}
    {rim(p, 'M86 35 C86 47 74 55 60 55 L64 96', 0.55, 1.2)}
  </>
);

const bathtub: Draw = ({ p }) => (
  <>
    <rect x="2" y="36" width="96" height="7" rx="3" fill={p.mid} />
    <path d="M5 43 H95 C95 68 83 82 70 84 H30 C17 82 5 68 5 43 Z" fill={p.body} />
    <path d="M16 84 L12 98 M84 84 L88 98" stroke={p.body} strokeWidth="5" strokeLinecap="round" />
    <path d="M84 36 V24 H76" stroke={p.metal} strokeOpacity="0.8" strokeWidth="2.6" fill="none" />
    {rim(p, 'M2 36 H98')}
    {rim(p, 'M95 43 C95 68 83 82 70 84', 0.55, 1.2)}
  </>
);

const table: Draw = ({ p, v, animated }) => {
  if (v === 'round') {
    return (
      <>
        <ellipse cx="50" cy="40" rx="44" ry="9" fill={p.mid} />
        <path d="M6 40 C6 46 26 50 50 50 C74 50 94 46 94 40 V44 C94 50 74 55 50 55 C26 55 6 50 6 44 Z" fill={p.body} />
        <rect x="46" y="54" width="8" height="36" fill={p.body} />
        <path d="M50 90 L26 100 M50 90 L74 100 M50 90 V100" stroke={p.body} strokeWidth="4" strokeLinecap="round" />
        {rim(p, 'M6 40 C6 34 26 31 50 31 C74 31 94 34 94 40', 0.7)}
      </>
    );
  }
  const dining = v === 'dining';
  const work = v === 'work';
  return (
    <>
      <path d="M4 34 H96 L100 41 H0 Z" fill={p.mid} />
      <rect x="0" y="41" width="100" height="5" fill={p.body} />
      {dining ? (
        <>
          <path d="M0 40 H100 L99 74 C84 77 16 77 1 74 Z" fill={p.paper} opacity="0.22" />
          <path d="M12 46 C13 58 12 66 10 75 M30 46 C31 60 31 68 29 76 M70 46 C69 60 69 68 71 76 M88 46 C87 58 88 66 90 75" stroke={p.paper} strokeOpacity="0.12" fill="none" vectorEffect={NS} />
        </>
      ) : (
        <rect x="4" y="46" width="92" height="6" fill={p.body} />
      )}
      <rect x="4" y="46" width="5" height="54" fill={p.body} />
      <rect x="91" y="46" width="5" height="54" fill={p.body} />
      <rect x="15" y="46" width="3" height="40" fill={p.body} />
      <rect x="82" y="46" width="3" height="40" fill={p.body} />
      {work && (
        <>
          <rect x="9" y="76" width="82" height="3" fill={p.body} />
          <path d="M18 34 L20 24 H32 L34 34 Z M60 34 L61 27 H69 L70 34 Z" fill={p.body} />
          <path d="M26 24 C24 16 20 12 16 10 M26 24 C28 14 34 10 38 8 M65 27 C64 22 66 18 70 16" stroke={p.body} strokeWidth="1.6" fill="none" vectorEffect={NS} />
          <path d="M40 76 L42 70 H50 L52 76 Z M62 76 L63 71 H71 L72 76 Z" fill={p.mid} />
        </>
      )}
      {dining && (
        <>
          <ellipse cx="24" cy="37" rx="9" ry="1.8" fill={p.paper} opacity="0.35" />
          <ellipse cx="76" cy="37" rx="9" ry="1.8" fill={p.paper} opacity="0.35" />
          <rect x="49" y="16" width="2" height="20" fill={p.metal} />
          <path d="M42 22 C42 28 58 28 58 22" stroke={p.metal} strokeWidth="1.6" fill="none" />
          <rect x="41" y="14" width="2" height="8" fill={p.paper} opacity="0.7" />
          <rect x="57" y="14" width="2" height="8" fill={p.paper} opacity="0.7" />
          <rect x="49" y="10" width="2" height="6" fill={p.paper} opacity="0.7" />
          {flame(p, 42, 11.5, 0.6, animated)}
          {flame(p, 58, 11.5, 0.6, animated)}
          {flame(p, 50, 7.5, 0.6, animated)}
        </>
      )}
      {!dining && !work && (
        <>
          <rect x="62" y="28" width="16" height="6" fill={p.paper} opacity="0.35" transform="rotate(-4 70 31)" />
          <rect x="24" y="27" width="6" height="7" rx="1" fill={p.glass} />
        </>
      )}
      {rim(p, 'M4 34 H96 L100 41')}
      {rim(p, 'M96 46 V100', 0.5, 1.2)}
    </>
  );
};

const counter: Draw = ({ p }) => (
  <>
    <rect x="0" y="28" width="100" height="7" fill={p.mid} />
    <rect x="2" y="35" width="96" height="54" fill={p.body} />
    <g fill="none" stroke={p.edge} strokeOpacity="0.8" vectorEffect={NS}>
      <rect x="6" y="40" width="26" height="42" />
      <rect x="37" y="40" width="26" height="42" />
      <rect x="68" y="40" width="26" height="42" />
    </g>
    <rect x="0" y="86" width="100" height="2.4" fill={p.metal} opacity="0.7" />
    <path d="M16 20 L18 28 H24 L26 20 Z M70 16 L71 28 H75 L76 16 Z" fill={p.glass} />
    <ellipse cx="21" cy="24" rx="4" ry="1.4" fill={p.glow} opacity="0.5" />
    <rect x="44" y="12" width="5" height="16" rx="1" fill={p.body} />
    {rim(p, 'M0 28 H100')}
    {rim(p, 'M0 86 H100', 0.4, 1)}
  </>
);

const clock: Draw = ({ p, v, animated }) => {
  if (v === 'tall') {
    return (
      <>
        <path d="M22 8 L50 0 L78 8 Z" fill={p.body} />
        <rect x="26" y="8" width="48" height="24" fill={p.body} />
        <circle cx="50" cy="20" r="10" fill={p.paper} opacity="0.55" />
        {stroke(p.edge, 'M50 20 L45 15 M50 20 L50 12.5', 1, 1.4)}
        <rect x="33" y="32" width="34" height="50" fill={p.body} />
        <rect x="42" y="38" width="16" height="36" fill="#05070c" />
        <g className={animated ? styles.swing : undefined}>
          <path d="M50 38 V64" stroke={p.metal} strokeWidth="1" vectorEffect={NS} />
          <circle cx="50" cy="66" r="4" fill={p.metal} opacity="0.85" />
        </g>
        <rect x="27" y="82" width="46" height="16" fill={p.body} />
        <rect x="25" y="96" width="50" height="4" fill={p.mid} />
        {rim(p, 'M50 0 L78 8 V32')}
        {rim(p, 'M67 32 V82 M73 82 V96', 0.55, 1.2)}
      </>
    );
  }
  return (
    <>
      <circle cx="50" cy="50" r="44" fill={p.body} />
      <circle cx="50" cy="50" r="36" fill={p.paper} opacity="0.5" />
      <g stroke={p.edge} strokeOpacity="0.7" vectorEffect={NS}>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 6;
          return <path key={i} d={`M${50 + Math.cos(a) * 30} ${50 + Math.sin(a) * 30} L${50 + Math.cos(a) * 34} ${50 + Math.sin(a) * 34}`} />;
        })}
      </g>
      {stroke(p.edge, 'M50 50 L33 41 M50 50 L46 25', 1, 2.2)}
      <circle cx="50" cy="50" r="2.4" fill={p.edge} />
      {rim(p, 'M82 20 A44 44 0 0 1 82 80')}
    </>
  );
};

const gramophone: Draw = ({ p }) => (
  <>
    <path d="M58 56 C54 40 38 24 8 8 C2 20 4 36 10 44 C26 42 44 48 54 60 Z" fill={p.body} />
    <path d="M8 8 C2 20 4 36 10 44" stroke={p.metal} strokeOpacity="0.5" strokeWidth="1.6" fill="none" vectorEffect={NS} />
    <path d="M54 60 L62 58 L64 64" stroke={p.metal} strokeWidth="2.4" fill="none" />
    <path d="M16 66 H84 L80 71 H20 Z" fill={p.mid} />
    <ellipse cx="44" cy="66" rx="22" ry="2.6" fill={p.edge} />
    <rect x="20" y="71" width="60" height="25" fill={p.body} />
    <rect x="22" y="96" width="5" height="4" fill={p.body} />
    <rect x="73" y="96" width="5" height="4" fill={p.body} />
    <path d="M80 80 H90 V87" stroke={p.body} strokeWidth="2.4" fill="none" />
    {rim(p, 'M8 8 C38 24 54 40 58 56', 0.7)}
    {rim(p, 'M80 71 V96', 0.55, 1.2)}
  </>
);

const microphone: Draw = ({ p }) => (
  <>
    <ellipse cx="50" cy="97" rx="18" ry="3" fill={p.body} />
    <rect x="48.5" y="40" width="3" height="57" fill={p.body} />
    <path d="M37 36 C37 46 63 46 63 36" stroke={p.body} strokeWidth="3" fill="none" />
    <rect x="38" y="4" width="24" height="36" rx="11" fill={p.body} />
    <g stroke={p.mid} vectorEffect={NS}>
      <path d="M41 12 H59 M40 17 H60 M40 22 H60 M40 27 H60 M40 32 H60" />
    </g>
    <rect x="38" y="20" width="24" height="3" fill={p.metal} opacity="0.6" />
    {rim(p, 'M62 14 V32')}
    {rim(p, 'M51.5 44 V95', 0.45, 1)}
  </>
);

const rope: Draw = ({ p }) => (
  <>
    {[
      [88, 36, 10],
      [81, 32, 9],
      [74, 28, 8],
      [67, 23, 7],
    ].map(([cy, rx, ry]) => (
      <g key={cy}>
        <ellipse cx="50" cy={cy} rx={rx} ry={ry} fill="none" stroke={p.body} strokeWidth="6" />
        <ellipse cx="50" cy={cy} rx={rx} ry={ry} fill="none" stroke={p.rim} strokeOpacity="0.22" strokeWidth="1.4" strokeDasharray="2 3" vectorEffect={NS} />
      </g>
    ))}
    <ellipse cx="50" cy="67" rx="16" ry="4" fill={p.edge} />
    <path d="M84 90 C92 94 96 97 99 100" stroke={p.body} strokeWidth="5" fill="none" strokeLinecap="round" />
    {rim(p, 'M86 88 C86 82 80 80 78 80', 0.6, 1.2)}
  </>
);

const hat: Draw = ({ p }) => (
  <>
    <ellipse cx="50" cy="80" rx="46" ry="11" fill={p.body} />
    <path d="M22 80 C22 56 26 36 36 32 C42 30 46 36 50 36 C54 36 58 30 64 32 C74 36 78 56 78 80 Z" fill={p.body} />
    <path d="M22 70 C36 74 64 74 78 70 V77 C64 81 36 81 22 77 Z" fill={p.mid} />
    <path d="M44 34 C46 44 54 44 56 34" stroke={p.edge} strokeOpacity="0.7" fill="none" vectorEffect={NS} />
    {rim(p, 'M64 32 C74 36 78 56 78 70')}
    {rim(p, 'M82 74 C92 76 96 80 94 84', 0.6, 1.2)}
  </>
);

const bin: Draw = ({ p }) => (
  <>
    <circle cx="40" cy="40" r="10" fill={p.paper} opacity="0.62" />
    <circle cx="58" cy="36" r="9" fill={p.paper} opacity="0.55" />
    <circle cx="50" cy="45" r="8" fill={p.paper} opacity="0.66" />
    <g stroke={p.edge} strokeOpacity="0.5" fill="none" vectorEffect={NS}>
      <path d="M34 36 L42 42 L38 46 M54 32 L60 38 M46 44 L54 48" />
    </g>
    <path d="M22 44 H78 L70 99 H30 Z" fill={p.body} />
    <g stroke={p.mid} vectorEffect={NS}>
      <path d="M23 56 H77 M25 68 H75 M27 80 H73 M29 92 H71" />
      <path d="M36 44 L39 99 M50 44 V99 M64 44 L61 99" />
    </g>
    {rim(p, 'M22 44 H78 L70 99')}
  </>
);

const rug: Draw = ({ p }) => (
  <>
    <path d="M14 18 H86 L100 92 H0 Z" fill={p.fabric} />
    <path d="M14 18 H86 L100 92 H0 Z" fill="#000000" opacity="0.25" />
    <path d="M20 24 H80 L91 86 H9 Z" fill="none" stroke={p.metal} strokeOpacity="0.35" vectorEffect={NS} />
    <path d="M24 28 H76 L85 82 H15 Z" fill="none" stroke={p.metal} strokeOpacity="0.2" vectorEffect={NS} />
    <ellipse cx="50" cy="55" rx="17" ry="11" fill="none" stroke={p.metal} strokeOpacity="0.35" vectorEffect={NS} />
    <path d="M50 46 L60 55 L50 64 L40 55 Z" fill={p.metal} opacity="0.18" />
    <path d={Array.from({ length: 34 }, (_, i) => `M${(i * 100) / 33} 92 v5`).join('')} stroke={p.paper} strokeOpacity="0.3" vectorEffect={NS} />
    {rim(p, 'M14 18 H86', 0.25, 1)}
  </>
);

const ashtray: Draw = ({ p }) => (
  <>
    <path d="M58 70 C62 58 54 52 58 40 C62 30 56 22 60 14" stroke="#aab3c3" strokeOpacity="0.22" strokeWidth="2" fill="none" />
    <ellipse cx="50" cy="84" rx="32" ry="9" fill={p.body} />
    <ellipse cx="50" cy="82" rx="24" ry="5.6" fill={p.edge} />
    <rect x="40" y="76" width="22" height="3.6" fill={p.paper} opacity="0.7" transform="rotate(-12 51 78)" />
    <circle cx="61" cy="75.2" r="1.8" fill={p.glow} />
    {halo(p, 61, 75, 8, 0.6)}
    {rim(p, 'M18 84 C18 89 32 93 50 93 C68 93 82 89 82 84', 0.6, 1.2)}
  </>
);

const gun: Draw = ({ p }) => (
  <>
    <rect x="8" y="44" width="44" height="7" fill={p.body} />
    <rect x="6" y="42" width="4" height="3" fill={p.body} />
    <rect x="48" y="40" width="20" height="15" rx="3" fill={p.mid} />
    <path d="M50 40 H72 L76 46 L74 56 H50 Z" fill={p.body} />
    <path d="M70 41 L78 34 L81 38 L74 44 Z" fill={p.body} />
    <path d="M66 54 L82 54 C86 66 86 76 80 82 L70 82 C70 72 68 64 64 60 Z" fill={p.body} />
    <path d="M56 55 C56 64 66 64 66 55" stroke={p.body} strokeWidth="2.2" fill="none" />
    {rim(p, 'M8 44 H72 L76 46', 0.7, 1.2)}
    {rim(p, 'M82 54 C86 66 86 76 80 82', 0.5, 1.2)}
  </>
);

const knife: Draw = ({ p }) => (
  <>
    <path d="M8 82 L62 56 L66 62 L12 86 Z" fill="#aab3c3" opacity="0.5" />
    <path d="M62 54 L68 64" stroke={p.metal} strokeWidth="3.4" strokeLinecap="round" />
    <path d="M66 58 L90 46 C94 44 97 50 93 53 L68 64 Z" fill={p.body} />
    {rim(p, 'M8 82 L62 56', 0.9, 1.2)}
  </>
);

const key: Draw = ({ p }) => (
  <>
    <circle cx="24" cy="50" r="12" fill="none" stroke={p.metal} strokeWidth="6" />
    <rect x="35" y="47" width="54" height="6" fill={p.metal} />
    <rect x="74" y="53" width="6" height="11" fill={p.metal} />
    <rect x="83" y="53" width="5" height="8" fill={p.metal} />
    {rim(p, 'M35 47 H89', 0.7, 1.2)}
    {rim(p, 'M32 40 A12 12 0 0 1 34 58', 0.6, 1.2)}
  </>
);

const vase: Draw = ({ p }) => (
  <>
    <path d="M44 42 C40 28 32 18 26 14 M50 42 V8 M56 42 C60 28 68 20 74 16 M47 42 C46 30 40 24 38 22" stroke={p.body} strokeWidth="1.8" fill="none" />
    <circle cx="26" cy="13" r="6" fill={p.fabric} />
    <circle cx="50" cy="8" r="6.5" fill={p.paper} opacity="0.5" />
    <circle cx="74" cy="15" r="6" fill={p.fabric} />
    <circle cx="38" cy="21" r="4.5" fill={p.paper} opacity="0.4" />
    <path d="M38 100 C30 90 28 74 36 60 C40 52 40 46 38 40 H62 C60 46 60 52 64 60 C72 74 70 90 62 100 Z" fill={p.body} />
    {rim(p, 'M62 40 C60 46 60 52 64 60 C72 74 70 90 62 100')}
  </>
);

const umbrella: Draw = ({ p }) => (
  <g transform="rotate(-8 50 60)">
    <path d="M50 4 L62 72 C58 76 42 76 38 72 Z" fill={p.body} />
    <path d="M44 20 L42 70 M56 20 L58 70" stroke={p.edge} strokeOpacity="0.7" vectorEffect={NS} />
    <path d="M50 74 V90 C50 98 40 98 40 90" stroke={p.body} strokeWidth="4" fill="none" strokeLinecap="round" />
    {rim(p, 'M50 4 L62 72')}
  </g>
);

const radio: Draw = ({ p }) => (
  <>
    <path d="M14 100 V44 C14 18 30 6 50 6 C70 6 86 18 86 44 V100 Z" fill={p.body} />
    <path d="M24 66 V44 C24 26 36 16 50 16 C64 16 76 26 76 44 V66 Z" fill={p.mid} />
    <g stroke={p.body} strokeWidth="2.4">
      <path d="M36 66 V28 M44 66 V20 M50 66 V18 M56 66 V20 M64 66 V28" />
    </g>
    <rect x="34" y="74" width="32" height="8" rx="2" fill={p.glow} opacity="0.6" />
    <circle cx="26" cy="90" r="4" fill={p.mid} />
    <circle cx="74" cy="90" r="4" fill={p.mid} />
    {rim(p, 'M50 6 C70 6 86 18 86 44 V100')}
  </>
);

const curtain: Draw = ({ p }) => (
  <>
    <rect x="0" y="0" width="100" height="8" fill={p.body} />
    <path d="M0 6 H42 C40 30 36 50 30 62 C34 74 38 88 40 100 H0 Z" fill={p.fabric} />
    <path d="M100 6 H58 C60 30 64 50 70 62 C66 74 62 88 60 100 H100 Z" fill={p.fabric} />
    <g stroke="#000000" strokeOpacity="0.35" fill="none" vectorEffect={NS}>
      <path d="M10 8 C10 40 12 70 8 100 M22 8 C22 40 22 70 20 100 M32 8 C30 36 26 56 26 62" />
      <path d="M90 8 C90 40 88 70 92 100 M78 8 C78 40 78 70 80 100 M68 8 C70 36 74 56 74 62" />
    </g>
    <rect x="24" y="60" width="10" height="4" fill={p.metal} opacity="0.6" />
    <rect x="66" y="60" width="10" height="4" fill={p.metal} opacity="0.6" />
    {rim(p, 'M58 8 C60 30 64 50 70 62', 0.5, 1.2)}
  </>
);

const candle: Draw = ({ p, animated }) => (
  <>
    <rect x="45" y="26" width="10" height="44" fill={p.paper} opacity="0.62" />
    {flame(p, 50, 22, 1.6, animated)}
    <path d="M38 70 H62 L58 76 H42 Z" fill={p.metal} opacity="0.8" />
    <rect x="47" y="76" width="6" height="14" fill={p.metal} opacity="0.75" />
    <ellipse cx="50" cy="94" rx="16" ry="5" fill={p.metal} opacity="0.7" />
    {rim(p, 'M55 28 V70', 0.4, 1)}
  </>
);

const item: Draw = ({ p }) => (
  <>
    <ellipse cx="50" cy="98" rx="20" ry="2.4" fill="#000000" opacity="0.5" />
    <path d="M32 98 V80 C32 74 36 72 42 72 H58 C64 72 68 74 68 80 V98 Z" fill={p.body} />
    <path d="M32 82 H68" stroke={p.edge} strokeOpacity="0.8" vectorEffect={NS} />
    {halo(p, 70, 64, 12, 0.9)}
    <path d="M70 56 L71.6 62.4 L78 64 L71.6 65.6 L70 72 L68.4 65.6 L62 64 L68.4 62.4 Z" fill="#f8e2ae" opacity="0.9" />
    {rim(p, 'M42 72 H58 C64 72 68 74 68 80 V98')}
  </>
);

const DRAW: Record<PropKind, Draw> = {
  desk,
  cabinet,
  glass,
  decanter,
  bottle,
  letter,
  coat,
  window: windowProp,
  door,
  painting,
  piano,
  phone,
  bed,
  bookshelf,
  fireplace,
  plant,
  chair,
  sofa,
  case: caseProp,
  safe,
  lamp,
  mirror,
  typewriter,
  barrel,
  crate,
  book,
  stairs,
  sink,
  bathtub,
  table,
  counter,
  clock,
  gramophone,
  microphone,
  rope,
  hat,
  bin,
  rug,
  ashtray,
  gun,
  knife,
  key,
  vase,
  umbrella,
  radio,
  curtain,
  candle,
  item,
  ...OBJECT_DRAW,
  ...FIXTURE_DRAW,
};

/** Draw one prop fitted into its hotspot box. Returns an <svg> element to place inside the scene's SVG. */
export function renderProp({ label, box, paint, flip = false, animated = false, seed }: PropRenderOptions): ReactElement {
  const info = describeProp(label, box);
  const r = seededRandom(seed ?? hashString(label));
  // A kind can have extra looks in the second library; they win over the kind's own drawing.
  const draw = VARIANT_DRAW[info.kind]?.[info.variant] ?? DRAW[info.kind];
  const drawn = draw({ p: paint, v: info.variant, r, animated });
  return (
    <svg
      x={box.x}
      y={box.y}
      width={box.w}
      height={box.h}
      viewBox="0 0 100 100"
      preserveAspectRatio={info.fit}
      overflow="visible"
      aria-hidden="true"
    >
      {flip ? <g transform="translate(100 0) scale(-1 1)">{drawn}</g> : drawn}
    </svg>
  );
}
