// --- Façade : rendu cohérent d'une créature alien (corps + tentacules) ---
// Explore le field pour trouver les groupes alien connectés,
// puis dessine chaque groupe comme un monstre unifié.

import { isAdjacent, partsBBox } from './utils.js';
import { drawOrganicBridge } from './bridge-draw.js';
import { drawTentacle } from './tentacle-draw.js';
import { drawCorePart } from './core-draw.js';
import { drawIceBridge } from './ice-bridge-draw.js';
import { drawIceSpire } from './spire-draw.js';
import { drawCryoCore } from './cryo-core-draw.js';

/**
 * Trouve tous les groupes alien connectés dans le field.
 * Retourne un Set des astéroïdes déjà traités (pour skip dans la passe normale).
 */
export function drawAlienCreatures(ctx, field) {
  const visited = new Set();
  const alienParts = field.grid.filter(
    (a) => a.alive && a.material?.creaturePart,
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

/** Dessine un groupe alien comme une créature unifiée */
function drawCreature(ctx, group) {
  const core = group.find((a) => a.materialKey === 'alienCore');
  const phase = core?.floatPhase || 0;
  const pulse = core ? 0.15 + Math.sin(phase * 2.5) * 0.12 : 0.15;

  // Dispatch : Cryovore (iceSpire) vs Parasite (tentacle)
  const isCryovore = group.some((a) => a.materialKey === 'iceSpire');

  if (isCryovore) {
    _drawCryovore(ctx, group, core, phase, pulse);
  } else {
    _drawParasite(ctx, group, core, phase, pulse);
  }
}

function _drawParasite(ctx, group, core, phase, pulse) {
  const tentacles = group.filter((a) => a.materialKey === 'tentacle');
  const tentacleGroups = groupTentacles(tentacles);

  if (core) {
    for (const tg of tentacleGroups) drawOrganicBridge(ctx, core, partsBBox(tg), pulse);
  }
  for (const tg of tentacleGroups) drawTentacle(ctx, tg, core, pulse);
  if (core) drawCorePart(ctx, core, pulse, phase);
}

function _drawCryovore(ctx, group, core, phase, pulse) {
  const spires = group.filter((a) => a.materialKey === 'iceSpire');
  const spireGroups = groupTentacles(spires);

  if (core) {
    for (const sg of spireGroups) drawIceBridge(ctx, core, partsBBox(sg), pulse);
  }
  for (const sg of spireGroups) drawIceSpire(ctx, sg, core, pulse);
  if (core) drawCryoCore(ctx, core, pulse, phase);
}
