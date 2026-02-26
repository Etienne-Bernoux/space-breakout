// --- Section Configs — DARK (Ré mineur) ---
// D2=38 F2=41 G2=43 A2=45 Bb2=46 C3=48 D3=50
// D4=62 F4=65 G4=67 A4=69 Bb4=70 C5=72 D5=74 F5=77
// Style Howard Shore (LOTR) : chœurs graves, brass en quintes/octaves,
// accords mineurs purs (Dm, Gm, Bb, Am), rythme martial.

const DARK_INTRO = {
  drums: [
    { fn: 'timpani', t: 0, note: 38, vol: 0.25 },
    { fn: 'timpani', t: 8, note: 38, vol: 0.3 },
  ],
  bass: [
    { fn: 'cello', t: 0, note: 38, dur: 16 },
  ],
  pad: [
    { fn: 'choir', t: 0, notes: [38, 45, 50], dur: 8, vol: 0.03 },
    { fn: 'choir', t: 8, notes: [38, 45, 50, 57], dur: 8, vol: 0.04 },
  ],
  lead: [],
  high: [
    ...[74, 69, 65, 62, 57, 53, 50, 45]
      .map((n, i) => ({ fn: 'harp', t: i * 2, note: n, dur: 2.5 })),
  ],
};

const DARK_VERSE = {
  drums: [
    ...[0, 4, 8, 12].map(t => ({ fn: 'timpani', t, note: 38, vol: 0.3 })),
    ...[8, 12].map(t => ({ fn: 'timpani', t: t + 2, note: 45, vol: 0.15 })),
  ],
  bass: [
    { fn: 'cello', t: 0, note: 38, dur: 4 },
    { fn: 'cello', t: 4, note: 45, dur: 4 },
    { fn: 'cello', t: 8, note: 43, dur: 4 },
    { fn: 'cello', t: 12, note: 45, dur: 4 },
  ],
  pad: [
    { fn: 'choir', t: 0, notes: [38, 45, 50], dur: 4, vol: 0.035 },
    { fn: 'choir', t: 4, notes: [45, 52, 57], dur: 4, vol: 0.035 },
    { fn: 'choir', t: 8, notes: [43, 50, 55], dur: 4, vol: 0.035 },
    { fn: 'choir', t: 12, notes: [45, 52, 57], dur: 4, vol: 0.035 },
  ],
  lead: [
    [62, 0, 3], [69, 3, 1],
    [67, 4, 2], [62, 6, 2],
    [65, 8, 1.5], [70, 9.5, 2.5],
    [69, 12, 2], [62, 14, 2],
  ].map(([note, t, dur]) => ({ fn: 'brass', t, note, dur, vol: 0.08 })),
  high: [],
};

const DARK_CHORUS = {
  drums: [
    ...Array.from({ length: 8 }, (_, i) => ({ fn: 'timpani', t: i * 2, note: 38, vol: 0.35 })),
    ...[0, 4, 8, 12].map(t => ({ fn: 'cymbal', t, vol: 0.06 })),
  ],
  bass: [
    [38, 0, 1], [38, 1, 1], [45, 2, 2],
    [43, 4, 1], [43, 5, 1], [50, 6, 2],
    [46, 8, 1], [46, 9, 1], [41, 10, 2],
    [45, 12, 2], [38, 14, 2],
  ].map(([note, t, dur]) => ({ fn: 'cello', t, note, dur })),
  pad: [
    { fn: 'choir', t: 0, notes: [38, 45, 50, 57], dur: 4, vol: 0.05 },
    { fn: 'choir', t: 4, notes: [43, 50, 55, 62], dur: 4, vol: 0.05 },
    { fn: 'choir', t: 8, notes: [46, 53, 58, 65], dur: 4, vol: 0.055 },
    { fn: 'choir', t: 12, notes: [45, 52, 57, 64], dur: 4, vol: 0.05 },
  ],
  lead: [
    [62, 0, 1.5], [69, 1.5, 1],
    [74, 3, 2],
    [70, 5, 1], [65, 6, 2],
    [67, 8, 1.5], [74, 9.5, 1],
    [70, 11, 1],
    [69, 12, 1.5], [62, 13.5, 2.5],
  ].map(([note, t, dur]) => ({ fn: 'brass', t, note, dur, vol: 0.12 })),
  high: [
    ...[
      [62, 0, 1.5], [69, 1.5, 1], [74, 3, 2],
      [70, 5, 1], [65, 6, 2],
      [67, 8, 1.5], [74, 9.5, 1], [70, 11, 1],
      [69, 12, 1.5], [62, 13.5, 2.5],
    ].map(([note, t, dur]) => ({ fn: 'brassHigh', t, note, dur, vol: 0.04 })),
  ],
};

const DARK_BRIDGE = {
  drums: [
    { fn: 'timpani', t: 0, note: 38, vol: 0.25 },
    { fn: 'timpani', t: 4, note: 38, vol: 0.25 },
    { fn: 'timpani', t: 8, note: 38, vol: 0.2 },
    { fn: 'timpani', t: 10, note: 38, vol: 0.25 },
    { fn: 'timpani', t: 12, note: 38, vol: 0.3 },
    { fn: 'timpani', t: 13, note: 45, vol: 0.25 },
    { fn: 'timpani', t: 14, note: 38, vol: 0.35 },
    { fn: 'timpani', t: 15, note: 45, vol: 0.3 },
  ],
  bass: [
    { fn: 'cello', t: 0, note: 38, dur: 4 },
    { fn: 'cello', t: 4, note: 45, dur: 4 },
    { fn: 'cello', t: 8, note: 43, dur: 4 },
    { fn: 'cello', t: 12, note: 45, dur: 4 },
  ],
  pad: [
    { fn: 'choir', t: 0, notes: [38, 45], dur: 8, vol: 0.03 },
    { fn: 'choir', t: 8, notes: [38, 45, 50, 57], dur: 8, vol: 0.05 },
  ],
  lead: [],
  high: [
    ...[50, 53, 57, 62, 53, 57, 62, 69, 57, 62, 69, 74, 62, 69, 74, 81]
      .map((n, i) => ({ fn: 'harp', t: i, note: n, dur: 0.8 })),
  ],
};

const DARK_BREAKDOWN = {
  drums: [
    { fn: 'timpani', t: 0, note: 36, vol: 0.3 },
    { fn: 'timpani', t: 4, note: 36, vol: 0.25 },
    { fn: 'timpani', t: 8, note: 36, vol: 0.3 },
    ...[12, 13, 14, 15].map((t, i) => ({ fn: 'timpani', t, note: 38, vol: 0.2 + i * 0.06 })),
  ],
  bass: [
    { fn: 'cello', t: 0, note: 38, dur: 8 },
    { fn: 'cello', t: 8, note: 38, dur: 8 },
  ],
  pad: [
    { fn: 'choir', t: 0, notes: [38, 45], dur: 8, vol: 0.03 },
    { fn: 'choir', t: 8, notes: [38, 45, 50], dur: 8, vol: 0.04 },
  ],
  lead: [],
  high: [],
};

const DARK_CLIMAX = {
  drums: [
    ...Array.from({ length: 16 }, (_, i) => ({
      fn: 'timpani', t: i, note: i % 2 === 0 ? 38 : 45, vol: 0.4,
    })),
    ...[0, 4, 8, 12].map(t => ({ fn: 'cymbal', t, vol: 0.08 })),
    ...[2, 6, 10, 14].map(t => ({ fn: 'cymbal', t, vol: 0.04 })),
  ],
  bass: [
    [38, 0, 1], [38, 1, 1], [45, 2, 2],
    [43, 4, 1], [43, 5, 1], [50, 6, 2],
    [46, 8, 1], [46, 9, 1], [53, 10, 2],
    [45, 12, 1], [43, 13, 1], [38, 14, 2],
  ].map(([note, t, dur]) => ({ fn: 'cello', t, note, dur })),
  pad: [
    { fn: 'choir', t: 0, notes: [38, 45, 50, 57, 62], dur: 4, vol: 0.06 },
    { fn: 'choir', t: 4, notes: [43, 50, 55, 62, 67], dur: 4, vol: 0.06 },
    { fn: 'strings', t: 8, notes: [46, 53, 58, 65, 70], dur: 4, vol: 0.05 },
    { fn: 'choir', t: 8, notes: [46, 53, 58], dur: 4, vol: 0.06 },
    { fn: 'strings', t: 12, notes: [45, 52, 57, 64, 69], dur: 4, vol: 0.05 },
    { fn: 'choir', t: 12, notes: [45, 52, 57], dur: 4, vol: 0.06 },
  ],
  lead: [
    [62, 0, 0.5], [69, 0.5, 0.5],
    [74, 1, 1.5], [81, 2.5, 1.5],
    [74, 4, 1], [70, 5, 1],
    [65, 6, 1], [62, 7, 1],
    [67, 8, 0.5], [74, 8.5, 0.5],
    [79, 9, 1.5], [74, 10.5, 1.5],
    [69, 12, 1], [74, 13, 1],
    [62, 14, 2],
  ].map(([note, t, dur]) => ({ fn: 'brass', t, note, dur, vol: 0.14 })),
  high: [
    ...[
      [62, 0, 0.5], [69, 0.5, 0.5], [74, 1, 1.5], [81, 2.5, 1.5],
      [74, 4, 1], [70, 5, 1], [65, 6, 1], [62, 7, 1],
      [67, 8, 0.5], [74, 8.5, 0.5], [79, 9, 1.5], [74, 10.5, 1.5],
      [69, 12, 1], [74, 13, 1], [62, 14, 2],
    ].map(([note, t, dur]) => ({ fn: 'brassHigh', t, note, dur, vol: 0.05 })),
    ...[74, 69, 62, 57, 62, 69, 74, 81, 69, 62, 57, 50, 57, 62, 69, 74,
        74, 69, 62, 57, 62, 69, 74, 81, 69, 62, 57, 50, 57, 62, 69, 74]
      .map((n, i) => ({ fn: 'harp', t: i * 0.5, note: n, dur: 0.4 })),
  ],
};

const DARK_OUTRO = {
  drums: [
    ...[0, 4, 8, 12].map(t => ({ fn: 'timpani', t, note: 38, vol: 0.3 })),
    ...[0, 8].map(t => ({ fn: 'cymbal', t, vol: 0.04 })),
  ],
  bass: [
    { fn: 'cello', t: 0, note: 45, dur: 4 },
    { fn: 'cello', t: 4, note: 43, dur: 4 },
    { fn: 'cello', t: 8, note: 45, dur: 4 },
    { fn: 'cello', t: 12, note: 38, dur: 4 },
  ],
  pad: [
    { fn: 'choir', t: 0, notes: [45, 52, 57, 64], dur: 4, vol: 0.05 },
    { fn: 'choir', t: 4, notes: [43, 50, 55, 62], dur: 4, vol: 0.045 },
    { fn: 'choir', t: 8, notes: [45, 52, 57], dur: 4, vol: 0.04 },
    { fn: 'choir', t: 12, notes: [38, 45, 50], dur: 4, vol: 0.03 },
  ],
  lead: [
    [69, 0, 2], [74, 2, 2],
    [70, 4, 2], [65, 6, 2],
    [69, 8, 2], [62, 10, 2],
    [62, 12, 4],
  ].map(([note, t, dur]) => ({ fn: 'brass', t, note, dur, vol: 0.1 })),
  high: [],
};

export { DARK_INTRO, DARK_VERSE, DARK_CHORUS, DARK_BRIDGE, DARK_BREAKDOWN, DARK_CLIMAX, DARK_OUTRO };
