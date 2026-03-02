// --- Rendu cohérent d'une créature alien (corps + tentacules) ---
// Explore le field pour trouver les groupes alien connectés,
// puis dessine chaque groupe comme un monstre unifié.
// Les parties alien adjacentes sont regroupées en "tentacules logiques"
// dessinées comme une forme allongée unique (pas un blob par cellule).

/**
 * Trouve tous les groupes alien connectés dans le field.
 * Retourne un Set des astéroïdes déjà traités (pour skip dans la passe normale).
 */
export function drawAlienCreatures(ctx, field) {
  const visited = new Set();
  const alienParts = field.grid.filter(
    (a) => a.alive && (a.materialKey === 'tentacle' || a.materialKey === 'alienCore'),
  );

  for (const part of alienParts) {
    if (visited.has(part)) continue;
    const group = floodFill(part, alienParts);
    for (const g of group) visited.add(g);
    drawCreature(ctx, group);
  }
  return visited;
}

/** Flood fill : trouve toutes les pièces alien adjacentes (grille) */
function floodFill(start, allParts) {
  const group = [start];
  const queue = [start];
  const seen = new Set([start]);

  while (queue.length > 0) {
    const cur = queue.shift();
    for (const other of allParts) {
      if (seen.has(other)) continue;
      if (isAdjacent(cur, other)) {
        seen.add(other);
        group.push(other);
        queue.push(other);
      }
    }
  }
  return group;
}

/** Deux astéroïdes sont adjacents si leurs cellules grille se touchent */
function isAdjacent(a, b) {
  const aRight = a.gridCol + a.cw;
  const aBottom = a.gridRow + a.ch;
  const bRight = b.gridCol + b.cw;
  const bBottom = b.gridRow + b.ch;
  const vOverlap = a.gridRow < bBottom && b.gridRow < aBottom;
  const hOverlap = a.gridCol < bRight && b.gridCol < aRight;
  const hAdj = aRight === b.gridCol || bRight === a.gridCol;
  const vAdj = aBottom === b.gridRow || bBottom === a.gridRow;
  return (vOverlap && hAdj) || (hOverlap && vAdj);
}

/**
 * Regroupe les parties alien (hors core) en tentacules logiques.
 * Sous-flood-fill parmi les tentacles uniquement.
 */
function groupTentacles(tentacles) {
  const groups = [];
  const seen = new Set();
  for (const t of tentacles) {
    if (seen.has(t)) continue;
    const grp = [t];
    const queue = [t];
    seen.add(t);
    while (queue.length > 0) {
      const cur = queue.shift();
      for (const other of tentacles) {
        if (seen.has(other)) continue;
        if (isAdjacent(cur, other)) {
          seen.add(other);
          grp.push(other);
          queue.push(other);
        }
      }
    }
    groups.push(grp);
  }
  return groups;
}

/** Bounding box d'un ensemble de parties */
function partsBBox(parts) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of parts) {
    x0 = Math.min(x0, p.x);
    y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x + p.width);
    y1 = Math.max(y1, p.y + p.height);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}

/** Dessine un groupe alien comme une créature unifiée */
function drawCreature(ctx, group) {
  const core = group.find((a) => a.materialKey === 'alienCore');
  const tentacles = group.filter((a) => a.materialKey === 'tentacle');
  const pulse = core ? 0.12 + Math.sin((core.floatPhase || 0) * 2.5) * 0.06 : 0.12;

  // Regrouper les parties alien en tentacules logiques
  const tentacleGroups = groupTentacles(tentacles);

  // 1. Ponts organiques (un par tentacule logique)
  if (core) {
    for (const tg of tentacleGroups) {
      const bb = partsBBox(tg);
      drawOrganicBridge(ctx, core, bb, pulse);
    }
  }

  // 2. Tentacules (un rendu unifié par groupe)
  for (const tg of tentacleGroups) {
    drawTentacle(ctx, tg, core, pulse);
  }

  // 3. Corps (par-dessus)
  if (core) {
    drawCorePart(ctx, core, pulse);
  }
}

// ─── Ponts organiques ───

function drawOrganicBridge(ctx, core, tentBB, pulse) {
  const cx = core.x + core.width / 2;
  const cy = core.y + core.height / 2;
  const tx = tentBB.cx;
  const ty = tentBB.cy;

  const dx = tx - cx;
  const dy = ty - cy;
  const dist = Math.hypot(dx, dy);
  if (dist < 1) return;

  const nx = dx / dist;
  const ny = dy / dist;
  const coreEdgeX = cx + nx * core.width * 0.45;
  const coreEdgeY = cy + ny * core.height * 0.45;
  const tentEdgeX = tx - nx * Math.min(tentBB.w, tentBB.h) * 0.4;
  const tentEdgeY = ty - ny * Math.min(tentBB.w, tentBB.h) * 0.4;

  // Largeur proportionnelle au plus petit côté du tentacule
  const bridgeW = Math.min(tentBB.w, tentBB.h) * 0.7;

  ctx.save();
  const midX = (coreEdgeX + tentEdgeX) / 2;
  const midY = (coreEdgeY + tentEdgeY) / 2;
  const perpX = -ny;
  const perpY = nx;

  ctx.beginPath();
  ctx.moveTo(coreEdgeX + perpX * bridgeW * 0.5, coreEdgeY + perpY * bridgeW * 0.5);
  ctx.quadraticCurveTo(
    midX + perpX * bridgeW * 0.35, midY + perpY * bridgeW * 0.35,
    tentEdgeX + perpX * bridgeW * 0.45, tentEdgeY + perpY * bridgeW * 0.45,
  );
  ctx.lineTo(tentEdgeX - perpX * bridgeW * 0.45, tentEdgeY - perpY * bridgeW * 0.45);
  ctx.quadraticCurveTo(
    midX - perpX * bridgeW * 0.35, midY - perpY * bridgeW * 0.35,
    coreEdgeX - perpX * bridgeW * 0.5, coreEdgeY - perpY * bridgeW * 0.5,
  );
  ctx.closePath();

  const bridgeGrad = ctx.createLinearGradient(coreEdgeX, coreEdgeY, tentEdgeX, tentEdgeY);
  bridgeGrad.addColorStop(0, '#2a3a2a');
  bridgeGrad.addColorStop(0.5, `rgba(30,80,35,${0.8 + pulse})`);
  bridgeGrad.addColorStop(1, '#1a2a1a');
  ctx.fillStyle = bridgeGrad;
  ctx.fill();

  // Veine centrale
  ctx.beginPath();
  ctx.moveTo(coreEdgeX, coreEdgeY);
  ctx.quadraticCurveTo(midX, midY, tentEdgeX, tentEdgeY);
  ctx.strokeStyle = `rgba(80,255,120,${0.3 + pulse})`;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = `rgba(50,200,80,${0.1 + pulse * 0.5})`;
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.restore();
}

// ─── Tentacule logique (plusieurs parties → une forme effilée) ───

/**
 * Trace une forme de tentacule effilée (base large → pointe fine).
 * La tentacule part du corps (base) vers l'extérieur (pointe).
 * Ondulation sinusoïdale animée + pulse au tir.
 */
function drawTentacle(ctx, parts, core, pulse) {
  const bb = partsBBox(parts);
  if (!core) return;

  const coreCx = core.x + core.width / 2;
  const coreCy = core.y + core.height / 2;

  // Direction : du corps vers l'extrémité du tentacule
  const dx = bb.cx - coreCx;
  const dy = bb.cy - coreCy;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist; // axe du tentacule (normalisé)
  const ny = dy / dist;

  // Base (côté corps) et pointe (côté opposé)
  const baseX = bb.cx - nx * (Math.abs(nx) > Math.abs(ny) ? bb.w / 2 : bb.h / 2);
  const baseY = bb.cy - ny * (Math.abs(nx) > Math.abs(ny) ? bb.w / 2 : bb.h / 2);
  const len = Math.max(bb.w, bb.h);
  const tipX = baseX + nx * len;
  const tipY = baseY + ny * len;

  // Épaisseur : large à la base, fine à la pointe
  const baseW = Math.min(bb.w, bb.h) * 0.45;
  const tipW = baseW * 0.15;

  // Perpendiculaire
  const px = -ny;
  const py = nx;

  // Animation : ondulation + firePulse
  const time = (parts[0].floatPhase || 0) * 1.5;
  const firePulse = Math.max(...parts.map(a => a.firePulse || 0));

  // Générer les points le long du tentacule (10 segments)
  const N = 10;
  const leftPts = [];
  const rightPts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const x = baseX + (tipX - baseX) * t;
    const y = baseY + (tipY - baseY) * t;
    // Épaisseur s'affine
    const w = baseW * (1 - t * 0.7) + tipW * t;
    // Ondulation sinusoïdale (amplitude croissante vers la pointe)
    const wave = Math.sin(time + t * 4) * t * baseW * 0.25;
    // Fire pulse : gonflement temporaire
    const fireBoost = firePulse * (1 - t) * baseW * 0.3;
    const totalW = w + fireBoost;
    leftPts.push({ x: x + px * (totalW + wave), y: y + py * (totalW + wave) });
    rightPts.push({ x: x - px * (totalW - wave), y: y - py * (totalW - wave) });
  }

  ctx.save();

  // Forme du tentacule (courbe lissée)
  ctx.beginPath();
  ctx.moveTo(leftPts[0].x, leftPts[0].y);
  for (let i = 1; i < leftPts.length; i++) {
    const prev = leftPts[i - 1];
    const cur = leftPts[i];
    ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + cur.x) / 2, (prev.y + cur.y) / 2);
  }
  ctx.lineTo(leftPts[N].x, leftPts[N].y);
  // Pointe arrondie
  ctx.quadraticCurveTo(
    tipX + nx * tipW, tipY + ny * tipW,
    rightPts[N].x, rightPts[N].y,
  );
  // Côté droit (inversé)
  for (let i = rightPts.length - 2; i >= 0; i--) {
    const prev = rightPts[i + 1];
    const cur = rightPts[i];
    ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + cur.x) / 2, (prev.y + cur.y) / 2);
  }
  ctx.closePath();

  // Gradient le long du tentacule
  const grad = ctx.createLinearGradient(baseX, baseY, tipX, tipY);
  const fireGlow = firePulse * 0.3;
  grad.addColorStop(0, '#2a4a2a');
  grad.addColorStop(0.3, `rgba(40,${80 + fireGlow * 200},40,1)`);
  grad.addColorStop(0.7, '#1a3a1a');
  grad.addColorStop(1, '#0a2a0a');
  ctx.fillStyle = grad;
  ctx.fill();

  // Clip pour détails internes
  ctx.save();
  ctx.clip();

  // Veine centrale bioluminescente
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  for (let i = 1; i <= N; i++) {
    const t = i / N;
    const x = baseX + (tipX - baseX) * t;
    const y = baseY + (tipY - baseY) * t;
    const wave = Math.sin(time + t * 4) * t * baseW * 0.08;
    ctx.lineTo(x + px * wave, y + py * wave);
  }
  ctx.strokeStyle = `rgba(80,255,120,${0.35 + pulse + fireGlow})`;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.strokeStyle = `rgba(50,200,80,${0.12 + pulse * 0.5})`;
  ctx.lineWidth = 6;
  ctx.stroke();

  // Veines secondaires latérales
  for (let i = 2; i < N - 1; i += 2) {
    const t = i / N;
    const x = baseX + (tipX - baseX) * t;
    const y = baseY + (tipY - baseY) * t;
    const w = baseW * (1 - t * 0.6) * 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + px * w, y + py * w);
    ctx.strokeStyle = `rgba(60,200,90,${0.2 + pulse})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - px * w, y - py * w);
    ctx.stroke();
  }

  // Œil (tourelle de tir) — au 2/3 vers la pointe
  const eyeT = 0.6;
  const eyeX = baseX + (tipX - baseX) * eyeT;
  const eyeY = baseY + (tipY - baseY) * eyeT;
  const eyeR = baseW * 0.3;
  const eyeFireBoost = firePulse * 0.4;

  ctx.beginPath();
  ctx.arc(eyeX, eyeY, eyeR * 1.2, 0, Math.PI * 2);
  ctx.fillStyle = '#0a1a0a';
  ctx.fill();

  const irisGrad = ctx.createRadialGradient(eyeX, eyeY, 0, eyeX, eyeY, eyeR);
  irisGrad.addColorStop(0, `rgba(${200 + eyeFireBoost * 55},255,100,${0.9 + pulse})`);
  irisGrad.addColorStop(0.6, `rgba(50,220,80,${0.6 + pulse + eyeFireBoost})`);
  irisGrad.addColorStop(1, 'rgba(20,80,30,0.2)');
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, eyeR * (1 + eyeFireBoost * 0.3), 0, Math.PI * 2);
  ctx.fillStyle = irisGrad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(eyeX, eyeY, eyeR * 0.25, 0, Math.PI * 2);
  ctx.fillStyle = '#001a00';
  ctx.fill();

  // Fire flash — éclat lumineux au tir
  if (firePulse > 0.1) {
    const flashR = eyeR * (1 + firePulse * 2);
    const flashGrad = ctx.createRadialGradient(eyeX, eyeY, 0, eyeX, eyeY, flashR);
    flashGrad.addColorStop(0, `rgba(200,255,150,${firePulse * 0.6})`);
    flashGrad.addColorStop(0.5, `rgba(100,255,100,${firePulse * 0.3})`);
    flashGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, flashR, 0, Math.PI * 2);
    ctx.fillStyle = flashGrad;
    ctx.fill();
  }

  ctx.restore(); // fin clip

  // Contour organique lumineux
  ctx.beginPath();
  ctx.moveTo(leftPts[0].x, leftPts[0].y);
  for (let i = 1; i < leftPts.length; i++) {
    const prev = leftPts[i - 1];
    const cur = leftPts[i];
    ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + cur.x) / 2, (prev.y + cur.y) / 2);
  }
  ctx.lineTo(leftPts[N].x, leftPts[N].y);
  ctx.quadraticCurveTo(tipX + nx * tipW, tipY + ny * tipW, rightPts[N].x, rightPts[N].y);
  for (let i = rightPts.length - 2; i >= 0; i--) {
    const prev = rightPts[i + 1];
    const cur = rightPts[i];
    ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + cur.x) / 2, (prev.y + cur.y) / 2);
  }
  ctx.closePath();
  ctx.strokeStyle = `rgba(80,255,120,${0.15 + pulse * 0.3 + fireGlow})`;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Damage overlay
  const totalHp = parts.reduce((s, a) => s + a.hp, 0);
  const totalMax = parts.reduce((s, a) => s + a.maxHp, 0);
  if (totalHp < totalMax) {
    const dmgRatio = 1 - totalHp / totalMax;
    ctx.save();
    ctx.clip();
    ctx.fillStyle = `rgba(0,0,0,${dmgRatio * 0.35})`;
    ctx.fillRect(bb.x - 5, bb.y - 5, bb.w + 10, bb.h + 10);
    ctx.restore();
  }

  // Shield
  if (parts.some((a) => a.shield)) {
    const sp = 0.6 + Math.sin((parts[0].floatPhase || 0) * 3) * 0.15;
    ctx.strokeStyle = `rgba(50,255,100,${0.3 * sp})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  ctx.restore();
}

// ─── Corps (métal parasité) ───

function drawCorePart(ctx, a, pulse) {
  const cx = a.x + a.width / 2 + (a.fragOffsetX || 0);
  const cy = a.y + a.height / 2 + (a.fragOffsetY || 0);
  const rx = a.width / 2;
  const ry = a.height / 2;

  ctx.save();
  ctx.translate(cx, cy);

  // Base métal
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * 0.92, ry * 0.92, 0, 0, Math.PI * 2);
  const metalGrad = ctx.createLinearGradient(-rx, -ry, rx, ry);
  metalGrad.addColorStop(0, '#aaaabc');
  metalGrad.addColorStop(0.3, '#888899');
  metalGrad.addColorStop(0.5, '#666677');
  metalGrad.addColorStop(0.7, '#555566');
  metalGrad.addColorStop(1, '#333344');
  ctx.fillStyle = metalGrad;
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * 0.92, ry * 0.92, 0, 0, Math.PI * 2);
  ctx.clip();

  // Reflet métallique
  const spec = ctx.createRadialGradient(-rx * 0.3, -ry * 0.4, 0, -rx * 0.2, -ry * 0.3, rx * 0.35);
  spec.addColorStop(0, 'rgba(255,255,255,0.25)');
  spec.addColorStop(0.5, 'rgba(255,255,255,0.05)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = spec;
  ctx.fillRect(-rx, -ry, rx * 2, ry * 2);

  // Excroissances organiques (mousse verte sur le métal)
  const mossCount = 6;
  for (let i = 0; i < mossCount; i++) {
    const angle = (i / mossCount) * Math.PI * 2 + 0.3;
    const dist = 0.4 + (i % 3) * 0.15;
    const mx = Math.cos(angle) * rx * dist;
    const my = Math.sin(angle) * ry * dist;
    const mr = Math.min(rx, ry) * (0.15 + (i % 2) * 0.08);
    const mossGrad = ctx.createRadialGradient(mx, my, 0, mx, my, mr);
    mossGrad.addColorStop(0, `rgba(40,180,60,${0.5 + pulse})`);
    mossGrad.addColorStop(0.5, `rgba(25,120,40,${0.3 + pulse * 0.5})`);
    mossGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = mossGrad;
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Veines organiques par-dessus le métal
  for (const v of a.veins) {
    ctx.beginPath();
    ctx.moveTo(v.x1 * 0.8, v.y1 * 0.8);
    if (v.cpx !== undefined) {
      ctx.quadraticCurveTo(v.cpx * 0.8, v.cpy * 0.8, v.x2 * 0.8, v.y2 * 0.8);
    } else {
      ctx.lineTo(v.x2 * 0.8, v.y2 * 0.8);
    }
    ctx.strokeStyle = `rgba(30,140,50,${0.5 + pulse})`;
    ctx.lineWidth = v.width * 1.2;
    ctx.stroke();
    ctx.strokeStyle = `rgba(80,255,120,${0.2 + pulse})`;
    ctx.lineWidth = v.width * 2.5;
    ctx.stroke();
  }

  // Grand œil central (le parasite)
  const eyeR = Math.min(rx, ry) * 0.25;
  ctx.beginPath();
  ctx.arc(0, 0, eyeR * 1.5, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0a0a';
  ctx.fill();
  const irisGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, eyeR);
  irisGrad.addColorStop(0, `rgba(150,255,100,${0.95 + pulse})`);
  irisGrad.addColorStop(0.4, `rgba(80,230,80,${0.8 + pulse})`);
  irisGrad.addColorStop(0.7, `rgba(40,180,60,${0.5 + pulse})`);
  irisGrad.addColorStop(1, 'rgba(20,80,30,0.2)');
  ctx.beginPath();
  ctx.arc(0, 0, eyeR, 0, Math.PI * 2);
  ctx.fillStyle = irisGrad;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, eyeR * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = '#001a00';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-eyeR * 0.2, -eyeR * 0.2, eyeR * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();

  ctx.restore();

  // Contour organique-métal
  ctx.beginPath();
  ctx.ellipse(0, 0, rx * 0.92, ry * 0.92, 0, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(80,255,120,${0.25 + pulse * 0.3})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Damage
  if (a.hp < a.maxHp && a.destructible) {
    const dmgRatio = 1 - a.hp / a.maxHp;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, rx * 0.92, ry * 0.92, 0, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = `rgba(0,0,0,${dmgRatio * 0.3})`;
    ctx.fillRect(-rx, -ry, rx * 2, ry * 2);
    const cracks = Math.floor(dmgRatio * 4) + 1;
    ctx.strokeStyle = `rgba(0,0,0,${0.3 + dmgRatio * 0.4})`;
    ctx.lineWidth = 0.8 + dmgRatio;
    for (let i = 0; i < cracks; i++) {
      const angle = (i / cracks) * Math.PI * 2 + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const len = (0.3 + dmgRatio * 0.5) * Math.min(rx, ry);
      ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Shield
  if (a.shield) {
    const sp = 0.6 + Math.sin((a.floatPhase || 0) * 3) * 0.15;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(50,255,100,${0.3 * sp})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  ctx.restore();
}
