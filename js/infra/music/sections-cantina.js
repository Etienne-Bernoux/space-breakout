// --- Section Configs — CANTINA (Bb majeur, jazz swing, saxo lead) ---
// Bb2=46 C3=48 D3=50 Eb3=51 F3=53 G3=55 A3=57
// Bb3=58 C4=60 D4=62 Eb4=63 F4=65 G4=67 A4=69
// Bb4=70 C5=72 D5=74 Eb5=75 F5=77 G5=79

// --- Drum patterns ---
// Swing feel : kick on 1 & 3, brush shuffle, rim on 2 & 4
const SWING_FULL = [
  ...[0, 4, 8, 12].map(t => ({ fn: 'jazzKick', t })),
  ...[2, 6, 10, 14].map(t => ({ fn: 'rimclick', t })),
  // Brush shuffle : on-beat + swung off-beat
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    .map(t => ({ fn: 'brushSnare', t, vol: 0.06 })),
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    .map(t => ({ fn: 'brushSnare', t: t + 0.66, vol: 0.04 })),
];

const SWING_LIGHT = [
  ...[0, 8].map(t => ({ fn: 'jazzKick', t, vol: 0.2 })),
  ...[4, 12].map(t => ({ fn: 'rimclick', t, vol: 0.08 })),
  ...[0, 2, 4, 6, 8, 10, 12, 14].map(t => ({ fn: 'brushSnare', t, vol: 0.05 })),
  ...[0, 2, 4, 6, 8, 10, 12, 14].map(t => ({ fn: 'brushSnare', t: t + 0.66, vol: 0.03 })),
];

const SWING_INTENSE = [
  ...[0, 2, 4, 6, 8, 10, 12, 14].map(t => ({ fn: 'jazzKick', t })),
  ...[1, 3, 5, 7, 9, 11, 13, 15].map(t => ({ fn: 'rimclick', t })),
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    .map(t => ({ fn: 'brushSnare', t, vol: 0.08 })),
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    .map(t => ({ fn: 'brushSnare', t: t + 0.66, vol: 0.06 })),
];

// --- Walking bass patterns ---
const WALK_I = [  // Bb → Eb → F → Bb (I-IV-V-I)
  [46, 0], [50, 1], [53, 2], [50, 3],
  [51, 4], [55, 5], [53, 6], [51, 7],
  [53, 8], [57, 9], [53, 10], [50, 11],
  [46, 12], [50, 13], [53, 14], [46, 15],
].map(([note, t]) => ({ fn: 'walkBass', t, note, dur: 0.9 }));

const WALK_II = [ // Bb → Cm → F7 → Bb (I-ii-V-I)
  [46, 0], [53, 1], [50, 2], [46, 3],
  [48, 4], [51, 5], [55, 6], [53, 7],
  [53, 8], [50, 9], [48, 10], [53, 11],
  [46, 12], [50, 13], [53, 14], [57, 15],
].map(([note, t]) => ({ fn: 'walkBass', t, note, dur: 0.9 }));

// --- Chord voicings (stabs) ---
const CH_Bb  = [58, 62, 65, 69]; // Bb D F A
const CH_Eb  = [58, 63, 67, 70]; // Bb Eb G Bb
const CH_F7  = [57, 60, 65, 69]; // A C F A
const CH_Cm7 = [60, 63, 67, 70]; // C Eb G Bb
const CH_Gm  = [55, 58, 62, 67]; // G Bb D G

// Comp syncopé (accords off-beat, style Freddie Green)
const COMP_I = [
  { fn: 'pianoChord', t: 0.66, notes: CH_Bb, dur: 0.8 },
  { fn: 'pianoChord', t: 2.66, notes: CH_Bb, dur: 0.8 },
  { fn: 'pianoChord', t: 4.66, notes: CH_Eb, dur: 0.8 },
  { fn: 'pianoChord', t: 6.66, notes: CH_Eb, dur: 0.8 },
  { fn: 'pianoChord', t: 8.66, notes: CH_F7, dur: 0.8 },
  { fn: 'pianoChord', t: 10.66, notes: CH_F7, dur: 0.8 },
  { fn: 'pianoChord', t: 12.66, notes: CH_Bb, dur: 0.8 },
  { fn: 'pianoChord', t: 14.66, notes: CH_Bb, dur: 0.8 },
];

const COMP_II = [
  { fn: 'pianoChord', t: 0.66, notes: CH_Bb, dur: 0.8 },
  { fn: 'pianoChord', t: 2.66, notes: CH_Gm, dur: 0.8 },
  { fn: 'pianoChord', t: 4.66, notes: CH_Cm7, dur: 0.8 },
  { fn: 'pianoChord', t: 6.66, notes: CH_Cm7, dur: 0.8 },
  { fn: 'pianoChord', t: 8.66, notes: CH_F7, dur: 0.8 },
  { fn: 'pianoChord', t: 10.66, notes: CH_Eb, dur: 0.8 },
  { fn: 'pianoChord', t: 12.66, notes: CH_Bb, dur: 0.8 },
  { fn: 'pianoChord', t: 14.66, notes: CH_F7, dur: 0.8 },
];

// ===== SECTIONS =====

const CANTINA_INTRO = {
  drums: SWING_LIGHT,
  bass: WALK_I.filter(ev => ev.t >= 8),
  pad: [
    { fn: 'pianoChord', t: 0, notes: CH_Bb, dur: 4 },
    { fn: 'pianoChord', t: 4, notes: CH_Eb, dur: 4 },
    { fn: 'pianoChord', t: 8, notes: CH_F7, dur: 4 },
    { fn: 'pianoChord', t: 12, notes: CH_Bb, dur: 4 },
  ],
  lead: [
    // Piano solo d'ouverture — phrases swing
    [70, 0, 0.6], [72, 0.66, 0.6], [74, 1.33, 1],
    [70, 4, 0.6], [67, 4.66, 0.6], [65, 5.33, 1],
    [70, 8, 0.5], [74, 8.66, 0.5], [77, 9.33, 1.5],
    [74, 12, 0.6], [72, 12.66, 0.6], [70, 13.33, 2],
  ].map(([note, t, dur]) => ({ fn: 'piano', t, note, dur, vol: 0.06 })),
  high: [],
};

const CANTINA_VERSE = {
  drums: SWING_FULL,
  bass: WALK_I,
  pad: COMP_I,
  lead: [
    // Piano comp stabs syncopés
    [70, 0.66, 0.4], [74, 2.66, 0.4], [72, 4.66, 0.4], [70, 6.66, 0.4],
    [69, 8.66, 0.4], [70, 10.66, 0.4], [74, 12.66, 0.4], [72, 14.66, 0.4],
  ].map(([note, t, dur]) => ({ fn: 'piano', t, note, dur, vol: 0.05 })),
  high: [
    // Saxo : mélodie principale, phrasé swing avec ghost notes
    [70, 0, 1], [74, 1.33, 0.8], [77, 2.33, 1.5],
    [75, 4, 0.6], [74, 4.66, 0.6], [72, 5.33, 0.6], [70, 6, 1.5],
    [69, 8, 0.8], [70, 9, 0.6], [72, 9.66, 0.6], [74, 10.33, 1.5],
    [72, 12, 0.6], [70, 12.66, 0.8], [67, 13.66, 0.6], [70, 14.33, 1.5],
  ].map(([note, t, dur]) => ({ fn: 'sax', t, note, dur, vol: 0.08 })),
};

const CANTINA_CHORUS = {
  drums: SWING_FULL,
  bass: WALK_II,
  pad: COMP_II,
  lead: [
    // Piano : stabs rythmiques et fills
    [70, 0.66, 0.3], [72, 1.33, 0.3], [74, 2, 0.5],
    [70, 4.66, 0.3], [67, 5.33, 0.3], [65, 6, 0.5],
    [69, 8.66, 0.3], [70, 9.33, 0.3], [72, 10, 0.5],
    [74, 12.66, 0.3], [72, 13.33, 0.3], [70, 14, 0.8],
  ].map(([note, t, dur]) => ({ fn: 'piano', t, note, dur, vol: 0.05 })),
  high: [
    // Saxo + trompette call & response
    // Sax call
    [77, 0, 1.2], [79, 1.33, 0.8], [77, 2.33, 1],
    // Trumpet response
    ...[[74, 4, 1], [72, 5, 0.6], [70, 5.66, 1.2]]
      .map(([note, t, dur]) => ({ fn: 'trumpet', t, note, dur, vol: 0.06 })),
    // Sax call
    [75, 8, 0.8], [77, 9, 0.6], [79, 9.66, 1.2],
    // Trumpet response
    ...[[77, 12, 0.8], [74, 13, 0.6], [70, 13.66, 1.5]]
      .map(([note, t, dur]) => ({ fn: 'trumpet', t, note, dur, vol: 0.06 })),
  ].filter(ev => ev.fn || true)
   .map(ev => ev.fn ? ev : ({ fn: 'sax', t: ev[1] ?? ev.t, note: ev[0] ?? ev.note, dur: ev[2] ?? ev.dur, vol: 0.09 })),
};

// Fix chorus high: mix sax & trumpet events proprement
const _CHORUS_HIGH = [
  // Sax calls
  { fn: 'sax', t: 0, note: 77, dur: 1.2, vol: 0.09 },
  { fn: 'sax', t: 1.33, note: 79, dur: 0.8, vol: 0.09 },
  { fn: 'sax', t: 2.33, note: 77, dur: 1, vol: 0.09 },
  // Trumpet response 1
  { fn: 'trumpet', t: 4, note: 74, dur: 1, vol: 0.06 },
  { fn: 'trumpet', t: 5, note: 72, dur: 0.6, vol: 0.06 },
  { fn: 'trumpet', t: 5.66, note: 70, dur: 1.2, vol: 0.06 },
  // Sax call 2
  { fn: 'sax', t: 8, note: 75, dur: 0.8, vol: 0.09 },
  { fn: 'sax', t: 9, note: 77, dur: 0.6, vol: 0.09 },
  { fn: 'sax', t: 9.66, note: 79, dur: 1.2, vol: 0.09 },
  // Trumpet response 2
  { fn: 'trumpet', t: 12, note: 77, dur: 0.8, vol: 0.06 },
  { fn: 'trumpet', t: 13, note: 74, dur: 0.6, vol: 0.06 },
  { fn: 'trumpet', t: 13.66, note: 70, dur: 1.5, vol: 0.06 },
];
// Replace chorus high with clean version
CANTINA_CHORUS.high = _CHORUS_HIGH;

const CANTINA_BRIDGE = {
  drums: SWING_LIGHT,
  bass: [
    [46, 0], [50, 2], [53, 4], [57, 6],
    [51, 8], [48, 10], [46, 12], [53, 14],
  ].map(([note, t]) => ({ fn: 'walkBass', t, note, dur: 1.8 })),
  pad: [
    { fn: 'pianoChord', t: 0, notes: CH_Bb, dur: 4 },
    { fn: 'pianoChord', t: 4, notes: CH_Gm, dur: 4 },
    { fn: 'pianoChord', t: 8, notes: CH_Eb, dur: 4 },
    { fn: 'pianoChord', t: 12, notes: CH_F7, dur: 4 },
  ],
  lead: [
    // Piano solo : runs rapides, bebop
    [70, 0, 0.4], [72, 0.5, 0.4], [74, 1, 0.4], [77, 1.5, 0.8],
    [75, 2.66, 0.4], [74, 3.33, 0.8],
    [72, 4, 0.4], [70, 4.5, 0.4], [69, 5, 0.4], [67, 5.5, 0.8],
    [65, 6.66, 0.4], [67, 7.33, 0.8],
    [70, 8, 0.4], [74, 8.5, 0.4], [77, 9, 0.8], [79, 10, 0.8],
    [77, 11, 0.4], [75, 11.5, 0.8],
    [74, 12, 0.4], [72, 12.5, 0.4], [70, 13, 0.6], [74, 14, 1.8],
  ].map(([note, t, dur]) => ({ fn: 'piano', t, note, dur, vol: 0.07 })),
  high: [
    // Saxo tenu en background
    { fn: 'sax', t: 0, note: 70, dur: 3.5, vol: 0.04 },
    { fn: 'sax', t: 8, note: 74, dur: 3.5, vol: 0.04 },
  ],
};

const CANTINA_BREAKDOWN = {
  drums: [
    ...[0, 4, 8, 12].map(t => ({ fn: 'rimclick', t })),
    ...[2, 6, 10, 14].map(t => ({ fn: 'brushSnare', t, vol: 0.04 })),
  ],
  bass: [
    [46, 0], [46, 2], [48, 4], [48, 6],
    [51, 8], [51, 10], [53, 12], [53, 14],
  ].map(([note, t]) => ({ fn: 'walkBass', t, note, dur: 1.8 })),
  pad: [
    { fn: 'pianoChord', t: 0, notes: CH_Cm7, dur: 8 },
    { fn: 'pianoChord', t: 8, notes: CH_F7, dur: 8 },
  ],
  lead: [
    [67, 4, 1.5], [70, 6.66, 1],
    [65, 12, 1.5], [67, 14.66, 1],
  ].map(([note, t, dur]) => ({ fn: 'piano', t, note, dur, vol: 0.04 })),
  high: [
    // Saxo : phrases suspensives
    { fn: 'sax', t: 0, note: 70, dur: 2, vol: 0.05 },
    { fn: 'sax', t: 4, note: 72, dur: 1.5, vol: 0.05 },
    { fn: 'sax', t: 8, note: 74, dur: 2, vol: 0.06 },
    { fn: 'sax', t: 12, note: 77, dur: 3, vol: 0.07 },
  ],
};

const CANTINA_CLIMAX = {
  drums: SWING_INTENSE,
  bass: WALK_II,
  pad: [
    // Accords rapides (2 beats chacun)
    { fn: 'pianoChord', t: 0, notes: CH_Bb, dur: 1.8 },
    { fn: 'pianoChord', t: 2, notes: CH_Gm, dur: 1.8 },
    { fn: 'pianoChord', t: 4, notes: CH_Cm7, dur: 1.8 },
    { fn: 'pianoChord', t: 6, notes: CH_F7, dur: 1.8 },
    { fn: 'pianoChord', t: 8, notes: CH_Eb, dur: 1.8 },
    { fn: 'pianoChord', t: 10, notes: CH_F7, dur: 1.8 },
    { fn: 'pianoChord', t: 12, notes: CH_Bb, dur: 1.8 },
    { fn: 'pianoChord', t: 14, notes: CH_F7, dur: 1.8 },
  ],
  lead: [
    // Piano : doubles croches swing
    [70, 0.33, 0.3], [74, 0.66, 0.3], [72, 1.33, 0.3], [70, 1.66, 0.3],
    [69, 2.33, 0.3], [70, 2.66, 0.3], [72, 3.33, 0.3], [74, 3.66, 0.3],
    [77, 4.33, 0.3], [75, 4.66, 0.3], [74, 5.33, 0.3], [72, 5.66, 0.3],
    [70, 6.33, 0.3], [72, 6.66, 0.3], [74, 7.33, 0.3], [77, 7.66, 0.3],
    [79, 8.33, 0.3], [77, 8.66, 0.3], [75, 9.33, 0.3], [74, 9.66, 0.3],
    [72, 10.33, 0.3], [74, 10.66, 0.3], [70, 11.33, 0.3], [72, 11.66, 0.3],
    [74, 12.33, 0.3], [77, 12.66, 0.3], [79, 13.33, 0.3], [77, 13.66, 0.5],
    [74, 14.33, 0.3], [70, 14.66, 1],
  ].map(([note, t, dur]) => ({ fn: 'piano', t, note, dur, vol: 0.06 })),
  high: [
    // Saxo + trompette ensemble — tutti
    { fn: 'sax', t: 0, note: 77, dur: 1.2, vol: 0.1 },
    { fn: 'trumpet', t: 0, note: 70, dur: 1.2, vol: 0.06 },
    { fn: 'sax', t: 1.33, note: 79, dur: 0.8, vol: 0.1 },
    { fn: 'trumpet', t: 1.33, note: 74, dur: 0.8, vol: 0.06 },
    { fn: 'sax', t: 2.33, note: 82, dur: 1.5, vol: 0.1 },
    { fn: 'trumpet', t: 2.33, note: 77, dur: 1.5, vol: 0.06 },
    { fn: 'sax', t: 4, note: 79, dur: 0.8, vol: 0.09 },
    { fn: 'sax', t: 5, note: 77, dur: 0.6, vol: 0.09 },
    { fn: 'sax', t: 5.66, note: 75, dur: 0.6, vol: 0.09 },
    { fn: 'sax', t: 6.33, note: 74, dur: 1.5, vol: 0.09 },
    { fn: 'trumpet', t: 8, note: 70, dur: 1, vol: 0.06 },
    { fn: 'trumpet', t: 9.33, note: 72, dur: 0.8, vol: 0.06 },
    { fn: 'sax', t: 10.33, note: 77, dur: 1.5, vol: 0.1 },
    { fn: 'trumpet', t: 10.33, note: 74, dur: 1.5, vol: 0.06 },
    { fn: 'sax', t: 12, note: 79, dur: 1, vol: 0.1 },
    { fn: 'trumpet', t: 12, note: 74, dur: 1, vol: 0.06 },
    { fn: 'sax', t: 13.33, note: 77, dur: 2.5, vol: 0.1 },
    { fn: 'trumpet', t: 13.33, note: 70, dur: 2.5, vol: 0.06 },
  ],
};

const CANTINA_OUTRO = {
  drums: [
    ...[0, 4].map(t => ({ fn: 'jazzKick', t, vol: 0.2 })),
    ...[0, 2, 4].map(t => ({ fn: 'brushSnare', t, vol: 0.04 })),
  ],
  bass: [
    [53, 0], [50, 2], [48, 4], [46, 6],
  ].map(([note, t]) => ({ fn: 'walkBass', t, note, dur: 1.8 })),
  pad: [
    { fn: 'pianoChord', t: 0, notes: CH_F7, dur: 4 },
    { fn: 'pianoChord', t: 4, notes: CH_Bb, dur: 8 },
  ],
  lead: [
    [74, 0, 1.5], [72, 2, 1], [70, 4, 4],
  ].map(([note, t, dur]) => ({ fn: 'piano', t, note, dur, vol: 0.05 })),
  high: [
    { fn: 'sax', t: 0, note: 70, dur: 3, vol: 0.06 },
    { fn: 'sax', t: 4, note: 70, dur: 6, vol: 0.04 },
  ],
};

export {
  CANTINA_INTRO, CANTINA_VERSE, CANTINA_CHORUS,
  CANTINA_BRIDGE, CANTINA_BREAKDOWN, CANTINA_CLIMAX, CANTINA_OUTRO,
};
