import { CONFIG } from './config.js';
import { Ship } from './ship.js';
import { Drone } from './drone.js';
import { AsteroidField } from './asteroid.js';
import { updateStars } from './stars.js';
import { updateMenu, handleMenuInput, handleMenuTap, updateMenuHover, handleMenuDrag, handleMenuRelease, resetMenu, loadSettings, setVolumeChangeCallback, getMusicVolume, getSfxVolume } from './menu.js';
import { setupResize } from './resize.js';
import { setupTouch, getTouchX, setTapHandler, setMenuTapHandler, setDragHandler, setReleaseHandler, getMousePos } from './touch.js';
import { spawnExplosion, spawnTrail, updateParticles } from './particles.js';
import { playBounce, playAsteroidHit, playLoseLife, playWin, playGameOver, playLaunch, unlockAudio, setSfxVolume } from './audio.js';
import { startMusic, isPlaying, setVolume as setMusicVolume } from './music.js';

// --- Canvas setup ---
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// --- États du jeu ---
let state = 'menu'; // menu | playing | paused | gameOver | won
let lives, score, ship = null, drone = null, field;

// --- Bouton pause (mobile) ---
const pauseBtn = { x: CONFIG.canvas.width - 45, y: 5, size: 30 };

setupResize(() => {
  // Repositionner le vaisseau en bas quand la hauteur change
  if (ship) {
    ship.y = CONFIG.canvas.height - ship.height - 10;
    ship.canvasWidth = CONFIG.canvas.width;
    if (drone && !drone.launched) drone.reset(ship);
  }
});
setupTouch();

// --- Chargement des réglages audio ---
// Courbe perceptuelle : x² pour que 50% du slider ≈ moitié du volume perçu
function perceptualVolume(v) { return v * v; }

loadSettings();
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
  lives = CONFIG.lives;
  score = 0;
  ship = new Ship(CONFIG.canvas.width, CONFIG.canvas.height);
  drone = new Drone(ship);
  field = new AsteroidField();
  state = 'playing';
}

// --- Handlers tactiles ---
setTapHandler((x, y) => {
  if (state === 'playing') {
    // Tap sur bouton pause
    if (x >= pauseBtn.x && x <= pauseBtn.x + pauseBtn.size &&
        y >= pauseBtn.y && y <= pauseBtn.y + pauseBtn.size) {
      state = 'paused';
      return;
    }
    if (!drone.launched) { drone.launched = true; playLaunch(); }
  }
  if (state === 'gameOver' || state === 'won') {
    resetMenu();
    state = 'menu';
  }
});

setMenuTapHandler((x, y) => {
  ensureMusic();
  if (state === 'menu') {
    const action = handleMenuTap(x, y);
    if (action === 'play') startGame();
  }
  if (state === 'paused') {
    const cx = CONFIG.canvas.width / 2;
    const cy = CONFIG.canvas.height / 2;
    // Bouton REPRENDRE
    if (x >= cx - 120 && x <= cx + 120 && y >= cy && y <= cy + 40) {
      state = 'playing';
    }
    // Bouton MENU
    if (x >= cx - 120 && x <= cx + 120 && y >= cy + 60 && y <= cy + 100) {
      resetMenu();
      state = 'menu';
    }
  }
});

// --- Drag slider (réglages) ---
setDragHandler((x, y) => {
  if (state === 'menu') handleMenuDrag(x, y);
});
setReleaseHandler(() => {
  handleMenuRelease();
});

// --- Contrôles clavier ---
document.addEventListener('keydown', (e) => {
  ensureMusic();
  if (state === 'menu') {
    const action = handleMenuInput(e.key);
    if (action === 'play') startGame();
    return;
  }

  if (state === 'playing') {
    if (e.key === 'ArrowLeft') ship.movingLeft = true;
    if (e.key === 'ArrowRight') ship.movingRight = true;
    if (e.key === ' ' && !drone.launched) { drone.launched = true; playLaunch(); }
    if (e.key === 'Escape') { state = 'paused'; return; }
  }

  if (state === 'paused') {
    if (e.key === 'Escape') state = 'playing';
    if (e.key === 'r') { resetMenu(); state = 'menu'; }
    return;
  }

  if ((state === 'gameOver' || state === 'won') && e.key === 'r') {
    resetMenu();
    state = 'menu';
  }
});

document.addEventListener('keyup', (e) => {
  if (state === 'playing') {
    if (e.key === 'ArrowLeft') ship.movingLeft = false;
    if (e.key === 'ArrowRight') ship.movingRight = false;
  }
});

// --- Collisions ---
function checkShipCollision() {
  const d = drone;
  const s = ship;
  if (
    d.dy > 0 &&
    d.y + d.radius >= s.y &&
    d.x >= s.x &&
    d.x <= s.x + s.width
  ) {
    d.dy = -d.dy;
    const hit = (d.x - s.x) / s.width;
    d.dx = d.speed * (hit - 0.5) * 2;
    playBounce();
  }
}

function checkAsteroidCollision() {
  for (const a of field.grid) {
    if (!a.alive) continue;
    if (
      drone.x + drone.radius > a.x &&
      drone.x - drone.radius < a.x + a.width &&
      drone.y + drone.radius > a.y &&
      drone.y - drone.radius < a.y + a.height
    ) {
      spawnExplosion(a.x + a.width / 2, a.y + a.height / 2, a.color);
      playAsteroidHit();
      a.alive = false;
      drone.dy = -drone.dy;
      const pts = a.sizeName === 'large' ? 40 : a.sizeName === 'medium' ? 20 : 10;
      score += pts;
      return;
    }
  }
}

function checkDroneLost() {
  if (drone.y - drone.radius > CONFIG.canvas.height) {
    lives--;
    if (lives <= 0) {
      state = 'gameOver';
      playGameOver();
    } else {
      playLoseLife();
      drone.reset(ship);
    }
  }
}

// --- HUD ---
function drawHUD() {
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px monospace';
  ctx.fillText(`VIES: ${lives}`, 15, 25);
  ctx.fillText(`SCORE: ${score}`, CONFIG.canvas.width - 130, 25);
}

function drawPauseButton() {
  const { x, y, size } = pauseBtn;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 9, y + 7, 4, 16);
  ctx.fillRect(x + 17, y + 7, 4, 16);
}

function drawPauseScreen() {
  const cx = CONFIG.canvas.width / 2;
  const cy = CONFIG.canvas.height / 2;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

  ctx.save();
  ctx.textAlign = 'center';

  ctx.fillStyle = '#00d4ff';
  ctx.font = 'bold 32px monospace';
  ctx.fillText('PAUSE', cx, cy - 40);

  // Bouton REPRENDRE
  ctx.fillStyle = 'rgba(0, 212, 255, 0.15)';
  ctx.fillRect(cx - 120, cy, 240, 40);
  ctx.strokeStyle = '#00d4ff';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 120, cy, 240, 40);
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px monospace';
  ctx.fillText('REPRENDRE', cx, cy + 26);

  // Bouton MENU
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.fillRect(cx - 120, cy + 60, 240, 40);
  ctx.strokeStyle = '#334455';
  ctx.strokeRect(cx - 120, cy + 60, 240, 40);
  ctx.fillStyle = '#667788';
  ctx.fillText('MENU', cx, cy + 86);

  // Instructions clavier
  const isMobile = 'ontouchstart' in window;
  if (!isMobile) {
    ctx.font = '12px monospace';
    ctx.fillStyle = '#445566';
    ctx.fillText('ÉCHAP REPRENDRE  ·  R MENU', cx, cy + 130);
  }

  ctx.restore();
}

function drawEndScreen(text) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = '32px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, CONFIG.canvas.width / 2, CONFIG.canvas.height / 2);
  ctx.font = '16px monospace';
  ctx.fillText('Appuie pour retourner au menu', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 + 40);
  ctx.textAlign = 'start';
}

// --- Game loop ---
function loop() {
  ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
  updateStars();

  // Curseur adapté à l'état
  document.body.classList.toggle('menu', state === 'menu' || state === 'paused');

  if (state === 'menu') {
    const mouse = getMousePos();
    updateMenuHover(mouse.x, mouse.y);
    updateMenu(ctx);
    requestAnimationFrame(loop);
    return;
  }

  if (state === 'paused') {
    field.draw(ctx);
    ship.draw(ctx);
    drone.draw(ctx);
    drawHUD();
    drawPauseScreen();
    requestAnimationFrame(loop);
    return;
  }

  if (state === 'gameOver') {
    drawEndScreen('GAME OVER');
    requestAnimationFrame(loop);
    return;
  }
  if (state === 'won') {
    drawEndScreen('ZONE NETTOYÉE !');
    requestAnimationFrame(loop);
    return;
  }

  field.update();
  ship.update(getTouchX());
  drone.update(ship, CONFIG.canvas.width);
  if (drone.launched) spawnTrail(drone.x, drone.y);
  checkShipCollision();
  checkAsteroidCollision();
  checkDroneLost();

  if (field.remaining === 0) { state = 'won'; playWin(); }

  field.draw(ctx);
  updateParticles(ctx);
  ship.draw(ctx);
  drone.draw(ctx);
  drawHUD();
  drawPauseButton();

  requestAnimationFrame(loop);
}

loop();
