// --- Lab Hub DOM Build ---

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

const LABS = [
  { id: 'dev',      label: 'Dev Panel',    desc: 'Config asteroids, presets, patterns' },
  { id: 'music',    label: 'Music Lab',    desc: 'Instruments, sections, stingers, mix' },
  { id: 'progress', label: 'Progress Lab', desc: 'Wallet, upgrades, simulation' },
  { id: 'ai',       label: 'AI Lab',       desc: 'Neuroévolution, entraînement, replay' },
];

export function buildLabHub(root) {
  root.innerHTML = '';

  const header = el('div', 'lh-header');
  header.appendChild(txt('span', 'lh-title', 'SPACE LAB'));
  root.appendChild(header);

  const body = el('div', 'lh-body');
  const refs = { buttons: [] };

  for (const lab of LABS) {
    const btn = el('button', 'lh-card');
    btn.setAttribute('data-action', 'open');
    btn.setAttribute('data-lab', lab.id);

    btn.appendChild(txt('span', 'lh-card-label', lab.label));
    btn.appendChild(txt('span', 'lh-card-desc', lab.desc));
    body.appendChild(btn);
    refs.buttons.push({ id: lab.id, btn });
  }

  root.appendChild(body);
  return refs;
}
