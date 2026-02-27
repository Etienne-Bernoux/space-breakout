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

export function playShipExplosion() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // --- A. Couche bruit : le souffle de l'explosion (le "boom") ---
  // Bruit blanc → filtre passe-bas grave → enveloppe rapide
  const bufLen = ctx.sampleRate * 1.5;
  const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  const nGain = ctx.createGain();
  nGain.gain.setValueAtTime(0.7, now);
  nGain.gain.linearRampToValueAtTime(0.5, now + 0.05);
  nGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
  const nFilter = ctx.createBiquadFilter();
  nFilter.type = 'lowpass';
  nFilter.frequency.setValueAtTime(600, now);
  nFilter.frequency.exponentialRampToValueAtTime(100, now + 0.8);
  nFilter.Q.setValueAtTime(1.5, now);
  noise.connect(nFilter);
  nFilter.connect(nGain);
  nGain.connect(sfxGain);
  noise.start(now);

  // --- B. Kick d'impact — sinus grave avec pitch drop rapide ---
  const kick = ctx.createOscillator();
  const kickGain = ctx.createGain();
  kick.type = 'sine';
  kick.frequency.setValueAtTime(160, now);
  kick.frequency.exponentialRampToValueAtTime(35, now + 0.15);
  kickGain.gain.setValueAtTime(0.6, now);
  kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
  kick.connect(kickGain);
  kickGain.connect(sfxGain);
  kick.start(now);
  kick.stop(now + 0.5);

  // --- C. Sous-explosion (deuxième boom décalé) ---
  const bufLen2 = ctx.sampleRate * 1.0;
  const buf2 = ctx.createBuffer(1, bufLen2, ctx.sampleRate);
  const data2 = buf2.getChannelData(0);
  for (let i = 0; i < bufLen2; i++) {
    data2[i] = Math.random() * 2 - 1;
  }
  const noise2 = ctx.createBufferSource();
  noise2.buffer = buf2;
  const n2Gain = ctx.createGain();
  n2Gain.gain.setValueAtTime(0.001, now);
  n2Gain.gain.setValueAtTime(0.4, now + 0.25);
  n2Gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
  const n2Filter = ctx.createBiquadFilter();
  n2Filter.type = 'lowpass';
  n2Filter.frequency.setValueAtTime(500, now + 0.25);
  n2Filter.frequency.exponentialRampToValueAtTime(80, now + 0.9);
  noise2.connect(n2Filter);
  n2Filter.connect(n2Gain);
  n2Gain.connect(sfxGain);
  noise2.start(now);

  // Kick de la sous-explosion
  const kick2 = ctx.createOscillator();
  const kick2Gain = ctx.createGain();
  kick2.type = 'sine';
  kick2.frequency.setValueAtTime(130, now + 0.25);
  kick2.frequency.exponentialRampToValueAtTime(30, now + 0.4);
  kick2Gain.gain.setValueAtTime(0.35, now + 0.25);
  kick2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  kick2.connect(kick2Gain);
  kick2Gain.connect(sfxGain);
  kick2.start(now + 0.25);
  kick2.stop(now + 0.6);
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
