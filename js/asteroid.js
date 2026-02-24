import { CONFIG } from './config.js';

// Génère un polygone irrégulier (seed par astéroïde)
function generateShape(numPoints) {
  const points = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2;
    const jitter = 0.7 + Math.random() * 0.5;
    points.push({ angle, jitter });
  }
  return points;
}

export class AsteroidField {
  constructor() {
    const c = CONFIG.asteroids;
    this.grid = [];

    for (let row = 0; row < c.rows; row++) {
      for (let col = 0; col < c.cols; col++) {
        const sizeVar = 0.85 + Math.random() * 0.3;
        this.grid.push({
          x: c.offsetLeft + col * (c.width + c.padding),
          y: c.offsetTop + row * (c.height + c.padding),
          width: c.width * sizeVar,
          height: c.height * sizeVar,
          alive: true,
          color: c.colors[row % c.colors.length],
          shape: generateShape(8 + Math.floor(Math.random() * 4)),
          craters: [
            { ox: -0.3 + Math.random() * 0.1, oy: -0.2 + Math.random() * 0.1, r: 3 + Math.random() * 2 },
            { ox: 0.15 + Math.random() * 0.1, oy: 0.2 + Math.random() * 0.1, r: 2 + Math.random() * 2 },
            { ox: 0.0 + Math.random() * 0.2, oy: -0.1 + Math.random() * 0.1, r: 1.5 + Math.random() * 1.5 },
          ],
        });
      }
    }
  }

  get remaining() {
    return this.grid.filter((a) => a.alive).length;
  }

  draw(ctx) {
    for (const a of this.grid) {
      if (!a.alive) continue;

      const cx = a.x + CONFIG.asteroids.width / 2;
      const cy = a.y + CONFIG.asteroids.height / 2;
      const rx = a.width / 2;
      const ry = a.height / 2;

      // Forme irrégulière
      ctx.fillStyle = a.color;
      ctx.beginPath();
      for (let i = 0; i < a.shape.length; i++) {
        const { angle, jitter } = a.shape[i];
        const px = cx + Math.cos(angle) * rx * jitter;
        const py = cy + Math.sin(angle) * ry * jitter;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Contour subtil
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Cratères
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      for (const c of a.craters) {
        ctx.beginPath();
        ctx.arc(cx + rx * c.ox, cy + ry * c.oy, c.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
