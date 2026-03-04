# Plan : Astéroïdes habités

## Résumé

Nouveau matériau "alien" — astéroïdes avec base + canon qui tirent des projectiles verts vers le vaisseau. Le projectile renforce les astéroïdes qu'il touche et applique un malus d'immobilisation au vaisseau.

## Décisions

- **Renforce** les astéroïdes touchés (v1). "Détruit" → backlog futur.
- **Malus** : nouveau power-up `shipStun` (immobilisation 2-3s), non droppable.
- **Intelligence locale** : chaque astéroïde habité a son propre timer de tir, pas de manager centralisé pour le timing.
- **Projectile** : entité domain pure, gérée comme les capsules (array dans G.entities).
- **Niveaux 1-5** : aucun alien. Niveau alien défini dans le level catalog.

## Phases

### Phase 1 — Matériau alien (domain)
**Fichiers** : `materials.js`
- Ajouter matériau `alien` : hp 3, couleurs vert/violet, style 'alien', `pointsMult: 2.5`
- Propriétés spécifiques : `fireRate: 360` (frames à 60fps ≈ 6s), `projectileSpeed: 1.5`
- Tests : materials.spec.js

### Phase 2 — Entité AlienProjectile (domain)
**Fichiers** : `domain/projectile/alien-projectile.js`, `domain/projectile/index.js`
- Classe pure : `{ x, y, vx, vy, radius, color, alive, rotation }`
- `update(canvasWidth, canvasHeight, ship, dt)` : mouvement + léger tracking vers ship
- Tracking : `vx += (targetDx) * trackingFactor * dt` (correction douce, pas homing)
- Tests : `domain/projectile/alien-projectile.spec.js`

### Phase 3 — Tir depuis AsteroidField (domain)
**Fichiers** : `asteroid/asteroid-field.js`
- À la création d'un astéroïde alien : ajouter `fireTimer`, `fireRate` (depuis material config)
- `update(dt)` : décrémenter `fireTimer` des aliens vivants
- Nouvelle méthode `getReadyToFire()` → retourne les astéroïdes dont `fireTimer <= 0` et reset leur timer
- Le loop appellera `getReadyToFire()` et spawnera les projectiles
- Tests : asteroid-field.spec.js

### Phase 4 — Collision projectile (use-cases)
**Fichiers** : `collision/collision-resolver.js`, `collision/collision-handler.js`
- `checkProjectileShipCollision(projectiles, ship)` → event `{ type: 'projectileHit', x, y }`
- `checkProjectileAsteroidCollision(projectiles, field)` → event `{ type: 'projectileReinforce', asteroid, x, y }`
  - Renforce : `asteroid.hp += 1`, `asteroid.maxHp += 1`
- Projectile ignore le drone (pas de collision drone-projectile)
- Dans CollisionHandler : appliquer malus `shipStun` via PowerUpManager
- Tests : collision-resolver.spec.js, collision-handler.spec.js

### Phase 5 — Power-up shipStun (domain + use-cases)
**Fichiers** : `power-ups.js`, `power-up-manager.js`
- Nouveau power-up `shipStun` : type 'malus', duration 2500ms, non droppable
- Effet : `{ target: 'ship', action: 'stun' }` → ship.speed = 0 (save/restore via strategy)
- Nouvelle stratégie dans PowerUpManager
- Tests : power-up-manager.spec.js

### Phase 6 — Config + level catalog
**Fichiers** : `config.js`, `domain/progression/level-catalog.js`
- Config projectile dans `CONFIG.projectile: { radius, speed, trackingFactor, color }`
- Ajouter `alien` dans les materials des niveaux 6+ du catalog
- Tests : level-catalog.spec.js

### Phase 7 — Wiring + loop (main)
**Fichiers** : `main/init.js`, `main/loop.js`
- `G.entities.projectiles = []`
- Dans `#loopPlaying` :
  - `field.getReadyToFire()` → spawn projectiles
  - Update projectiles (position + tracking)
  - Filtrer les morts
  - Collision handler gère projectile-ship et projectile-asteroid
- Slow-mo s'applique aux projectiles (`dtEff`)

### Phase 8 — Rendu visuel (infra)
**Fichiers** : `infra/renderers/projectile-render.js`, `infra/renderers/asteroid-render.js`
- `drawProjectile(ctx, p)` : boule verte avec glow + petite traînée
- Style alien dans asteroid-render : base alien (structure métallique/organique) + canon orienté vers le bas + pulsation
- Intégrer dans `#drawScene` entre capsules et ship

## Ordre d'exécution

Phase 1 → 2 → 3 → 6 → 5 → 4 → 7 → 8

(On crée les briques domain d'abord, puis le wiring, puis le visuel)
