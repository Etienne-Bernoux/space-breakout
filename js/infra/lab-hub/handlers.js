// --- Lab Hub DOM Handlers ---

/**
 * @param {HTMLElement} root
 * @param {object} opts - { onOpen(labId) }
 */
export function attachLabHubHandlers(root, { onOpen }) {
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'open') {
      onOpen(btn.dataset.lab);
    }
  });
}
