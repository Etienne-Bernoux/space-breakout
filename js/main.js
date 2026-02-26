import { CONFIG } from './config.js';
import { Ship } from './domain/ship.js';
import { Drone } from './domain/drone.js';
import { AsteroidField } from './domain/asteroid.js';
import { GameSession } from './use-cases/game-logic.js';
import { updateStars } from './infra/stars.js';
import { updateMenu, handleMenuInput, handleMenuTap, updateMenuHover, handleMenuDrag, handleMenuRelease, resetMenu, loadSettings, setVolumeChangeCallback, getMusicVolume, getSfxVolume } from './infra/menu.js';
import { setupResize } from './infra/resize.js';
import { setupTouch, getTouchX, setTapHandler, setMenuTapHandler, setDragHandler, setReleaseHandler, getMousePos } from './infra/touch.js';
import { spawnExplosion, spawnTrail, updateParticles } from './infra/particles.js';
import { playBounce, playAsteroidHit, playLoseLife, playWin, playGameOver, playLaunch, unlockAudio, setSfxVolume } from './infra/audio.js';
import { startMusic, isPlaying, setVolume as setMusicVolume } from './infra/music.js';
import { isDevMode, isDevPanelActive, showDevPanel, hideDevPanel, loadDevConfig, getDevAsteroidConfig, drawDevPanel, handleDevTap, handleDevDrag, handleDevRelease, handleDevHover } from './infra/dev-panel.js';
import { Capsule } from './domain/capsule.js';
import { DropSystem } from './use-cases/drop-system.js';
import { PowerUpManager } from './use-cases/power-up-manager.js';
import { getPowerUp } from './domain/power-ups.js';
import { drawCapsule, drawPowerUpHUD } from './infra/power-up-render.js';

// --- Canvas setup ---
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// --- Session de jeu (use case) ---
const session = new GameSession(CONFIG);
let ship = null, drone = null, field;
let capsules = [];
const dropSystem = new DropSystem(CONFIG.drop);
const puManager = new PowerUpManager();

// --- Scale responsive pour le jeu (HUD, boutons, overlays) ---
function gameScale() { return Math.min(1.0, Math.max(0.6, CONFIG.canvas.width / 500)); }

// --- Bouton pause (responsive) ---
function pauseBtnLayout() {
  const s = gameScale();
  const size = Math.round(40 * s);
  return { x: CONFIG.canvas.width - size - 10, y: 8, size };
}

setupResize(() => {
  // Repositionner le vaisseau en bas quand la hauteur change
  session.canvasHeight = CONFIG.canvas.height;
  if (ship) {
    if (ship.isMobile) {
      ship.bottomMargin = Math.max(60, Math.round(CONFIG.canvas.height * ship._mobileRatio));
    }
    ship.y = CONFIG.canvas.height - ship.height - ship.bottomMargin;
    ship.canvasWidth = CONFIG.canvas.width;
    if (drone && !drone.launched) drone.reset(ship);
  }
});
setupTouch();

// --- Chargement des réglages audio ---
// Courbe perceptuelle : x² pour que 50% du slider ≈ moitié du volume perçu
function perceptualVolume(v) { return v * v; }

loadSettings();
loadDevConfig();
// En mode dev, afficher le panel avant le menu
if (isDevMode()) showDevPanel();

setVolumeChangeCallback((music, sfx) => {
  setMusicVolume(perceptualVolume(music) * 0.3);
  setSfxVolume(perceptualVolume(sfx));
});
// Appliquer les volumes sauvegardés
setSfxVolume(perceptualVolume(getSfxVolume()));

function ensureMusic() {
  if (!isPlaying()) {
    startMusic();
    setMusicVolume(perceptualVolume(getMusicVolume()) * 0.3);
  }
}

function startGame() {
  unlockAudio();
  ensureMusic();
  const isMobile = 'ontouchstart' in window;
  ship = new Ship(CONFIG.ship, CONFIG.canvas.width, CONFIG.canvas.height, isMobile);
  drone = new Drone(CONFIG.drone, ship, isMobile, CONFIG.canvas.width);
  // En mode dev, utiliser la config enrichie (matériaux + densité)
  const astConfig = isDevMode() ? getDevAsteroidConfig() : CONFIG.asteroids;
  field = new AsteroidField(astConfig);
  capsules = [];
  puManager.clear({ ship, drone, session, field });
  session.start();
}

// --- Handlers tactiles ---
setTapHandler((x, y) => {
  if (session.state === 'playing') {
    // Tap sur bouton pause
    const pb = pauseBtnLayout();
    if (x >= pb.x && x <= pb.x + pb.size &&
        y >= pb.y && y <= pb.y + pb.size) {
      session.pause();
      return;
    }
    if (!drone.launched) { drone.launched = true; playLaunch(); }
  }
  if (session.state === 'gameOver' || session.state === 'won') {
    resetMenu();
    session.backToMenu();
    if (isDevMode()) showDevPanel();
  }
});

setMenuTapHandler((x, y) => {
  ensureMusic();
  // Dev panel intercepte les taps quand actif
  if (isDevPanelActive()) {
    const result = handleDevTap(x, y);
    if (result === 'launch') {
      hideDevPanel();
      startGame();
    }
    return;
  }
  if (session.state === 'menu') {
    const action = handleMenuTap(x, y);
    if (action === 'play') startGame();
  }
  if (session.state === 'paused') {
    const cx = CONFIG.canvas.width / 2;
    const cy = CONFIG.canvas.height / 2;
    const s = gameScale();
    const halfW = Math.round(CONFIG.canvas.width * 0.4);
    const btnH = Math.round(44 * s);
    const gap = Math.round(16 * s);
    // Bouton REPRENDRE
    if (x >= cx - halfW && x <= cx + halfW && y >= cy && y <= cy + btnH) {
      session.resume();
    }
    // Bouton MENU
    if (x >= cx - halfW && x <= cx + halfW && y >= cy + btnH + gap && y <= cy + btnH * 2 + gap) {
      resetMenu();
      session.backToMenu();
      if (isDevMode()) showDevPanel();
    }
  }
});

// --- Drag slider (réglages + dev panel) ---
setDragHandler((x, y) => {
  if (isDevPanelActive()) { handleDevDrag(x, y); return; }
  if (session.state === 'menu') handleMenuDrag(x, y);
});
setReleaseHandler(() => {
  if (isDevPanelActive()) { handleDevRelease(); return; }
  handleMenuRelease();
});

// --- Contrôles clavier ---
document.addEventListener('keydown', (e) => {
  ensureMusic();
  // Dev panel : Entrée pour lancer
  if (isDevPanelActive()) {
    if (e.key === 'Enter') { hideDevPanel(); startGame(); }
    return;
  }
  if (session.state === 'menu') {
    const action = handleMenuInput(e.key);
    if (action === 'play') startGame();
    return;
  }

  if (session.state === 'playing') {
    if (e.key === 'ArrowLeft') ship.movingLeft = true;
    if (e.key === 'ArrowRight') ship.movingRight = true;
    if (e.key === ' ' && !drone.launched) { drone.launched = true; playLaunch(); }
    if (e.key === 'Escape') { session.pause(); return; }
  }

  if (session.state === 'paused') {
    if (e.key === 'Escape') session.resume();
    if (e.key === 'r') { resetMenu(); session.backToMenu(); if (isDevMode()) showDevPanel(); }
    return;
  }

  if ((session.state === 'gameOver' || session.state === 'won') && e.key === 'r') {
    resetMenu();
    session.backToMenu();
    if (isDevMode()) showDevPanel();
  }
});

document.addEventListener('keyup', (e) => {
  if (session.state === 'playing') {
    if (e.key === 'ArrowLeft') ship.movingLeft = false;
    if (e.key === 'ArrowRight') ship.movingRight = false;
  }
});

// --- Collisions (déléguées au use case, dispatch des effets ici) ---
function handleCollisions() {
  const ev1 = session.checkShipCollision(drone, ship);
  if (ev1) playBounce();

  const ev2 = session.checkAsteroidCollision(drone, field);
  if (ev2) {
    spawnExplosion(ev2.x, ev2.y, ev2.color);
    playAsteroidHit();
    // Drop de power-up sur destruction
    if (ev2.type === 'asteroidHit' || ev2.type === 'asteroidFragment') {
      const puId = dropSystem.decideDrop({ materialKey: ev2.materialKey || 'rock', sizeName: ev2.sizeName || 'small' });
      if (puId) capsules.push(new Capsule(puId, ev2.x, ev2.y, CONFIG.capsule));
    }
  }

  // Capsules ramassées
  const capEvts = session.checkCapsuleCollision(capsules, ship);
  for (const ce of capEvts) {
    const gs = { ship, drone, session, field };
    puManager.activate(ce.powerUpId, gs);
    spawnExplosion(ce.x, ce.y, getPowerUp(ce.powerUpId)?.color || '#fff');
  }

  // Expiration des power-ups
  puManager.update({ ship, drone, session, field });

  const ev3 = session.checkDroneLost(drone, ship);
  if (ev3 && ev3.type === 'gameOver') playGameOver();
  if (ev3 && ev3.type === 'loseLife') playLoseLife();

  const ev4 = session.checkWin(field);
  if (ev4) playWin();
}

// --- HUD ---
function drawHUD() {
  const s = gameScale();
  const fontSize = Math.round(18 * s);
  const pad = Math.round(15 * s);
  const pb = pauseBtnLayout();
  ctx.fillStyle = '#ffffff';
  ctx.font = `${fontSize}px monospace`;
  ctx.fillText(`VIES: ${session.lives}`, pad, pad + fontSize * 0.6);
  const scoreText = `SCORE: ${session.score}`;
  const scoreW = ctx.measureText(scoreText).width;
  // Placer le score à gauche du bouton pause
  ctx.fillText(scoreText, pb.x - scoreW - 8, pad + fontSize * 0.6);
}

function drawDeathLine(ship) {
  const lineY = ship.y + ship.height + ship.bottomMargin * 0.4;
  const w = CONFIG.canvas.width;

  // Lueur diffuse statique
  const glow = ctx.createLinearGradient(0, lineY - 15, 0, lineY + 15);
  glow.addColorStop(0, 'rgba(0, 212, 255, 0)');
  glow.addColorStop(0.5, 'rgba(0, 212, 255, 0.07)');
  glow.addColorStop(1, 'rgba(0, 212, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, lineY - 15, w, 30);

  // Ligne continue avec grésillement (segments d'opacité variable)
  ctx.save();
  const segW = 6;
  for (let x = 0; x < w; x += segW) {
    const a = 0.25 + Math.random() * 0.35;
    ctx.strokeStyle = `rgba(0, 212, 255, ${a})`;
    ctx.lineWidth = 0.8 + Math.random() * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, lineY + (Math.random() - 0.5) * 1.2);
    ctx.lineTo(x + segW, lineY + (Math.random() - 0.5) * 1.2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPauseButton() {
  const { x, y, size } = pauseBtnLayout();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#ffffff';
  const barW = Math.round(size * 0.13);
  const barH = Math.round(size * 0.53);
  const padX = Math.round(size * 0.3);
  const padY = Math.round(size * 0.23);
  ctx.fillRect(x + padX, y + padY, barW, barH);
  ctx.fillRect(x + size - padX - barW, y + padY, barW, barH);
}

function drawPauseScreen() {
  const cx = CONFIG.canvas.width / 2;
  const cy = CONFIG.canvas.height / 2;
  const s = gameScale();
  const halfW = Math.round(CONFIG.canvas.width * 0.4);
  const btnH = Math.round(44 * s);
  const gap = Math.round(16 * s);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = '#00d4ff';
  ctx.font = `bold ${Math.round(32 * s)}px monospace`;
  ctx.fillText('PAUSE', cx, cy - 40 * s);

  // Bouton REPRENDRE
  ctx.fillStyle = 'rgba(0, 212, 255, 0.15)';
  ctx.fillRect(cx - halfW, cy, halfW * 2, btnH);
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - halfW, cy, halfW * 2, btnH);
  ctx.fillStyle = '#ffffff';
  ctx.font = `${Math.round(20 * s)}px monospace`;
  ctx.fillText('REPRENDRE', cx, cy + btnH * 0.65);

  // Bouton MENU
  const menuY = cy + btnH + gap;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(cx - halfW, menuY, halfW * 2, btnH);
  ctx.strokeStyle = '#334455';
  ctx.strokeRect(cx - halfW, menuY, halfW * 2, btnH);
  ctx.fillStyle = '#667788';
  ctx.fillText('MENU', cx, menuY + btnH * 0.65);

  // Instructions clavier
  const isMobile = 'ontouchstart' in window;
  if (!isMobile) {
    ctx.font = `${Math.round(12 * s)}px monospace`;
    ctx.fillStyle = '#445566';
    ctx.fillText('ÉCHAP REPRENDRE  ·  R MENU', cx, menuY + btnH + 30 * s);
  }

  ctx.restore();
}

function drawEndScreen(text) {
  const s = gameScale();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(32 * s)}px monospace`;
  ctx.textAlign = 'center';
  ctx.fillText(text, CONFIG.canvas.width / 2, CONFIG.canvas.height / 2);
  ctx.font = `${Math.round(16 * s)}px monospace`;
  ctx.fillText('Appuie pour retourner au menu', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 + 40 * s);
  ctx.textAlign = 'start';
}

// --- Game loop ---
function loop() {
  ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
  updateStars();

  // Curseur adapté à l'état
  document.body.classList.toggle('menu', session.state === 'menu' || session.state === 'paused');

  if (isDevPanelActive()) {
    const mouse = getMousePos();
    handleDevHover(mouse.x, mouse.y);
    drawDevPanel(ctx);
    requestAnimationFrame(loop);
    return;
  }

  if (session.state === 'menu') {
    const mouse = getMousePos();
    updateMenuHover(mouse.x, mouse.y);
    updateMenu(ctx);
    requestAnimationFrame(loop);
    return;
  }

  if (session.state === 'paused') {
    field.draw(ctx);
    ship.draw(ctx);
    drone.draw(ctx);
    drawHUD();
    drawPauseScreen();
    requestAnimationFrame(loop);
    return;
  }

  if (session.state === 'gameOver') {
    drawEndScreen('GAME OVER');
    requestAnimationFrame(loop);
    return;
  }
  if (session.state === 'won') {
    drawEndScreen('ZONE NETTOYÉE !');
    requestAnimationFrame(loop);
    return;
  }

  field.update();
  ship.update(getTouchX());
  drone.update(ship, CONFIG.canvas.width);
  if (drone.launched) spawnTrail(drone.x, drone.y);
  for (const c of capsules) c.update(CONFIG.canvas.height);
  capsules = capsules.filter(c => c.alive);
  handleCollisions();

  field.draw(ctx);
  updateParticles(ctx);
  for (const c of capsules) drawCapsule(ctx, c);
  if (ship.isMobile) drawDeathLine(ship);
  ship.draw(ctx);
  drone.draw(ctx);
  drawHUD();
  drawPowerUpHUD(ctx, puManager.getActive(), CONFIG.canvas.width);
  drawPauseButton();

  requestAnimationFrame(loop);
}

loop();
