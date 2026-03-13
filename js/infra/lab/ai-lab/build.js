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
  watchBtn.textContent = 'Regarder le meilleur';
  watchBtn.setAttribute('data-action', 'watch');
  ctrlSection.appendChild(watchBtn);

  const resetBtn = el('button', 'ai-btn ai-btn-danger');
  resetBtn.id = 'ai-reset-btn';
  resetBtn.textContent = 'Reset cerveau';
  resetBtn.setAttribute('data-action', 'reset');
  ctrlSection.appendChild(resetBtn);
  left.appendChild(ctrlSection);

  // Boutons import/export modèle
  const ioSection = el('div', 'ai-section');
  ioSection.appendChild(txt('div', 'ai-label', 'Modèle'));

  const exportBtn = el('button', 'ai-btn');
  exportBtn.id = 'ai-export-btn';
  exportBtn.textContent = 'Exporter modèle';
  exportBtn.setAttribute('data-action', 'export');
  ioSection.appendChild(exportBtn);

  const importBtn = el('button', 'ai-btn');
  importBtn.id = 'ai-import-btn';
  importBtn.textContent = 'Importer modèle';
  importBtn.setAttribute('data-action', 'import');
  ioSection.appendChild(importBtn);

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

  // Graphe fitness
  const graphSection = el('div', 'ai-section');
  graphSection.appendChild(txt('div', 'ai-label', 'Évolution fitness'));
  const graphCanvas = document.createElement('canvas');
  graphCanvas.id = 'ai-graph';
  graphCanvas.width = 280;
  graphCanvas.height = 120;
  graphCanvas.className = 'ai-graph';
  graphSection.appendChild(graphCanvas);
  right.appendChild(graphSection);

  body.appendChild(right);
  root.appendChild(body);

  return { select, startBtn, watchBtn, resetBtn, exportBtn, importBtn, fileInput, statsDiv, graphCanvas };
}
