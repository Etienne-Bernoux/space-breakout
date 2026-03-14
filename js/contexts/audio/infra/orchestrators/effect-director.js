// --- EffectDirector : effets visuels pilotés par l'intensité gameplay ---

// Palette par niveau d'intensité (0-4)
const PRESETS = [
  // 0 calm
  { starSpeed: 1.0, vignetteAlpha: 0, vignetteHue: [0, 100, 180],
    microShake: 0, deathLine: [0, 212, 255], deathLineGlow: 0.07,
    scoreGlow: 0, scoreColor: '#ffffff' },
  // 1 cruise
  { starSpeed: 1.2, vignetteAlpha: 0, vignetteHue: [0, 100, 180],
    microShake: 0, deathLine: [0, 212, 255], deathLineGlow: 0.08,
    scoreGlow: 0, scoreColor: '#ffffff' },
  // 2 action
  { starSpeed: 1.5, vignetteAlpha: 0.05, vignetteHue: [40, 60, 160],
    microShake: 0.3, deathLine: [80, 220, 200], deathLineGlow: 0.10,
    scoreGlow: 4, scoreColor: '#ffffff' },
  // 3 intense
  { starSpeed: 2.0, vignetteAlpha: 0.12, vignetteHue: [120, 40, 160],
    microShake: 0.8, deathLine: [255, 160, 40], deathLineGlow: 0.15,
    scoreGlow: 8, scoreColor: '#ffcc66' },
  // 4 climax
  { starSpeed: 2.5, vignetteAlpha: 0.20, vignetteHue: [200, 30, 30],
    microShake: 1.5, deathLine: [255, 50, 30], deathLineGlow: 0.20,
    scoreGlow: 12, scoreColor: '#ffaa44' },
];

export class EffectDirector {
  constructor() {
    this._level = 0;
    this._current = { ...PRESETS[0] };
    this._target = { ...PRESETS[0] };
  }

  /** Appelé par GameIntensityDirector quand l'intensité change. */
  setIntensity(level) {
    this._level = level;
    this._target = PRESETS[level] || PRESETS[0];
  }

  /** Appelé chaque frame — lerp progressif vers la cible. */
  update() {
    const speed = 0.06; // vitesse de transition (plus bas = plus doux)
    const c = this._current;
    const t = this._target;
    c.starSpeed += (t.starSpeed - c.starSpeed) * speed;
    c.vignetteAlpha += (t.vignetteAlpha - c.vignetteAlpha) * speed;
    c.microShake += (t.microShake - c.microShake) * speed;
    c.deathLineGlow += (t.deathLineGlow - c.deathLineGlow) * speed;
    c.scoreGlow += (t.scoreGlow - c.scoreGlow) * speed;
    c.scoreColor = t.scoreColor; // pas de lerp sur les couleurs hex
    // Lerp sur les couleurs RGB
    for (let i = 0; i < 3; i++) {
      c.vignetteHue[i] += (t.vignetteHue[i] - c.vignetteHue[i]) * speed;
      c.deathLine[i] += (t.deathLine[i] - c.deathLine[i]) * speed;
    }
  }

  /** Retourne les effets visuels courants (lerpés). */
  getEffects() {
    return this._current;
  }
}
