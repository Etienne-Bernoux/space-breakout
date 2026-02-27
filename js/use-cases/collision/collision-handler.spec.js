import { CollisionHandler } from './collision-handler.js';

// --- Helpers pour créer des mocks ---

function makeDrone(launched = true) {
  return { launched, x: 50, y: 50, reset: vi.fn() };
}

function makeShip() {
  return { x: 100, y: 400, width: 60, height: 10 };
}

function makeField(remaining = 5) {
  return { remaining };
}

function makeDeps(overrides = {}) {
  const entities = {
    ship: makeShip(),
    drones: [makeDrone()],
    field: makeField(),
    capsules: [],
    totalAsteroids: 10,
    ...overrides.entities,
  };
  const session = {
    checkShipCollision: vi.fn(() => null),
    checkAsteroidCollision: vi.fn(() => null),
    checkCapsuleCollision: vi.fn(() => []),
    isDroneLost: vi.fn(() => false),
    checkWin: vi.fn(() => null),
    loseLife: vi.fn(() => 2),
    state: 'playing',
    ...overrides.session,
  };
  const systems = {
    intensity: {
      onBounce: vi.fn(),
      onAsteroidHit: vi.fn(),
      onAsteroidDestroyed: vi.fn(),
      onPowerUpActivated: vi.fn(),
      onPowerUpExpired: vi.fn(),
      onGameOver: vi.fn(),
      onLifeChanged: vi.fn(),
      onWin: vi.fn(),
    },
    drop: { decideDrop: vi.fn(() => null) },
    powerUp: {
      activate: vi.fn(),
      update: vi.fn(),
      getActive: vi.fn(() => []),
    },
    ...overrides.systems,
  };
  const ui = { combo: 0, comboDisplay: 0, comboFadeTimer: 0, slowMoTimer: 0, ...overrides.ui };
  const config = {
    screenshake: { intensity: { small: 2, medium: 4, large: 6 } },
    capsule: { speed: 2 },
    ...overrides.config,
  };
  const effects = {
    spawnExplosion: vi.fn(),
    triggerShake: vi.fn(),
    ...overrides.effects,
  };
  return { entities, session, systems, ui, config, effects };
}

function asteroidHitEvent(sizeName = 'small') {
  return { type: 'asteroidHit', x: 100, y: 50, color: '#f00', sizeName, materialKey: 'rock' };
}

// --- Tests ---

describe('CollisionHandler', () => {
  let deps, handler;

  beforeEach(() => {
    deps = makeDeps();
    handler = new CollisionHandler(deps);
  });

  // 1. Bounce vaisseau
  it('reset le combo et notifie intensity sur bounce vaisseau', () => {
    deps.ui.combo = 5;
    deps.session.checkShipCollision.mockReturnValue({ type: 'shipBounce' });

    handler.update();

    expect(deps.ui.combo).toBe(0);
    expect(deps.systems.intensity.onBounce).toHaveBeenCalled();
  });

  // 2. Asteroid hit
  it('spawn une explosion et notifie intensity sur asteroid hit', () => {
    deps.session.checkAsteroidCollision.mockReturnValue(asteroidHitEvent());

    handler.update();

    expect(deps.effects.spawnExplosion).toHaveBeenCalledWith(100, 50, '#f00');
    expect(deps.systems.intensity.onAsteroidHit).toHaveBeenCalled();
  });

  // 3. Combo incrémenté et shake
  it('incrémente le combo et trigger un shake sur asteroid destroy', () => {
    deps.session.checkAsteroidCollision.mockReturnValue(asteroidHitEvent('medium'));

    handler.update();

    expect(deps.ui.combo).toBe(1);
    expect(deps.effects.triggerShake).toHaveBeenCalledWith(4);
  });

  // 4. Combo display activé à ≥ 2
  it('met à jour comboDisplay et comboFadeTimer quand combo >= 2', () => {
    deps.ui.combo = 1; // déjà 1, va passer à 2
    deps.session.checkAsteroidCollision.mockReturnValue(asteroidHitEvent());

    handler.update();

    expect(deps.ui.combo).toBe(2);
    expect(deps.ui.comboDisplay).toBe(2);
    expect(deps.ui.comboFadeTimer).toBe(90); // COMBO_FADE_DURATION
  });

  // 5. Capsule drop
  it('crée une capsule quand decideDrop retourne un puId', () => {
    deps.systems.drop.decideDrop.mockReturnValue('shield');
    deps.session.checkAsteroidCollision.mockReturnValue(asteroidHitEvent());

    handler.update();

    expect(deps.entities.capsules.length).toBe(1);
    expect(deps.entities.capsules[0].powerUpId).toBe('shield');
  });

  // 6. Win trigger slow-mo
  it('active le slow-mo quand field.remaining atteint 0', () => {
    deps.entities.field = makeField(0);
    deps.session.checkAsteroidCollision.mockReturnValue(asteroidHitEvent());

    handler.update();

    expect(deps.ui.slowMoTimer).toBe(30); // SLOW_MO_DURATION
  });

  // 7. Capsule pickup
  it('active le power-up et spawn une explosion sur capsule pickup', () => {
    deps.session.checkCapsuleCollision.mockReturnValue([
      { powerUpId: 'shield', x: 80, y: 200 },
    ]);

    handler.update();

    expect(deps.systems.powerUp.activate).toHaveBeenCalledWith('shield', expect.any(Object));
    expect(deps.systems.intensity.onPowerUpActivated).toHaveBeenCalled();
    expect(deps.effects.spawnExplosion).toHaveBeenCalled();
  });

  // 8. Power-up expiry
  it('notifie intensity quand tous les power-ups expirent', () => {
    // Avant update : 1 actif, après : 0
    let callCount = 0;
    deps.systems.powerUp.getActive.mockImplementation(() => {
      return callCount++ === 0 ? [{ id: 'shield' }] : [];
    });

    handler.update();

    expect(deps.systems.intensity.onPowerUpExpired).toHaveBeenCalled();
  });

  // 9. Drone perdu en multi-drone → splice sans perte de vie
  it('retire un drone bonus sans perdre de vie', () => {
    deps.entities.drones = [makeDrone(), makeDrone()];
    deps.session.isDroneLost.mockImplementation((d) => d === deps.entities.drones[1]);

    handler.update();

    expect(deps.entities.drones.length).toBe(1);
    expect(deps.session.loseLife).not.toHaveBeenCalled();
  });

  // 10. Dernier drone perdu → perte de vie
  it('perd une vie et reset le drone quand le dernier est perdu', () => {
    deps.session.isDroneLost.mockReturnValue(true);
    deps.session.loseLife.mockReturnValue(2);
    deps.ui.combo = 3;

    handler.update();

    expect(deps.session.loseLife).toHaveBeenCalled();
    expect(deps.ui.combo).toBe(0);
    expect(deps.entities.drones[0].reset).toHaveBeenCalledWith(deps.entities.ship);
    expect(deps.systems.intensity.onLifeChanged).toHaveBeenCalledWith(2);
  });

  // 11. Game over
  it('passe en gameOver quand loseLife retourne 0', () => {
    deps.session.isDroneLost.mockReturnValue(true);
    deps.session.loseLife.mockReturnValue(0);

    handler.update();

    expect(deps.session.state).toBe('gameOver');
    expect(deps.systems.intensity.onGameOver).toHaveBeenCalled();
  });

  // 12. Win condition
  it('notifie intensity.onWin quand checkWin retourne un event', () => {
    deps.ui.slowMoTimer = 0;
    deps.session.checkWin.mockReturnValue({ type: 'win' });

    handler.update();

    expect(deps.systems.intensity.onWin).toHaveBeenCalled();
  });

  // 13. Win bloqué pendant slow-mo
  it('ne check pas le win pendant le slow-mo', () => {
    deps.ui.slowMoTimer = 10;

    handler.update();

    expect(deps.session.checkWin).not.toHaveBeenCalled();
  });
});
