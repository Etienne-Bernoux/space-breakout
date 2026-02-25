// --- Patterns de niveaux ---
// Chaque pattern est un tableau de strings (ASCII art).
// Chaque caractère mappe une cellule de la grille :
//   .  = vide
//   ?  = aléatoire (selon la distribution materials du niveau)
//   R  = rock, I = ice, L = lava, M = metal, C = crystal, O = obsidian
//
// Les dimensions de la grille sont déduites du pattern (rows = lignes, cols = longueur max).
// Le constructeur AsteroidField tente de merger les cellules adjacentes de même matériau
// en astéroïdes plus gros (2×2, 2×1, 1×2) via un algo glouton.

const CHAR_TO_MAT = {
  R: 'rock', I: 'ice', L: 'lava', M: 'metal', C: 'crystal', O: 'obsidian',
  r: 'rock', i: 'ice', l: 'lava', m: 'metal', c: 'crystal', o: 'obsidian',
};

/** Parse un pattern ASCII → matrice de materialKey|'?'|null */
export function parsePattern(lines) {
  return lines.map(line =>
    [...line].map(ch => {
      if (ch === '.' || ch === ' ') return null;
      if (ch === '?') return '?';
      return CHAR_TO_MAT[ch] || null;
    })
  );
}

// --- Grille presets par difficulté ---
export const GRID_PRESETS = {
  small:  { rows: 6,  cols: 10, label: 'Petite (10×6)' },
  medium: { rows: 10, cols: 14, label: 'Moyenne (14×10)' },
  large:  { rows: 12, cols: 16, label: 'Grande (16×12)' },
};

// ============================================================
//  PATTERNS
// ============================================================

export const PATTERNS = {
  // --- Facile ---
  diamond: {
    name: 'Diamant',
    grid: GRID_PRESETS.medium,
    lines: [
      '......??......',
      '.....????.....',
      '....??????....',
      '...????????...',
      '..??????????..',
      '..??????????..',
      '...????????...',
      '....??????....',
      '.....????.....',
      '......??......',
    ],
  },

  corridors: {
    name: 'Couloirs',
    grid: GRID_PRESETS.medium,
    lines: [
      '??.??..??.??..',
      '??.??..??.??..',
      '..............',
      '..??.??..??.??',
      '..??.??..??.??',
      '??.??..??.??..',
      '??.??..??.??..',
      '..............',
      '..??.??..??.??',
      '..??.??..??.??',
    ],
  },

  // --- Moyen ---
  fortress: {
    name: 'Forteresse',
    grid: GRID_PRESETS.medium,
    lines: [
      'MMMMMMMMMMMMMM',
      'M............M',
      'M.OOOO..OOOO.M',
      'M.O..????..O.M',
      'M....????....M',
      'M....????....M',
      'M.O..????..O.M',
      'M.OOOO..OOOO.M',
      'M............M',
      'MMMMMMMMMMMMMM',
    ],
  },

  waves: {
    name: 'Vagues',
    grid: GRID_PRESETS.medium,
    lines: [
      'II..........II',
      '.II........II.',
      '..II......II..',
      '...IILLLLII...',
      '....LLLLLL....',
      '....RRRRRR....',
      '...RRMMMMRR...',
      '..RR.MMMM.RR..',
      '.RR........RR.',
      'RR..........RR',
    ],
  },

  cross: {
    name: 'Croix',
    grid: GRID_PRESETS.medium,
    lines: [
      '.....????.....',
      '.....????.....',
      '.....????.....',
      '??????????????',
      '??????????????',
      '??????????????',
      '??????????????',
      '.....????.....',
      '.....????.....',
      '.....????.....',
    ],
  },

  // --- Difficile ---
  spiral: {
    name: 'Spirale',
    grid: GRID_PRESETS.large,
    lines: [
      'RRRRRRRRRRRRRRRR',
      'R..............R',
      'R.LLLLLLLLLLLL.R',
      'R.L..........L.R',
      'R.L.MMMMMMMM.L.R',
      'R.L.M......M.L.R',
      'R.L.M.CCCC.M.L.R',
      'R.L.M......M.L.R',
      'R.L.MMMMMMMM.L.R',
      'R.L..........L.R',
      'R.LLLLLLLLLLLL.R',
      'R..............R',
    ],
  },

  checkerboard: {
    name: 'Damier',
    grid: GRID_PRESETS.large,
    lines: [
      'M.L.M.L.M.L.M.L.',
      '.R.R.R.R.R.R.R.R',
      'L.M.L.M.L.M.L.M.',
      '.R.R.R.R.R.R.R.R',
      'M.L.M.L.M.L.M.L.',
      '.R.R.R.R.R.R.R.R',
      'L.M.L.M.L.M.L.M.',
      '.R.R.R.R.R.R.R.R',
      'M.L.M.L.M.L.M.L.',
      '.R.R.R.R.R.R.R.R',
      'L.M.L.M.L.M.L.M.',
      '.R.R.R.R.R.R.R.R',
    ],
  },

  // --- Boss ---
  skull: {
    name: 'Crâne',
    grid: GRID_PRESETS.large,
    lines: [
      '....OOOOOOOO....',
      '..OOOOOOOOOOOO..',
      '.OOOOOOOOOOOOOO.',
      '.OOO.OOOO.OOOOO.',
      '.OO..LOOL..OOOO.',
      '.OOOOOOOOOOOOOO.',
      '..OOOO.OO.OOOO..',
      '...OO......OO...',
      '....O.OOOO.O....',
      '.....OOOOOO.....',
      '......OOOO......',
      '................',
    ],
  },

  volcano: {
    name: 'Volcan',
    grid: GRID_PRESETS.large,
    lines: [
      '......LLLL......',
      '.....LLLLLL.....',
      '....LL.LL.LL....',
      '...LLL.LL.LLL...',
      '..LLLL....LLLL..',
      '.RRRRR....RRRRR.',
      'RRRRRR.CC.RRRRRR',
      'RRRRRR.CC.RRRRRR',
      'RRRRRRRRRRRRRRRR',
      'MMMMMMMMMMMMMMMM',
      'MMMMMMMMMMMMMMMM',
      'OOOOOOOOOOOOOOOO',
    ],
  },

  // --- Aléatoire pur (pas de pattern, fallback) ---
  random: {
    name: 'Aléatoire',
    grid: null, // utilise la grille par défaut
    lines: null,
  },
};

export const PATTERN_KEYS = Object.keys(PATTERNS);
