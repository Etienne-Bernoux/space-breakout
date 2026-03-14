// --- AI Lab DOM Build ---

function el(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}
function txt(tag, cls, text) {
  const e = el(tag, cls);
  e.textContent = text;
  return e;
}

export function buildAILab(root, levels) {
  root.innerHTML = '';

  // Header
  const header = el('div', 'ai-header');
  header.appendChild(txt('span', 'ai-title', 'AI LAB'));
  const backBtn = el('button', 'lab-back-btn');
  backBtn.textContent = '← Hub';
  backBtn.setAttribute('data-action', 'back');
  header.appendChild(backBtn);
  root.appendChild(header);

  // Body
  const body = el('div', 'ai-body');

  // --- Colonne gauche : contrôles ---
  const left = el('div', 'ai-col');

  // Sélecteur de niveau
  const levelSection = el('div', 'ai-section');
  levelSection.appendChild(txt('div', 'ai-label', 'Niveau'));
  const select = document.createElement('select');
  select.className = 'ai-select';
  select.id = 'ai-level-select';
  for (const lvl of levels) {
    const opt = document.createElement('option');
    opt.value = lvl.id;
    opt.textContent = `${lvl.id} — ${lvl.name}`;
    select.appendChild(opt);
  }
  levelSection.appendChild(select);
  left.appendChild(levelSection);

  // Boutons de contrôle
  const ctrlSection = el('div', 'ai-section');
  const startBtn = el('button', 'ai-btn ai-btn-primary');
  startBtn.id = 'ai-start-btn';
  startBtn.textContent = 'Lancer l\'entraînement';
  startBtn.setAttribute('data-action', 'start');
  ctrlSection.appendChild(startBtn);

  const watchBtn = el('button', 'ai-btn');
  watchBtn.id = 'ai-watch-btn';
  watchBtn.textContent = 'Tester le modèle';
  watchBtn.setAttribute('data-action', 'watch');
  ctrlSection.appendChild(watchBtn);

  const resetBtn = el('button', 'ai-btn ai-btn-danger');
  resetBtn.id = 'ai-reset-btn';
  resetBtn.textContent = 'Reset cerveau';
  resetBtn.setAttribute('data-action', 'reset');
  ctrlSection.appendChild(resetBtn);
  left.appendChild(ctrlSection);

  // Modèles sauvegardés
  const modelSection = el('div', 'ai-section');
  modelSection.appendChild(txt('div', 'ai-label', 'Modèle'));

  const modelSelect = document.createElement('select');
  modelSelect.className = 'ai-select';
  modelSelect.id = 'ai-model-select';
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = '— localStorage (actuel) —';
  modelSelect.appendChild(defaultOpt);
  modelSection.appendChild(modelSelect);

  const loadModelBtn = el('button', 'ai-btn');
  loadModelBtn.id = 'ai-load-model-btn';
  loadModelBtn.textContent = 'Charger ce modèle';
  loadModelBtn.setAttribute('data-action', 'load-model');
  modelSection.appendChild(loadModelBtn);

  const modelInfo = el('div', 'ai-stat-muted');
  modelInfo.id = 'ai-model-info';
  modelSection.appendChild(modelInfo);

  left.appendChild(modelSection);

  // Import/export fichier
  const ioSection = el('div', 'ai-section');
  ioSection.appendChild(txt('div', 'ai-label', 'Import / Export'));

  const exportBtn = el('button', 'ai-btn');
  exportBtn.id = 'ai-export-btn';
  exportBtn.textContent = 'Exporter modèle';
  exportBtn.setAttribute('data-action', 'export');
  ioSection.appendChild(exportBtn);

  const importBtn = el('button', 'ai-btn');
  importBtn.id = 'ai-import-btn';
  importBtn.textContent = 'Importer fichier';
  importBtn.setAttribute('data-action', 'import');
  ioSection.appendChild(importBtn);

  const saveModelBtn = el('button', 'ai-btn');
  saveModelBtn.id = 'ai-save-model-btn';
  saveModelBtn.textContent = 'Sauvegarder dans models/';
  saveModelBtn.setAttribute('data-action', 'save-model');
  ioSection.appendChild(saveModelBtn);

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json';
  fileInput.id = 'ai-file-input';
  fileInput.style.display = 'none';
  ioSection.appendChild(fileInput);

  left.appendChild(ioSection);

  body.appendChild(left);

  // --- Colonne droite : stats ---
  const right = el('div', 'ai-col');
  const statsSection = el('div', 'ai-section');
  statsSection.appendChild(txt('div', 'ai-label', 'Statistiques'));
  const statsDiv = el('div', 'ai-stats');
  statsDiv.id = 'ai-stats';
  statsDiv.innerHTML = '<div class="ai-stat-muted">En attente…</div>';
  statsSection.appendChild(statsDiv);
  right.appendChild(statsSection);

  // Graphes d'évolution (grille de mini-graphes)
  const graphSection = el('div', 'ai-section');
  graphSection.appendChild(txt('div', 'ai-label', 'Évolution'));
  const graphGrid = el('div', 'ai-graph-grid');

  const graphDefs = [
    { id: 'ai-graph-fitness', label: 'Fitness' },
    { id: 'ai-graph-elites', label: 'Elites' },
    { id: 'ai-graph-catches', label: 'Catches' },
    { id: 'ai-graph-drops', label: 'Drops' },
    { id: 'ai-graph-wins', label: 'Wins' },
    { id: 'ai-graph-diversity', label: 'Diversité' },
    { id: 'ai-graph-destroys', label: 'Destroys' },
    { id: 'ai-graph-stars', label: 'Stars' },
  ];

  const graphCanvases = {};
  for (const def of graphDefs) {
    const wrap = el('div', 'ai-graph-wrap');
    wrap.appendChild(txt('div', 'ai-graph-label', def.label));
    const c = document.createElement('canvas');
    c.id = def.id;
    c.width = 200;
    c.height = 80;
    c.className = 'ai-graph';
    c.dataset.graphId = def.id;
    c.style.cursor = 'pointer';
    wrap.appendChild(c);
    graphGrid.appendChild(wrap);
    graphCanvases[def.id] = c;
  }

  graphSection.appendChild(graphGrid);
  right.appendChild(graphSection);

  body.appendChild(right);
  root.appendChild(body);

  // Modale zoom graphe
  const modal = el('div', 'ai-graph-modal');
  modal.id = 'ai-graph-modal';
  const modalTitle = txt('div', 'ai-graph-modal-title', '');
  modal.appendChild(modalTitle);
  const modalCanvas = document.createElement('canvas');
  modalCanvas.id = 'ai-graph-modal-canvas';
  modalCanvas.className = 'ai-graph-modal-canvas';
  modal.appendChild(modalCanvas);
  root.appendChild(modal);

  return { select, startBtn, watchBtn, resetBtn, exportBtn, importBtn, saveModelBtn, fileInput, statsDiv, graphCanvases, modelSelect, loadModelBtn, modelInfo, modal, modalCanvas, modalTitle };
}
