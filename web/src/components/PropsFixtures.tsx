// Fixtures and furniture that the first prop library did not have (an elevator, a boiler, a soda
// fountain, a switchboard...), plus extra looks for kinds it did have: a dozen sorts of paper, a
// champagne bottle, a barred window, a wall telephone. Same rules as Props.tsx: a 100 x 100 box with
// the ground line at y = 100, dark shapes with a lamp-coloured rim.
import type { ReactNode } from 'react';
import { BLOOD, NS, STEEL, ground, halo, rim, stroke, type Draw, type PropPaint } from './propKit.tsx';

// ---------------------------------------------------------------------------
// New kinds

const tray: Draw = ({ p, v }) => {
  if (v === 'glasses') {
    return (
      <>
        {ground(50, 44)}
        <ellipse cx="50" cy="88" rx="46" ry="9" fill={STEEL} opacity="0.55" />
        <ellipse cx="50" cy="86" rx="40" ry="6.500" fill={p.edge} opacity="0.5" />
        {[24, 41, 59, 76].map((x, i) => (
          <g key={x}>
            <path d={`M${x} 84 V66`} stroke={p.paper} strokeOpacity="0.7" strokeWidth="1.400" />
            <ellipse cx={x} cy="84" rx="5" ry="1.600" fill={p.paper} opacity="0.6" />
            <path d={`M${x - 7} 44 H${x + 7} C${x + 7} 58 ${x + 3} 66 ${x} 66 C${x - 3} 66 ${x - 7} 58 ${x - 7} 44 Z`} fill={p.glass} opacity="0.85" />
            {i !== 2 && <path d={`M${x - 6} 52 H${x + 6} C${x + 5} 60 ${x + 2} 65 ${x} 65 C${x - 2} 65 ${x - 5} 60 ${x - 6} 52 Z`} fill={p.glow} opacity="0.45" />}
            {stroke('#ffffff', `M${x - 4.500} 47 V58`, 0.4, 1)}
          </g>
        ))}
        {rim(p, 'M8 90 C20 98 80 98 92 90', 0.8, 1.4)}
      </>
    );
  }
  if (v === 'silver') {
    return (
      <>
        {ground(50, 44)}
        <ellipse cx="50" cy="84" rx="46" ry="12" fill={STEEL} opacity="0.6" />
        <ellipse cx="50" cy="82" rx="38" ry="8" fill={p.edge} opacity="0.45" />
        <path d="M4 84 C-2 76 2 70 10 74 M96 84 C102 76 98 70 90 74" fill="none" stroke={STEEL} strokeOpacity="0.7" strokeWidth="3" />
        <rect x="38" y="72" width="26" height="14" fill={p.paper} opacity="0.8" transform="rotate(-8 50 79)" />
        {stroke(p.edge, 'M43 78 H58 M43 82 H54', 0.5)}
        {stroke('#ffffff', 'M18 80 C30 74 46 73 58 74', 0.5, 1.6)}
        {rim(p, 'M6 88 C22 98 78 98 94 88', 0.8, 1.4)}
      </>
    );
  }
  // letter: a stack of desk trays, in and out
  return (
    <>
      {ground(50, 40)}
      <rect x="14" y="80" width="72" height="16" rx="1.500" fill={p.body} />
      <rect x="14" y="52" width="72" height="14" rx="1.500" fill={p.body} />
      <path d="M18 66 V80 M82 66 V80" stroke={p.metal} strokeWidth="2.400" />
      <rect x="20" y="74" width="60" height="7" fill={p.paper} opacity="0.75" />
      <rect x="18" y="44" width="58" height="9" fill={p.paper} opacity="0.8" transform="rotate(-3 47 48)" />
      <rect x="26" y="40" width="54" height="7" fill={p.paper} opacity="0.6" transform="rotate(4 53 43)" />
      {stroke(p.edge, 'M24 48 H60 M30 43 H70', 0.45)}
      {rim(p, 'M14 52 H86 M14 80 H86', 0.7, 1.4)}
      {rim(p, 'M86 54 V66 M86 82 V96', 0.6, 1.2)}
    </>
  );
};

const bicycle: Draw = ({ p }) => (
  <>
    {ground(50, 46)}
    <g fill="none" stroke={p.body} strokeWidth="3.600">
      <circle cx="24" cy="74" r="22" />
      <circle cx="76" cy="74" r="22" />
    </g>
    <g fill="none" stroke={p.mid} strokeWidth="1" opacity="0.8">
      <path d="M24 52 V96 M2 74 H46 M8 58 L40 90 M8 90 L40 58" />
      <path d="M76 52 V96 M54 74 H98 M60 58 L92 90 M60 90 L92 58" />
    </g>
    <path d="M24 74 L42 42 H68 L50 74 Z M68 42 L76 74 M42 42 L50 74" fill="none" stroke={p.body} strokeWidth="4" strokeLinejoin="round" />
    <path d="M36 34 H50" stroke={p.body} strokeWidth="6" strokeLinecap="round" />
    <path d="M42 42 L40 34" stroke={p.body} strokeWidth="3.500" />
    <path d="M68 42 L64 26 H76" fill="none" stroke={p.body} strokeWidth="3.500" strokeLinecap="round" />
    <circle cx="50" cy="74" r="5" fill={p.metal} />
    {/* the delivery basket */}
    <rect x="70" y="30" width="20" height="13" rx="2" fill={p.mid} />
    {stroke(p.edge, 'M74 30 V43 M79 30 V43 M84 30 V43', 0.6)}
    {rim(p, 'M42 42 H68 L76 74', 0.8, 1.4)}
    {rim(p, 'M92 58 A22 22 0 0 1 96 82', 0.7, 1.4)}
  </>
);

const elevator: Draw = ({ p }) => (
  <>
    <rect x="2" y="2" width="96" height="98" fill={p.body} />
    <rect x="12" y="26" width="76" height="74" fill={p.edge} />
    <rect x="14" y="28" width="35" height="72" fill={p.mid} />
    <rect x="51" y="28" width="35" height="72" fill={p.mid} />
    <g fill="none" stroke={p.edge} strokeOpacity="0.8" vectorEffect={NS}>
      <rect x="19" y="34" width="25" height="26" />
      <rect x="19" y="66" width="25" height="28" />
      <rect x="56" y="34" width="25" height="26" />
      <rect x="56" y="66" width="25" height="28" />
    </g>
    {/* the floor dial */}
    <path d="M32 22 A18 18 0 0 1 68 22 Z" fill={p.metal} opacity="0.85" />
    {stroke(p.edge, 'M36 20 L38 17 M43 14 L44 10.500 M50 12 V8 M57 14 L56 10.500 M64 20 L62 17', 0.8)}
    <path d="M50 22 L60 11" stroke={BLOOD} strokeWidth="1.800" strokeLinecap="round" />
    <circle cx="50" cy="22" r="2" fill={p.edge} />
    <rect x="91" y="52" width="5" height="14" rx="1" fill={p.metal} />
    <circle cx="93.500" cy="56" r="1.300" fill={p.glow} />
    {rim(p, 'M2 2 H98', 0.6, 1.4)}
    {rim(p, 'M86 28 V100', 0.7, 1.4)}
    {rim(p, 'M49 28 V100', 0.35, 1)}
  </>
);

const musicstandShape: Draw = ({ p }) => (
  <>
    {ground(50, 26)}
    <path d="M50 54 V90 M50 90 L30 98 M50 90 L70 98 M50 90 V98" stroke={p.body} strokeWidth="3" strokeLinecap="round" fill="none" />
    <path d="M20 18 H80 L84 54 H16 Z" fill={p.body} />
    <rect x="24" y="20" width="24" height="31" fill={p.paper} opacity="0.85" transform="rotate(-2 36 35)" />
    <rect x="52" y="20" width="24" height="31" fill={p.paper} opacity="0.75" transform="rotate(2 64 35)" />
    {stroke(p.edge, 'M27 26 H45 M27 30 H45 M27 34 H45 M27 38 H45 M27 42 H45', 0.45)}
    {stroke(p.edge, 'M55 26 H73 M55 30 H73 M55 34 H73 M55 38 H73', 0.45)}
    <g fill={p.edge} opacity="0.7">
      <ellipse cx="31" cy="30" rx="1.600" ry="1.200" />
      <ellipse cx="37" cy="34" rx="1.600" ry="1.200" />
      <ellipse cx="42" cy="26" rx="1.600" ry="1.200" />
      <ellipse cx="60" cy="34" rx="1.600" ry="1.200" />
      <ellipse cx="67" cy="26" rx="1.600" ry="1.200" />
    </g>
    <rect x="15" y="52" width="70" height="4" fill={p.metal} opacity="0.8" />
    {rim(p, 'M80 18 L84 54', 0.8, 1.4)}
  </>
);

const bandstand: Draw = (c) => {
  const { p } = c;
  return (
    <>
      <rect x="0" y="72" width="100" height="28" fill={p.body} />
      <rect x="0" y="72" width="100" height="5" fill={p.mid} />
      {stroke(p.edge, 'M0 86 H100', 0.6)}
      <path d="M2 72 V40 H98 V72" fill="none" stroke={p.body} strokeWidth="3" />
      {stroke(p.body, 'M14 40 V72 M26 40 V72 M74 40 V72 M86 40 V72', 0.9, 2)}
      {/* bass drum with the band's name on it */}
      <circle cx="50" cy="56" r="17" fill={p.paper} opacity="0.75" />
      <circle cx="50" cy="56" r="17" fill="none" stroke={p.metal} strokeWidth="2.500" />
      {stroke(p.edge, 'M40 54 H60 M43 60 H57', 0.55, 1.4)}
      <g transform="translate(6 30) scale(0.42)">{musicstandShape(c)}</g>
      <g transform="translate(54 30) scale(0.42)">{musicstandShape(c)}</g>
      {rim(p, 'M0 72 H100', 0.8, 1.4)}
      {rim(p, 'M64 44 A17 17 0 0 1 67 62', 0.7, 1.2)}
    </>
  );
};

const grating: Draw = ({ p }) => (
  <>
    <rect x="4" y="10" width="92" height="80" rx="4" fill={p.body} />
    <rect x="10" y="16" width="80" height="68" fill="#000000" opacity="0.85" />
    {[18, 28, 38, 48, 58, 68, 78].map((x) => (
      <rect key={x} x={x} y="16" width="5" height="68" fill={p.mid} />
    ))}
    <rect x="10" y="46" width="80" height="5" fill={p.mid} />
    <g fill={p.metal} opacity="0.7">
      <circle cx="8" cy="14" r="1.800" />
      <circle cx="92" cy="14" r="1.800" />
      <circle cx="8" cy="86" r="1.800" />
      <circle cx="92" cy="86" r="1.800" />
    </g>
    {/* something caught between the bars */}
    <path d="M52 60 L58 72 L50 80 L46 66 Z" fill={p.paper} opacity="0.55" />
    {rim(p, 'M4 10 H96', 0.7, 1.4)}
    {rim(p, 'M23 16 V84 M43 16 V84 M63 16 V84 M83 16 V84', 0.3, 1)}
  </>
);

const reeds: Draw = ({ p }) => (
  <>
    {ground(50, 40, 3)}
    <g fill="none" stroke={p.body} strokeWidth="2.400" strokeLinecap="round">
      <path d="M20 98 C22 70 18 44 24 22" />
      <path d="M34 98 C34 68 40 40 36 12" />
      <path d="M50 98 C50 70 54 46 52 24" />
      <path d="M64 98 C62 72 70 50 68 18" />
      <path d="M80 98 C80 76 76 54 82 34" />
    </g>
    <g fill={p.body}>
      <path d="M14 98 C12 74 6 60 2 52 C12 62 18 76 20 98 Z" />
      <path d="M44 98 C46 76 56 62 62 56 C54 70 50 82 50 98 Z" />
      <path d="M72 98 C76 80 88 66 96 62 C86 74 80 84 78 98 Z" />
      <path d="M28 98 C26 82 30 70 34 64 C32 76 32 86 34 98 Z" />
    </g>
    <g fill={p.fabric}>
      <rect x="21" y="18" width="6" height="20" rx="3" />
      <rect x="33" y="8" width="6" height="22" rx="3" />
      <rect x="49" y="20" width="6" height="20" rx="3" />
      <rect x="65" y="14" width="6" height="22" rx="3" />
      <rect x="79" y="30" width="6" height="18" rx="3" />
    </g>
    {rim(p, 'M39 10 V28 M71 16 V34 M85 32 V46', 0.7, 1.2)}
  </>
);

const pond: Draw = ({ p }) => (
  <>
    <ellipse cx="50" cy="62" rx="50" ry="36" fill={p.body} />
    <ellipse cx="50" cy="60" rx="45" ry="31" fill={p.glass} />
    <ellipse cx="50" cy="60" rx="45" ry="31" fill="#000000" opacity="0.25" />
    {stroke(p.rim, 'M16 56 C24 52 34 52 42 55 M56 74 C66 70 78 71 86 74', 0.25, 1.4)}
    <g fill="#2d5b45" opacity="0.9">
      <path d="M24 66 a9 4.500 0 1 0 0.100 0 Z M30 66 L24 70.500 L31 73 Z" />
      <ellipse cx="62" cy="52" rx="10" ry="4.500" />
      <ellipse cx="74" cy="66" rx="8" ry="3.600" />
      <ellipse cx="40" cy="78" rx="9" ry="4" />
    </g>
    <g fill={p.paper} opacity="0.9">
      <path d="M62 50 l-4 -5 l4 2 l0 -6 l2 6 l4 -2 l-3 5 Z" />
      <path d="M40 76 l-3.500 -4.500 l3.500 1.800 l0 -5 l2 5 l3.500 -1.800 l-3 4.500 Z" />
    </g>
    {rim(p, 'M4 50 C16 28 84 28 96 50', 0.6, 1.4)}
  </>
);

const fountain: Draw = ({ p }) => (
  <>
    {/* the marble soda fountain: counter, draft arms, stools */}
    <rect x="0" y="34" width="100" height="8" fill={p.paper} opacity="0.55" />
    <rect x="2" y="42" width="96" height="58" fill={p.body} />
    {stroke(p.edge, 'M2 62 H98', 0.7)}
    <rect x="6" y="46" width="88" height="12" fill={p.mid} />
    {[22, 40, 58].map((x) => (
      <g key={x}>
        <rect x={x - 3} y="24" width="6" height="10" fill={STEEL} opacity="0.8" />
        <path d={`M${x} 24 V12 C${x} 6 ${x + 10} 6 ${x + 10} 12 V17`} fill="none" stroke={STEEL} strokeOpacity="0.85" strokeWidth="3" strokeLinecap="round" />
        <rect x={x - 1.500} y="4" width="3" height="6" rx="1.500" fill={p.edge} />
      </g>
    ))}
    <path d="M76 34 V16 H88 V34 Z" fill={p.glass} opacity="0.85" />
    {stroke(p.paper, 'M79 16 L77 6 M83 16 V5 M86 16 L88 7', 0.7, 1.2)}
    {[18, 50, 82].map((x) => (
      <g key={x}>
        <ellipse cx={x} cy="74" rx="11" ry="3.500" fill={p.fabric} />
        <rect x={x - 1.500} y="76" width="3" height="22" fill={STEEL} opacity="0.7" />
        <ellipse cx={x} cy="98" rx="7" ry="1.800" fill={STEEL} opacity="0.6" />
      </g>
    ))}
    {rim(p, 'M0 34 H100', 0.9, 1.6)}
    {rim(p, 'M98 42 V100', 0.6, 1.2)}
  </>
);

const wall: Draw = ({ p }) => (
  <>
    <rect x="0" y="0" width="100" height="100" fill={p.body} />
    <g stroke={p.edge} strokeOpacity="0.75" vectorEffect={NS}>
      {[14, 28, 42, 56, 70, 84].map((y, i) => (
        <path key={y} d={`M0 ${y} H100 ${[0, 1, 2, 3, 4].map((k) => `M${k * 25 + (i % 2 ? 12.500 : 0)} ${y - 14} V${y}`).join(' ')}`} />
      ))}
      <path d="M12.500 84 V100 M37.500 84 V100 M62.500 84 V100 M87.500 84 V100" />
    </g>
    {/* the part that was opened and bricked up again */}
    <path d="M38 28 H62.500 V42 H75 V70 H50 V56 H38 Z" fill={p.mid} />
    <path d="M38 28 H62.500 V42 H75 V70 H50 V56 H38 Z" fill="none" stroke={p.rim} strokeOpacity="0.5" strokeDasharray="3 3" vectorEffect={NS} />
    <path d="M46 84 C44 76 52 72 56 78 C60 84 54 92 46 84 Z" fill="#000000" opacity="0.4" />
    {rim(p, 'M0 0 H100', 0.4, 1.2)}
  </>
);

const boiler: Draw = ({ p, animated }) => (
  <>
    {ground(46, 40)}
    <path d="M18 98 V34 C18 16 78 16 78 34 V98 Z" fill={p.body} />
    {stroke(p.edge, 'M18 40 H78 M18 70 H78', 0.7)}
    <g fill={p.metal} opacity="0.7">
      {[22, 34, 46, 58, 70].map((x) => (
        <circle key={x} cx={x + 2} cy="40" r="1.300" />
      ))}
    </g>
    <rect x="32" y="74" width="32" height="18" rx="2" fill={p.edge} />
    <rect x="35" y="77" width="26" height="12" fill={p.glow} opacity={animated ? 0.75 : 0.6} />
    {stroke(p.edge, 'M41 77 V89 M48 77 V89 M55 77 V89', 0.9, 1.4)}
    {halo(p, 48, 83, 26, 1.200)}
    <circle cx="48" cy="54" r="10" fill={p.paper} opacity="0.8" />
    <circle cx="48" cy="54" r="10" fill="none" stroke={p.metal} strokeWidth="2" />
    <path d="M48 54 L54 47" stroke={BLOOD} strokeWidth="1.800" strokeLinecap="round" />
    <path d="M78 46 H92 V4 M30 22 V4" fill="none" stroke={p.body} strokeWidth="6" />
    <rect x="86" y="24" width="12" height="5" fill={p.metal} opacity="0.7" />
    <circle cx="84" cy="56" r="6" fill="none" stroke={BLOOD} strokeWidth="2.400" />
    {rim(p, 'M78 34 V98', 0.9, 1.6)}
    {rim(p, 'M48 20 C64 20 78 24 78 34', 0.6, 1.2)}
  </>
);

const switchboard: Draw = ({ p }) => (
  <>
    {ground(50, 42)}
    <rect x="10" y="4" width="80" height="62" rx="2" fill={p.body} />
    <rect x="6" y="66" width="88" height="10" fill={p.mid} />
    <rect x="12" y="76" width="76" height="22" fill={p.body} />
    {[14, 24, 34, 44].map((y) =>
      [18, 28, 38, 48, 58, 68, 78].map((x, i) => (
        <circle key={`${x}-${y}`} cx={x + 2} cy={y} r="2.200" fill={(x + y) % 3 === 0 ? p.glow : p.edge} opacity={(x + y + i) % 3 === 0 ? 0.95 : 0.8} />
      )),
    )}
    {halo(p, 40, 24, 10, 0.800)}
    <g fill="none" strokeWidth="1.800" strokeLinecap="round">
      <path d="M30 34 C28 52 22 60 20 68" stroke={BLOOD} />
      <path d="M60 24 C58 48 48 58 44 68" stroke={p.paper} strokeOpacity="0.8" />
      <path d="M70 44 C72 56 68 62 66 68" stroke="#3c5a96" />
    </g>
    {[20, 32, 44, 56, 66, 78].map((x) => (
      <rect key={x} x={x - 1.500} y="64" width="3" height="6" fill={p.metal} />
    ))}
    {/* the operator's headset on its hook */}
    <path d="M90 14 C102 14 102 40 92 40" fill="none" stroke={p.mid} strokeWidth="3" />
    <circle cx="92" cy="41" r="4" fill={p.edge} />
    {rim(p, 'M10 4 H90 V66', 0.8, 1.4)}
    {rim(p, 'M6 66 H94', 0.6, 1.2)}
  </>
);

const keyrack: Draw = ({ p }) => {
  const hooks: Array<[number, number, boolean]> = [];
  for (const y of [30, 62]) for (let i = 0; i < 6; i++) hooks.push([14 + i * 14.400, y, !(y === 62 && i === 3)]);
  return (
    <>
      <rect x="2" y="6" width="96" height="88" rx="2" fill={p.body} />
      <rect x="6" y="10" width="88" height="80" fill={p.mid} />
      <rect x="30" y="13" width="40" height="8" fill={p.paper} opacity="0.6" />
      {stroke(p.edge, 'M35 17 H65', 0.6)}
      {hooks.map(([x, y, full], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="1.800" fill={p.metal} />
          {full ? (
            <>
              <circle cx={x} cy={y + 6} r="3.500" fill="none" stroke={p.metal} strokeWidth="1.800" />
              <rect x={x - 1} y={y + 9} width="2" height="12" fill={p.metal} />
              <rect x={x + 1} y={y + 16} width="3" height="2" fill={p.metal} />
              <rect x={x - 5} y={y + 10} width="4.500" height="6" fill={p.paper} opacity="0.7" transform={`rotate(-12 ${x - 3} ${y + 13})`} />
            </>
          ) : (
            // the one key that is not on the board
            <circle cx={x} cy={y + 8} r="7" fill="none" stroke={p.rim} strokeOpacity="0.8" strokeDasharray="2.500 2.500" vectorEffect={NS} />
          )}
        </g>
      ))}
      {rim(p, 'M2 6 H98', 0.7, 1.4)}
      {rim(p, 'M98 6 V94', 0.5, 1.2)}
    </>
  );
};

const cart: Draw = ({ p, v }) => {
  if (v === 'trolley') {
    return (
      <>
        {ground(50, 42)}
        <rect x="12" y="40" width="76" height="6" fill={p.body} />
        <rect x="12" y="72" width="76" height="6" fill={p.body} />
        <path d="M14 36 V88 M86 36 V88" stroke={p.metal} strokeWidth="3" />
        <path d="M86 36 H96" stroke={p.metal} strokeWidth="3" strokeLinecap="round" />
        <circle cx="18" cy="92" r="6" fill={p.edge} />
        <circle cx="82" cy="92" r="6" fill={p.edge} />
        <path d="M30 40 V26 H42 V40 Z" fill={p.glass} opacity="0.85" />
        <ellipse cx="62" cy="38" rx="14" ry="3.500" fill={STEEL} opacity="0.7" />
        <path d="M50 38 C50 24 74 24 74 38 Z" fill={STEEL} opacity="0.6" />
        <rect x="26" y="62" width="28" height="10" fill={p.paper} opacity="0.7" />
        {rim(p, 'M12 40 H88 M12 72 H88', 0.8, 1.4)}
      </>
    );
  }
  // linen: the canvas laundry cart
  return (
    <>
      {ground(50, 44)}
      <path d="M14 30 C22 20 34 26 40 22 C50 14 62 26 70 20 C80 18 86 26 86 32 Z" fill={p.paper} opacity="0.8" />
      {stroke(p.edge, 'M26 30 C30 24 36 26 40 22 M54 30 C58 24 66 26 70 20', 0.4)}
      <path d="M8 30 H92 L84 82 H16 Z" fill={p.body} />
      {stroke(p.edge, 'M30 30 L32 82 M50 30 V82 M70 30 L68 82', 0.6)}
      <rect x="10" y="30" width="80" height="5" fill={p.metal} opacity="0.8" />
      <path d="M20 82 V90 M80 82 V90" stroke={p.metal} strokeWidth="3" />
      <circle cx="20" cy="93" r="5.500" fill={p.edge} />
      <circle cx="80" cy="93" r="5.500" fill={p.edge} />
      <circle cx="20" cy="93" r="2" fill={p.metal} />
      <circle cx="80" cy="93" r="2" fill={p.metal} />
      {rim(p, 'M92 30 L84 82', 0.9, 1.6)}
    </>
  );
};

const icebox: Draw = ({ p }) => (
  <>
    <rect x="6" y="8" width="88" height="86" rx="3" fill={p.body} />
    <rect x="4" y="2" width="92" height="8" rx="2" fill={p.mid} />
    <rect x="12" y="94" width="8" height="6" fill={p.body} />
    <rect x="80" y="94" width="8" height="6" fill={p.body} />
    <g fill="none" stroke={p.edge} strokeOpacity="0.85" vectorEffect={NS}>
      <rect x="11" y="14" width="78" height="30" />
      <rect x="11" y="48" width="38" height="42" />
      <rect x="51" y="48" width="38" height="42" />
    </g>
    <g fill={STEEL} opacity="0.85">
      <rect x="74" y="24" width="12" height="5" rx="1.500" />
      <rect x="38" y="64" width="9" height="5" rx="1.500" />
      <rect x="53" y="64" width="9" height="5" rx="1.500" />
    </g>
    {/* the door that was left ajar, and the cold coming out of it */}
    <path d="M51 48 L46 52 V94 L51 90 Z" fill={p.glass} opacity="0.9" />
    {stroke(p.paper, 'M40 96 C36 92 42 90 38 86 M46 98 C44 94 50 94 47 90', 0.35, 1.4)}
    {rim(p, 'M4 2 H96', 0.8, 1.4)}
    {rim(p, 'M94 10 V94', 0.7, 1.4)}
  </>
);

const booth: Draw = ({ p, animated }) => (
  <>
    {/* the control booth, seen through its window */}
    <rect x="0" y="6" width="100" height="78" fill={p.body} />
    <rect x="5" y="11" width="90" height="68" fill={p.glass} />
    <rect x="5" y="11" width="90" height="68" fill="#000000" opacity="0.35" />
    <path d="M5 11 L44 11 L18 79 L5 79 Z" fill="#ffffff" opacity="0.06" />
    <path d="M56 11 L70 11 L46 79 L32 79 Z" fill="#ffffff" opacity="0.04" />
    {/* the engineer */}
    <g fill={p.edge}>
      <ellipse cx="34" cy="42" rx="7" ry="8" />
      <path d="M18 79 C18 58 26 52 34 52 C42 52 50 58 50 79 Z" />
    </g>
    <path d="M26 40 C26 30 42 30 42 40" fill="none" stroke={p.mid} strokeWidth="2.400" />
    {/* the desk and its dials */}
    <rect x="46" y="62" width="46" height="17" fill={p.edge} />
    {[54, 64, 74, 84].map((x) => (
      <circle key={x} cx={x} cy="70" r="3" fill={p.metal} opacity="0.85" />
    ))}
    <rect x="62" y="18" width="28" height="11" rx="1.500" fill={BLOOD} opacity={animated ? 0.95 : 0.85} />
    {stroke('#ffe9e0', 'M66 23.500 H74 M77 20.500 V26.500 M80 20.500 H86 M80 26.500 H86', 0.9, 1.4)}
    <circle cx="76" cy="23.500" r="12" fill={BLOOD} opacity="0.14" />
    <rect x="0" y="84" width="100" height="16" fill={p.mid} />
    {rim(p, 'M0 6 H100', 0.8, 1.4)}
    {rim(p, 'M95 11 V79', 0.5, 1.2)}
  </>
);

export const FIXTURE_DRAW = {
  tray,
  bicycle,
  elevator,
  bandstand,
  musicstand: musicstandShape,
  grating,
  reeds,
  pond,
  fountain,
  wall,
  boiler,
  switchboard,
  keyrack,
  cart,
  icebox,
  booth,
} satisfies Record<string, Draw>;

export type FixtureKind = keyof typeof FIXTURE_DRAW;

// ---------------------------------------------------------------------------
// Extra looks for kinds the first library already had. Keyed by kind, then variant.

/** A sheet of paper with typed lines, the base of most documents. */
const sheet = (p: PropPaint, rot: number, lines: string, extra?: ReactNode) => (
  <g transform={`rotate(${rot} 50 50)`}>
    <rect x="23" y="11" width="58" height="80" fill="#000000" opacity="0.3" />
    <rect x="20" y="8" width="58" height="80" fill={p.paper} opacity="0.9" />
    <g stroke={p.edge} strokeOpacity="0.5" vectorEffect={NS}>
      <path d={lines} />
    </g>
    {extra}
    {rim(p, 'M20 8 H78', 0.5, 1.2)}
  </g>
);

const TYPED = 'M27 26 H71 M27 32 H69 M27 38 H71 M27 44 H62 M27 52 H71 M27 58 H66 M27 64 H70';

const letterVariants: Record<string, Draw> = {
  // a signed statement
  form: ({ p }) =>
    sheet(
      p,
      -4,
      TYPED,
      <>
        <rect x="27" y="14" width="30" height="6" fill={p.edge} opacity="0.6" />
        <path d="M30 78 C34 72 36 82 40 76 C44 70 46 82 52 76 C55 73 58 78 62 76" fill="none" stroke="#243b6e" strokeWidth="1.600" strokeLinecap="round" />
        {stroke(p.edge, 'M27 82 H66', 0.5)}
      </>,
    ),
  list: ({ p }) =>
    sheet(
      p,
      3,
      'M34 22 H70 M34 30 H66 M34 38 H71 M34 46 H60 M34 54 H68 M34 62 H64 M34 70 H70',
      <>
        <g fill={p.edge} opacity="0.7">
          {[22, 30, 38, 46, 54, 62, 70].map((y) => (
            <circle key={y} cx="28.500" cy={y} r="1.500" />
          ))}
        </g>
        <path d="M27 46 L29 49 L33 42" fill="none" stroke={BLOOD} strokeWidth="1.800" strokeLinecap="round" />
        <path d="M44 4 V16 C44 20 52 20 52 16 V7" fill="none" stroke={STEEL} strokeWidth="2" strokeLinecap="round" />
      </>,
    ),
  // a chit, an IOU, a deposit slip
  slip: ({ p }) => (
    <g transform="rotate(7 50 50)">
      <rect x="17" y="33" width="70" height="38" fill="#000000" opacity="0.3" />
      <rect x="14" y="30" width="70" height="38" fill={p.paper} opacity="0.9" />
      <path d="M26 30 V68" stroke={p.edge} strokeOpacity="0.5" strokeDasharray="2 2" vectorEffect={NS} />
      {stroke(p.edge, 'M32 38 H76 M32 45 H64', 0.5)}
      <rect x="58" y="52" width="20" height="10" fill="none" stroke={p.edge} strokeOpacity="0.6" vectorEffect={NS} />
      <path d="M32 58 C36 53 38 62 42 57 C45 53 47 60 52 57" fill="none" stroke="#243b6e" strokeWidth="1.600" strokeLinecap="round" />
      {rim(p, 'M14 30 H84', 0.5, 1.2)}
    </g>
  ),
  // an insurance policy, a deed: heavy paper with a seal
  policy: ({ p }) =>
    sheet(
      p,
      -3,
      'M32 34 H66 M32 40 H66 M32 46 H60 M32 52 H66',
      <>
        <rect x="24" y="12" width="50" height="72" fill="none" stroke={p.edge} strokeOpacity="0.55" strokeWidth="2" vectorEffect={NS} />
        <rect x="34" y="18" width="30" height="8" fill={p.edge} opacity="0.55" />
        <path d="M58 72 L54 90 L61 85 L66 91 L64 72 Z" fill={BLOOD} opacity="0.85" />
        <circle cx="61" cy="68" r="9" fill={BLOOD} />
        <circle cx="61" cy="68" r="5.500" fill="none" stroke="#ffd9dc" strokeOpacity="0.6" vectorEffect={NS} />
        <path d="M30 70 C33 66 35 74 38 70 C40 67 42 72 46 70" fill="none" stroke="#243b6e" strokeWidth="1.500" strokeLinecap="round" />
      </>,
    ),
  folder: ({ p }) => (
    <g transform="rotate(-5 50 50)">
      <rect x="20" y="20" width="56" height="60" fill={p.paper} opacity="0.85" transform="rotate(4 48 50)" />
      <rect x="22" y="18" width="54" height="62" fill={p.paper} opacity="0.7" transform="rotate(-3 49 49)" />
      <path d="M12 26 H40 L45 20 H70 L74 26 H88 V86 H12 Z" fill="#b08a4e" />
      <path d="M12 26 H88 V86 H12 Z" fill="#000000" opacity="0.12" />
      <rect x="28" y="44" width="44" height="16" fill={p.paper} opacity="0.9" />
      {stroke(p.edge, 'M33 50 H67 M33 55 H58', 0.6)}
      {rim(p, 'M12 26 H40 L45 20 H70 L74 26 H88 V86', 0.6, 1.2)}
    </g>
  ),
  envelope: ({ p }) => (
    <g transform="rotate(-6 50 50)">
      <rect x="13" y="31" width="80" height="50" fill="#000000" opacity="0.3" />
      <rect x="10" y="28" width="80" height="50" fill={p.paper} opacity="0.9" />
      <path d="M10 28 L50 56 L90 28" fill="none" stroke={p.edge} strokeOpacity="0.5" vectorEffect={NS} />
      <path d="M10 78 L38 52 M90 78 L62 52" fill="none" stroke={p.edge} strokeOpacity="0.3" vectorEffect={NS} />
      <rect x="70" y="33" width="14" height="16" fill={p.fabric} opacity="0.7" />
      {/* soaked through */}
      <path d="M10 62 C22 54 30 66 44 60 C58 54 70 70 90 60 V78 H10 Z" fill="#3c5a96" opacity="0.22" />
      {rim(p, 'M10 28 H90', 0.5, 1.2)}
    </g>
  ),
  telegram: ({ p }) => (
    <g transform="rotate(4 50 50)">
      <rect x="13" y="23" width="80" height="60" fill="#000000" opacity="0.3" />
      <rect x="10" y="20" width="80" height="60" fill="#d9c78f" opacity="0.92" />
      <rect x="10" y="20" width="80" height="11" fill={p.edge} opacity="0.6" />
      {stroke(p.paper, 'M16 25.500 H44', 0.8, 1.6)}
      {[38, 49, 60].map((y, i) => (
        <g key={y}>
          <rect x={15 + i * 2} y={y} width={62 - i * 8} height="7" fill="#fbf6ea" />
          {stroke(p.edge, `M${18 + i * 2} ${y + 3.500} H${72 - i * 6}`, 0.7, 1.4)}
        </g>
      ))}
      {rim(p, 'M10 20 H90', 0.5, 1.2)}
    </g>
  ),
  ticket: ({ p }) => {
    const stub = (rot: number, x: number, y: number, key: number) => (
      <g key={key} transform={`translate(${x} ${y}) rotate(${rot})`}>
        <path d="M0 0 H52 V9 A4 4 0 0 0 52 17 V26 H0 V17 A4 4 0 0 0 0 9 Z" fill={key ? '#c98d6a' : '#d9c78f'} />
        <path d="M14 2 V24" stroke={p.edge} strokeOpacity="0.5" strokeDasharray="2 2" vectorEffect={NS} />
        {stroke(p.edge, 'M20 9 H46 M20 15 H40', 0.6, 1.4)}
        {stroke(p.edge, 'M5 9 H10 M5 15 H10', 0.6, 1.4)}
      </g>
    );
    return (
      <>
        {stub(-14, 20, 34, 0)}
        {stub(10, 30, 52, 1)}
      </>
    );
  },
  // a till roll: the machine's own record of the evening
  tape: ({ p }) => (
    <>
      <path d="M38 4 H62 V74 C62 84 50 88 44 82 C38 76 44 68 50 70 C54 72 54 78 50 78" fill="none" stroke={p.paper} strokeOpacity="0.9" strokeWidth="2.400" />
      <path d="M38 4 H62 V74 C62 80 56 84 50 84 C44 84 38 80 38 74 Z" fill={p.paper} opacity="0.88" />
      <g stroke={p.edge} strokeOpacity="0.55" vectorEffect={NS}>
        {[12, 19, 26, 33, 40, 47, 54, 61].map((y) => (
          <path key={y} d={`M42 ${y} H50 M54 ${y} H58`} />
        ))}
      </g>
      <path d="M41 44 H59 V50 H41 Z" fill="none" stroke={BLOOD} strokeWidth="1.400" />
      {rim(p, 'M62 4 V74', 0.6, 1.2)}
    </>
  ),
  // loose pages cut from a book: old maps
  pages: ({ p }) => (
    <>
      <rect x="18" y="20" width="50" height="64" fill={p.paper} opacity="0.7" transform="rotate(-12 43 52)" />
      <rect x="26" y="16" width="50" height="64" fill={p.paper} opacity="0.8" transform="rotate(2 51 48)" />
      <g transform="rotate(10 58 50)">
        <rect x="34" y="16" width="50" height="64" fill="#e6d9b4" />
        <path d="M38 34 C46 26 54 40 62 32 C70 24 76 38 80 34 V62 C72 70 64 56 56 64 C48 72 44 60 38 66 Z" fill="#7fa3a0" opacity="0.5" />
        <path d="M40 46 C50 40 60 54 78 44" fill="none" stroke={BLOOD} strokeOpacity="0.7" strokeDasharray="3 2" vectorEffect={NS} />
        <circle cx="72" cy="26" r="5" fill="none" stroke={p.edge} strokeOpacity="0.6" vectorEffect={NS} />
        <path d="M72 20 V32 M66 26 H78" stroke={p.edge} strokeOpacity="0.6" vectorEffect={NS} />
        <path d="M34 16 V80" stroke={p.edge} strokeOpacity="0.5" strokeDasharray="1.500 2" vectorEffect={NS} />
        {rim(p, 'M34 16 H84', 0.5, 1.2)}
      </g>
    </>
  ),
  // a printed card: a dance program, a menu, a tally card
  card: ({ p }) => (
    <g transform="rotate(-5 50 50)">
      <rect x="21" y="15" width="64" height="76" fill="#000000" opacity="0.3" />
      <rect x="18" y="12" width="64" height="76" fill="#f3ead2" />
      <rect x="22" y="16" width="56" height="68" fill="none" stroke="#8a5a0c" strokeOpacity="0.7" vectorEffect={NS} />
      <path d="M40 26 H60 M36 31 H64" stroke="#8a5a0c" strokeWidth="2" strokeLinecap="round" />
      <path d="M50 36 l2 4 l4 0.500 l-3 3 l1 4 l-4 -2 l-4 2 l1 -4 l-3 -3 l4 -0.500 Z" fill="#8a5a0c" opacity="0.7" />
      {stroke(p.edge, 'M28 54 H72 M28 60 H72 M28 66 H72 M28 72 H72', 0.5)}
      <path d="M26 60 H74" stroke={BLOOD} strokeWidth="1.600" strokeOpacity="0.8" />
      {rim(p, 'M18 12 H82', 0.5, 1.2)}
    </g>
  ),
  crumpled: ({ p }) => (
    <>
      <ellipse cx="50" cy="84" rx="32" ry="4" fill="#000000" opacity="0.4" />
      <path d="M22 54 L30 32 L48 22 L66 28 L80 44 L76 66 L60 80 L38 78 L24 68 Z" fill={p.paper} opacity="0.9" />
      <g fill="#000000" opacity="0.14">
        <path d="M30 32 L48 22 L44 44 Z" />
        <path d="M66 28 L80 44 L58 46 Z" />
        <path d="M24 68 L38 78 L42 58 Z" />
        <path d="M76 66 L60 80 L56 60 Z" />
      </g>
      <path d="M44 44 L58 46 L56 60 L42 58 Z" fill="#ffffff" opacity="0.2" />
      {stroke(p.edge, 'M46 48 L56 49 M45 52 L55 53 M45 56 L52 57', 0.6)}
      {stroke(p.edge, 'M30 32 L44 44 M66 28 L58 46 M80 44 L58 46 M24 68 L42 58 M60 80 L56 60', 0.3)}
      {rim(p, 'M48 22 L66 28 L80 44 L76 66', 0.6, 1.2)}
    </>
  ),
  blotter: ({ p }) => (
    <>
      <rect x="4" y="30" width="92" height="50" rx="2" fill={p.body} />
      <rect x="10" y="35" width="80" height="40" fill="#d7e2cf" opacity="0.8" />
      <g fill={p.fabric}>
        <path d="M4 30 H20 L4 46 Z M96 30 H80 L96 46 Z M4 80 H20 L4 64 Z M96 80 H80 L96 64 Z" />
      </g>
      {/* what the last letter left behind, back to front */}
      <g transform="translate(100 0) scale(-1 1)" stroke="#243b6e" strokeOpacity="0.55" strokeWidth="1.400" fill="none" strokeLinecap="round">
        <path d="M24 46 C28 42 30 50 34 46 C38 42 40 50 46 46 M24 54 C30 50 34 58 40 54 C44 51 48 56 54 54" />
      </g>
      <circle cx="30" cy="62" r="4" fill="#243b6e" opacity="0.45" />
      <circle cx="37" cy="66" r="1.800" fill="#243b6e" opacity="0.45" />
      {rim(p, 'M4 30 H96', 0.7, 1.4)}
    </>
  ),
  spike: ({ p }) => (
    <>
      {ground(50, 26)}
      <rect x="28" y="88" width="44" height="9" rx="2" fill={p.body} />
      <path d="M50 88 V8" stroke={STEEL} strokeWidth="2.400" strokeLinecap="round" />
      {(
        [
          [70, -8],
          [60, 6],
          [50, -3],
          [40, 9],
        ] as Array<[number, number]>
      ).map(([y, a]) => (
        <g key={y} transform={`rotate(${a} 50 ${y})`}>
          <rect x="24" y={y - 4} width="52" height="9" fill={p.paper} opacity="0.88" />
          {stroke(p.edge, `M29 ${y} H44 M56 ${y} H70`, 0.5)}
        </g>
      ))}
      {rim(p, 'M72 90 V96', 0.6, 1.2)}
    </>
  ),
  passport: ({ p }) => (
    <g transform="rotate(-8 50 50)">
      <rect x="27" y="15" width="52" height="74" rx="3" fill="#000000" opacity="0.3" />
      <rect x="24" y="12" width="52" height="74" rx="3" fill="#1f3a5c" />
      <circle cx="50" cy="42" r="12" fill="none" stroke={p.metal} strokeWidth="2" />
      <path d="M50 30 V54 M38 42 H62 M42 34 C48 38 52 46 58 50" fill="none" stroke={p.metal} strokeOpacity="0.8" vectorEffect={NS} />
      <path d="M34 66 H66 M38 73 H62" stroke={p.metal} strokeWidth="2.400" strokeLinecap="round" />
      {rim(p, 'M76 15 V83', 0.6, 1.2)}
    </g>
  ),
};

const bookVariants: Record<string, Draw> = {
  // a ledger lying open, with the entry that matters underlined
  open: ({ p }) => (
    <>
      <ellipse cx="50" cy="92" rx="46" ry="4" fill="#000000" opacity="0.45" />
      <path d="M4 30 L50 38 L96 30 V84 L50 92 L4 84 Z" fill={p.body} />
      <path d="M8 27 C24 22 40 24 50 32 V86 C40 78 24 76 8 81 Z" fill={p.paper} opacity="0.94" />
      <path d="M92 27 C76 22 60 24 50 32 V86 C60 78 76 76 92 81 Z" fill={p.paper} opacity="0.86" />
      <g fill="none" stroke={p.edge} strokeOpacity="0.5" vectorEffect={NS}>
        {[36, 43, 50, 57, 64, 71].map((y) => (
          <path key={y} d={`M14 ${y - 3} C24 ${y - 6} 36 ${y - 5} 45 ${y} M55 ${y} C64 ${y - 5} 76 ${y - 6} 86 ${y - 3}`} />
        ))}
        <path d="M22 28 V78 M78 28 V78" strokeOpacity="0.3" />
      </g>
      <path d="M55 57 C64 52 76 51 86 54" fill="none" stroke={BLOOD} strokeWidth="1.800" strokeLinecap="round" />
      <path d="M50 32 V86" stroke={p.edge} strokeOpacity="0.5" strokeWidth="1.500" vectorEffect={NS} />
      <path d="M58 82 V96 L61 93 L64 96 V80 Z" fill={BLOOD} opacity="0.9" />
      {rim(p, 'M92 27 C76 22 60 24 50 32', 0.6, 1.2)}
      {rim(p, 'M96 30 V84', 0.6, 1.2)}
    </>
  ),
  // one book, shut: a psalter, a pocket notebook, a day book
  closed: ({ p }) => (
    <g transform="rotate(-9 50 55)">
      <path d="M22 28 H78 C80 28 82 30 82 32 V82 H26 C22 82 20 80 20 76 V30 C20 29 21 28 22 28 Z" fill={p.body} />
      <path d="M26 78 H82 V84 H26 C23 84 22 82 22 81 C22 79 23 78 26 78 Z" fill={p.paper} opacity="0.85" />
      {stroke(p.edge, 'M26 81 H82', 0.4)}
      <rect x="20" y="28" width="7" height="50" fill={p.fabric} opacity="0.85" />
      <rect x="34" y="38" width="40" height="22" fill="none" stroke={p.metal} strokeOpacity="0.8" vectorEffect={NS} />
      <path d="M40 46 H68 M44 52 H64" stroke={p.metal} strokeWidth="1.800" strokeLinecap="round" />
      <path d="M62 78 V92 L65 89 L68 92 V78 Z" fill={BLOOD} opacity="0.9" />
      {rim(p, 'M22 28 H78 C80 28 82 30 82 32 V78')}
    </g>
  ),
};

const bottleVariants: Record<string, Draw> = {
  champagne: ({ p }) => (
    <>
      {ground(50, 22)}
      <path d="M34 100 V52 C34 40 44 38 45 26 V14 H55 V26 C56 38 66 40 66 52 V100 Z" fill="#1d3a2a" />
      <path d="M43 8 H57 V30 H43 Z" fill={p.metal} />
      <rect x="44" y="4" width="12" height="6" rx="2.500" fill={p.metal} />
      <rect x="37" y="62" width="26" height="24" fill={p.paper} opacity="0.85" />
      <path d="M41 70 H59 M43 76 H57" stroke="#8a5a0c" strokeWidth="1.600" strokeLinecap="round" />
      {/* a smear on the heavy end */}
      <path d="M36 88 C44 84 56 86 64 90 V100 H36 Z" fill={BLOOD} opacity="0.5" />
      {stroke('#ffffff', 'M38 48 V96', 0.2, 1.800)}
      {rim(p, 'M55 14 V26 C56 38 66 40 66 52 V100')}
    </>
  ),
};

const crateVariants: Record<string, Draw> = {
  parcel: ({ p }) => (
    <>
      {ground(50, 40)}
      <path d="M12 44 L50 34 L88 44 V92 L50 100 L12 92 Z" fill="#8a6a44" />
      <path d="M50 52 L88 44 V92 L50 100 Z" fill="#000000" opacity="0.28" />
      <path d="M12 44 L50 52 L88 44 L50 34 Z" fill="#ffffff" opacity="0.12" />
      <path d="M31 39 L69 48 V96 M69 39 L31 48 V96 M50 52 V100" fill="none" stroke={p.paper} strokeOpacity="0.85" strokeWidth="1.600" />
      <path d="M50 42 C44 34 40 38 46 42 C40 44 46 50 50 44 C54 50 60 44 54 42 C60 38 56 34 50 42 Z" fill={p.paper} opacity="0.85" />
      <rect x="18" y="62" width="24" height="15" fill={p.paper} opacity="0.85" transform="skewY(12)" />
      {rim(p, 'M50 34 L88 44 V92', 0.7, 1.4)}
    </>
  ),
  cashbox: ({ p }) => (
    <>
      {ground(50, 40)}
      <path d="M14 38 L84 26 L88 40 L18 52 Z" fill={p.mid} />
      <path d="M40 34 C40 24 60 22 60 31" fill="none" stroke={STEEL} strokeWidth="3" strokeOpacity="0.8" />
      <rect x="14" y="52" width="72" height="44" rx="2" fill={p.body} />
      <rect x="18" y="56" width="64" height="36" fill="none" stroke={p.edge} strokeOpacity="0.8" vectorEffect={NS} />
      <rect x="44" y="60" width="12" height="14" rx="2" fill={STEEL} opacity="0.8" />
      <circle cx="50" cy="65" r="2" fill={p.edge} />
      <rect x="49" y="66" width="2" height="5" fill={p.edge} />
      {/* the slip that says how much should be in it */}
      <rect x="54" y="42" width="24" height="12" fill={p.paper} opacity="0.9" transform="rotate(-10 66 48)" />
      {rim(p, 'M14 38 L84 26', 0.8, 1.4)}
      {rim(p, 'M86 54 V96', 0.8, 1.4)}
    </>
  ),
};

const binVariants: Record<string, Draw> = {
  bucket: ({ p }) => (
    <>
      {ground(50, 34)}
      <path d="M22 40 C10 10 90 10 78 40" fill="none" stroke={STEEL} strokeOpacity="0.7" strokeWidth="2.400" />
      <path d="M18 40 H82 L74 96 H26 Z" fill={BLOOD} opacity="0.85" />
      <path d="M18 40 H82 L74 96 H26 Z" fill="#000000" opacity="0.3" />
      <ellipse cx="50" cy="40" rx="32" ry="7" fill={p.edge} />
      <ellipse cx="50" cy="41" rx="27" ry="5" fill="#b7a887" opacity="0.8" />
      {/* a white band, not the word FIRE: props are mirrored to face the lamp, and letters would read backwards */}
      <path d="M21.500 58 H78.500 L77 70 H23 Z" fill="#ffe9e0" opacity="0.55" />
      {rim(p, 'M82 40 L74 96', 0.9, 1.6)}
    </>
  ),
};

const ropeVariants: Record<string, Draw> = {
  cable: ({ p }) => (
    <>
      <ellipse cx="46" cy="86" rx="34" ry="4" fill="#000000" opacity="0.4" />
      <g fill="none" stroke={p.body} strokeWidth="6">
        <ellipse cx="44" cy="60" rx="30" ry="20" />
        <ellipse cx="46" cy="56" rx="24" ry="15" />
      </g>
      <g fill="none" stroke={p.rim} strokeOpacity="0.4" vectorEffect={NS}>
        <ellipse cx="44" cy="60" rx="30" ry="20" />
        <ellipse cx="46" cy="56" rx="24" ry="15" />
      </g>
      <path d="M72 52 C82 44 86 32 94 26" fill="none" stroke={p.body} strokeWidth="6" strokeLinecap="butt" />
      <path d="M22 72 C16 80 10 84 4 88" fill="none" stroke={p.body} strokeWidth="6" strokeLinecap="butt" />
      {/* cut clean: bare copper at both ends */}
      <circle cx="94" cy="26" r="3" fill="#d08a4a" />
      <circle cx="4" cy="88" r="3" fill="#d08a4a" />
    </>
  ),
  hooks: ({ p }) => (
    <>
      <path d="M0 14 C20 22 80 22 100 14" fill="none" stroke={p.body} strokeWidth="5" />
      {stroke(p.rim, 'M0 13 C20 21 80 21 100 13', 0.4, 1)}
      {[26, 52, 78].map((x, i) => (
        <g key={x}>
          <path d={`M${x} 20 V${50 + i * 8}`} stroke={p.body} strokeWidth="3.500" />
          <path d={`M${x} ${50 + i * 8} V${64 + i * 8} C${x} ${78 + i * 8} ${x - 14} ${78 + i * 8} ${x - 14} ${66 + i * 8}`} fill="none" stroke={STEEL} strokeOpacity="0.8" strokeWidth="3.500" strokeLinecap="round" />
        </g>
      ))}
    </>
  ),
  chain: ({ p }) => (
    <g fill="none" stroke={STEEL} strokeOpacity="0.8" strokeWidth="4">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <ellipse key={i} cx={14 + i * 14.400} cy={30 + i * 9} rx={i % 2 ? 4 : 9} ry={i % 2 ? 9 : 5} transform={`rotate(32 ${14 + i * 14.400} ${30 + i * 9})`} />
      ))}
      <path d="M2 22 L8 26" stroke={p.rim} strokeOpacity="0.6" strokeWidth="1.400" />
    </g>
  ),
};

const clockVariants: Record<string, Draw> = {
  // the paper dial out of a watchman's clock, punched at every station
  dial: ({ p }) => (
    <g transform="rotate(-8 50 50)">
      <circle cx="52" cy="53" r="40" fill="#000000" opacity="0.3" />
      <circle cx="50" cy="50" r="40" fill={p.paper} opacity="0.92" />
      <circle cx="50" cy="50" r="34" fill="none" stroke={p.edge} strokeOpacity="0.5" vectorEffect={NS} />
      <circle cx="50" cy="50" r="22" fill="none" stroke={p.edge} strokeOpacity="0.5" vectorEffect={NS} />
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2;
        return <path key={i} d={`M${50 + 34 * Math.cos(a)} ${50 + 34 * Math.sin(a)} L${50 + (i % 2 ? 31 : 28) * Math.cos(a)} ${50 + (i % 2 ? 31 : 28) * Math.sin(a)}`} stroke={p.edge} strokeOpacity="0.6" vectorEffect={NS} />;
      })}
      {/* the punches: regular, then a gap */}
      {[0, 1, 2, 3, 7, 8].map((i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        return <rect key={i} x={50 + 25 * Math.cos(a) - 1.800} y={50 + 25 * Math.sin(a) - 1.800} width="3.600" height="3.600" fill={p.edge} opacity="0.85" />;
      })}
      <path d="M50 50 L64.700 70.200 A25 25 0 0 1 28.300 62.500 Z" fill={BLOOD} opacity="0.18" />
      <circle cx="50" cy="50" r="4" fill={p.edge} />
      {rim(p, 'M78 22 A40 40 0 0 1 90 50', 0.5, 1.2)}
    </g>
  ),
  pocket: ({ p }) => (
    <>
      <path d="M50 16 C40 4 20 8 14 22 C8 36 20 44 18 58" fill="none" stroke={p.metal} strokeWidth="2" strokeDasharray="4 2.500" />
      <rect x="45" y="12" width="10" height="10" rx="2" fill={p.metal} />
      <circle cx="50" cy="8" r="5" fill="none" stroke={p.metal} strokeWidth="2.500" />
      <circle cx="50" cy="56" r="34" fill={p.metal} />
      <circle cx="50" cy="56" r="28" fill={p.paper} opacity="0.92" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <path key={i} d={`M${50 + 27 * Math.cos(a)} ${56 + 27 * Math.sin(a)} L${50 + 23 * Math.cos(a)} ${56 + 23 * Math.sin(a)}`} stroke={p.edge} strokeOpacity="0.7" strokeWidth="1.400" />;
      })}
      <path d="M50 56 L50 36 M50 56 L64 62" stroke={p.edge} strokeWidth="2.200" strokeLinecap="round" />
      {/* stopped: the glass is cracked */}
      {stroke(p.edge, 'M34 44 L46 52 L42 64 M46 52 L58 46', 0.5)}
      {rim(p, 'M74 32 A34 34 0 0 1 84 56', 0.9, 1.6)}
    </>
  ),
};

const doorVariants: Record<string, Draw> = {
  // a serving hatch in the wall
  hatch: ({ p }) => (
    <>
      <rect x="2" y="8" width="96" height="78" fill={p.body} />
      <rect x="9" y="15" width="82" height="60" fill="#000000" opacity="0.85" />
      <rect x="9" y="15" width="82" height="24" fill={p.mid} />
      {stroke(p.edge, 'M9 23 H91 M9 31 H91', 0.7)}
      <rect x="44" y="35" width="12" height="3.500" rx="1.500" fill={p.metal} />
      {/* what is waiting on the other side */}
      <ellipse cx="34" cy="71" rx="13" ry="3" fill={p.paper} opacity="0.7" />
      <path d="M24 70 C24 58 44 58 44 70 Z" fill={STEEL} opacity="0.55" />
      <rect x="60" y="54" width="9" height="19" fill={p.glass} />
      <rect x="0" y="75" width="100" height="9" fill={p.mid} />
      {rim(p, 'M0 75 H100', 0.9, 1.6)}
      {rim(p, 'M2 8 H98', 0.5, 1.2)}
    </>
  ),
  revolving: ({ p }) => (
    <>
      <path d="M4 100 V22 C4 8 96 8 96 22 V100 Z" fill={p.body} />
      <path d="M11 100 V26 C11 16 89 16 89 26 V100 Z" fill={p.glass} />
      <path d="M11 100 V26 C11 16 89 16 89 26 V100 Z" fill="#000000" opacity="0.3" />
      <path d="M50 16 V100" stroke={p.body} strokeWidth="4" />
      <path d="M50 22 L22 30 V100 M50 22 L80 28 V100" fill="none" stroke={p.body} strokeWidth="2.500" />
      <path d="M22 30 L50 22 L50 100 L22 100 Z" fill="#ffffff" opacity="0.06" />
      <path d="M26 62 H46 M54 60 H76" stroke={p.metal} strokeWidth="3" strokeLinecap="round" />
      {rim(p, 'M4 22 C4 8 96 8 96 22', 0.8, 1.4)}
      {rim(p, 'M96 22 V100', 0.6, 1.2)}
    </>
  ),
};

const windowVariants: Record<string, Draw> = {
  barred: ({ p }) => (
    <>
      <rect x="2" y="2" width="96" height="96" fill={p.body} />
      <rect x="9" y="9" width="82" height="82" fill={p.glass} />
      <path d="M9 9 L50 9 L20 91 L9 91 Z" fill="#ffffff" opacity="0.06" />
      <path d="M50 9 V91 M9 50 H91" stroke={p.body} strokeWidth="3" />
      {[20, 35, 50, 65, 80].map((x) => (
        <rect key={x} x={x - 2} y="4" width="4" height="92" fill={p.edge} />
      ))}
      <rect x="6" y="28" width="88" height="4" fill={p.edge} />
      <rect x="6" y="70" width="88" height="4" fill={p.edge} />
      {rim(p, 'M22 4 V96 M52 4 V96 M82 4 V96', 0.35, 1)}
      {rim(p, 'M2 98 H98', 0.6, 1.4)}
    </>
  ),
  // a counter window: tickets, prescriptions, wages
  ticket: ({ p }) => (
    <>
      <rect x="2" y="2" width="96" height="96" fill={p.body} />
      <path d="M12 84 V32 C12 10 88 10 88 32 V84 Z" fill={p.glass} />
      <path d="M12 84 V32 C12 10 88 10 88 32 V84 Z" fill={p.glow} opacity="0.12" />
      <g stroke={p.metal} strokeOpacity="0.8" strokeWidth="1.600">
        {[24, 36, 48, 60, 72].map((x) => (
          <path key={x} d={`M${x + 2} 16 V70`} />
        ))}
        <path d="M12 34 H88 M12 52 H88" />
      </g>
      <path d="M36 84 V70 H64 V84 Z" fill="#000000" opacity="0.8" />
      <rect x="0" y="84" width="100" height="8" fill={p.mid} />
      <rect x="34" y="4" width="32" height="8" fill={p.paper} opacity="0.6" />
      {stroke(p.edge, 'M39 8 H61', 0.6, 1.4)}
      {rim(p, 'M0 84 H100', 0.9, 1.6)}
    </>
  ),
};

const phoneVariants: Record<string, Draw> = {
  wall: ({ p }) => (
    <>
      <rect x="24" y="12" width="44" height="76" rx="3" fill={p.body} />
      <circle cx="37" cy="24" r="7" fill={p.metal} />
      <circle cx="55" cy="24" r="7" fill={p.metal} />
      <circle cx="46" cy="33" r="2.500" fill={p.edge} />
      <path d="M46 50 L30 44 L26 54 L46 58 Z" fill={p.edge} />
      <ellipse cx="27" cy="49" rx="4" ry="6.500" fill={p.mid} />
      <rect x="34" y="64" width="24" height="16" fill={p.mid} />
      {stroke(p.edge, 'M38 69 H54 M38 74 H50', 0.6)}
      {/* the receiver, off its hook */}
      <path d="M68 40 H78" stroke={p.metal} strokeWidth="3" strokeLinecap="round" />
      <path d="M76 44 C74 60 90 70 82 96" fill="none" stroke={p.edge} strokeWidth="1.800" />
      <path d="M76 84 L88 90 L86 98 L72 92 Z" fill={p.body} />
      {rim(p, 'M68 14 V86', 0.8, 1.4)}
      {rim(p, 'M60 18 A7 7 0 0 1 62 28', 0.8, 1.2)}
    </>
  ),
};

const chairVariants: Record<string, Draw> = {
  bench: ({ p }) => (
    <>
      {ground(50, 46)}
      <rect x="2" y="60" width="96" height="9" rx="2" fill={p.fabric} />
      <rect x="2" y="66" width="96" height="6" fill={p.body} />
      <rect x="4" y="30" width="92" height="24" rx="3" fill={p.body} />
      {stroke(p.edge, 'M27 32 V52 M50 32 V52 M73 32 V52', 0.6)}
      <g fill={p.metal} opacity="0.7">
        <circle cx="15" cy="42" r="1.500" />
        <circle cx="38" cy="42" r="1.500" />
        <circle cx="62" cy="42" r="1.500" />
        <circle cx="85" cy="42" r="1.500" />
      </g>
      <path d="M8 54 V60 M92 54 V60 M10 72 V98 M90 72 V98 M50 72 V98" stroke={p.body} strokeWidth="4.500" />
      {rim(p, 'M4 30 H96', 0.8, 1.4)}
      {rim(p, 'M2 60 H98', 0.7, 1.4)}
    </>
  ),
};

const cabinetVariants: Record<string, Draw> = {
  // one drawer, forced
  drawer: ({ p }) => (
    <>
      <rect x="0" y="0" width="100" height="100" fill={p.body} />
      <rect x="6" y="6" width="88" height="26" fill="none" stroke={p.edge} strokeOpacity="0.8" vectorEffect={NS} />
      <rect x="6" y="72" width="88" height="24" fill="none" stroke={p.edge} strokeOpacity="0.8" vectorEffect={NS} />
      <rect x="6" y="38" width="88" height="28" fill="#000000" opacity="0.8" />
      <rect x="10" y="44" width="88" height="28" fill={p.mid} />
      <rect x="14" y="40" width="50" height="6" fill={p.paper} opacity="0.7" />
      <rect x="44" y="54" width="20" height="5" rx="2.500" fill={p.metal} />
      <circle cx="78" cy="57" r="3.500" fill={p.metal} />
      <circle cx="78" cy="57" r="1.300" fill={p.edge} />
      {/* splinters round the lock */}
      {stroke(p.paper, 'M72 50 L76 54 M84 50 L81 54 M73 64 L76 60 M85 63 L81 60', 0.7, 1.4)}
      <rect x="44" y="16" width="20" height="5" rx="2.500" fill={p.metal} opacity="0.8" />
      <rect x="44" y="82" width="20" height="5" rx="2.500" fill={p.metal} opacity="0.8" />
      {rim(p, 'M10 44 H98', 0.8, 1.4)}
    </>
  ),
};

const paintingVariants: Record<string, Draw> = {
  // the building directory in a lobby: white letters on black felt
  directory: ({ p }) => (
    <>
      <rect x="2" y="2" width="96" height="96" fill={p.metal} opacity="0.85" />
      <rect x="8" y="8" width="84" height="84" fill="#000000" opacity="0.88" />
      <rect x="24" y="12" width="52" height="8" fill={p.metal} opacity="0.7" />
      <g stroke={p.paper} strokeOpacity="0.75" strokeWidth="1.800" strokeLinecap="round">
        {[28, 36, 44, 52, 60, 68, 76, 84].map((y, i) => (
          <path key={y} d={`M14 ${y} H${34 + ((i * 7) % 12)} M56 ${y} H${74 + ((i * 5) % 12)}`} />
        ))}
      </g>
      <g fill={p.paper} opacity="0.75">
        {[28, 36, 44, 52, 60, 68, 76, 84].map((y) => (
          <rect key={y} x="46" y={y - 1.500} width="4" height="3" />
        ))}
      </g>
      {/* one name taken down */}
      <rect x="54" y="57" width="34" height="6" fill="#000000" />
      {rim(p, 'M2 2 H98', 0.8, 1.4)}
      {rim(p, 'M98 2 V98', 0.5, 1.2)}
    </>
  ),
};

const caseVariants: Record<string, Draw> = {
  // a satchel: the delivery boy's bag, a postman's bag
  bag: ({ p }) => (
    <>
      {ground(50, 38)}
      <path d="M26 44 C22 10 78 10 74 44" fill="none" stroke={p.mid} strokeWidth="4" />
      <path d="M14 44 H86 C90 44 92 47 92 50 V90 C92 95 88 97 84 97 H16 C12 97 8 95 8 90 V50 C8 47 10 44 14 44 Z" fill={p.body} />
      <path d="M8 50 C8 47 10 44 14 44 H86 C90 44 92 47 92 50 V62 C80 76 20 76 8 62 Z" fill={p.mid} />
      <rect x="44" y="64" width="12" height="14" rx="2" fill={p.metal} />
      <rect x="47" y="68" width="6" height="5" fill={p.edge} />
      <path d="M10 66 C24 78 76 78 90 66" fill="none" stroke={p.rim} strokeOpacity="0.4" strokeDasharray="2.500 2.500" vectorEffect={NS} />
      <rect x="60" y="34" width="20" height="12" fill={p.paper} opacity="0.8" transform="rotate(-6 70 40)" />
      {rim(p, 'M86 44 C90 44 92 47 92 50 V90', 0.9, 1.6)}
    </>
  ),
};

const gunVariants: Record<string, Draw> = {
  // spent cartridges
  bullet: ({ p }) => {
    const round = (x: number, y: number, rot: number, key: number) => (
      <g key={key} transform={`translate(${x} ${y}) rotate(${rot})`}>
        <rect x="0" y="-7" width="36" height="14" rx="2" fill={p.metal} />
        <rect x="0" y="-8" width="4" height="16" rx="1" fill={p.metal} />
        <path d="M36 -6 C48 -6 54 -2 54 0 C54 2 48 6 36 6 Z" fill={STEEL} opacity="0.75" />
        {stroke('#ffffff', 'M6 -4 H32', 0.45, 1.4)}
      </g>
    );
    return (
      <>
        <ellipse cx="50" cy="80" rx="40" ry="4" fill="#000000" opacity="0.4" />
        {round(14, 40, 18, 0)}
        {round(30, 66, -12, 1)}
        <ellipse cx="14" cy="40" rx="2" ry="5" fill={p.edge} transform="rotate(18 14 40)" />
      </>
    );
  },
};

export const VARIANT_DRAW: Record<string, Record<string, Draw>> = {
  letter: letterVariants,
  book: bookVariants,
  bottle: bottleVariants,
  crate: crateVariants,
  bin: binVariants,
  rope: ropeVariants,
  clock: clockVariants,
  door: doorVariants,
  window: windowVariants,
  phone: phoneVariants,
  chair: chairVariants,
  cabinet: cabinetVariants,
  painting: paintingVariants,
  case: caseVariants,
  gun: gunVariants,
};
