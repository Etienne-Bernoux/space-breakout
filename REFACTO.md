# Audit qualité & plan de refactoring

Date : 2026-02-27 — Post quick-wins session (9 commits, 227 tests)

Effort : S = quelques heures, M = demi-journée, L = journée+

---

## R1 · Power-Up _apply/_revert → strategy par type d'effet (S)

**Fichier** : `js/use-cases/power-up/power-up-manager.js` (173 lignes)

**Problème** : `_apply()` (L85-104) et `_revert()` (L116-144) ont des arbres conditionnels miroirs à 4 branches. Chaque nouveau type d'effet oblige à modifier 3 méthodes (`_apply`, `_revert`, bloc re-activation L25-36). Le cumul ship (L29-31) et le cumul drone (L33-35) sont des `if` rajoutés en cascade.

**Exemple de duplication** :
```
_apply:  if (ship+width) … else if (drone+factor) … else if (drone) … else if (session+factor)
_revert: if (ship+width) … else if (drone+factor) … else if (drone) … else if (session+factor)
```

**Solution proposée** : Map de strategies indexées par clé `target:prop` ou `target:type`.
```js
const STRATEGIES = {
  'ship:width':    { apply(gs, effect, saved) { … }, revert(gs, effect, saved) { … }, cumul(gs, effect) { … } },
  'drone:numeric': { apply(gs, effect, saved) { … }, revert(gs, effect, saved) { … }, cumul(gs, effect) { … } },
  'drone:boolean': { apply(gs, effect, saved) { … }, revert(gs, effect, saved) { … } },
  'session:factor':{ apply(gs, effect, saved) { … }, revert(gs, effect, saved) { … } },
};
```
Le manager dispatch via `resolveStrategy(effect)` → 1 seul endroit à modifier pour ajouter un type.

**Gain** : Ajout d'un nouveau type d'effet = 1 objet, pas 3 méthodes.

**Tests impactés** : `power-up-manager.spec.js` — aucun changement d'API publique, tests existants couvrent.

---

## R2 · gameState reconstruit 3× → factory unique (S)

**Fichiers** :
- `js/main/init.js` L42-44 : `get gs() { return { ship, drones, session, field }; }`
- `js/use-cases/collision/collision-handler.js` L87 : `const gs = { ship, drones: …, session, field }`
- `js/use-cases/collision/collision-handler.js` L97 : idem, reconstruit dans `#handlePowerUpExpiry()`

**Problème** : 3 constructions manuelles de la même shape `{ ship, drones, session, field }`. Si la shape change (ex: ajout de `capsules`), il faut trouver et modifier chaque site.

**Solution proposée** : CollisionHandler reçoit une fonction `getGameState` injectée à la construction (= `G.gs` de init.js). Plus aucune reconstruction locale.
```js
constructor({ …, getGameState }) {
  this.getGameState = getGameState;
}
#handleCapsulePickup() {
  const gs = this.getGameState();
  // …
}
```

**Gain** : Single source of truth, 1 site à modifier si la shape évolue.

---

## R3 · loop.js state machine → dispatch map (S)

**Fichier** : `js/main/loop.js` (147 lignes)

**Problème** : `loop()` a 7 branches if/return (L45, 53, 61, 69, 79, 84, 91) avec rendu dupliqué. L'état `paused` (L70-72) et `#drawScene()` (L123-128) dessinent les mêmes entités (field, ship, drones). Le chemin slow-motion (L91-98) intercepte le flow normal.

**Solution proposée** :
```js
const STATE_HANDLERS = {
  musicLab: (dt) => { … },
  devPanel: (dt) => { … },
  menu:     (dt) => { … },
  paused:   (dt) => { this.#drawScene(fx); this.hud.drawPauseScreen(); },
  gameOver: (dt) => { this.hud.drawEndScreen('GAME OVER'); },
  won:      (dt) => { this.hud.drawEndScreen('ZONE NETTOYÉE !'); },
  playing:  (dt) => { this.#updateEntities(); this.#drawScene(fx); },
};
```
Chaque handler est testable indépendamment. Le slow-motion devient un paramètre de `#updateEntities()` (skip update si `frame % 3 !== 0`).

**Gain** : Lisibilité, suppression de la duplication rendu, testabilité des états individuels.

---

## R4 · GameSession.checkAsteroidCollision → CollisionResolver dédié (M)

**Fichier** : `js/use-cases/game-logic/game-session.js` L64-120 (57 lignes)

**Problème** : `checkAsteroidCollision()` contient de la logique use-case dans un objet domaine :
- Scoring avec combo multiplier (L102-107)
- Fragmentation via `field.fragment()` (L109)
- Gestion piercing multi-hit (L66-68, 91, 97, 115)
- HP decrement (L94)

GameSession est documenté "pur : aucune dépendance DOM, audio, canvas" mais fait du scoring + fragmentation + physique drone.

**Solution proposée** : Extraire un `CollisionResolver` (use-case) qui reçoit `(drone, field, session)` et retourne des events. GameSession ne garde que l'état (score, lives, combo, scoreMultiplier).
```
domain/GameSession    → état pur (score, lives, state, combo)
use-cases/CollisionResolver → checkShipCollision, checkAsteroidCollision, checkCapsuleCollision
```

**Gain** : SRP respecté, GameSession redescend à ~60 lignes, collision testable sans GameSession.

**Risque** : Refacto large, beaucoup de tests à adapter. À planifier sur un créneau calme.

---

## R5 · asteroid-render.js → squelette partagé + 6 configs (M)

**Fichier** : `js/infra/renderers/asteroid-render.js` (322 lignes, dépasse la limite 300L)

**Problème** : 6 fonctions style (`styleRock`, `styleIce`, `styleLava`, `styleMetal`, `styleCrystal`, `styleObsidian`) à 80% identiques. Chacune fait :
```
tracePath → fill gradient → save → clip → draw details → restore → drawRim → drawDamageOverlay
```
Seuls les paramètres (couleurs, gradients, détails) changent.

**Solution proposée** : Extraire `renderAsteroid(ctx, a, rx, ry, tracePath, styleConfig)` qui porte le squelette commun. Chaque matériau = un objet config déclaratif :
```js
const ROCK = {
  gradient: (ctx, rx, ry, color) => { … },
  details: (ctx, rx, ry, a) => { drawVeins(…); drawCraters(…); },
  rim: { highlight: 'rgba(255,255,255,0.2)', shadow: 'rgba(0,0,0,0.5)' },
};
```

**Gain** : ~120 lignes au lieu de 322. Ajout d'un nouveau matériau = 1 objet config.

---

## R6 · Pause button hit-test dupliqué → layout partagé (S)

**Fichiers** :
- `js/main/hud.js` L118-161 : `drawPauseScreen()` dessine les boutons avec des constantes inline
- `js/main/input.js` L79-95 : hit-test des mêmes boutons avec calculs dupliqués

**Problème** : Les 2 fichiers calculent `halfW`, `btnH`, `gap`, `cy` de manière identique :
```js
// hud.js L123-125
const halfW = Math.round(this.canvas.width * 0.4);
const btnH = Math.round(44 * s);
const gap = Math.round(16 * s);

// input.js L80-85  (identique)
const halfW = Math.round(this.canvas.width * 0.4);
const btnH = Math.round(44 * s);
const gap = Math.round(16 * s);
```

Si la taille d'un bouton change dans HUD, le hit-test ne suit pas.

**Solution proposée** : Fonction `pauseScreenLayout(canvas, scale)` exportée (comme `pauseBtnLayout`), retourne `{ cx, cy, halfW, btnH, gap, resumeBtn: {x,y,w,h}, menuBtn: {x,y,w,h} }`. HUD et Input l'utilisent.

**Gain** : DRY, impossible de désynchroniser rendu et input.

---

## R7 · GameIntensityDirector : DI manquante pour Music/Effects (S)

**Fichier** : `js/use-cases/intensity/game-intensity-director.js` L11-12

**Problème** :
```js
constructor() {
  this.music = new MusicDirector();    // instanciation directe
  this.effects = new EffectDirector(); // instanciation directe
}
```
Pas de DI → impossible de tester l'intensité sans instancier Music+Effects. Les tests actuels contournent via des mocks manuels.

**Solution proposée** : Injection par constructeur, valeurs par défaut pour la prod :
```js
constructor({ music, effects } = {}) {
  this.music = music ?? new MusicDirector();
  this.effects = effects ?? new EffectDirector();
}
```

**Gain** : Tests propres sans mock global. Cohérent avec le pattern DI utilisé partout ailleurs.

---

## R8 · Magic numbers HUD → constantes nommées (S)

**Fichier** : `js/main/hud.js`

**Problème** : Calculs inline sans nom :
- L48 : `comboFadeTimer / 30` — ratio hardcodé (30 = COMBO_FADE_DURATION / 3 ?)
- L52 : `Math.sin(progress * Math.PI) * 0.3` — amplitude pulse 30%
- L63 : `(comboDisplay - 2) / 13` — range combo 2→15
- L64 : `60 - t * 60` — hue yellow→red
- L68 : `12 + t * 8` — glow range
- L78 : `bottomMargin * 0.4` — ratio death line

**Solution proposée** :
```js
const COMBO_ALPHA_FRAMES = 30;
const COMBO_PULSE_AMP = 0.3;
const COMBO_MIN = 2, COMBO_MAX = 15;
const COMBO_HUE_START = 60, COMBO_HUE_END = 0;
const COMBO_GLOW_MIN = 12, COMBO_GLOW_MAX = 20;
const DEATH_LINE_RATIO = 0.4;
```

**Gain** : Lisibilité, tuning facilité, auto-documentation.

---

## R9 · Responsive scale formula dupliquée (S)

**Fichiers** :
- `js/main/init.js` L56 : `Math.min(1.0, Math.max(0.6, CONFIG.canvas.width / 500))`
- `js/infra/power-up-render.js` L~50 : même formule
- `js/infra/menu/state.js` : probablement aussi

**Problème** : Même formule `clamp(0.6, width/500, 1.0)` copiée dans 3+ fichiers.

**Solution proposée** : Export depuis `config.js` ou `utils.js` :
```js
export function gameScale(width = CONFIG.canvas.width) {
  return Math.min(1.0, Math.max(0.6, width / 500));
}
```

**Gain** : 1 site à modifier si les breakpoints changent.

---

## R10 · Couverture de tests : 14 specs / 69 fichiers prod (~20%) (M→L)

**État actuel** :
| Couche | Fichiers prod | Fichiers testés | Couverture |
|--------|--------------|-----------------|------------|
| domain/ | ~15 | 3 (asteroid, capsule, drone) | 20% |
| use-cases/ | ~10 | 7 (collision, drop, effect, game-session, intensity, music, power-up) | 70% |
| main/ | 4 | 3 (hud, input, loop) | 75% |
| infra/ | ~40 | 1 (integration.spec) | 2.5% |

**Lacunes critiques** :
- `asteroid-field.js` (279L) — algorithme de génération/merge non testé
- `asteroid-render.js` (322L) — 6 matériaux visuels, zéro test
- `stars.js` (268L) — parallaxe, zéro test
- `particles.js`, `screenshake.js` — physique d'effets visuels non testée
- `input.js` — couvert mais pause button hit-test non testé directement
- `touch.js` — gestion tactile non testée

**Priorité** :
1. `asteroid-field.js` — algorithme de jeu, bugs subtils possibles
2. `power-up-icons.js` — vérifier que chaque icône draw sans crash
3. renderers — au moins un smoke test par matériau (pas de throw)

---

## R11 · Multi-drone lifecycle éparpillé (M)

**Fichiers** :
- `power-up-manager.js` L152-165 : spawn (instanciation, copie props, angle)
- `collision-handler.js` L112-113 : suppression (`drones.splice`)
- `drone.js` L~reset : reset individuel
- `collision-handler.js` L123 : `clearDroneEffects()` après reset

**Problème** : Le cycle de vie d'un drone multi (spawn → power-up sync → death → cleanup) traverse 3 modules sans service centralisé. Risque de désync si on ajoute un nouveau drone power-up.

**Solution proposée** : Extraire un `DroneManager` (use-case) qui encapsule spawn, remove, reset, power-up sync. PowerUpManager et CollisionHandler appellent DroneManager au lieu de manipuler `gs.drones` directement.

**Gain** : 1 point d'entrée pour tout ce qui touche au lifecycle drone.

---

## Priorisation recommandée

| Prio | Ticket | Effort | Valeur | Status |
|------|--------|--------|--------|--------|
| 1 | R1 — Strategy power-up | S | Débloque ajout facile de nouveaux power-ups | ✅ 04fe367 |
| 2 | R2 — gameState factory | S | Élimine 3 reconstructions manuelles | ✅ b6b02a9 |
| 3 | R6 — Pause button layout | S | Quick fix, supprime un bug latent | ✅ 7473acf |
| 4 | R8 — Magic numbers HUD | S | Quick fix, lisibilité | ✅ 93b1b7c |
| 5 | R9 — Scale formula | S | Quick fix, DRY | ✅ 28ce369 |
| 6 | R7 — DI intensity director | S | Aligne le pattern DI existant | ✅ 9517fd3 |
| 7 | R3 — Loop state dispatch | S | Lisibilité, testabilité | ✅ 9990282 |
| 8 | R5 — Asteroid render split | M | Passe sous 300L, maintenabilité | ✅ 6169b81 |
| 9 | R4 — CollisionResolver extract | M | SRP, architecture propre | ✅ 2f096c8 |
| 10 | R11 — DroneManager | M | Encapsule lifecycle drone | ✅ 8062fa4 |
| 11 | R10 — Tests infra/domain | L | Filet de sécurité global | ✅ f2c7d9c (domain: +53 tests, 280 total) |
