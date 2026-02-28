// --- Screenshake (infra) ---
// Tremblement du canvas sur destruction d'astéroïde.
// trigger(intensity) lance un shake, update() retourne l'offset courant.

let intensity = 0;
let decay = 0.85;
let ambientAmount = 0;

export function triggerShake(amount) {
  intensity = Math.max(intensity, amount);
}

/** Micro-shake constant piloté par l'intensité gameplay. */
export function setAmbientShake(amount) {
  ambientAmount = amount;
}

export function updateShake(dt = 1) {
  let total = ambientAmount;
  if (intensity >= 0.5) {
    total += intensity;
    intensity *= Math.pow(decay, dt);
  } else {
    intensity = 0;
  }
  if (total < 0.01) return { x: 0, y: 0 };
  const x = (Math.random() * 2 - 1) * total;
  const y = (Math.random() * 2 - 1) * total;
  return { x, y };
}
