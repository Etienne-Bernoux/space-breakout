let audioCtx = null;
let sfxGain = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    sfxGain = audioCtx.createGain();
    sfxGain.gain.value = 1.0;
    sfxGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

export function setSfxVolume(v) {
  getCtx();
  sfxGain.gain.value = v;
}

function playTone(freq, duration, type = 'sine', volume = 0.3, freqEnd = null) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (freqEnd !== null) {
    osc.frequency.linearRampToValueAtTime(freqEnd, ctx.currentTime + duration);
  }

  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(sfxGain);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, volume = 0.15) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, ctx.currentTime);
  filter.frequency.linearRampToValueAtTime(100, ctx.currentTime + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(sfxGain);
  source.start();
}

// --- Sons du jeu ---

export function playBounce() {
  playTone(600, 0.08, 'square', 0.15, 900);
}

export function playAsteroidHit() {
  playNoise(0.2, 0.2);
  playTone(150, 0.15, 'sawtooth', 0.1, 60);
}

export function playLoseLife() {
  playTone(400, 0.4, 'sawtooth', 0.2, 80);
}

export function playWin() {
  const ctx = getCtx();
  [400, 500, 600, 800].forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'sine', 0.2), i * 120);
  });
}

export function playGameOver() {
  const ctx = getCtx();
  [300, 250, 200, 120].forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'triangle', 0.2), i * 150);
  });
}

export function playLaunch() {
  playTone(200, 0.12, 'sine', 0.15, 500);
}

// Débloquer l'audio au premier tap/clic (politique navigateur)
export function unlockAudio() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();
}

// --- Utilitaire volume ---
export function perceptualVolume(v) {
  return v * v;
}
