// --- Lab Hub Facade ---

import { isLabMode, isLabHubActive, setLabHubActive, setCurrentLab } from './state.js';
import { buildLabHub } from './build.js';
import { attachLabHubHandlers } from './handlers.js';

export { isLabMode, isLabHubActive };

let callbacks = {};

/**
 * Initialise le lab hub. Construit le DOM, attache les handlers.
 * @param {object} opts - { openDev, openMusic, openProgress }
 */
export function initLabHub({ openDev, openMusic, openProgress, ai }) {
  callbacks = { dev: openDev, music: openMusic, progress: openProgress, ai };
  const root = document.getElementById('lab-hub');
  if (!root) return;

  buildLabHub(root);

  attachLabHubHandlers(root, {
    onOpen: (labId) => {
      hideLabHub();
      setCurrentLab(labId);
      const fn = callbacks[labId];
      if (fn) fn();
    },
  });
}

export function showLabHub() {
  setLabHubActive(true);
  setCurrentLab(null);
  const root = document.getElementById('lab-hub');
  if (root) root.classList.add('active');
}

export function hideLabHub() {
  setLabHubActive(false);
  const root = document.getElementById('lab-hub');
  if (root) root.classList.remove('active');
}
