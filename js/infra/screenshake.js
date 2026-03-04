// --- Screenshake (infra) ---
// Tremblement du canvas — punch initial + ease-out + fréquence variable.

let maxIntensity = 0;  // intensité initiale (pour ease-out)
let intensity = 0;
let elapsed = 0;        // frames écoulées depuis le trigger
let ambientAmount = 0;

export function triggerShake(amount) {
  if (amount > intensity) {
    maxIntensity = amount;
    intensity = amount;
    elapsed = 0;
  }
}

/** Micro-shake constant piloté par l'intensité gameplay. */
export function setAmbientShake(amount) {
  ambientAmount = amount;
}

export function updateShake(dt = 1) {
  let total = ambientAmount;

  if (intensity >= 0.5) {
    elapsed += dt;
    // Ease-out quadratique : punch fort au début, décroissance rapide
    const t = Math.min(elapsed / (maxIntensity * 2.5), 1); // durée proportionnelle à l'intensité
    const easeOut = 1 - t * t; // quadratic ease-out
    intensity = maxIntensity * easeOut;

    // Fréquence variable : rapide au début (haute fréq), lent vers la fin
    const freq = 0.8 + (1 - t) * 0.5; // 1.3 → 0.8
    total += intensity * freq;
  } else {
    intensity = 0;
    maxIntensity = 0;
  }

  if (total < 0.01) return { x: 0, y: 0 };
  const x = (Math.random() * 2 - 1) * total;
  const y = (Math.random() * 2 - 1) * total;
  return { x, y };
}
