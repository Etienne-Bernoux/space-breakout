import { expect } from 'chai';
import { GameSession } from './game-session.js';

const TEST_CONFIG = {
  canvas: { width: 800, height: 600 },
  lives: 3,
};

function makeSession() {
  return new GameSession(TEST_CONFIG);
}

function makeDrone(overrides = {}) {
  return {
    x: 400, y: 500, dx: 1, dy: -3, radius: 6, speed: 3,
    launched: true,
    reset() { this.launched = false; this.y = 0; },
    ...overrides,
  };
}

function makeShip(overrides = {}) {
  return { x: 350, y: 570, width: 100, height: 20, ...overrides };
}

function makeAsteroid(overrides = {}) {
  return {
    x: 100, y: 50, width: 70, height: 28,
    alive: true, sizeName: 'small', color: '#8b4513',
    hp: 1, maxHp: 1, destructible: true,
    materialKey: 'rock', material: { pointsMult: 1, noFragment: false },
    ...overrides,
  };
}

function makeField(asteroids) {
  return {
    grid: asteroids,
    get remaining() { return this.grid.filter(a => a.alive).length; },
    fragment(ast) { ast.alive = false; return []; },
  };
}

// --- State transitions ---

describe('GameSession — état', () => {
  it('démarre en menu', () => {
    const s = makeSession();
    expect(s.state).to.equal('menu');
  });

  it('start() passe en playing avec lives et score', () => {
    const s = makeSession();
    s.start();
    expect(s.state).to.equal('playing');
    expect(s.lives).to.equal(3);
    expect(s.score).to.equal(0);
  });

  it('pause() et resume()', () => {
    const s = makeSession();
    s.start();
    s.pause();
    expect(s.state).to.equal('paused');
    s.resume();
    expect(s.state).to.equal('playing');
  });

  it('pause() ignorée si pas en playing', () => {
    const s = makeSession();
    s.pause();
    expect(s.state).to.equal('menu');
  });

  it('resume() ignorée si pas en paused', () => {
    const s = makeSession();
    s.start();
    s.resume(); // déjà playing
    expect(s.state).to.equal('playing');
  });

  it('backToMenu()', () => {
    const s = makeSession();
    s.start();
    s.backToMenu();
    expect(s.state).to.equal('menu');
  });
});

// --- Ship collision ---

describe('GameSession — checkShipCollision', () => {
  it('rebondit quand le drone touche le vaisseau', () => {
    const s = makeSession();
    s.start();
    const ship = makeShip();
    const drone = makeDrone({ x: 400, y: 565, dy: 3 });
    const ev = s.checkShipCollision(drone, ship);
    expect(ev).to.deep.equal({ type: 'bounce' });
    expect(drone.dy).to.be.below(0);
  });

  it('pas de rebond si drone monte', () => {
    const s = makeSession();
    s.start();
    const ship = makeShip();
    const drone = makeDrone({ x: 400, y: 565, dy: -3 });
    const ev = s.checkShipCollision(drone, ship);
    expect(ev).to.be.null;
  });

  it('pas de rebond si drone hors du vaisseau', () => {
    const s = makeSession();
    s.start();
    const ship = makeShip();
    const drone = makeDrone({ x: 200, y: 565, dy: 3 });
    const ev = s.checkShipCollision(drone, ship);
    expect(ev).to.be.null;
  });

  it('ajuste dx selon position de frappe', () => {
    const s = makeSession();
    s.start();
    const ship = makeShip({ x: 350, width: 100 });
    // Frappe côté gauche
    const drone = makeDrone({ x: 360, y: 565, dy: 3 });
    s.checkShipCollision(drone, ship);
    expect(drone.dx).to.be.below(0); // renvoie vers la gauche
  });
});

// --- Asteroid collision ---

describe('GameSession — checkAsteroidCollision', () => {
  it('détruit un astéroïde et retourne un event', () => {
    const s = makeSession();
    s.start();
    const ast = makeAsteroid({ x: 395, y: 495 });
    const field = makeField([ast]);
    const drone = makeDrone({ x: 400, y: 500, dy: -3 });
    const ev = s.checkAsteroidCollision(drone, field);
    expect(ev).to.not.be.null;
    expect(ev.type).to.equal('asteroidHit');
    expect(ev.points).to.equal(10); // small
    expect(ast.alive).to.be.false;
    expect(s.score).to.equal(10);
  });

  it('score 40 pour large, 20 pour medium', () => {
    const s = makeSession();
    s.start();
    const large = makeAsteroid({ sizeName: 'large', x: 395, y: 495 });
    const field1 = makeField([large]);
    const d1 = makeDrone({ x: 400, y: 500, dy: -3 });
    s.checkAsteroidCollision(d1, field1);
    expect(s.score).to.equal(40);

    const medium = makeAsteroid({ sizeName: 'medium', x: 395, y: 495 });
    const field2 = makeField([medium]);
    const d2 = makeDrone({ x: 400, y: 500, dy: -3 });
    s.checkAsteroidCollision(d2, field2);
    expect(s.score).to.equal(60); // 40 + 20
  });

  it('ignore les astéroïdes morts', () => {
    const s = makeSession();
    s.start();
    const ast = makeAsteroid({ alive: false, x: 395, y: 495 });
    const field = makeField([ast]);
    const drone = makeDrone({ x: 400, y: 500, dy: -3 });
    const ev = s.checkAsteroidCollision(drone, field);
    expect(ev).to.be.null;
  });

  it('null si pas de collision', () => {
    const s = makeSession();
    s.start();
    const ast = makeAsteroid({ x: 10, y: 10 });
    const field = makeField([ast]);
    const drone = makeDrone({ x: 400, y: 500 });
    const ev = s.checkAsteroidCollision(drone, field);
    expect(ev).to.be.null;
  });
});

// --- Matériaux : HP, indestructible ---

describe('GameSession — matériaux', () => {
  it('métal HP 3 : 2 premiers coups → asteroidDamage', () => {
    const s = makeSession();
    s.start();
    const ast = makeAsteroid({ hp: 3, maxHp: 3, x: 395, y: 495 });
    const field = makeField([ast]);
    const d = makeDrone({ x: 400, y: 500, dy: -3 });
    const ev = s.checkAsteroidCollision(d, field);
    expect(ev.type).to.equal('asteroidDamage');
    expect(ev.hpLeft).to.equal(2);
    expect(ast.alive).to.be.true;
    expect(s.score).to.equal(0); // pas de points tant que pas détruit
  });

  it('métal HP 1 restant → détruit et score', () => {
    const s = makeSession();
    s.start();
    const ast = makeAsteroid({ hp: 1, maxHp: 3, x: 395, y: 495, material: { pointsMult: 2, noFragment: false } });
    const field = makeField([ast]);
    const d = makeDrone({ x: 400, y: 500, dy: -3 });
    const ev = s.checkAsteroidCollision(d, field);
    expect(ev.type).to.equal('asteroidHit');
    expect(ev.points).to.equal(20); // 10 * pointsMult 2
    expect(ast.alive).to.be.false;
  });

  it('obsidienne indestructible → bounce, pas de dégât', () => {
    const s = makeSession();
    s.start();
    const ast = makeAsteroid({ destructible: false, hp: Infinity, x: 395, y: 495 });
    const field = makeField([ast]);
    const d = makeDrone({ x: 400, y: 500, dy: -3 });
    const ev = s.checkAsteroidCollision(d, field);
    expect(ev.type).to.equal('bounce');
    expect(ast.alive).to.be.true;
    expect(ast.hp).to.equal(Infinity);
    expect(s.score).to.equal(0);
  });

  it('cristal pointsMult 3 → triple points', () => {
    const s = makeSession();
    s.start();
    const ast = makeAsteroid({ x: 395, y: 495, material: { pointsMult: 3, noFragment: false } });
    const field = makeField([ast]);
    const d = makeDrone({ x: 400, y: 500, dy: -3 });
    const ev = s.checkAsteroidCollision(d, field);
    expect(ev.points).to.equal(30); // 10 * 3
  });
});

// --- Combo score multiplier ---

describe('GameSession — combo score multiplier', () => {
  it('combo 0-4 → ×1 (pas de bonus)', () => {
    const s = makeSession();
    s.start();
    s.combo = 4;
    const ast = makeAsteroid({ x: 395, y: 495 });
    const field = makeField([ast]);
    const d = makeDrone({ x: 400, y: 500, dy: -3 });
    s.checkAsteroidCollision(d, field);
    expect(s.score).to.equal(10); // small × 1
  });

  it('combo 5 → ×2', () => {
    const s = makeSession();
    s.start();
    s.combo = 5;
    const ast = makeAsteroid({ x: 395, y: 495 });
    const field = makeField([ast]);
    const d = makeDrone({ x: 400, y: 500, dy: -3 });
    s.checkAsteroidCollision(d, field);
    expect(s.score).to.equal(20); // small × 2
  });

  it('combo 10 → ×3', () => {
    const s = makeSession();
    s.start();
    s.combo = 10;
    const ast = makeAsteroid({ sizeName: 'large', x: 395, y: 495 });
    const field = makeField([ast]);
    const d = makeDrone({ x: 400, y: 500, dy: -3 });
    s.checkAsteroidCollision(d, field);
    expect(s.score).to.equal(120); // 40 × 3
  });

  it('combo se cumule avec material pointsMult', () => {
    const s = makeSession();
    s.start();
    s.combo = 5;
    const ast = makeAsteroid({ x: 395, y: 495, material: { pointsMult: 2 } });
    const field = makeField([ast]);
    const d = makeDrone({ x: 400, y: 500, dy: -3 });
    s.checkAsteroidCollision(d, field);
    expect(s.score).to.equal(40); // 10 × 2 (material) × 2 (combo)
  });

  it('combo reset à 0 après start()', () => {
    const s = makeSession();
    s.start();
    s.combo = 10;
    s.start();
    expect(s.combo).to.equal(0);
  });
});

// --- Drone lost ---

describe('GameSession — isDroneLost + loseLife', () => {
  it('détecte un drone tombé en bas', () => {
    const s = makeSession();
    s.start();
    const drone = makeDrone({ y: 610 });
    expect(s.isDroneLost(drone)).to.be.true;
  });

  it('false si drone encore dans le canvas', () => {
    const s = makeSession();
    s.start();
    const drone = makeDrone({ y: 400 });
    expect(s.isDroneLost(drone)).to.be.false;
  });

  it('false si drone non lancé', () => {
    const s = makeSession();
    s.start();
    const drone = makeDrone({ y: 610, launched: false });
    expect(s.isDroneLost(drone)).to.be.false;
  });

  it('loseLife décrémente les vies', () => {
    const s = makeSession();
    s.start();
    expect(s.loseLife()).to.equal(2);
    expect(s.lives).to.equal(2);
  });

  it('loseLife ne descend pas sous 0', () => {
    const s = makeSession();
    s.start();
    s.lives = 0;
    expect(s.loseLife()).to.equal(0);
  });
});

// --- Win ---

describe('GameSession — checkWin', () => {
  it('win quand remaining === 0', () => {
    const s = makeSession();
    s.start();
    const field = makeField([makeAsteroid({ alive: false })]);
    const ev = s.checkWin(field);
    expect(ev).to.deep.equal({ type: 'win' });
    expect(s.state).to.equal('won');
  });

  it('null si des astéroïdes restent', () => {
    const s = makeSession();
    s.start();
    const field = makeField([makeAsteroid({ alive: true })]);
    const ev = s.checkWin(field);
    expect(ev).to.be.null;
  });
});
