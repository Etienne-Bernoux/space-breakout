// --- Music Lab DOM Update ---
// Sync DOM ← state, music API. Layout 2 colonnes, pas de tabs.

import { isPlaying, getCurrentSection, getLayerVolumes, getTrack } from '../music/index.js';
import { getActivityProgress, getSim, isMuffled } from './state.js';
import { getInstruments } from './tab-sons.js';

const INTENSITY_LABELS = ['CALM', 'CRUISE', 'ACTION', 'INTENSE', 'CLIMAX'];
const INTENSITY_COLORS = ['#44aa66', '#88cc44', '#ccaa33', '#ff6644', '#ff2244'];

export function updateMusicLab(refs) {
  // Track buttons
  const currentTrack = getTrack();
  for (const t of refs.trackBtns) {
    t.btn.classList.toggle('ml-btn-active', t.id === currentTrack);
  }

  // Section buttons — highlight active
  const curSec = getCurrentSection();
  for (const s of refs.sectionBtns) {
    s.btn.classList.toggle('ml-btn-active', s.id === curSec);
  }

  // Rebuild instruments if track changed
  rebuildInstruments(refs);

  // Gameplay sim
  updateSimPanel(refs);

  // Layer readonly
  updateLayerReadonly(refs);

  // Mix
  updateMixPanel(refs);
}

function rebuildInstruments(refs) {
  const instruments = getInstruments();
  const container = refs.instContainer;
  if (refs.instBtns.length === instruments.length && refs._lastTrack === getTrack()) return;
  refs._lastTrack = getTrack();
  container.innerHTML = '';
  refs.instBtns = [];
  for (const inst of instruments) {
    const btn = document.createElement('button');
    btn.className = 'ml-btn';
    btn.textContent = inst.label;
    btn.setAttribute('data-action', 'instrument');
    btn.setAttribute('data-id', inst.id);
    btn.style.borderColor = inst.color;
    btn.style.color = inst.color;
    container.appendChild(btn);
    refs.instBtns.push(btn);
  }
}

function updateSimPanel(refs) {
  const sim = getSim();
  const s = refs.sim;

  s.intValue.textContent = sim.intensity;
  s.intValue.style.color = INTENSITY_COLORS[sim.intensity];
  s.intLabel.textContent = INTENSITY_LABELS[sim.intensity];
  s.intLabel.style.color = INTENSITY_COLORS[sim.intensity];

  for (let i = 0; i < refs.intensityBtns.length; i++) {
    refs.intensityBtns[i].classList.toggle('ml-btn-active', i === sim.intensity);
  }

  const ratio = sim.total > 0 ? sim.remaining / sim.total : 0;
  s.progressFill.style.width = `${(ratio * 100).toFixed(0)}%`;
  s.progressText.textContent = `Remaining: ${sim.remaining}/${sim.total} (${(ratio * 100).toFixed(0)}%)`;

  s.combo.textContent = `Combo: ${sim.combo}`;
  s.combo.style.color = sim.combo >= 3 ? '#ffcc00' : '#556677';
  s.lives.textContent = `Lives: ${sim.lives}`;
  s.lives.style.color = sim.lives <= 1 ? '#ff4444' : '#556677';
  s.pu.textContent = `PU: ${sim.powerUp ? 'ON' : 'OFF'}`;
  s.pu.style.color = sim.powerUp ? '#ffcc00' : '#556677';
  if (s.puBtn) s.puBtn.textContent = sim.powerUp ? 'PU OFF' : 'PU ON';
}

function updateLayerReadonly(refs) {
  const vols = getLayerVolumes();
  for (const lr of refs.layerReadonly) {
    const vol = vols[lr.name] || 0;
    lr.fill.style.width = `${(vol * 100).toFixed(0)}%`;
    lr.label.style.color = vol > 0.5 ? '#ffffff' : '#556677';
  }
}

function updateMixPanel(refs) {
  const vols = getLayerVolumes();
  for (const lt of refs.layerToggles) {
    const vol = vols[lt.name] || 0;
    const isOn = vol > 0.01;
    lt.btn.textContent = `${lt.name.toUpperCase()} ${isOn ? 'ON' : 'OFF'}`;
    lt.btn.classList.toggle('ml-btn-active', isOn);
    lt.volText.textContent = `vol: ${(vol * 100).toFixed(0)}%`;
  }

  if (refs.muffleBtn) {
    refs.muffleBtn.textContent = isMuffled() ? 'UNMUFFLE' : 'MUFFLE';
  }
}

/** Update footer transport + activity bar (called from rAF loop) */
export function updateFooter(refs) {
  const f = refs.footer;
  const playing = isPlaying();
  f.transport.textContent = playing ? '■ STOP' : '▸ PLAY';
  f.transport.classList.toggle('ml-btn-active', playing);

  const prog = getActivityProgress();
  if (prog) {
    f.actFill.style.width = `${(prog.ratio * 100).toFixed(0)}%`;
    f.actLabel.textContent = `▸ ${prog.label}`;
    f.actTime.textContent = `${prog.elapsed.toFixed(1)}s / ${prog.total.toFixed(1)}s`;
  } else {
    f.actFill.style.width = '0%';
    f.actLabel.textContent = 'Idle';
    f.actTime.textContent = '';
  }

  const curSec = getCurrentSection();
  f.secLabel.textContent = curSec ? `Section: ${curSec.toUpperCase()}` : '';
}
