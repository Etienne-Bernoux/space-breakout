// State management for Music Lab

const state = {
  active: false,
  muffled: false,
  hovered: null,
  scrollY: 0,
  currentTab: 0,
  activity: { label: null, startTime: 0, duration: 0 },
  loopStartTime: 0,
  sim: {
    remaining: 20,
    total: 20,
    combo: 0,
    lives: 3,
    powerUp: false,
    intensity: 0,
    adaptiveEnabled: false,
  },
};

// Getters and setters for public API
export function isActive() {
  return state.active;
}

export function setActive(value) {
  state.active = value;
}

export function isMuffled() {
  return state.muffled;
}

export function setMuffled(value) {
  state.muffled = value;
}

export function getHovered() {
  return state.hovered;
}

export function setHovered(value) {
  state.hovered = value;
}

export function getScrollY() {
  return state.scrollY;
}

export function setScrollY(value) {
  state.scrollY = value;
}

export function getCurrentTab() {
  return state.currentTab;
}

export function setCurrentTab(value) {
  state.currentTab = value;
}

export function getActivity() {
  return state.activity;
}

export function setActivity(label, duration) {
  if (label === null) {
    state.activity = { label: null, startTime: 0, duration: 0 };
  } else {
    state.activity = { label, startTime: Date.now(), duration: duration * 1000 };
  }
}

export function getLoopStartTime() {
  return state.loopStartTime;
}

export function setLoopStartTime(value) {
  state.loopStartTime = value;
}

export function getSim() {
  return state.sim;
}

export function getActivityProgress() {
  if (!state.activity.label) return null;
  const elapsed = Date.now() - state.activity.startTime;
  if (elapsed >= state.activity.duration) { state.activity.label = null; return null; }
  return {
    label: state.activity.label,
    elapsed: elapsed / 1000,
    total: state.activity.duration / 1000,
    ratio: elapsed / state.activity.duration,
  };
}

export default state;
