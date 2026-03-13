// --- AI Lab State ---

const state = {
  active: false,
  selectedLevel: 'z1-1',
  training: false,
};

/** Retourne true si le panel AI bloque le canvas (= actif ET pas en train d'entraîner). */
export function isAILabActive() { return state.active && !state.training; }
export function isAILabOpen() { return state.active; }
export function setAILabActive(v) { state.active = v; }

export default state;
