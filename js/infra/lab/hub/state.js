// --- Lab Hub State ---

const state = {
  active: false,
  currentLab: null, // 'dev' | 'music' | 'progress' | 'ai' | null
};

export function isLabMode() {
  return new URLSearchParams(window.location.search).has('lab');
}

export function isLabHubActive() { return state.active; }
export function setLabHubActive(v) { state.active = v; }

export function getCurrentLab() { return state.currentLab; }
export function setCurrentLab(v) { state.currentLab = v; }

export default state;
