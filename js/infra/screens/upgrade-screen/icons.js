// --- Icônes canvas pour chaque upgrade de l'atelier ---
// Dessinées en géométrie pure, centrées sur (0,0), taille [-s, +s].

export function drawUpgradeIcon(ctx, id, s, color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  const fn = ICONS[id];
  if (fn) fn(ctx, s, color);
}

const ICONS = {
  // --- Vaisseau ---

  // Propulseurs : flèche vers la droite avec traits de vitesse
  shipSpeed(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.6, 0); ctx.lineTo(s * 0.6, 0);
    ctx.moveTo(s * 0.3, -s * 0.3); ctx.lineTo(s * 0.6, 0); ctx.lineTo(s * 0.3, s * 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s, -s * 0.4); ctx.lineTo(-s * 0.4, -s * 0.4);
    ctx.moveTo(-s, s * 0.4); ctx.lineTo(-s * 0.4, s * 0.4);
    ctx.stroke();
  },

  // Coque élargie : rectangle avec flèches ← →
  shipWidth(ctx, s) {
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-s * 0.4, -s * 0.25, s * 0.8, s * 0.5);
    ctx.beginPath();
    ctx.moveTo(-s, 0); ctx.lineTo(-s * 0.55, 0);
    ctx.moveTo(s, 0); ctx.lineTo(s * 0.55, 0);
    ctx.moveTo(-s + 2, -2); ctx.lineTo(-s, 0); ctx.lineTo(-s + 2, 2);
    ctx.moveTo(s - 2, -2); ctx.lineTo(s, 0); ctx.lineTo(s - 2, 2);
    ctx.stroke();
  },

  // --- Drone ---

  // Accélérateur : drone + flèche montante
  droneSpeed(ctx, s) {
    ctx.beginPath();
    ctx.arc(0, s * 0.2, s * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.1); ctx.lineTo(0, -s);
    ctx.moveTo(-s * 0.3, -s * 0.6); ctx.lineTo(0, -s); ctx.lineTo(s * 0.3, -s * 0.6);
    ctx.stroke();
  },

  // Foreuse à métal : drone + dent de scie
  droneMetalDamage(ctx, s) {
    ctx.beginPath();
    ctx.arc(0, -s * 0.1, s * 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Dents de scie en dessous
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, s * 0.4);
    ctx.lineTo(-s * 0.25, s * 0.8);
    ctx.lineTo(0, s * 0.4);
    ctx.lineTo(s * 0.25, s * 0.8);
    ctx.lineTo(s * 0.5, s * 0.4);
    ctx.stroke();
  },

  // Foret perçant : flèche traversante + lignes brisées
  dronePiercingDamage(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(0, s); ctx.lineTo(0, -s);
    ctx.moveTo(-s * 0.35, -s * 0.5); ctx.lineTo(0, -s); ctx.lineTo(s * 0.35, -s * 0.5);
    ctx.stroke();
    // Astéroïdes brisés (lignes en X)
    ctx.beginPath();
    ctx.moveTo(-s * 0.6, -s * 0.1); ctx.lineTo(-s * 0.3, s * 0.1);
    ctx.moveTo(s * 0.3, -s * 0.1); ctx.lineTo(s * 0.6, s * 0.1);
    ctx.moveTo(-s * 0.5, s * 0.4); ctx.lineTo(-s * 0.2, s * 0.6);
    ctx.moveTo(s * 0.2, s * 0.4); ctx.lineTo(s * 0.5, s * 0.6);
    ctx.stroke();
  },

  // --- Power-ups ---

  // Stabilisateur : horloge (cercle + aiguille)
  puDuration(ctx, s) {
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, -s * 0.5);
    ctx.moveTo(0, 0); ctx.lineTo(s * 0.3, s * 0.1);
    ctx.stroke();
  },

  // Scanner amélioré : loupe
  puDropRate(ctx, s) {
    ctx.beginPath();
    ctx.arc(-s * 0.15, -s * 0.15, s * 0.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.2, s * 0.2); ctx.lineTo(s * 0.7, s * 0.7);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.lineWidth = 1.2;
  },

  // Module incendiaire : flamme
  puUnlockFireball(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.8);
    ctx.bezierCurveTo(-s * 0.7, s * 0.1, -s * 0.4, -s * 0.5, 0, -s * 0.8);
    ctx.bezierCurveTo(s * 0.4, -s * 0.5, s * 0.7, s * 0.1, 0, s * 0.8);
    ctx.fill();
  },

  // Duplicateur de drone : deux cercles
  puUnlockMulti(ctx, s) {
    ctx.beginPath();
    ctx.arc(-s * 0.35, 0, s * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(s * 0.35, 0, s * 0.35, 0, Math.PI * 2);
    ctx.fill();
    // + entre les deux
    ctx.fillStyle = '#000';
    ctx.font = `bold ${s}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', 0, 0);
  },

  // --- Consommables ---

  // Bouclier d'urgence : cœur
  extraLife(ctx, s) {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.5);
    ctx.bezierCurveTo(-s, -s * 0.1, -s * 0.5, -s, 0, -s * 0.3);
    ctx.bezierCurveTo(s * 0.5, -s, s, -s * 0.1, 0, s * 0.5);
    ctx.fill();
  },
};
