import { CONFIG } from './config.js';
import { Ship } from './ship.js';
import { Drone } from './drone.js';
import { AsteroidField } from './asteroid.js';

// --- Canvas setup ---
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// --- Étoiles (fond) ---
const stars = Array.from({ length: CONFIG.starCount }, () => ({
  x: Math.random() * CONFIG.canvas.width,
  y: Math.random() * CONFIG.canvas.height,
  size: Math.random() * 2 + 0.5,
  alpha: Math.random() * 0.8 + 0.2,
}));

function drawStars() {
  for (const s of stars) {
    ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
    ctx.fillRect(s.x, s.y, s.size, s.size);
  }
}

// --- État du jeu ---
let lives = CONFIG.lives;
let score = 0;
let gameOver = false;
let won = false;

const ship = new Ship(CONFIG.canvas.width, CONFIG.canvas.height);
const drone = new Drone(ship);
const field = new AsteroidField();

// --- Contrôles ---
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') ship.movingLeft = true;
  if (e.key === 'ArrowRight') ship.movingRight = true;
  if (e.key === ' ' && !drone.launched) drone.launched = true;
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowLeft') ship.movingLeft = false;
  if (e.key === 'ArrowRight') ship.movingRight = false;
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
    // Angle selon point d'impact
    const hit = (d.x - s.x) / s.width; // 0..1
    d.dx = d.speed * (hit - 0.5) * 2;
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
      a.alive = false;
      drone.dy = -drone.dy;
      score += 10;
      return;
    }
  }
}

function checkDroneLost() {
  if (drone.y - drone.radius > CONFIG.canvas.height) {
    lives--;
    if (lives <= 0) {
      gameOver = true;
    } else {
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

function drawEndScreen(text) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = '32px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, CONFIG.canvas.width / 2, CONFIG.canvas.height / 2);
  ctx.font = '16px monospace';
  ctx.fillText('Appuie sur R pour rejouer', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2 + 40);
  ctx.textAlign = 'start';
}

// --- Restart ---
document.addEventListener('keydown', (e) => {
  if (e.key === 'r' && (gameOver || won)) {
    lives = CONFIG.lives;
    score = 0;
    gameOver = false;
    won = false;
    field.grid.forEach((a) => (a.alive = true));
    drone.reset(ship);
  }
});

// --- Game loop ---
function loop() {
  ctx.clearRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
  drawStars();

  if (gameOver) {
    drawEndScreen('GAME OVER');
    requestAnimationFrame(loop);
    return;
  }
  if (won) {
    drawEndScreen('ZONE NETTOYÉE !');
    requestAnimationFrame(loop);
    return;
  }

  ship.update();
  drone.update(ship, CONFIG.canvas.width);
  checkShipCollision();
  checkAsteroidCollision();
  checkDroneLost();

  if (field.remaining === 0) won = true;

  field.draw(ctx);
  ship.draw(ctx);
  drone.draw(ctx);
  drawHUD();

  requestAnimationFrame(loop);
}

loop();
