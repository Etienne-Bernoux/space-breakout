// --- AI Lab DOM Handlers ---

/**
 * @param {HTMLElement} root
 * @param {object} opts - { onBack, onStart, onWatch, onReset, onLevelChange }
 */
export function attachAILabHandlers(root, { onBack, onStart, onWatch, onReset, onExport, onImport, onLevelChange }) {
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    switch (btn.dataset.action) {
      case 'back':   onBack(); break;
      case 'start':  onStart(); break;
      case 'watch':  onWatch(); break;
      case 'reset':  onReset(); break;
      case 'export': onExport(); break;
      case 'import': onImport(); break;
    }
  });

  const select = root.querySelector('#ai-level-select');
  if (select) select.addEventListener('change', () => onLevelChange(select.value));
}
