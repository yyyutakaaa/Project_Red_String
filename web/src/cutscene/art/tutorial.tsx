/* eslint-disable react-refresh/only-export-components -- a set of drawings and the helpers they share */
// The prologue's comic art: Delancey Street in the rain, the Captain's office at Central Station,
// Sergeant Doyle at the door of the Hotel Cardinal, and the doorstop on the office floor.
// Placeholder drawings: a file in src/assets/art/cutscenes/tutorial/<key>.png replaces any of them.
import type { ComponentType } from 'react';
import { Art, C, H, W, line } from './kit.tsx';

type Pt = [number, number];
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const pts = (list: Pt[]) => list.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

/**
 * Windows on a wall seen in perspective. The wall is the quad near-top, far-top, far-bottom,
 * near-bottom; columns crowd together towards the far end.
 */
function wallWindows(nt: Pt, ft: Pt, fb: Pt, nb: Pt, cols: number, rows: [number, number][], lit: (c: number, r: number) => boolean) {
  const out: { quad: Pt[]; lit: boolean; key: string }[] = [];
  const at = (u: number, v: number) => lerp(lerp(nt, ft, u), lerp(nb, fb, u), v);
  const col = (i: number) => 1 - (1 - i / cols) ** 2;
  for (let c = 0; c < cols; c++) {
    const u0 = col(c) + (col(c + 1) - col(c)) * 0.22;
    const u1 = col(c) + (col(c + 1) - col(c)) * 0.72;
    rows.forEach(([v0, v1], r) => {
      out.push({ quad: [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)], lit: lit(c, r), key: `${c}-${r}` });
    });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Panel 1: Delancey Street.

function StreetSky() {
  return (
    <Art>
      <rect width={W} height={H} fill="url(#cs-sky)" />
      <g fill="#1c2a46" opacity="0.8">
        <ellipse cx="380" cy="120" rx="420" ry="70" />
        <ellipse cx="1180" cy="80" rx="520" ry="80" />
        <ellipse cx="820" cy="210" rx="380" ry="50" opacity="0.6" />
      </g>
      {/* The far end of the street: a block of buildings where the two walls meet. */}
      <path d="M760 560V400h40v-30h60v40h50v-70h28v-26h6v26h28v100h40v-40h60v180z" fill={C.night1} {...line(3)} />
      <g fill={C.lamp} opacity="0.85">
        <rect x="772" y="420" width="8" height="12" />
        <rect x="822" y="440" width="8" height="12" />
        <rect x="922" y="380" width="7" height="11" />
        <rect x="944" y="410" width="7" height="11" />
        <rect x="1008" y="470" width="8" height="12" />
      </g>
    </Art>
  );
}

const L_NT: Pt = [0, -260];
const L_FT: Pt = [840, 450];
const L_FB: Pt = [840, 562];
const L_NB: Pt = [0, 1010];

function StreetCity() {
  const windows = wallWindows(L_NT, L_FT, L_FB, L_NB, 7, [[0.12, 0.3], [0.4, 0.58]], (c, r) => (c * 3 + r * 5) % 4 === 1);
  return (
    <Art>
      {/* The street itself, wet and shining. */}
      <polygon points={pts([[0, 1010], [840, 562], [990, 562], [1600, 1010]])} fill="url(#cs-street)" />
      <polygon points={pts([[0, 1010], [840, 562], [862, 562], [140, 1010]])} fill={C.night3} opacity="0.7" {...line(3)} />
      <g opacity="0.55">
        <ellipse cx="1150" cy="760" rx="40" ry="150" fill={C.neon} filter="url(#cs-soft)" />
        <ellipse cx="330" cy="860" rx="34" ry="110" fill={C.lamp} filter="url(#cs-soft)" />
        <ellipse cx="910" cy="640" rx="20" ry="60" fill={C.lamp} filter="url(#cs-soft)" />
      </g>
      <g fill="none" stroke={C.cool} strokeWidth="2.5" opacity="0.4">
        <ellipse cx="760" cy="760" rx="120" ry="16" />
        <ellipse cx="1040" cy="850" rx="170" ry="20" />
        <ellipse cx="520" cy="880" rx="90" ry="12" />
      </g>
      <path d="M840 562L420 900M990 562L1300 900" stroke={C.ink} strokeWidth="2" opacity="0.5" />

      {/* The row of buildings on the left. */}
      <polygon points={pts([L_NT, L_FT, L_FB, L_NB])} fill={C.night1} {...line(5)} />
      <polygon points={pts([L_NT, L_FT, L_FB, L_NB])} fill="url(#cs-brick)" opacity="0.35" />
      <polygon points={pts([[0, -260], [840, 450], [840, 470], [0, -200]])} fill={C.night3} />
      {windows.map((w) => (
        <polygon key={w.key} points={pts(w.quad)} fill={w.lit ? C.lamp : C.night2} opacity={w.lit ? 0.92 : 1} {...line(3)} />
      ))}
      <polygon points={pts([[0, 300], [840, 520], [840, 562], [0, 1010]])} fill="url(#cs-dots)" opacity="0.35" />

      {/* A street lamp on the corner. */}
      <polygon points="330,250 150,900 520,900" fill={C.lamp} opacity="0.1" />
      <ellipse cx="330" cy="890" rx="190" ry="26" fill="url(#cs-lamp-pool)" />
      <path d="M318 900V240h18v660z" fill={C.ink} />
      <path d="M296 240h62l-10 26h-42z" fill={C.ink} />
      <ellipse cx="327" cy="268" rx="22" ry="7" fill={C.lampHot} filter="url(#cs-glow)" />
    </Art>
  );
}

const R_NT: Pt = [1600, -200];
const R_FT: Pt = [990, 440];
const R_FB: Pt = [990, 562];
const R_NB: Pt = [1600, 1010];

/** A point on the hotel's wall: u from the near edge (0) to the far end (1), v from top (0) to bottom (1). */
const onRight = (u: number, v: number): Pt => lerp(lerp(R_NT, R_FT, u), lerp(R_NB, R_FB, u), v);
const shift = (p: Pt, dx: number, dy: number): Pt => [p[0] + dx, p[1] + dy];

function StreetHotel() {
  const windows = wallWindows(R_NT, R_FT, R_FB, R_NB, 6, [[0.1, 0.27], [0.36, 0.52]], (c, r) => (c + r * 2) % 3 !== 0);
  const letters = 'HOTEL'.split('');
  return (
    <Art>
      <polygon points={pts([R_NT, R_FT, R_FB, R_NB])} fill={C.night2} {...line(5)} />
      <polygon points={pts([R_NT, R_FT, R_FB, R_NB])} fill="url(#cs-brick)" opacity="0.4" />
      {windows.map((w) => (
        <polygon key={w.key} points={pts(w.quad)} fill={w.lit ? C.lamp : C.night1} {...line(3)} />
      ))}
      {/* The lit doorway, and the canopy over it. */}
      <polygon points={pts([onRight(0.44, 0.6), onRight(0.62, 0.6), onRight(0.62, 1), onRight(0.44, 1)])} fill={C.lamp} {...line(5)} />
      <polygon points={pts([onRight(0.47, 0.66), onRight(0.59, 0.66), onRight(0.59, 1), onRight(0.47, 1)])} fill={C.lampHot} opacity="0.7" />
      <polygon
        points={pts([onRight(0.4, 0.5), onRight(0.66, 0.5), shift(onRight(0.66, 0.58), -26, 34), shift(onRight(0.4, 0.58), -26, 34)])}
        fill="#5a1a1f"
        {...line(5)}
      />
      <ellipse cx="1260" cy="900" rx="150" ry="40" fill="url(#cs-lamp-pool)" />

      {/* The neon sign, standing out from the wall. */}
      <g transform="translate(-90 0)">
        <ellipse cx="1205" cy="330" rx="150" ry="260" fill="url(#cs-neon-glow)" />
        <path d="M1236 180h40M1236 480h40" stroke={C.ink} strokeWidth="8" />
        <rect x="1160" y="130" width="78" height="400" rx="6" fill={C.ink} />
        <rect x="1170" y="140" width="58" height="380" rx="4" fill="#24080b" />
        {letters.map((l, i) => (
          <text
            key={i}
            x="1199"
            y={206 + i * 74}
            textAnchor="middle"
            className={i === 3 ? 'cs-neon cs-flicker' : 'cs-neon'}
            fill={C.neon}
            fontSize="62"
            filter="url(#cs-glow)"
          >
            {l}
          </text>
        ))}
      </g>
    </Art>
  );
}

function StreetDetective() {
  return (
    <Art>
      <g transform="translate(110 0)">
        {/* The reflection in the wet street. */}
        <g transform="translate(0 1760) scale(1 -1)" opacity="0.22">
          <path d="M590 880l10-120h80l12 120z" fill={C.ink} />
        </g>
        <g>
          <path d="M594 884l6-120h28l-2 120zM646 884l2-120h28l8 120z" fill={C.ink} />
          <path d="M584 884h44v10h-48zM648 884h46l4 10h-50z" fill={C.ink} />
          {/* The trench coat, belted, collar up. */}
          <path d="M574 560c18-14 42-20 66-20s48 6 66 20l18 220c-28 18-56 24-84 24s-60-6-84-24z" fill={C.ink} />
          <path d="M584 640h112" stroke={C.night3} strokeWidth="6" />
          <path d="M600 548l40 26 40-26" fill="none" stroke={C.night3} strokeWidth="4" />
          <path d="M708 566c8 60 12 140 16 214" fill="none" stroke={C.lamp} strokeWidth="4" opacity="0.85" />
          {/* Head and hat, from behind. */}
          <ellipse cx="640" cy="520" rx="30" ry="34" fill={C.ink} />
          <path d="M578 504c10-10 34-14 62-14s52 4 62 14c-14 8-36 10-62 10s-48-2-62-10z" fill={C.ink} />
          <path d="M608 494c0-26 12-40 32-40s32 14 32 40z" fill={C.ink} />
          <path d="M610 486h60" stroke={C.night3} strokeWidth="5" />
          <path d="M668 462c4 8 5 18 4 28M702 504c-10 5-24 8-40 9" fill="none" stroke={C.lamp} strokeWidth="3.5" opacity="0.9" />
        </g>
      </g>
    </Art>
  );
}

// ---------------------------------------------------------------------------------------------
// Panel 2: the Captain's office.

function OfficeWall() {
  const slats = Array.from({ length: 17 }, (_, i) => 92 + i * 27);
  return (
    <Art>
      <rect width={W} height={H} fill="#1a2232" />
      <rect width={W} height={H} fill="url(#cs-dots-fine)" opacity="0.25" />
      <path d="M0 520h1600" stroke={C.ink} strokeWidth="5" />
      <rect y="520" width={W} height="380" fill="#121826" />

      {/* The window: dawn behind the blinds. */}
      <rect x="1060" y="70" width="460" height="500" fill="url(#cs-dawn)" {...line(8)} />
      {slats.map((y, i) => (
        <g key={y}>
          <rect x="1064" y={y} width="452" height={i % 5 === 2 ? 10 : 18} fill="#202b40" />
          <path d={`M1064 ${y}h452`} stroke={C.cool} strokeWidth="2" opacity="0.6" />
        </g>
      ))}
      <path d="M1290 70v500" stroke={C.ink} strokeWidth="6" />

      {/* The clock: a quarter to seven. */}
      <circle cx="300" cy="150" r="76" fill={C.paper} {...line(8)} />
      <circle cx="300" cy="150" r="76" fill="url(#cs-dots-fine)" opacity="0.18" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        return <path key={i} d={`M${300 + Math.sin(a) * 60} ${150 - Math.cos(a) * 60}L${300 + Math.sin(a) * 68} ${150 - Math.cos(a) * 68}`} stroke={C.ink} strokeWidth="5" />;
      })}
      <path d={`M300 150L${300 + Math.sin((202.5 * Math.PI) / 180) * 38} ${150 - Math.cos((202.5 * Math.PI) / 180) * 38}`} stroke={C.ink} strokeWidth="8" strokeLinecap="round" />
      <path d="M300 150L246 150" stroke={C.ink} strokeWidth="5" strokeLinecap="round" />
      <circle cx="300" cy="150" r="7" fill={C.red} />

      {/* The board, with a red string between two of its notes. */}
      <rect x="80" y="270" width="400" height="230" fill={C.warm2} {...line(6)} />
      <rect x="80" y="270" width="400" height="230" fill="url(#cs-dots-fine)" opacity="0.35" />
      <g {...line(3)}>
        <rect x="104" y="292" width="96" height="120" fill={C.paper} transform="rotate(-4 152 352)" />
        <rect x="232" y="300" width="108" height="86" fill={C.paperDim} transform="rotate(3 286 343)" />
        <rect x="360" y="290" width="92" height="124" fill={C.paper} transform="rotate(-2 406 352)" />
        <rect x="240" y="404" width="120" height="80" fill={C.paper} transform="rotate(5 300 444)" />
      </g>
      <g stroke={C.ink} strokeWidth="3" opacity="0.6">
        <path d="M118 320h60M118 336h50M118 352h64M246 322h80M246 340h70M374 316h60M374 332h50M374 348h62M256 428h90M256 446h70" />
      </g>
      <path d="M152 300L406 296M152 300L300 410" stroke={C.red} strokeWidth="4" />
      <g fill={C.red} {...line(2)}>
        <circle cx="152" cy="300" r="8" />
        <circle cx="406" cy="296" r="8" />
        <circle cx="300" cy="410" r="8" />
      </g>

      {/* A filing cabinet in the corner. */}
      <rect x="1540" y="380" width="120" height="560" fill="#283247" {...line(6)} />
    </Art>
  );
}

function OfficeCaptain() {
  return (
    <Art>
      {/* Shirt, braces and a loosened tie. */}
      <path d="M560 900c10-180 60-300 150-350 40-22 90-30 150-30s110 8 150 30c90 50 140 170 150 350z" fill="#bdb39a" {...line(7)} />
      <path d="M560 900c10-180 60-300 150-350 40-22 90-30 120-28l-60 378z" fill="url(#cs-dots)" opacity="0.55" />
      <path d="M720 560c-10 120-10 240 0 340M1000 560c10 120 10 240 0 340" stroke="#4a2a20" strokeWidth="22" fill="none" />
      <path d="M800 520l60 70 60-70" fill="#e7dfc8" {...line(5)} />
      <path d="M846 586l14-10 14 10-10 30 22 150-26 40-26-40 22-150z" fill={C.red} {...line(5)} />
      {/* Neck and head: bald, heavy-jawed, a moustache, lit from the lamp below him. */}
      <path d="M800 470h120v70c-20 18-100 18-120 0z" fill="#b98a66" {...line(6)} />
      <path d="M760 300c0-90 46-140 100-140s100 50 100 140c0 70-20 130-46 160-16 18-36 24-54 24s-38-6-54-24c-26-30-46-90-46-160z" fill="#d8ad84" {...line(7)} />
      <path d="M860 160c54 0 100 50 100 140 0 70-20 130-46 160-16 18-36 24-54 24z" fill="#8f6446" />
      <path d="M860 160c54 0 100 50 100 140 0 70-20 130-46 160-16 18-36 24-54 24z" fill="url(#cs-dots)" opacity="0.5" />
      <path d="M758 300c-10-40 0-70 14-80 4 30 6 50 4 82zM962 300c10-40 0-70-14-80-4 30-6 50-4 82z" fill="#6f6a66" {...line(4)} />
      <ellipse cx="752" cy="318" rx="16" ry="28" fill="#c99872" {...line(5)} />
      <ellipse cx="968" cy="318" rx="16" ry="28" fill="#7d5538" {...line(5)} />
      {/* Brows low, eyes narrow. */}
      <path d="M786 280c20-12 44-12 60 0M878 280c16-12 40-12 60 0" stroke={C.ink} strokeWidth="11" strokeLinecap="round" fill="none" />
      <path d="M800 302c12-5 26-5 36 0M886 302c12-5 26-5 36 0" stroke={C.ink} strokeWidth="6" strokeLinecap="round" fill="none" />
      <circle cx="820" cy="304" r="3.5" fill={C.lampHot} />
      <path d="M860 300c-6 30-14 50-14 60 0 10 10 14 24 12" fill="none" {...line(5)} />
      <path d="M806 392c20-18 40-20 54-10 14-10 34-8 54 10-24 12-40 14-54 6-14 8-30 6-54-6z" fill="#5d5650" {...line(5)} />
      <path d="M826 420c22 8 46 8 68 0" stroke={C.ink} strokeWidth="5" fill="none" />
      {/* The cigar, and its ember. */}
      <path d="M884 412l120 22-4 18-120-20z" fill="#6b4422" {...line(4)} />
      <circle cx="1004" cy="443" r="9" fill={C.neon} filter="url(#cs-glow)" />
      {/* Rim light from the window. */}
      <path d="M958 250c6 30 6 70-4 120" stroke={C.cool} strokeWidth="5" fill="none" opacity="0.8" />
      <path d="M1100 620c20 60 36 150 44 280" stroke={C.cool} strokeWidth="5" fill="none" opacity="0.6" />
    </Art>
  );
}

function OfficeDesk() {
  return (
    <Art>
      <polygon points="0,640 1600,618 1600,900 0,900" fill={C.warm1} {...line(7)} />
      <polygon points="0,640 1600,618 1600,900 0,900" fill="url(#cs-hatch)" opacity="0.18" />
      <path d="M0 700L1600 680" stroke={C.ink} strokeWidth="5" />
      <ellipse cx="330" cy="670" rx="300" ry="70" fill="url(#cs-lamp-pool)" />

      {/* The file the Captain is pushing across the desk. */}
      <polygon points="700,668 1010,656 1040,744 690,760" fill="#d9b874" {...line(5)} />
      <polygon points="690,760 1040,744 1036,754 690,770" fill="#a8873f" {...line(3)} />
      <rect x="760" y="690" width="140" height="30" fill={C.paper} transform="rotate(-2 830 705)" {...line(3)} />
      <text x="830" y="713" textAnchor="middle" transform="rotate(-2 830 705)" className="cs-type" fill={C.ink} fontSize="20">
        CARDINAL
      </text>
      <text x="972" y="732" textAnchor="middle" transform="rotate(-8 972 732)" className="cs-stamp" fill={C.red} fontSize="22">
        000
      </text>
      {/* His hands, flat on the file. */}
      <path d="M690 690c20-24 60-30 90-20 18 6 20 26 6 34-30 16-70 16-92 6-10-4-10-12-4-20z" fill="#d8ad84" {...line(5)} />
      <path d="M1030 682c-20-24-60-30-90-20-18 6-20 26-6 34 30 16 70 16 92 6 10-4 10-12 4-20z" fill="#9a6e4e" {...line(5)} />

      {/* The green lamp. */}
      <path d="M326 640v-90" stroke={C.brass} strokeWidth="12" />
      <ellipse cx="326" cy="648" rx="70" ry="16" fill={C.brass} {...line(5)} />
      <path d="M210 552c10-48 50-70 116-70s106 22 116 70z" fill="#2f5d4a" {...line(6)} />
      <path d="M220 552h212" stroke={C.lampHot} strokeWidth="6" filter="url(#cs-glow)" />

      {/* The telephone. */}
      <path d="M1250 640c0-26 24-40 60-40s60 14 60 40v26h-120z" fill={C.ink} />
      <path d="M1228 596c20-20 144-20 164 0l-12 18c-40-12-100-12-140 0z" fill={C.ink} {...line(4)} />
      <circle cx="1310" cy="640" r="18" fill={C.steel} {...line(3)} />
    </Art>
  );
}

function OfficeLight() {
  return (
    <Art className="cs-screen">
      <g fill={C.cool} opacity="0.12">
        {Array.from({ length: 8 }, (_, i) => (
          <polygon key={i} points={pts([[1060, 120 + i * 56], [1060, 140 + i * 56], [200, 520 + i * 70], [200, 480 + i * 70]])} />
        ))}
      </g>
      <g fill="none" stroke={C.paper} strokeWidth="10" strokeLinecap="round" opacity="0.22" className="cs-smoke">
        <path d="M1004 430c20-40-20-70 10-110s-10-80 20-120" />
        <path d="M1010 420c40-30 10-80 50-110" strokeWidth="6" />
      </g>
    </Art>
  );
}

// ---------------------------------------------------------------------------------------------
// Panel 3: Sergeant Doyle at the hotel door.

function DoorLobby() {
  return (
    <Art>
      <rect width={W} height={H} fill="url(#cs-lobby)" />
      <rect width={W} height="560" fill="url(#cs-wallpaper)" />
      <ellipse cx="1000" cy="160" rx="320" ry="200" fill="url(#cs-lamp-pool)" />
      <path d="M1000 0v100" stroke={C.ink} strokeWidth="4" />
      <path d="M960 100h80l-14 30h-52z" fill={C.brass} {...line(4)} />
      {/* The pigeonholes and their keys. */}
      <rect x="850" y="250" width="320" height="180" fill={C.warm1} {...line(5)} />
      {Array.from({ length: 12 }, (_, i) => (
        <g key={i}>
          <rect x={862 + (i % 6) * 51} y={262 + Math.floor(i / 6) * 82} width="42" height="72" fill="#2a1a0e" {...line(3)} />
          {i % 4 !== 3 && <circle cx={883 + (i % 6) * 51} cy={290 + Math.floor(i / 6) * 82} r="7" fill={C.brass} />}
        </g>
      ))}
      {/* The front desk and its bell. */}
      <rect x="760" y="560" width="520" height="220" fill={C.warm2} {...line(6)} />
      <path d="M760 600h520M890 600v180M1150 600v180" stroke={C.ink} strokeWidth="4" />
      <path d="M1090 560c0-30 16-44 34-44s34 14 34 44z" fill="url(#cs-brass)" {...line(4)} />
      <rect x="760" y="780" width="520" height="120" fill="#1c120a" />
    </Art>
  );
}

function DoorFrame() {
  return (
    <Art>
      <path d={`M0 0H${W}V${H}H0Z M770 140V${H}H1230V140Z`} fill={C.night2} fillRule="evenodd" />
      <path d={`M0 0H${W}V${H}H0Z M770 140V${H}H1230V140Z`} fill="url(#cs-brick)" fillRule="evenodd" opacity="0.55" />
      <path d={`M0 0H${W}V${H}H0Z M770 140V${H}H1230V140Z`} fill="url(#cs-dots)" fillRule="evenodd" opacity="0.3" />
      <path d="M750 900V120h500v780" fill="none" stroke={C.ink} strokeWidth="26" />
      <path d="M750 900V120h500v780" fill="none" stroke={C.warm3} strokeWidth="8" opacity="0.6" />
      {/* The glass door, swung open, with the hotel's name in gold. */}
      <polygon points="1240,130 1440,96 1440,960 1240,900" fill={C.cool} opacity="0.18" />
      <polygon points="1240,130 1440,96 1440,960 1240,900" fill="none" {...line(10)} />
      <g transform="translate(1340 300) skewY(-10)">
        <text textAnchor="middle" className="cs-letter" fill={C.lamp} fontSize="34">
          HOTEL
        </text>
        <text y="44" textAnchor="middle" className="cs-letter" fill={C.lamp} fontSize="30">
          CARDINAL
        </text>
      </g>
      <polygon points="1240,820 1440,836 1440,960 1240,900" fill={C.brass} opacity="0.7" {...line(4)} />
      {/* The canopy, dripping. */}
      <path d="M560 0h880l40 96c-30 18-50 18-73 0-23 18-50 18-73 0-23 18-50 18-73 0-23 18-50 18-73 0-23 18-50 18-73 0-23 18-50 18-73 0-23 18-50 18-73 0-23 18-50 18-73 0-23 18-50 18-73 0-23 18-50 18-73 0-23 18-50 18-73 0-30 18-50 18-73 0z" fill="#5a1a1f" {...line(6)} />
      <path d="M560 0h880l18 40H542z" fill="url(#cs-dots)" opacity="0.5" />
    </Art>
  );
}

function DoorDoyle() {
  return (
    <Art>
      {/* The rain cape, shining wet. */}
      <path d="M760 900c20-240 90-420 240-470 150 50 220 230 240 470z" fill="#162236" {...line(7)} />
      <path d="M1000 430c-150 50-220 230-240 470h120c10-200 50-360 120-470z" fill="url(#cs-dots)" opacity="0.5" />
      <path d="M842 560c-30 80-46 200-50 320M1158 560c30 80 46 200 50 320M1080 520c30 90 40 220 40 360" stroke={C.cool} strokeWidth="5" fill="none" opacity="0.7" />
      <path d="M1000 470v430" stroke={C.ink} strokeWidth="5" />
      <g fill={C.brass} {...line(3)}>
        <circle cx="1000" cy="620" r="9" />
        <circle cx="1000" cy="720" r="9" />
        <circle cx="1000" cy="820" r="9" />
      </g>
      {/* His badge. */}
      <path d="M1074 560l20 10 20-10 4 30-24 22-24-22z" fill="url(#cs-brass)" {...line(4)} />
      {/* Head: round, kind, moustached, lit from the lobby behind him. */}
      <path d="M950 400h100v60c-20 14-80 14-100 0z" fill="#7a5640" {...line(5)} />
      <ellipse cx="1000" cy="300" rx="80" ry="92" fill="#a77b5a" {...line(7)} />
      <path d="M1000 208c-44 0-80 40-80 92s36 92 80 92z" fill="#7a5640" />
      <path d="M1000 208c-44 0-80 40-80 92s36 92 80 92z" fill="url(#cs-dots)" opacity="0.45" />
      <path d="M926 250c10-40 40-56 74-56s64 16 74 56c-20-18-46-24-74-24s-54 6-74 24z" fill="#8c8a86" {...line(4)} />
      <path d="M1076 260c10 30 10 70-4 100M924 260c-10 30-10 70 4 100" stroke={C.lamp} strokeWidth="5" fill="none" opacity="0.9" />
      <ellipse cx="920" cy="310" rx="13" ry="22" fill="#7a5640" {...line(4)} />
      <ellipse cx="1080" cy="310" rx="13" ry="22" fill="#a77b5a" {...line(4)} />
      <path d="M950 280c12-8 26-8 36 0M1014 280c12-8 26-8 36 0" stroke={C.ink} strokeWidth="7" strokeLinecap="round" fill="none" />
      <circle cx="968" cy="296" r="5" fill={C.ink} />
      <circle cx="1032" cy="296" r="5" fill={C.ink} />
      <ellipse cx="1000" cy="328" rx="16" ry="14" fill="#c28e68" {...line(4)} />
      <path d="M948 356c20-12 38-12 52-2 14-10 32-10 52 2-14 22-36 26-52 16-16 10-38 6-52-16z" fill="#c9c3b8" {...line(5)} />
      {/* The cap, held to his chest. */}
      <path d="M880 520c10-34 60-50 120-50s110 16 120 50c-30 20-80 28-120 28s-90-8-120-28z" fill="#101a2b" {...line(6)} />
      <path d="M900 540c30 30 170 30 200 0l-10 34c-40 18-140 18-180 0z" fill={C.ink} {...line(4)} />
      <path d="M988 486h24v18h-24z" fill="url(#cs-brass)" {...line(3)} />
      <path d="M884 530c-14 10-20 26-14 40 10 14 34 10 44-6M1116 530c14 10 20 26 14 40-10 14-34 10-44-6" fill="#a77b5a" {...line(5)} />
    </Art>
  );
}

function DoorShoulder() {
  return (
    <Art>
      <path d="M-40 900c0-200 40-330 180-380 60-22 150-26 230-6 120 30 180 160 200 386z" fill={C.ink} />
      <ellipse cx="250" cy="380" rx="120" ry="140" fill={C.ink} />
      <ellipse cx="240" cy="262" rx="290" ry="56" transform="rotate(-5 240 262)" fill={C.ink} />
      <path d="M120 256c0-80 50-120 126-120s126 40 126 120z" fill={C.ink} />
      <path d="M128 230c60-12 180-14 240 0" stroke={C.night3} strokeWidth="9" />
      <path d="M520 250c10 8 10 16 0 22M370 150c10 26 12 60 6 90M500 520c50 60 80 200 94 380" stroke={C.lamp} strokeWidth="5" fill="none" opacity="0.75" />
      <path d="M220 520c40 30 90 50 150 40" stroke={C.night3} strokeWidth="6" fill="none" />
    </Art>
  );
}

// ---------------------------------------------------------------------------------------------
// Panel 4: the office floor.

function Floor() {
  const boards = Array.from({ length: 15 }, (_, i) => -260 + i * 150);
  return (
    <Art>
      <rect width={W} height={H} fill={C.warm1} />
      {boards.map((x) => (
        <path key={x} d={`M${x} ${H}L${800 + (x - 800) * 0.25} 0`} stroke={C.ink} strokeWidth="4" />
      ))}
      {[180, 420, 700].map((y, i) => (
        <path key={y} d={`M${i * 140} ${y}h${160 + i * 40}M${700 + i * 120} ${y + 60}h180`} stroke={C.ink} strokeWidth="3" opacity="0.7" />
      ))}
      <ellipse cx="800" cy="560" rx="620" ry="280" fill="url(#cs-lamp-pool)" opacity="0.8" />
      <rect width={W} height={H} fill="url(#cs-dots)" opacity="0.18" />

      {/* The overturned chair. */}
      <g {...line(6)} fill="#2a1a0e">
        <path d="M60 330l260 60-14 40-260-60z" />
        <path d="M100 360l-40 200M280 400l-10 210" fill="none" stroke={C.ink} strokeWidth="16" />
        <path d="M120 230l200 46-10 40-200-46z" />
      </g>
      {/* The ledger, open, coins and notes spilt from the safe. */}
      <g {...line(5)}>
        <polygon points="1130,620 1380,580 1430,720 1170,770" fill={C.paper} />
        <path d="M1255 600l45 150" stroke={C.ink} strokeWidth="4" />
        <rect x="1300" y="770" width="120" height="56" fill="#7f9a6e" transform="rotate(14 1360 798)" />
      </g>
      <g stroke={C.ink} strokeWidth="2.5" opacity="0.6">
        <path d="M1160 650l80-12M1166 670l70-10M1172 690l76-12M1300 620l60-10M1308 640l54-8M1314 660l60-10" />
      </g>
      <g fill="url(#cs-brass)" {...line(3)}>
        <ellipse cx="1080" cy="760" rx="20" ry="9" />
        <ellipse cx="1030" cy="800" rx="18" ry="8" />
        <ellipse cx="1110" cy="830" rx="20" ry="9" />
      </g>
      <radialGradient id="cs-vignette" cx="50%" cy="55%" r="70%">
        <stop offset="55%" stopColor={C.ink} stopOpacity="0" />
        <stop offset="100%" stopColor={C.ink} stopOpacity="0.92" />
      </radialGradient>
      <rect width={W} height={H} fill="url(#cs-vignette)" />
    </Art>
  );
}

function FloorDoorstop() {
  return (
    <Art>
      <ellipse cx="800" cy="676" rx="210" ry="30" fill={C.ink} opacity="0.6" />
      <path d="M700 690c30 10 70 6 100-6" stroke="#3a0d10" strokeWidth="14" strokeLinecap="round" opacity="0.8" />
      {/* The brass doorstop, on its side. */}
      <g transform="rotate(-78 800 600)">
        <path d="M730 520c0-50 30-80 70-80s70 30 70 80c0 40 30 70 40 120H690c10-50 40-80 40-120z" fill="url(#cs-brass)" {...line(7)} />
        <path d="M690 640h220v26H690z" fill={C.brass} {...line(6)} />
        <path d="M770 440c0-40 12-60 30-60s30 20 30 60" fill="none" stroke={C.ink} strokeWidth="18" />
        <path d="M770 440c0-40 12-60 30-60s30 20 30 60" fill="none" stroke={C.lamp} strokeWidth="8" />
        <path d="M760 500c6-24 20-38 40-40" stroke={C.lampHot} strokeWidth="8" strokeLinecap="round" fill="none" />
        <path d="M856 520c4 40 26 70 34 116" stroke="#6b4614" strokeWidth="10" fill="none" opacity="0.6" />
      </g>
    </Art>
  );
}

export const tutorialArt: Record<string, ComponentType> = {
  'street-sky': StreetSky,
  'street-city': StreetCity,
  'street-hotel': StreetHotel,
  'street-detective': StreetDetective,
  'office-wall': OfficeWall,
  'office-captain': OfficeCaptain,
  'office-desk': OfficeDesk,
  'office-light': OfficeLight,
  'door-lobby': DoorLobby,
  'door-frame': DoorFrame,
  'door-doyle': DoorDoyle,
  'door-shoulder': DoorShoulder,
  floor: Floor,
  'floor-doorstop': FloorDoorstop,
};
