# Architecture & Décisions techniques

Détails des choix d'implémentation. Référencé depuis `CLAUDE.md`.

## Power-ups déclaratifs (pattern `def.effect`)
Chaque power-up dans `power-ups.js` porte un objet `effect` qui décrit son comportement :
```js
shipWide:  { effect: { target: 'ship',    prop: 'width',  factor: 1.5 } }
extraLife: { effect: { target: 'session',  prop: 'lives',  delta: 1 } }
weaken:    { effect: { target: 'field',    action: 'weakenAll', delta: -1 } }
```
`PowerUpManager` utilise un **strategy pattern** (STRATEGIES map) pour apply/revert/cumul. Ajouter un nouveau type d'effet = 1 objet strategy, pas 3 méthodes.

## Domain Shapes (collision = ce qu'on voit)
Chaque entité porte un `collisionPoly: [{x, y}]` (world-space) qui sert à la collision ET guide le rendu.

**Principe** : la forme domain est dynamique (mise à jour chaque frame dans `AsteroidField.update()`).
Le renderer peut ajouter des effets visuels (couleurs, glow, textures) mais doit rester dans la **tolérance** :
```
maxDeviation = min(entityRadius * 0.05, 3px)
```
Double garde-fou : pourcentage (5%) + distance absolue max (3px).

**Types de formes** :
- Astéroïde normal : polygone polaire (`shape.js`) → converti en Cartésien via `polarToCartesian()` (rotation + position)
- Tentacule alien : polygone effilé dynamique via `computeTentaclePoly()` (ondulation sinusoïdale, 22 points)
- Core alien : ellipse via `computeCorePoly()` (12 points, pulsation)

**Collision** : broadphase AABB (`polyBounds`) + narrowphase cercle↔polygone (`circleIntersectsPolygon`).
Fallback AABB si pas de `collisionPoly` (entités legacy).

**Fichiers** : `js/domain/shape/` (polygon-collision, tentacle-shape, core-shape).

## Responsive Canvas (pas de rem)
Canvas API ne supporte que des px pour les fonts/tailles. Tout le scaling est manuel.

**Formule commune** centralisée dans `shared/responsive.js` :
```js
export function gameScale(width = CONFIG.canvas.width) {
  return Math.min(1.0, Math.max(0.6, width / 500));
}
```
Importée partout (menu, HUD, pause, power-up-render). Un seul site à modifier si les breakpoints changent.

**Mobile vs desktop** : `isMobile = 'ontouchstart' in window`
- Passé aux constructeurs (`Ship`, `Drone`) pour activer les ratios proportionnels
- Ship mobile : `width = canvasWidth * 0.28` (config `mobileWidthRatio`)
- Drone mobile : `radius = canvasWidth * 0.02` (config `mobileRadiusRatio`)
- Desktop : valeurs fixes depuis config

**Boutons/textes responsive** :
- Boutons menu/pause : 80% de la largeur canvas (`halfW = w * 0.4`)
- Sliders : 60% de la largeur
- Score positionné relativement au bouton pause (pas de position absolue)

## GameIntensityDirector (chef d'orchestre)
Point d'entrée unique pour tous les événements gameplay. Les fichiers `main/` (collisions, input) n'importent jamais directement audio/music — tout passe par `G.intensityDirector.onXxx()`.

`GameIntensityDirector` (use-case, DI pure via ports duck-typed : `{ music, effects }`) calcule l'intensité 0-4 et dispatch vers :
- `MusicDirector` (`infra/orchestrators/`) — gère TOUS les sons (SFX + musique + stingers)
- `EffectDirector` (`infra/orchestrators/`) — effets visuels (vitesse étoiles, vignette, micro-shake, couleur death line, glow score)

Les orchestrateurs vivent dans `infra/` car ils dépendent de Web Audio / Canvas. Le GID ne les importe pas — il reçoit des ports via DI (NOOP fallbacks si non fournis).

Calcul d'intensité :
- Ratio astéroïdes restants (>80%→0, 50-80%→1, 30-50%→2, <30%→3, <10%→4)
- Combo boost (+1 à ≥3, +2 à ≥6)
- Power-up actif → min 2
- Dernière vie → min 3

## Musique adaptative
`music/` génère la musique procédurale avec 5 layers (drums, bass, pad, lead, high) sur des GainNodes séparés.
L'intensité contrôle les layers (fade in/out), le BPM (110→128), et sélectionne la section suivante.
Scheduling section-par-section (pas en bulk) pour permettre le mode adaptatif.
Fills de transition (snare roll, arp rise) 2 beats avant les changements de section.
Accents combo par paliers (×2: 1 note, ×3: 2 notes, ×5+: 3 notes).
Stinger spécial aux paliers ronds (×5, ×10, ×15…) : arpège majeur 7 en square wave filtré.

## EffectDirector
5 presets visuels (calm → climax), lerp progressif chaque frame (speed 0.06).
Effets pilotés : starSpeed, vignetteAlpha/Hue, microShake, deathLine RGB, scoreGlow/Color.

`music-lab/` (?mus) : panel de test avec 3 onglets :
- **Sons** : sections, instruments, stingers isolés + sélecteur piste (prêt multi-pistes)
- **Gameplay** : triggers simulés (destroy, combo, lives, PU) + override intensité 0-4
- **Mix** : toggle layers ON/OFF, effets (muffle)

## Delta-time (mouvement indépendant du framerate)
Tout mouvement et toute animation **doivent** utiliser le paramètre `dt` (delta-time normalisé à 60fps).

**Calcul** dans `loop.js` : `dt = (now - lastTime) / 16.667`, cap à 3 (anti-saut après tab switch).
À 60fps dt≈1.0, à 120fps dt≈0.5, à 30fps dt≈2.0. Les vitesses dans `config.js` sont calibrées pour 60fps.

**Convention** — toute méthode `update()` accepte `dt = 1` en dernier paramètre :
```js
update(ship, canvasWidth, dt = 1) {
  this.x += this.dx * dt;        // linéaire
}
```

**Patterns** :
- Mouvement linéaire : `value += speed * dt`
- Decay exponentiel : `value *= Math.pow(base, dt)` (ex: screenshake `Math.pow(0.85, dt)`)
- Lerp framerate-indépendant : `value += diff * (1 - Math.pow(1 - factor, dt))` (ex: ship touch 0.3)
- Timer : `timer -= dt` (les ratios `timer/duration` pour easing marchent sans changement)
- Slow-mo : `dtEff = dt * 0.33` (pas de frame-skip)

## Constantes centralisées
`config.js` regroupe tout : `scoring.basePoints`, `capsule` (bob/rotation/speed), `drop` (baseRate, sizeMult), ratios mobile. Aucune constante métier dans le code applicatif.

## Multi-drone
`G.drones` est un array. Le power-up `droneMulti` ajoute un drone supplémentaire (instant, duration 0).
Tous les drones non lancés partent en éventail (angles répartis uniformément).
Un drone bonus perdu est simplement retiré. Seul le dernier drone déclenche une perte de vie.
Game over uniquement quand le dernier drone est perdu ET vies à 0.

Le lifecycle drone est centralisé dans `DroneManager` (spawn, removeExtra, resetLast).
`CollisionHandler` et `PowerUpManager` utilisent le DroneManager via DI — aucune manipulation directe de `drones[]`.

## Dev overlay (?dev, desktop)
Deux panels DOM (pas canvas) de part et d'autre du jeu :
- **Panel gauche** (`#dev-overlay`) : boutons power-ups avec icônes, vie +/-, Win instant, Asteroid HP -1
- **Panel droit** (`#dev-stats`) : timer, niveau d'intensité (barre colorée), combo

Activé seulement en mode `?dev` + desktop (pas mobile).
Cliquer un bouton power-up = exactement comme ramasser la capsule en jeu.
Le resize du canvas tient compte des panels (`resize.js` déduit leur largeur).

## Power-ups
12 power-ups implémentés (P1 + P2 drone) dans `power-ups.js` :

P1 : shipWide, shipNarrow, droneSticky, dronePiercing, extraLife, scoreDouble, weaken, droneMulti.
P2 : droneLarge (radius ×1.8), droneMini (radius ×0.5), droneFast (speed ×1.8), droneWarp (traverse murs).

Mécaniques :
- Cumul taille vaisseau : réactivation multiplie (×1.5 → ×2.25), revert à l'original
- Props numériques drone (radius, speed) : save/restore via PowerUpManager
- Warp : Drone.update() wrap-around au lieu de rebond murs latéraux
- Multiplicateur score combo : ×2 @5, ×3 @10, ×4 @15… (cumulable avec material et scoreDouble)

## Validation visuelle avec Playwright (norme)
Pour tout changement UI/CSS/layout, **toujours valider visuellement via Playwright** avant de considérer le fix terminé :
```bash
# Pattern standard : lancer un serveur + prendre un screenshot
npx serve -l 3333 &
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  await page.goto('http://localhost:3333/?dev');
  await page.waitForTimeout(1500);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'screenshot.png' });
  await browser.close();
})();
"
```
- Prendre des screenshots à chaque étape (menu, playing, pause, game over)
- Vérifier les viewports étroits (1000x700) en plus du standard (1200x800)
- Itérer fix → screenshot → vérifier jusqu'à ce que le rendu soit bon
- Ne jamais livrer un fix CSS sans l'avoir vu en screenshot
