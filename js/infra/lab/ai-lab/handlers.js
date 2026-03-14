// --- AI Lab DOM Handlers ---

/**
 * @param {HTMLElement} root
 * @param {object} opts - callbacks
 */
export function attachAILabHandlers(root, {
  onBack, onStart, onWatch, onReset, onExport, onImport,
  onLevelChange, onLoadModel, onSaveModel, onModelSelectChange,
  onGraphClick,
}) {
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (btn) {
      switch (btn.dataset.action) {
        case 'back':       onBack(); break;
        case 'start':      onStart(); break;
        case 'watch':      onWatch(); break;
        case 'reset':      onReset(); break;
        case 'export':     onExport(); break;
        case 'import':     onImport(); break;
        case 'load-model': onLoadModel(); break;
        case 'save-model': onSaveModel(); break;
      }
      return;
    }
    // Clic sur un mini-graphe → zoom
    const graph = e.target.closest('[data-graph-id]');
    if (graph) {
      onGraphClick(graph.dataset.graphId);
      return;
    }
    // Clic sur la modale → fermer
    const modal = e.target.closest('.ai-graph-modal');
    if (modal) {
      modal.classList.remove('active');
    }
  });

  const select = root.querySelector('#ai-level-select');
  if (select) select.addEventListener('change', () => onLevelChange(select.value));

  const modelSelect = root.querySelector('#ai-model-select');
  if (modelSelect) modelSelect.addEventListener('change', () => onModelSelectChange(modelSelect.value));
}
