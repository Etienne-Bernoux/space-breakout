// Génère un polygone irrégulier (seed par astéroïde)
export function generateShape(numPoints, fracturedSide = null) {
  const points = [];
  // Plages angulaires pour chaque côté (en radians, 0 = droite, PI/2 = bas)
  // Top/bottom ont des plages plus larges car les astéroïdes sont plus larges que hauts
  const SIDES = {
    right:  { range: [5.5, 6.8],  extra: 5, jitterMin: 0.50, jitterVar: 0.35 },
    bottom: { range: [0.5, 2.6],  extra: 8, jitterMin: 0.40, jitterVar: 0.30 },
    left:   { range: [2.5, 3.8],  extra: 5, jitterMin: 0.50, jitterVar: 0.35 },
    top:    { range: [3.6, 5.7],  extra: 8, jitterMin: 0.40, jitterVar: 0.30 },
  };
  const fracDef = fracturedSide ? SIDES[fracturedSide] : null;
  const fracRange = fracDef ? fracDef.range : null;

  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    let jitter;
    if (fracRange) {
      const a = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const inFrac = fracRange[0] < fracRange[1]
        ? (a >= fracRange[0] && a <= fracRange[1])
        : (a >= fracRange[0] || a <= fracRange[1]);
      if (inFrac) {
        jitter = fracDef.jitterMin + Math.random() * fracDef.jitterVar;
      } else {
        jitter = 0.75 + Math.random() * 0.4;
      }
    } else {
      jitter = 0.7 + Math.random() * 0.5;
    }
    points.push({ angle, jitter });
  }

  // Points supplémentaires sur le côté fracturé pour plus de dents de scie
  if (fracDef) {
    for (let i = 0; i < fracDef.extra; i++) {
      const t = Math.random();
      const angle = fracRange[0] < fracRange[1]
        ? fracRange[0] + t * (fracRange[1] - fracRange[0])
        : fracRange[0] + t * ((fracRange[1] + Math.PI * 2) - fracRange[0]);
      const jitter = fracDef.jitterMin + Math.random() * fracDef.jitterVar;
      points.push({ angle: angle % (Math.PI * 2), jitter });
    }
    points.sort((a, b) => a.angle - b.angle);
  }

  return points;
}

export function generateCraters(count, rx, ry) {
  const craters = [];
  const minR = Math.min(rx, ry);
  for (let i = 0; i < count; i++) {
    craters.push({
      ox: (Math.random() - 0.5) * 0.55,
      oy: (Math.random() - 0.5) * 0.55,
      r: minR * (0.08 + Math.random() * 0.12),
      depth: 0.2 + Math.random() * 0.3, // profondeur visuelle
    });
  }
  return craters;
}

// Génère des stries/veines de surface
export function generateVeins(count, rx, ry) {
  const veins = [];
  for (let i = 0; i < count; i++) {
    const a1 = Math.random() * Math.PI * 2;
    const a2 = a1 + (0.3 + Math.random() * 0.8) * (Math.random() < 0.5 ? 1 : -1);
    const dist = 0.2 + Math.random() * 0.5;
    veins.push({
      x1: Math.cos(a1) * rx * dist,
      y1: Math.sin(a1) * ry * dist,
      x2: Math.cos(a2) * rx * dist * 0.9,
      y2: Math.sin(a2) * ry * dist * 0.9,
      cpx: (Math.random() - 0.5) * rx * 0.4,
      cpy: (Math.random() - 0.5) * ry * 0.4,
      width: 0.5 + Math.random() * 1,
    });
  }
  return veins;
}
