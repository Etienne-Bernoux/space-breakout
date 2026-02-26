// --- Screenshake (infra) ---
// Tremblement du canvas sur destruction d'astéroïde.
// trigger(intensity) lance un shake, update() retourne l'offset courant.

let intensity = 0;
let decay = 0.85;

export function triggerShake(amount) {
  intensity = Math.max(intensity, amount);
}

export function updateShake() {
  if (intensity < 0.5) {
    intensity = 0;
    return { x: 0, y: 0 };
  }
  const x = (Math.random() * 2 - 1) * intensity;
  const y = (Math.random() * 2 - 1) * intensity;
  intensity *= decay;
  return { x, y };
}
