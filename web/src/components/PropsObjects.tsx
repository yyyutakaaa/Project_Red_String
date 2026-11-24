// Small things a detective picks up: the kind of object a story turns on. Same rules as Props.tsx:
// a 100 x 100 box, ground line at y = 100, dark shapes with a lamp-coloured rim, colours from the
// scene's paint. Things that stand (a sack, a statuette) sit on the ground line; things that lie
// (a glove, a ring) are drawn around the middle of the box.
import { BLOOD, NS, PEARL, STEEL, ground, halo, rim, stroke, type Draw } from './propKit.tsx';

/** A four-point sparkle on something that catches the light. */
const glint = (x: number, y: number, s = 1) => (
  <path
    d={`M${x} ${y - 5 * s}L${x + 1.3 * s} ${y - 1.3 * s}L${x + 5 * s} ${y}L${x + 1.3 * s} ${y + 1.3 * s}L${x} ${y + 5 * s}L${x - 1.3 * s} ${y + 1.3 * s}L${x - 5 * s} ${y}L${x - 1.3 * s} ${y - 1.3 * s}Z`}
    fill="#fff6d8"
    opacity="0.9"
  />
);

const shoes: Draw = ({ p }) => {
  const pump = 'M18 70 C22 66 28 68 30 74 C32 80 36 84 42 85 L64 89 C76 91 84 94 84 98 L46 98 C44 93 40 89 34 88 L32 98 L23 98 Z';
  return (
    <>
      {ground(50, 44)}
      {/* drawn small, then enlarged from the ground line so the pair fills the picture */}
      <g transform="translate(-17 -34.300) scale(1.350)">
        <path d={pump} fill={p.mid} transform="translate(-9 -5)" />
        <path d={pump} fill={p.fabric} />
        {stroke('#ffffff', 'M44 87 L64 91 C72 92 78 94 81 96', 0.3, 1.4)}
        {rim(p, 'M18 70 C22 66 28 68 30 74 C32 80 36 84 42 85 L64 89 C76 91 84 94 84 98')}
        {stroke(p.edge, 'M23 98 H32 M46 98 H84', 0.8, 1.4)}
      </g>
    </>
  );
};

const glove: Draw = ({ p }) => (
  <g transform="rotate(-14 50 55)">
    <path
      d="M38 96 L36 58 C32 52 31 46 32 40 L32 26 a3.5 3.5 0 0 1 7 0 V38 h1.5 V17 a3.5 3.5 0 0 1 7 0 V38 h1.5 V14 a3.5 3.5 0 0 1 7 0 V38 h1.5 V20 a3.5 3.5 0 0 1 7 0 V44 C66 52 65 56 62 60 L62 96 Z"
      fill={p.paper}
      opacity="0.86"
    />
    <path d="M33 46 C27 44 22 38 23 33 a3.4 3.4 0 0 1 6.6 -1 L34 40 Z" fill={p.paper} opacity="0.86" />
    {stroke(p.edge, 'M41 60 C46 63 54 63 59 60 M40 72 C46 74 54 74 60 72 M40 84 C46 86 55 86 61 84', 0.45)}
    {stroke(p.edge, 'M42 40 V50 M50 40 V52 M57 40 V50', 0.35)}
    {/* the stain that makes it evidence */}
    <path d="M48 20 C54 18 60 24 62 32 C58 36 50 34 47 28 Z" fill={BLOOD} opacity="0.45" />
    {rim(p, 'M64.5 20 V44 C66 52 65 56 62 60 L62 96', 0.7, 1.4)}
  </g>
);

const mallet: Draw = ({ p, v }) => {
  if (v === 'rack') {
    return (
      <>
        {ground(50, 42)}
        <rect x="10" y="90" width="80" height="8" rx="1.5" fill={p.body} />
        <rect x="12" y="52" width="76" height="5" fill={p.body} />
        <path d="M14 57 V90 M86 57 V90" stroke={p.body} strokeWidth="4" />
        {[26, 42, 58, 74].map((x, i) => (
          <g key={x}>
            <rect x={x - 1.6} y="26" width="3.2" height="66" fill={p.mid} />
            <rect x={x - 9} y="16" width="18" height="10" rx="2" fill={p.body} />
            <rect x={x - 9} y="19" width="18" height="3" fill={[p.fabric, p.metal, p.glow, p.paper][i]} opacity="0.75" />
          </g>
        ))}
        {rim(p, 'M12 52 H88', 0.7, 1.4)}
        {rim(p, 'M65 16 H83 V26', 0.6, 1.2)}
      </>
    );
  }
  return (
    <>
      <path d="M16 88 L64 32" stroke={p.mid} strokeWidth="4.6" strokeLinecap="round" />
      {rim(p, 'M17 86 L63 32', 0.55, 1.2)}
      <g transform="rotate(41 68 27)">
        <rect x="48" y="18" width="40" height="18" rx="4" fill={p.body} />
        <rect x="54" y="18" width="5" height="18" fill={p.fabric} opacity="0.85" />
        <rect x="77" y="18" width="5" height="18" fill={p.fabric} opacity="0.85" />
        {rim(p, 'M52 18 H84 C87 18 88 20 88 22', 0.8, 1.4)}
        {/* what the pond did not wash off */}
        <path d="M82 22 C88 22 88 34 84 36 L80 36 Z" fill={BLOOD} opacity="0.55" />
      </g>
    </>
  );
};

const jewel: Draw = ({ p, v }) => {
  if (v === 'cufflink') {
    return (
      <>
        <ellipse cx="52" cy="80" rx="30" ry="4" fill="#000000" opacity="0.45" />
        <path d="M58 56 L74 70" stroke={p.metal} strokeWidth="4" strokeLinecap="round" />
        <rect x="66" y="66" width="24" height="7" rx="3.5" fill={p.metal} transform="rotate(24 78 70)" />
        <ellipse cx="42" cy="46" rx="24" ry="17" fill={p.metal} />
        <ellipse cx="42" cy="46" rx="18" ry="12" fill="none" stroke={p.edge} strokeOpacity="0.5" vectorEffect={NS} />
        {stroke(p.edge, 'M33 50 V42 M33 50 H39 M45 42 L49 50 L53 42', 0.75, 1.4)}
        {rim(p, 'M22 38 C28 30 50 27 62 36', 0.9, 1.6)}
        {glint(26, 36, 0.9)}
      </>
    );
  }
  if (v === 'ring') {
    return (
      <>
        <ellipse cx="50" cy="88" rx="26" ry="3.5" fill="#000000" opacity="0.45" />
        <ellipse cx="50" cy="62" rx="22" ry="24" fill="none" stroke={p.metal} strokeWidth="7" />
        <path d="M38 38 L44 26 H56 L62 38 L50 46 Z" fill="#dff0ff" opacity="0.92" />
        {stroke(p.edge, 'M38 38 H62 M44 26 L50 38 L56 26 M50 38 V46', 0.5)}
        {rim(p, 'M66 46 C74 56 74 72 64 82', 0.8, 1.6)}
        {glint(58, 28, 1.2)}
      </>
    );
  }
  if (v === 'necklace') {
    const beads = Array.from({ length: 17 }, (_, i) => {
      const t = i / 16;
      const x = 16 + t * 68;
      const y = 22 + Math.sin(t * Math.PI) * 52;
      return [x, y] as const;
    });
    return (
      <>
        {beads.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={i === 8 ? 6 : 4.2} fill={PEARL} opacity="0.92" />
        ))}
        {beads.map(([x, y], i) => (
          <circle key={`s${i}`} cx={x - 1.2} cy={y - 1.4} r="1.2" fill="#ffffff" opacity="0.8" />
        ))}
        <rect x="11" y="17" width="7" height="7" rx="2" fill={p.metal} />
        <rect x="82" y="17" width="7" height="7" rx="2" fill={p.metal} />
        {glint(50, 66, 1)}
      </>
    );
  }
  if (v === 'box') {
    return (
      <>
        {ground(50, 34)}
        <path d="M20 44 L78 30 L82 46 L24 60 Z" fill={p.body} />
        <path d="M24 49 L78 36" stroke={p.fabric} strokeWidth="6" opacity="0.7" />
        <rect x="18" y="60" width="64" height="36" rx="3" fill={p.body} />
        <rect x="23" y="64" width="54" height="13" rx="2" fill={p.fabric} opacity="0.85" />
        <circle cx="40" cy="70" r="4.5" fill={p.metal} />
        <circle cx="60" cy="70" r="4.5" fill={p.metal} />
        <rect x="46" y="80" width="8" height="6" rx="1" fill={p.metal} opacity="0.8" />
        {rim(p, 'M20 44 L78 30')}
        {rim(p, 'M82 62 V94', 0.7, 1.4)}
        {glint(60, 68, 0.7)}
      </>
    );
  }
  // earring: one pearl drop on a gold screw-back
  return (
    <>
      <ellipse cx="52" cy="92" rx="18" ry="3" fill="#000000" opacity="0.45" />
      <path d="M50 12 C40 12 38 24 46 26" stroke={p.metal} strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="29" r="5" fill={p.metal} />
      <path d="M50 34 V46" stroke={p.metal} strokeWidth="2.4" />
      <path d="M43 50 C43 45 57 45 57 50 Z" fill={p.metal} />
      <path d="M50 48 C62 56 68 68 64 78 C60 88 40 88 36 78 C32 68 38 56 50 48 Z" fill={PEARL} />
      <path d="M58 60 C63 68 62 78 56 83" stroke="#b9ad92" strokeWidth="3" fill="none" opacity="0.6" strokeLinecap="round" />
      <ellipse cx="44" cy="64" rx="4" ry="6" fill="#ffffff" opacity="0.8" />
      {glint(62, 56, 1)}
    </>
  );
};

const wallet: Draw = ({ p }) => (
  <g transform="rotate(-7 50 55)">
    <rect x="24" y="24" width="52" height="16" fill={p.paper} opacity="0.6" transform="rotate(-6 50 32)" />
    <rect x="30" y="20" width="40" height="18" rx="1.5" fill={p.paper} opacity="0.8" />
    {stroke(p.edge, 'M35 26 H52 M35 31 H60', 0.6)}
    <path d="M10 38 H90 C93 38 94 40 94 43 V80 C94 84 92 86 88 86 H12 C8 86 6 84 6 80 V43 C6 40 7 38 10 38 Z" fill={p.body} />
    <path d="M50 38 V86" stroke={p.edge} strokeOpacity="0.8" strokeWidth="2" vectorEffect={NS} />
    <path d="M10 43 H46 M54 43 H90 M10 81 H46 M54 81 H90" stroke={p.rim} strokeOpacity="0.45" strokeDasharray="2.5 2.5" vectorEffect={NS} />
    <rect x="58" y="52" width="26" height="17" rx="2" fill={p.mid} />
    {stroke(p.rim, 'M62 58 H78 M62 63 H72', 0.4)}
    {rim(p, 'M10 38 H90 C93 38 94 40 94 43 V80')}
  </g>
);

const photo: Draw = ({ p }) => (
  <g transform="rotate(-6 50 50)">
    <rect x="13" y="19" width="78" height="64" fill="#000000" opacity="0.35" />
    <rect x="10" y="16" width="78" height="64" fill={p.paper} opacity="0.94" />
    <rect x="15" y="21" width="68" height="46" fill={p.edge} />
    <rect x="15" y="21" width="68" height="46" fill={p.mid} opacity="0.55" />
    {/* two people who should not have been photographed together */}
    <g fill={p.edge}>
      <ellipse cx="38" cy="40" rx="7" ry="8" />
      <path d="M24 67 C24 54 30 50 38 50 C46 50 52 54 52 67 Z" />
      <ellipse cx="60" cy="38" rx="6.5" ry="7.5" />
      <path d="M48 67 C48 53 53 48 60 48 C68 48 74 53 74 67 Z" />
    </g>
    {rim(p, 'M43 35 C46 38 46 43 43 46', 0.7, 1.2)}
    {rim(p, 'M65 33 C68 36 68 41 65 44', 0.7, 1.2)}
    <path d="M15 21 L48 21 L26 67 L15 67 Z" fill="#ffffff" opacity="0.08" />
    {stroke(p.edge, 'M22 73 H60', 0.5)}
  </g>
);

const footprints: Draw = ({ p }) => {
  const steps: Array<[number, number, number]> = [
    [24, 82, -18],
    [44, 62, -12],
    [56, 40, -20],
    [76, 22, -14],
  ];
  return (
    <>
      {steps.map(([x, y, a], i) => (
        <g key={i} transform={`translate(${x + (i % 2 ? 7 : -7)} ${y}) rotate(${a})`} fill={p.paper} opacity={0.3 + i * 0.12}>
          <path d="M-5 -10 C-5 -16 5 -16 5 -10 C6 -3 4 2 0 3 C-4 2 -6 -3 -5 -10 Z" />
          <ellipse cx="0" cy="9.500" rx="3.6" ry="4.200" />
        </g>
      ))}
    </>
  );
};

const press: Draw = ({ p }) => (
  <>
    {ground(50, 38)}
    <rect x="16" y="86" width="68" height="11" rx="2" fill={p.body} />
    <rect x="22" y="30" width="7" height="58" fill={p.body} />
    <rect x="71" y="30" width="7" height="58" fill={p.body} />
    <rect x="18" y="24" width="64" height="9" rx="2" fill={p.body} />
    <rect x="46.500" y="12" width="7" height="50" fill={p.metal} opacity="0.9" />
    {stroke(p.edge, 'M46.500 36 H53.500 M46.500 41 H53.500 M46.500 46 H53.500 M46.500 51 H53.500 M46.500 56 H53.500', 0.7)}
    <rect x="28" y="62" width="44" height="8" rx="1" fill={p.mid} />
    <rect x="31" y="72" width="38" height="13" fill={p.fabric} opacity="0.8" />
    {stroke(p.paper, 'M32 76 H68 M32 80 H68', 0.45)}
    <rect x="26" y="8" width="48" height="5" rx="2.500" fill={p.metal} />
    <circle cx="26" cy="10.500" r="4.500" fill={p.metal} />
    <circle cx="74" cy="10.500" r="4.500" fill={p.metal} />
    {rim(p, 'M18 24 H82')}
    {rim(p, 'M78 33 V86', 0.7, 1.4)}
  </>
);

const sleeve: Draw = ({ p }) => (
  <>
    <circle cx="62" cy="52" r="32" fill={p.edge} />
    <g fill="none" stroke={p.rim} strokeOpacity="0.16" vectorEffect={NS}>
      <circle cx="62" cy="52" r="27" />
      <circle cx="62" cy="52" r="22" />
      <circle cx="62" cy="52" r="17" />
    </g>
    <circle cx="62" cy="52" r="11" fill={p.fabric} />
    <circle cx="62" cy="52" r="2" fill={p.edge} />
    {rim(p, 'M84 30 A32 32 0 0 1 92 62', 0.8, 1.4)}
    <g transform="rotate(-4 36 52)">
      <rect x="6" y="20" width="60" height="62" fill={p.paper} opacity="0.86" />
      <path d="M66 20 V82" stroke={p.edge} strokeOpacity="0.4" vectorEffect={NS} />
      <rect x="14" y="30" width="34" height="12" fill="#2f6b4a" opacity="0.65" />
      {stroke(p.edge, 'M14 50 H56 M14 56 H50 M14 62 H40', 0.5)}
      {rim(p, 'M6 20 H66', 0.5, 1.2)}
    </g>
  </>
);

const tag: Draw = ({ p, v }) => {
  if (v === 'badge') {
    return (
      <>
        <path d="M50 10 L80 20 V48 C80 68 66 82 50 90 C34 82 20 68 20 48 V20 Z" fill={p.metal} />
        <path d="M50 18 L73 26 V48 C73 63 62 74 50 81 C38 74 27 63 27 48 V26 Z" fill="none" stroke={p.edge} strokeOpacity="0.55" vectorEffect={NS} />
        <path d="M50 32 L54.500 44 L67 44 L57 52 L61 64 L50 57 L39 64 L43 52 L33 44 L45.500 44 Z" fill={p.edge} opacity="0.55" />
        {rim(p, 'M50 10 L80 20 V48 C80 68 66 82 50 90', 0.9, 1.6)}
        {glint(34, 28, 1)}
      </>
    );
  }
  if (v === 'coin') {
    return (
      <>
        <ellipse cx="50" cy="90" rx="34" ry="4" fill="#000000" opacity="0.45" />
        {[84, 77, 70].map((y) => (
          <g key={y}>
            <ellipse cx="42" cy={y} rx="22" ry="6" fill={p.metal} />
            <ellipse cx="42" cy={y - 1.500} rx="22" ry="6" fill="none" stroke={p.edge} strokeOpacity="0.5" vectorEffect={NS} />
          </g>
        ))}
        <circle cx="68" cy="52" r="20" fill={p.metal} />
        <circle cx="68" cy="52" r="15" fill="none" stroke={p.edge} strokeOpacity="0.5" vectorEffect={NS} />
        {stroke(p.edge, 'M63 46 H73 M68 46 V60 M63 60 H73', 0.6, 1.6)}
        {rim(p, 'M82 38 A20 20 0 0 1 86 60', 0.9, 1.6)}
        {glint(58, 40, 0.9)}
      </>
    );
  }
  return (
    <>
      <path d="M50 30 C38 16 26 10 16 14 C10 18 14 26 22 24" stroke={p.paper} strokeOpacity="0.7" strokeWidth="1.6" fill="none" />
      <g transform="rotate(14 50 58)">
        <path d="M36 28 H64 L74 40 V86 C74 89 72 90 70 90 H30 C28 90 26 89 26 86 V40 Z" fill={p.metal} />
        <circle cx="50" cy="38" r="4.500" fill={p.edge} />
        {stroke(p.edge, 'M34 52 H66 M34 60 H66 M34 68 H58 M34 76 H62', 0.6, 1.4)}
        {rim(p, 'M64 28 L74 40 V86', 0.9, 1.6)}
      </g>
      {glint(30, 46, 0.8)}
    </>
  );
};

const sack: Draw = ({ p }) => (
  <>
    {ground(50, 40)}
    <path d="M30 34 C20 44 12 66 16 84 C18 94 28 98 50 98 C72 98 82 94 84 84 C88 66 80 44 70 34 Z" fill={p.body} />
    <path d="M34 34 C30 26 34 18 40 16 L46 22 L52 14 L58 22 L64 16 C68 20 70 28 66 34 Z" fill={p.body} />
    <path d="M30 34 H70" stroke={p.paper} strokeOpacity="0.7" strokeWidth="2.4" />
    {stroke(p.edge, 'M30 50 C40 56 60 56 72 50 M24 68 C40 76 62 76 78 68', 0.45)}
    <rect x="36" y="58" width="28" height="18" fill={p.paper} opacity="0.5" />
    {stroke(p.edge, 'M40 64 H60 M40 70 H54', 0.6)}
    {/* spilled grain */}
    <g fill="#e58aa0" opacity="0.8">
      <circle cx="86" cy="96" r="1.600" />
      <circle cx="91" cy="94" r="1.400" />
      <circle cx="89" cy="98" r="1.300" />
      <circle cx="94" cy="97" r="1.500" />
      <circle cx="82" cy="98" r="1.300" />
    </g>
    {rim(p, 'M70 34 C80 44 88 66 84 84')}
  </>
);

const money: Draw = ({ p, v }) => {
  if (v === 'coins') return tag({ p, v: 'coin', r: Math.random, animated: false });
  if (v === 'chips') {
    return (
      <>
        {ground(50, 38)}
        {[
          [34, p.fabric],
          [62, p.metal],
        ].map(([x, c], k) =>
          [0, 1, 2, 3, 4].slice(0, k ? 3 : 5).map((i) => (
            <g key={`${k}-${i}`}>
              <ellipse cx={x as number} cy={92 - i * 7} rx="19" ry="5.500" fill={c as string} />
              <ellipse cx={x as number} cy={92 - i * 7} rx="19" ry="5.500" fill="none" stroke={p.paper} strokeOpacity="0.55" strokeDasharray="5 6" vectorEffect={NS} />
            </g>
          )),
        )}
        {rim(p, 'M52 60 C53 68 53 84 52 92', 0.6, 1.2)}
      </>
    );
  }
  const note = (rot: number, key: number) => (
    <g key={key} transform={`rotate(${rot} 50 78)`}>
      <rect x="20" y="34" width="60" height="30" fill="#5f7a5c" opacity="0.92" />
      <rect x="23" y="37" width="54" height="24" fill="none" stroke={p.paper} strokeOpacity="0.5" vectorEffect={NS} />
      <ellipse cx="50" cy="49" rx="8" ry="9" fill={p.paper} opacity="0.4" />
    </g>
  );
  return (
    <>
      {[-26, -9, 8, 24].map((a, i) => note(a, i))}
      <rect x="40" y="62" width="20" height="9" fill={p.paper} opacity="0.85" />
      {rim(p, 'M72 40 L82 60', 0.5, 1.2)}
    </>
  );
};

const spectacles: Draw = ({ p }) => (
  <>
    <ellipse cx="50" cy="74" rx="38" ry="3" fill="#000000" opacity="0.35" />
    <circle cx="30" cy="52" r="17" fill={p.glass} opacity="0.55" />
    <circle cx="70" cy="52" r="17" fill={p.glass} opacity="0.55" />
    <g fill="none" stroke={p.metal} strokeWidth="3">
      <circle cx="30" cy="52" r="17" />
      <circle cx="70" cy="52" r="17" />
      <path d="M47 50 C49 45 51 45 53 50" />
      <path d="M13 50 L4 40 M87 50 L96 40" strokeLinecap="round" />
    </g>
    {stroke('#ffffff', 'M22 44 L30 38 M62 44 L70 38', 0.5, 1.6)}
    {/* the cracked lens */}
    {stroke(p.paper, 'M70 52 L80 42 M70 52 L60 58 M70 52 L76 64', 0.6)}
  </>
);

const tool: Draw = ({ p, v }) => {
  if (v === 'crowbar') {
    return (
      <>
        <path d="M14 88 L74 24 C80 18 90 20 90 30" stroke={STEEL} strokeOpacity="0.75" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M14 88 L8 86 M14 88 L16 94" stroke={STEEL} strokeOpacity="0.75" strokeWidth="5" strokeLinecap="round" />
        {rim(p, 'M18 82 L74 22 C80 16 90 18 92 28', 0.7, 1.2)}
      </>
    );
  }
  if (v === 'shovel') {
    return (
      <>
        {ground(50, 20)}
        <rect x="47" y="14" width="6" height="56" fill={p.mid} />
        <path d="M40 6 H60 V14 H40 Z M46 6 V14 M54 6 V14" fill="none" stroke={p.mid} strokeWidth="4" />
        <path d="M34 66 H66 L64 90 C60 98 40 98 36 90 Z" fill={STEEL} opacity="0.6" />
        <path d="M36 82 C44 88 56 88 64 82 L64 90 C60 98 40 98 36 90 Z" fill={p.edge} opacity="0.55" />
        {rim(p, 'M53 14 V66 M66 66 L64 90', 0.8, 1.4)}
      </>
    );
  }
  if (v === 'axe') {
    return (
      <>
        <path d="M22 92 L66 22" stroke={p.mid} strokeWidth="5.500" strokeLinecap="round" />
        <path d="M58 14 L80 26 C88 36 86 50 78 56 C74 44 66 38 54 36 Z" fill={STEEL} opacity="0.7" />
        <path d="M80 26 C88 36 86 50 78 56" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1.600" fill="none" />
        {rim(p, 'M24 90 L66 24', 0.6, 1.2)}
      </>
    );
  }
  if (v === 'hammer') {
    return (
      <>
        <path d="M20 90 L62 36" stroke={p.mid} strokeWidth="5.500" strokeLinecap="round" />
        <g transform="rotate(38 66 30)">
          <rect x="46" y="20" width="34" height="16" rx="2" fill={p.body} />
          <path d="M80 20 C90 18 94 24 94 28 L86 30 L80 36 Z" fill={p.body} />
          {rim(p, 'M46 20 H80 C90 18 94 24 94 28', 0.8, 1.4)}
        </g>
        {rim(p, 'M22 88 L62 38', 0.6, 1.2)}
      </>
    );
  }
  // wrench
  return (
    <g transform="rotate(-38 50 50)">
      <rect x="22" y="45" width="52" height="10" rx="3" fill={STEEL} opacity="0.7" />
      <path d="M72 38 C82 34 92 40 92 50 C92 60 82 66 72 62 L72 56 H82 V44 H72 Z" fill={STEEL} opacity="0.7" />
      <circle cx="18" cy="50" r="11" fill={STEEL} opacity="0.7" />
      <circle cx="18" cy="50" r="4.500" fill={p.edge} />
      {rim(p, 'M22 45 H72 M72 38 C82 34 92 40 92 50', 0.8, 1.4)}
    </g>
  );
};

const instrument: Draw = ({ p, v }) => {
  if (v === 'violin') {
    return (
      <g transform="rotate(28 50 55)">
        <rect x="47.500" y="4" width="5" height="40" fill={p.edge} />
        <path d="M46 4 C44 0 56 0 54 4 Z" fill={p.mid} />
        <path d="M50 38 C62 38 68 46 64 56 C62 60 62 64 66 68 C74 78 68 94 50 94 C32 94 26 78 34 68 C38 64 38 60 36 56 C32 46 38 38 50 38 Z" fill={p.body} />
        <path d="M50 38 C62 38 68 46 64 56 C62 60 62 64 66 68 C74 78 68 94 50 94" fill={p.fabric} opacity="0.5" />
        {stroke(p.paper, 'M48.500 8 V84 M51.500 8 V84', 0.5, 0.8)}
        <rect x="44" y="74" width="12" height="3" fill={p.edge} />
        {stroke(p.edge, 'M41 60 C39 64 39 68 41 72 M59 60 C61 64 61 68 59 72', 0.8, 1.6)}
        {rim(p, 'M64 56 C62 60 62 64 66 68 C74 78 68 94 50 94', 0.8, 1.4)}
      </g>
    );
  }
  if (v === 'drum') {
    return (
      <>
        {ground(50, 40)}
        <path d="M18 52 V84 C18 92 82 92 82 84 V52 Z" fill={p.body} />
        <ellipse cx="50" cy="52" rx="32" ry="10" fill={p.paper} opacity="0.75" />
        <ellipse cx="50" cy="52" rx="32" ry="10" fill="none" stroke={p.metal} strokeWidth="2.500" />
        <path d="M18 80 C18 90 82 90 82 80" stroke={p.metal} strokeWidth="2.500" fill="none" />
        {stroke(p.metal, 'M26 60 L34 86 M42 62 L50 89 M58 62 L66 87 M74 59 L80 80', 0.6, 1.4)}
        <path d="M30 18 L62 50 M72 14 L44 50" stroke={p.paper} strokeOpacity="0.8" strokeWidth="2.400" strokeLinecap="round" />
        {rim(p, 'M82 52 V84', 0.7, 1.4)}
      </>
    );
  }
  // horn: a trumpet, seen from the side
  return (
    <g transform="rotate(-10 50 50)">
      <path d="M64 40 C78 38 88 30 94 22 V74 C88 66 78 58 64 56 Z" fill={p.metal} />
      <rect x="10" y="44" width="56" height="7" rx="3" fill={p.metal} />
      <path d="M24 51 H58 C66 51 66 68 58 68 H30 C22 68 22 51 30 51" fill="none" stroke={p.metal} strokeWidth="5" />
      {[34, 43, 52].map((x) => (
        <g key={x}>
          <rect x={x - 2.500} y="34" width="5" height="22" fill={p.metal} />
          <rect x={x - 3.500} y="30" width="7" height="5" rx="1.500" fill={p.paper} opacity="0.8" />
        </g>
      ))}
      <rect x="4" y="43" width="8" height="9" rx="2" fill={p.metal} />
      {rim(p, 'M64 40 C78 38 88 30 94 22', 0.9, 1.6)}
      {rim(p, 'M12 44 H62', 0.8, 1.2)}
    </g>
  );
};

const cards: Draw = ({ p, v }) => {
  if (v === 'dice') {
    const die = (x: number, y: number, rot: number, pips: Array<[number, number]>) => (
      <g transform={`translate(${x} ${y}) rotate(${rot})`}>
        <rect x="-16" y="-16" width="32" height="32" rx="6" fill={p.paper} opacity="0.92" />
        {pips.map(([px, py], i) => (
          <circle key={i} cx={px} cy={py} r="3.200" fill={p.edge} />
        ))}
      </g>
    );
    return (
      <>
        <ellipse cx="50" cy="88" rx="38" ry="4" fill="#000000" opacity="0.45" />
        {die(34, 62, -14, [[-8, -8], [0, 0], [8, 8]])}
        {die(68, 54, 18, [[-8, -8], [8, -8], [0, 0], [-8, 8], [8, 8]])}
      </>
    );
  }
  return (
    <>
      {[-24, -8, 8, 24].map((a, i) => (
        <g key={a} transform={`rotate(${a} 50 92)`}>
          <rect x="34" y="20" width="32" height="48" rx="3.500" fill={p.paper} opacity="0.94" />
          <rect x="34" y="20" width="32" height="48" rx="3.500" fill="none" stroke={p.edge} strokeOpacity="0.45" vectorEffect={NS} />
          {i % 2 === 0 ? (
            <path d="M50 37 C46 32 40 36 43 41 L50 49 L57 41 C60 36 54 32 50 37 Z" fill={BLOOD} />
          ) : (
            <path d="M50 34 C44 42 42 44 42 47 C42 51 48 51 49 48 L48 53 H52 L51 48 C52 51 58 51 58 47 C58 44 56 42 50 34 Z" fill={p.edge} />
          )}
          <circle cx="39" cy="26" r="1.800" fill={i % 2 === 0 ? BLOOD : p.edge} />
        </g>
      ))}
    </>
  );
};

const handcuffs: Draw = ({ p }) => (
  <>
    <ellipse cx="50" cy="84" rx="40" ry="3.500" fill="#000000" opacity="0.4" />
    <g fill="none" stroke={STEEL} strokeOpacity="0.8">
      <circle cx="26" cy="54" r="17" strokeWidth="6" />
      <circle cx="74" cy="54" r="17" strokeWidth="6" />
      <path d="M43 50 C46 46 50 46 52 50 C54 54 58 54 60 50" strokeWidth="3.500" />
    </g>
    <rect x="18" y="33" width="16" height="9" rx="2" fill={STEEL} opacity="0.85" />
    <rect x="66" y="33" width="16" height="9" rx="2" fill={STEEL} opacity="0.85" />
    <circle cx="26" cy="37.500" r="1.800" fill={p.edge} />
    <circle cx="74" cy="37.500" r="1.800" fill={p.edge} />
    {rim(p, 'M38 42 A17 17 0 0 1 42 62 M86 42 A17 17 0 0 1 90 62', 0.8, 1.4)}
  </>
);

const magnifier: Draw = ({ p }) => (
  <>
    <path d="M58 60 L86 90" stroke={p.body} strokeWidth="9" strokeLinecap="round" />
    <path d="M58 60 L66 68" stroke={p.metal} strokeWidth="9" />
    <circle cx="40" cy="42" r="26" fill={p.glass} opacity="0.6" />
    <circle cx="40" cy="42" r="26" fill="none" stroke={p.metal} strokeWidth="5" />
    {stroke('#ffffff', 'M24 34 C28 24 38 20 46 22', 0.55, 2)}
    {halo(p, 40, 42, 22, 0.9)}
    {rim(p, 'M62 28 A26 26 0 0 1 60 60', 0.8, 1.4)}
    {rim(p, 'M62 62 L88 88', 0.6, 1.2)}
  </>
);

const binoculars: Draw = ({ p }) => (
  <>
    {ground(50, 36)}
    <path d="M16 96 V46 C16 38 22 34 30 34 C38 34 44 38 44 46 V96 Z" fill={p.body} />
    <path d="M56 96 V46 C56 38 62 34 70 34 C78 34 84 38 84 46 V96 Z" fill={p.body} />
    <rect x="42" y="44" width="16" height="22" fill={p.mid} />
    <circle cx="50" cy="55" r="6" fill={p.metal} />
    <rect x="22" y="20" width="16" height="16" rx="3" fill={p.mid} />
    <rect x="62" y="20" width="16" height="16" rx="3" fill={p.mid} />
    <ellipse cx="30" cy="92" rx="13" ry="4" fill={p.glass} />
    <ellipse cx="70" cy="92" rx="13" ry="4" fill={p.glass} />
    {rim(p, 'M44 46 V96 M84 46 V96')}
    {rim(p, 'M38 20 V36 M78 20 V36', 0.6, 1.2)}
  </>
);

const medical: Draw = ({ p, v }) => {
  if (v === 'pills') {
    return (
      <>
        {ground(48, 40)}
        <g transform="rotate(62 40 70)">
          <rect x="26" y="38" width="28" height="48" rx="5" fill={p.glass} />
          <rect x="24" y="30" width="32" height="10" rx="2" fill={p.mid} />
          <rect x="29" y="52" width="22" height="20" fill={p.paper} opacity="0.6" />
          {stroke(p.edge, 'M33 58 H47 M33 64 H44', 0.6)}
          {rim(p, 'M54 40 V82', 0.8, 1.4)}
        </g>
        <g fill={p.paper} opacity="0.92">
          <ellipse cx="74" cy="92" rx="6" ry="3.500" />
          <ellipse cx="86" cy="86" rx="6" ry="3.500" transform="rotate(-30 86 86)" />
          <ellipse cx="92" cy="95" rx="5.500" ry="3.200" />
          <ellipse cx="66" cy="84" rx="5.500" ry="3.200" transform="rotate(20 66 84)" />
        </g>
      </>
    );
  }
  if (v === 'stethoscope') {
    return (
      <>
        <path d="M26 12 C22 34 30 46 44 50 C58 46 66 34 62 12" fill="none" stroke={p.body} strokeWidth="5" strokeLinecap="round" />
        <path d="M44 50 V70 C44 86 70 88 76 74" fill="none" stroke={p.body} strokeWidth="5" strokeLinecap="round" />
        <circle cx="26" cy="11" r="4" fill={p.metal} />
        <circle cx="62" cy="11" r="4" fill={p.metal} />
        <circle cx="78" cy="66" r="12" fill={STEEL} opacity="0.8" />
        <circle cx="78" cy="66" r="7" fill={p.mid} />
        {rim(p, 'M62 12 C66 34 58 46 44 50', 0.6, 1.2)}
        {rim(p, 'M86 57 A12 12 0 0 1 88 72', 0.8, 1.4)}
      </>
    );
  }
  // syringe
  return (
    <g transform="rotate(-34 50 50)">
      <rect x="34" y="42" width="40" height="16" rx="2" fill={p.glass} />
      <rect x="34" y="42" width="22" height="16" fill={p.glow} opacity="0.45" />
      <rect x="34" y="42" width="40" height="16" rx="2" fill="none" stroke={p.paper} strokeOpacity="0.6" vectorEffect={NS} />
      {stroke(p.paper, 'M42 42 V47 M50 42 V47 M58 42 V47 M66 42 V47', 0.6)}
      <rect x="74" y="47" width="8" height="6" fill={STEEL} opacity="0.85" />
      <path d="M82 50 H98" stroke={STEEL} strokeWidth="1.400" strokeLinecap="round" />
      <rect x="8" y="48" width="28" height="4" fill={STEEL} opacity="0.85" />
      <rect x="4" y="40" width="5" height="20" rx="1.500" fill={STEEL} opacity="0.85" />
      <rect x="30" y="38" width="5" height="24" rx="1.500" fill={STEEL} opacity="0.85" />
      {rim(p, 'M34 42 H74', 0.8, 1.2)}
      <circle cx="98" cy="50" r="1.600" fill={p.glow} opacity="0.9" />
    </g>
  );
};

const pipe: Draw = ({ p }) => (
  <>
    <path d="M30 26 C24 18 34 12 30 4 M40 24 C36 16 44 12 42 6" stroke={p.paper} strokeOpacity="0.35" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M16 36 H50 V62 C50 76 16 76 16 62 Z" fill={p.body} />
    <ellipse cx="33" cy="36" rx="17" ry="5" fill={p.edge} />
    <ellipse cx="33" cy="36" rx="12" ry="3" fill={p.glow} opacity="0.5" />
    <path d="M46 62 C58 70 72 62 96 50" fill="none" stroke={p.body} strokeWidth="7" strokeLinecap="round" />
    <path d="M82 56 L96 50" stroke={p.edge} strokeWidth="7" strokeLinecap="round" />
    {rim(p, 'M50 38 V62', 0.8, 1.4)}
    {rim(p, 'M52 62 C62 66 74 60 94 48', 0.6, 1.2)}
  </>
);

const statuette: Draw = ({ p, v }) => {
  if (v === 'trophy') {
    return (
      <>
        {ground(50, 30)}
        <rect x="30" y="86" width="40" height="12" rx="1.500" fill={p.body} />
        <rect x="36" y="89" width="28" height="6" fill={p.metal} opacity="0.7" />
        <rect x="45" y="66" width="10" height="20" fill={p.metal} />
        <path d="M30 22 H70 C70 46 62 60 50 66 C38 60 30 46 30 22 Z" fill={p.metal} />
        <path d="M30 28 C14 26 14 46 34 50 M70 28 C86 26 86 46 66 50" fill="none" stroke={p.metal} strokeWidth="4" />
        <ellipse cx="50" cy="22" rx="20" ry="4" fill={p.edge} opacity="0.7" />
        {rim(p, 'M70 22 C70 46 62 60 50 66', 0.9, 1.6)}
      </>
    );
  }
  // bust on a plinth: heavy, marble, just the right size for a hand
  return (
    <>
      {ground(50, 30)}
      <rect x="28" y="84" width="44" height="14" rx="1.500" fill={p.body} />
      <rect x="34" y="76" width="32" height="8" fill={p.mid} />
      <path d="M26 76 C28 60 38 56 44 54 V46 H56 V54 C62 56 72 60 74 76 Z" fill={p.paper} opacity="0.7" />
      <path d="M38 30 C38 16 62 16 62 30 C62 40 58 48 50 48 C42 48 38 40 38 30 Z" fill={p.paper} opacity="0.7" />
      <path d="M36 28 C36 12 64 12 64 28 C60 22 40 22 36 28 Z" fill={p.paper} opacity="0.5" />
      {stroke(p.edge, 'M45 34 H48 M52 34 H55 M50 36 V40 M46 43 H54', 0.5)}
      <path d="M56 54 C62 56 72 60 74 76 H62 C62 66 60 60 56 58 Z" fill={BLOOD} opacity="0.35" />
      {rim(p, 'M62 30 C62 40 58 48 56 48 V54 C62 56 72 60 74 76')}
    </>
  );
};

const reel: Draw = ({ p }) => (
  <>
    <path d="M70 70 C84 74 92 84 96 96 H86 C84 88 76 80 66 78 Z" fill={p.edge} />
    <path d="M72 73 C82 77 88 86 91 96" stroke={p.paper} strokeOpacity="0.5" strokeDasharray="2 3" fill="none" vectorEffect={NS} />
    <circle cx="46" cy="50" r="38" fill={p.body} />
    <circle cx="46" cy="50" r="38" fill="none" stroke={p.metal} strokeWidth="3" />
    {[0, 72, 144, 216, 288].map((a) => (
      <circle key={a} cx={46 + 22 * Math.cos((a * Math.PI) / 180)} cy={50 + 22 * Math.sin((a * Math.PI) / 180)} r="9" fill={p.edge} />
    ))}
    <circle cx="46" cy="50" r="6" fill={p.metal} />
    <circle cx="46" cy="50" r="2" fill={p.edge} />
    {rim(p, 'M76 26 A38 38 0 0 1 82 62', 0.9, 1.6)}
  </>
);

const scale: Draw = ({ p, v }) => {
  if (v === 'mortar') {
    return (
      <>
        {ground(50, 34)}
        <path d="M70 18 L52 62" stroke={p.paper} strokeOpacity="0.8" strokeWidth="7" strokeLinecap="round" />
        <path d="M18 50 H82 C82 78 70 92 50 92 C30 92 18 78 18 50 Z" fill={p.body} />
        <rect x="34" y="90" width="32" height="8" rx="2" fill={p.body} />
        <ellipse cx="50" cy="50" rx="32" ry="6" fill={p.edge} />
        <ellipse cx="48" cy="52" rx="16" ry="2.500" fill={p.paper} opacity="0.45" />
        {rim(p, 'M82 50 C82 78 70 92 50 92', 0.9, 1.6)}
      </>
    );
  }
  return (
    <>
      {ground(50, 32)}
      <rect x="30" y="90" width="40" height="8" rx="2" fill={p.body} />
      <rect x="47" y="24" width="6" height="68" fill={p.metal} />
      <circle cx="50" cy="20" r="5" fill={p.metal} />
      <path d="M12 34 L88 26" stroke={p.metal} strokeWidth="3.500" strokeLinecap="round" />
      {stroke(p.metal, 'M14 34 L6 62 M14 34 L26 62 M86 26 L76 50 M86 26 L96 50', 0.8, 1.2)}
      <path d="M2 62 H30 C28 72 4 72 2 62 Z" fill={p.metal} />
      <path d="M72 50 H100 C98 60 74 60 72 50 Z" fill={p.metal} />
      <circle cx="16" cy="58" r="5" fill={p.paper} opacity="0.7" />
      {rim(p, 'M53 24 V90', 0.7, 1.2)}
    </>
  );
};

const nautical: Draw = ({ p, v }) => {
  if (v === 'buoy') {
    return (
      <>
        <circle cx="50" cy="52" r="34" fill="none" stroke={p.paper} strokeOpacity="0.85" strokeWidth="15" />
        <g fill="none" stroke={BLOOD} strokeWidth="15" strokeOpacity="0.85">
          <path d="M50 18 A34 34 0 0 1 74 28" />
          <path d="M84 52 A34 34 0 0 1 74 76" />
          <path d="M50 86 A34 34 0 0 1 26 76" />
          <path d="M16 52 A34 34 0 0 1 26 28" />
        </g>
        {rim(p, 'M79 22 A42 42 0 0 1 92 52', 0.8, 1.6)}
      </>
    );
  }
  if (v === 'wheel') {
    return (
      <>
        {[0, 45, 90, 135].map((a) => (
          <g key={a} transform={`rotate(${a} 50 52)`}>
            <path d="M50 6 V98" stroke={p.mid} strokeWidth="5" strokeLinecap="round" />
            <path d="M51.500 8 V20 M51.500 84 V96" stroke={p.rim} strokeOpacity="0.7" strokeWidth="1.200" strokeLinecap="round" />
          </g>
        ))}
        <circle cx="50" cy="52" r="30" fill="none" stroke={p.mid} strokeWidth="8" />
        <circle cx="50" cy="52" r="30" fill="none" stroke={p.metal} strokeOpacity="0.7" strokeWidth="1.600" />
        <circle cx="50" cy="52" r="10" fill={p.metal} />
        <circle cx="50" cy="52" r="3.500" fill={p.edge} />
        {rim(p, 'M72 30 A31 31 0 0 1 82 52', 0.9, 1.6)}
      </>
    );
  }
  return (
    <>
      <circle cx="50" cy="14" r="7" fill="none" stroke={p.body} strokeWidth="4.500" />
      <path d="M50 21 V88" stroke={p.body} strokeWidth="7" strokeLinecap="round" />
      <path d="M32 32 H68" stroke={p.body} strokeWidth="6" strokeLinecap="round" />
      <path d="M14 60 C16 82 34 92 50 92 C66 92 84 82 86 60" fill="none" stroke={p.body} strokeWidth="7" strokeLinecap="round" />
      <path d="M8 66 L14 54 L22 66 Z M78 66 L86 54 L92 66 Z" fill={p.body} />
      {rim(p, 'M54 22 V86 M86 60 C84 80 68 90 54 92', 0.7, 1.4)}
    </>
  );
};

const cloth: Draw = ({ p }) => (
  <g transform="rotate(-8 50 52)">
    <path d="M14 30 L60 22 L88 40 L80 82 L30 86 L12 62 Z" fill={p.paper} opacity="0.86" />
    <path d="M60 22 L52 52 L88 40 M52 52 L30 86 M52 52 L12 62" fill="none" stroke={p.edge} strokeOpacity="0.35" vectorEffect={NS} />
    <path d="M60 22 L88 40 L52 52 Z" fill="#ffffff" opacity="0.14" />
    {/* the embroidered corner */}
    <g stroke="#3c5a96" strokeOpacity="0.9" strokeWidth="1.800" fill="none" strokeLinecap="round">
      <path d="M62 68 C58 66 58 72 62 72 C66 72 66 78 61 76" />
      <path d="M68 67 L70 77 L73 70 L76 77 L78 67" />
    </g>
    {rim(p, 'M60 22 L88 40 L80 82', 0.6, 1.2)}
  </g>
);

const cosmetic: Draw = ({ p, v }) => {
  if (v === 'compact') {
    return (
      <>
        <ellipse cx="50" cy="92" rx="32" ry="4" fill="#000000" opacity="0.45" />
        <ellipse cx="50" cy="38" rx="30" ry="26" fill={p.metal} />
        <ellipse cx="50" cy="38" rx="24" ry="20" fill={p.glass} />
        <path d="M34 30 L52 22 L40 46 Z" fill="#ffffff" opacity="0.18" />
        <ellipse cx="50" cy="80" rx="30" ry="10" fill={p.metal} />
        <ellipse cx="50" cy="78" rx="23" ry="6.500" fill="#e9c7b8" opacity="0.85" />
        <rect x="44" y="62" width="12" height="8" rx="1.500" fill={p.metal} />
        {rim(p, 'M74 24 A30 26 0 0 1 80 42', 0.9, 1.6)}
      </>
    );
  }
  return (
    <>
      {ground(44, 26)}
      <rect x="32" y="56" width="22" height="42" rx="2" fill={p.metal} />
      <rect x="35" y="42" width="16" height="16" fill={p.paper} opacity="0.8" />
      <path d="M37 42 V26 C37 20 49 18 49 30 V42 Z" fill="#c8323c" />
      {stroke('#ffffff', 'M40 26 V40', 0.4, 1.4)}
      {/* the cap, rolled away */}
      <rect x="64" y="84" width="28" height="14" rx="2" fill={p.metal} transform="rotate(-8 78 91)" />
      {rim(p, 'M54 56 V96', 0.9, 1.4)}
      {rim(p, 'M64 82 L92 78', 0.6, 1.2)}
    </>
  );
};

const stain: Draw = ({ p, v }) => {
  if (v === 'outline') {
    // the chalk outline on the floor
    return (
      <g fill="none" stroke={p.paper} strokeOpacity="0.8" strokeWidth="2.200" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 3">
        <circle cx="26" cy="34" r="9" />
        <path d="M34 40 L52 46 L58 26 L66 28 L62 50 L88 62 L84 70 L58 62 L46 88 L38 84 L46 60 L24 76 L18 70 L38 52 L30 44" />
      </g>
    );
  }
  return (
    <>
      <path d="M22 52 C18 38 34 30 46 36 C56 28 76 32 78 46 C90 52 88 70 74 72 C68 84 46 86 38 76 C24 78 14 66 22 52 Z" fill={BLOOD} opacity="0.85" />
      <path d="M34 48 C40 42 52 42 56 46" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="2" fill="none" strokeLinecap="round" />
      <g fill={BLOOD} opacity="0.8">
        <circle cx="88" cy="38" r="3.500" />
        <circle cx="94" cy="50" r="2" />
        <circle cx="14" cy="80" r="3" />
        <circle cx="10" cy="40" r="2" />
        <ellipse cx="62" cy="92" rx="4" ry="2.500" />
      </g>
    </>
  );
};

const fingerprint: Draw = ({ p }) => (
  <g transform="rotate(4 50 50)">
    <rect x="16" y="14" width="68" height="74" fill={p.paper} opacity="0.9" />
    {stroke(p.edge, 'M22 22 H50 M22 80 H60', 0.5)}
    <g fill="none" stroke={p.edge} strokeOpacity="0.75" strokeWidth="1.500" strokeLinecap="round" vectorEffect={NS}>
      <path d="M50 70 C50 60 50 56 50 52" />
      <path d="M45 72 C44 60 44 50 50 46 C56 50 56 60 55 72" />
      <path d="M40 72 C38 56 40 44 50 40 C60 44 62 56 60 72" />
      <path d="M35 70 C32 52 36 38 50 34 C64 38 68 52 65 70" />
      <path d="M31 64 C28 46 34 32 50 28 C66 32 72 46 69 64" />
    </g>
    {rim(p, 'M16 14 H84', 0.5, 1.2)}
  </g>
);

const camera: Draw = ({ p }) => (
  <>
    {ground(50, 40)}
    <rect x="14" y="40" width="62" height="56" rx="3" fill={p.body} />
    <rect x="22" y="30" width="24" height="12" rx="2" fill={p.mid} />
    <circle cx="45" cy="68" r="20" fill={p.mid} />
    <circle cx="45" cy="68" r="14" fill={p.glass} />
    <circle cx="45" cy="68" r="7" fill={p.edge} />
    <circle cx="40" cy="63" r="2.600" fill="#ffffff" opacity="0.5" />
    {/* the flashgun */}
    <rect x="80" y="30" width="5" height="50" fill={p.metal} />
    <path d="M68 14 C68 4 98 4 98 14 C98 28 68 28 68 14 Z" fill={p.metal} />
    <circle cx="83" cy="14" r="5" fill={p.paper} />
    {halo(p, 83, 14, 14, 1.2)}
    {rim(p, 'M76 40 V96')}
    {rim(p, 'M14 40 H76', 0.7, 1.4)}
  </>
);

const bell: Draw = ({ p }) => (
  <>
    {ground(50, 36)}
    <rect x="18" y="88" width="64" height="10" rx="3" fill={p.body} />
    <path d="M22 88 C22 56 34 42 50 42 C66 42 78 56 78 88 Z" fill={p.metal} />
    <rect x="46" y="30" width="8" height="12" fill={p.metal} />
    <ellipse cx="50" cy="28" rx="9" ry="4.500" fill={p.metal} />
    {stroke('#ffffff', 'M32 78 C32 62 38 52 46 49', 0.4, 2.400)}
    {rim(p, 'M66 48 C74 56 78 68 78 88', 0.9, 1.6)}
  </>
);

const ladder: Draw = ({ p }) => (
  <>
    {ground(50, 30)}
    <path d="M30 98 L44 6 M56 98 L70 6" stroke={p.body} strokeWidth="5.500" strokeLinecap="round" />
    {[18, 34, 50, 66, 82].map((y, i) => (
      <path key={y} d={`M${42.300 - i * 2.450} ${y} H${68.300 - i * 2.450}`} stroke={p.mid} strokeWidth="4" strokeLinecap="round" />
    ))}
    {rim(p, 'M58 96 L72 6', 0.8, 1.4)}
  </>
);

export const OBJECT_DRAW = {
  shoes,
  glove,
  mallet,
  jewel,
  wallet,
  photo,
  footprints,
  press,
  sleeve,
  tag,
  sack,
  money,
  spectacles,
  tool,
  instrument,
  cards,
  handcuffs,
  magnifier,
  binoculars,
  medical,
  pipe,
  statuette,
  reel,
  scale,
  nautical,
  cloth,
  cosmetic,
  stain,
  fingerprint,
  camera,
  bell,
  ladder,
} satisfies Record<string, Draw>;

export type ObjectKind = keyof typeof OBJECT_DRAW;
