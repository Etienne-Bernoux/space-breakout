// --- Icônes canvas pour chaque power-up ---
// Dessinées en géométrie pure (pas d'unicode/emoji).
// Chaque fonction dessine dans un carré [-s, -s] → [+s, +s] centré sur (0,0).

export function drawIcon(ctx, id, s, color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';

  const fn = ICONS[id];
  if (fn) fn(ctx, s, color);
}

const ICONS = {
  // Vaisseau élargi : flèches ← →
  shipWide(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(-s, 0); ctx.lineTo(s, 0);
    ctx.moveTo(-s + 2, -2); ctx.lineTo(-s, 0); ctx.lineTo(-s + 2, 2);
    ctx.moveTo(s - 2, -2); ctx.lineTo(s, 0); ctx.lineTo(s - 2, 2);
    ctx.stroke();
  },

  // Vaisseau rétréci : flèches → ←
  shipNarrow(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(-s, 0); ctx.lineTo(s, 0);
    ctx.moveTo(-2, -2); ctx.lineTo(0, 0); ctx.lineTo(-2, 2);
    ctx.moveTo(2, -2); ctx.lineTo(0, 0); ctx.lineTo(2, 2);
    ctx.stroke();
  },

  // Drone collant : cercle + trait collé
  droneSticky(ctx, s) {
    ctx.beginPath();
    ctx.arc(0, -s * 0.3, s * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s * 0.6, s * 0.5); ctx.lineTo(s * 0.6, s * 0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, s * 0.1); ctx.lineTo(0, s * 0.5);
    ctx.stroke();
  },

  // Drone perçant : flèche vers le haut traversante
  dronePiercing(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(0, s); ctx.lineTo(0, -s);
    ctx.moveTo(-s * 0.4, -s * 0.4); ctx.lineTo(0, -s); ctx.lineTo(s * 0.4, -s * 0.4);
    ctx.stroke();
    // Lignes horizontales (astéroïdes traversés)
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, 0); ctx.lineTo(s * 0.5, 0);
    ctx.moveTo(-s * 0.4, s * 0.4); ctx.lineTo(s * 0.4, s * 0.4);
    ctx.stroke();
  },

  // Vie supplémentaire : cœur
  extraLife(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.5);
    ctx.bezierCurveTo(-s, -s * 0.1, -s * 0.5, -s, 0, -s * 0.3);
    ctx.bezierCurveTo(s * 0.5, -s, s, -s * 0.1, 0, s * 0.5);
    ctx.fill();
  },

  // Score ×2 : "×2"
  scoreDouble(ctx, s) {
    ctx.font = `bold ${s * 1.6}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('×2', 0, 0);
  },

  // Drone supplémentaire : deux cercles
  droneMulti(ctx, s) {
    ctx.beginPath();
    ctx.arc(-s * 0.35, 0, s * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.35, 0, s * 0.4, 0, Math.PI * 2);
    ctx.fill();
  },

  // Fragilisation : éclairs / fissures
  weaken(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s);
    ctx.lineTo(s * 0.2, -s * 0.2);
    ctx.lineTo(-s * 0.1, -s * 0.1);
    ctx.lineTo(s * 0.3, s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, s * 0.3); ctx.lineTo(s * 0.5, s * 0.3);
    ctx.stroke();
  },
};
