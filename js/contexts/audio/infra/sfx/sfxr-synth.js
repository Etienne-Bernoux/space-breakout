// sfxr-synth.js — synthèse sfxr sample-by-sample (zéro dépendance)
// Traduit les params normalisés de https://sfxr.me/ en Float32Array

export function synthSfxr(p, sampleRate = 44100) {
  // --- Conversion params normalisés → valeurs internes ---
  let fperiod = 100 / (p.p_base_freq ** 2 + 0.001);
  const fmaxperiod = p.p_freq_limit > 0
    ? 100 / (p.p_freq_limit ** 2 + 0.001) : 0;
  let fslide = 1 - p.p_freq_ramp ** 3 * 0.01;
  const fdslide = -(p.p_freq_dramp ** 3) * 0.000001;

  // Envelope (en samples)
  const envLen = [
    Math.floor(p.p_env_attack ** 2 * 100000),
    Math.floor(p.p_env_sustain ** 2 * 100000),
    Math.floor(p.p_env_decay ** 2 * 100000),
  ];
  const totalLen = envLen[0] + envLen[1] + envLen[2];
  if (totalLen === 0) return new Float32Array(0);

  // Vibrato
  const vibSpeed = p.p_vib_speed ** 2 * 0.01;
  const vibAmp = p.p_vib_strength * 0.5;

  // Arpeggio
  const arpMod = p.p_arp_mod >= 0
    ? 1 - p.p_arp_mod ** 2 * 0.9
    : 1 + p.p_arp_mod ** 2 * 10;
  const arpTime = p.p_arp_speed === 0
    ? 0 : Math.floor((1 - p.p_arp_speed) ** 2 * 20000 + 32);

  // Phaser
  let phaOffset = p.p_pha_offset ** 2 * 1020;
  if (p.p_pha_offset < 0) phaOffset = -phaOffset;
  let phaRamp = p.p_pha_ramp ** 2;
  if (p.p_pha_ramp < 0) phaRamp = -phaRamp;
  const phaBuf = new Float32Array(1024);

  // LPF
  let fltw = p.p_lpf_freq ** 3 * 0.1;
  const fltwD = 1 + p.p_lpf_ramp * 0.0001;
  let fltDmp = 5 / (1 + p.p_lpf_resonance ** 2 * 20) * (0.01 + fltw);
  if (fltDmp > 0.8) fltDmp = 0.8;

  // HPF
  let flthp = p.p_hpf_freq ** 2 * 0.1;
  const flthpD = 1 + p.p_hpf_ramp * 0.0003;

  // --- État de synthèse ---
  let phase = 0, period = Math.floor(fperiod);
  let noiseVal = Math.random() * 2 - 1;
  let vibPhase = 0, arpT = 0, arpDone = false;
  let envStage = 0, envTime = 0, envVol = 0;
  let fltp = 0, fltdp = 0, fltphp = 0, phaPos = 0;

  const out = new Float32Array(totalLen);

  for (let i = 0; i < totalLen; i++) {
    // --- Envelope ---
    envTime++;
    if (envTime >= envLen[envStage]) {
      envTime = 0;
      envStage++;
      if (envStage >= 3) break;
    }
    if (envStage === 0) {
      envVol = envLen[0] > 0 ? envTime / envLen[0] : 1;
    } else if (envStage === 1) {
      envVol = 1 + (1 - envTime / envLen[1]) * 2 * p.p_env_punch;
    } else {
      envVol = 1 - envTime / envLen[2];
    }

    // --- Arpeggio ---
    if (arpTime > 0 && !arpDone) {
      arpT++;
      if (arpT >= arpTime) { fperiod *= arpMod; arpDone = true; }
    }

    // --- Freq slide ---
    fslide += fdslide;
    fperiod *= fslide;
    if (fmaxperiod > 0 && fperiod > fmaxperiod) fperiod = fmaxperiod;

    // --- Vibrato ---
    vibPhase += vibSpeed;
    period = Math.max(8, Math.floor(fperiod * (1 + Math.sin(vibPhase) * vibAmp)));

    // --- Noise sample-and-hold ---
    phase++;
    if (phase >= period) {
      phase = 0;
      noiseVal = Math.random() * 2 - 1;
    }
    let sample = noiseVal;

    // --- LPF ---
    const prevFltp = fltp;
    fltw = Math.min(Math.max(fltw * fltwD, 0), 0.1);
    fltdp += (sample - fltp) * fltw;
    fltdp -= fltdp * fltDmp;
    fltp += fltdp;

    // --- HPF ---
    flthp = Math.min(Math.max(flthp * flthpD, 0.00001), 0.1);
    fltphp += fltp - prevFltp;
    fltphp -= fltphp * flthp;
    sample = fltphp;

    // --- Phaser ---
    phaBuf[phaPos & 1023] = sample;
    sample += phaBuf[(phaPos - Math.floor(Math.abs(phaOffset))) & 1023];
    phaOffset += phaRamp;
    phaPos++;

    out[i] = sample * envVol * (p.sound_vol || 0.25);
  }

  return out;
}
