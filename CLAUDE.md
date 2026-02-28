# Space Breakout

> **Règle doc** : après tout changement structurel (nouveau fichier, nouveau pattern, nouvelle commande), mettre à jour ce fichier, `README.md` et `BACKLOG.md` si pertinent.

Casse-briques spatial inspiré d'Adibou, publié sur GitHub Pages.

## Concept

Un vaisseau de nettoyage spatial envoie un drone de minage détruire des astéroïdes.
Le thème spatial influence le gameplay (prévu : récolte de matière, power-ups, upgrades vaisseau).

## Stack

- Vanilla JS (ES modules) + Canvas API
- Web Audio API (sons procéduraux + musique)
- Tests unitaires : Vitest + Chai (specs co-localisées `js/**/*.spec.js`, ~300 tests)
- Tests e2e : Playwright (dossier `e2e/`, 16 tests)
- Zéro dépendance runtime
- Hébergé sur GitHub Pages : https://etienne-bernoux.github.io/space-breakout/

## Structure (Clean Architecture)

```
index.html              → point d'entrée
style.css               → styles (responsive, touch-action)
js/
  config.js             → constantes centralisées
  main.js               → bootstrap (import ./main/index.js)
  shared/               → utilitaires transverses
    responsive.js       → gameScale() centralisé (clamp 0.6–1.0)
  main/                 → composition root (wiring, boucle)
    init.js             → canvas, instances, startGame, état partagé (G), wiring DI
    loop.js             → boucle principale, state dispatch map, slow-motion
    index.js            → point d'entrée, bootstrap
  domain/               → entités pures (config injectée, 0 dépendance)
    ship/ship.js        → vaisseau (raquette)
    drone/drone.js      → drone de minage (balle)
    capsule/capsule.js  → capsule de power-up
    materials.js        → 6 matériaux (roche, glace, lave, métal, cristal, obsidienne)
    power-ups.js        → 12 power-ups déclaratifs (P1 + P2 drone)
    patterns.js         → patterns ASCII de niveaux
    asteroid/           → génération procédurale d'astéroïdes
      shape.js          → géométrie procédurale (polygones, cratères, veines)
      asteroid-field.js → AsteroidField (grille, merge glouton, fragmentation)
      index.js          → façade (re-export AsteroidField)
  use-cases/            → logique métier (0 DOM, 0 audio)
    game-logic/
      game-session.js   → GameSession : état, score, vies (~72 lignes)
    collision/
      collision-handler.js → dispatch collisions par frame
      collision-resolver.js → détection pure (ship, asteroid, capsule, win)
    power-up/
      power-up-manager.js → strategy pattern apply/revert/cumul
    drone/
      drone-manager.js  → lifecycle drone centralisé (spawn, remove, reset)
    intensity/
      game-intensity-director.js → chef d'orchestre (intensité 0-4 → music + effects, DI)
    drop/
      drop-system.js    → probabilité de drop
  infra/                → DOM, Canvas, Audio, Input
    orchestrators/
      music-director.js → gère TOUS les sons/musique (reçoit events du GID)
      effect-director.js → effets visuels par intensité (lerp entre presets)
    input-handler.js    → handlers tactiles/clavier, pause
    stars.js            → fond étoilé parallaxe
    resize.js           → canvas responsive
    touch.js            → contrôles tactiles + souris
    particles.js        → explosions + traînée
    audio.js            → sons procéduraux (SFX)
    screenshake.js      → tremblement caméra
    power-up-render.js  → rendu capsules + HUD power-ups actifs
    power-up-icons.js   → icônes canvas power-ups (12 icônes)
    renderers/
      hud-render.js     → HUD, combo, pause screen, end screen
      ship-render.js    → rendu vaisseau
      drone-render.js   → rendu drone
      field-render.js   → rendu champ d'astéroïdes
      asteroid-render.js → rendu par matériau (188 lignes)
      asteroid-render-helpers.js → helpers partagés (couleurs, cratères, veines, rim)
    music/              → musique procédurale (Web Audio)
      audio-core.js     → contexte audio, master gain/filter, layers
      instruments-main.js → instruments piste Space Synth
      instruments-dark.js → instruments piste Dark Orchestral (+ chœur SATB)
      sections-main.js  → 7 configs sections Mi mineur
      sections-dark.js  → 7 configs sections Ré mineur (LOTR style)
      section-engine.js → registre instruments + dispatch data-driven
      scheduler.js      → boucle sections, mode adaptatif, contrôle lecture
      fills.js          → fills de transition (snare roll, arp rise)
      stingers.js       → motifs courts (win, game over, power-up, combo)
      demos.js          → démos instruments (music lab)
      index.js          → façade publique
    music-lab/          → panel test musical (?mus)
      state.js          → état UI centralisé
      draw-helpers.js   → utilitaires dessin
      draw-header.js    → en-tête + onglets
      draw-footer.js    → transport + activité
      loop-tracker.js   → suivi boucle musicale
      tab-sons.js       → onglet Sons
      tab-gameplay.js   → onglet Gameplay (simulation)
      tab-mix.js        → onglet Mix (layers)
      hit-test.js       → zones cliquables
      handlers.js       → événements utilisateur
      index.js          → façade publique
    menu/               → menu principal
      state.js          → état + persistence volumes
      draw-menu.js      → écran menu principal
      draw-settings.js  → écran réglages (sliders)
      draw-credits.js   → écran crédits
      handlers.js       → input menu
      index.js          → façade publique
    dev-panel/          → panel dev pré-partie (?dev)
      state.js          → config + presets + persistence
      draw.js           → rendu panel
      handlers.js       → input panel
      index.js          → façade publique
    dev-overlay/        → overlay in-game (?dev, desktop only)
      index.js          → panel DOM gauche (boutons power-ups, vie +/-, win, ast -1)
      dev-stats.js      → panel DOM droit (timer, intensité, combo)
e2e/                    → tests end-to-end (Playwright)
  smoke.spec.js         → démarrage sans erreur console
  flow.spec.js          → menu → lancer → pause → resume
  modes.spec.js         → ?dev et ?mus/?music
playwright.config.js    → config Playwright (serve sur :3333)
```

## Règles de structure

### Limite de taille : 300 lignes max par fichier
Si un fichier dépasse ~300 lignes, le transformer en **dossier** avec un `index.js` façade.

### Pattern dossier-module
Quand un fichier est splitté en dossier :
1. Créer le dossier au même emplacement que l'ancien fichier
2. `index.js` = façade publique (re-exports uniquement), même API qu'avant
3. Les fichiers internes s'importent entre eux
4. Les consommateurs importent depuis `./dossier/index.js` (chemin explicite obligatoire, pas de résolution automatique — ES modules natifs)
5. État partagé mutable → objet default export depuis `state.js`

### Imports ES modules natifs
Pas de bundler → les imports doivent avoir le chemin complet avec extension :
```js
import { Foo } from './bar/index.js';  // ✅
import { Foo } from './bar/';          // ❌ (le navigateur ne résout pas index.js)
import { Foo } from './bar';           // ❌
```

## Contrôles

Desktop :
- Flèches gauche/droite → déplacer le vaisseau
- Espace → lancer le drone
- Échap → pause
- R → retour au menu (depuis pause ou fin de partie)

Mobile :
- Glisser le doigt → le vaisseau suit
- Tap → lancer le drone
- Bouton ⏸ → pause
- Boutons tactiles dans les menus

## Architecture

- **Clean Architecture** : Domain (entités pures) → Use Cases (game logic) → Infra (DOM/Canvas/Audio)
- **DI systématique** : config injectée par constructeur, toutes les dépendances via `{ deps }` (pas d'import CONFIG dans les entités)
- GameSession est pur état (~72 lignes), CollisionResolver gère la détection, CollisionHandler orchestre
- États du jeu : menu → worldMap → playing → paused / gameOver / won → stats → worldMap
- Canvas interne 800x600 (paysage) ou 800xN (portrait, hauteur dynamique)
- Fond étoilé parallaxe sur un canvas séparé (bg-canvas, plein écran)
- Touch & keyboard coexistent

## Décisions techniques

### Power-ups déclaratifs (pattern `def.effect`)
Chaque power-up dans `power-ups.js` porte un objet `effect` qui décrit son comportement :
```js
shipWide:  { effect: { target: 'ship',    prop: 'width',  factor: 1.5 } }
extraLife: { effect: { target: 'session',  prop: 'lives',  delta: 1 } }
weaken:    { effect: { target: 'field',    action: 'weakenAll', delta: -1 } }
```
`PowerUpManager` utilise un **strategy pattern** (STRATEGIES map) pour apply/revert/cumul. Ajouter un nouveau type d'effet = 1 objet strategy, pas 3 méthodes.

### Responsive Canvas (pas de rem)
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

### GameIntensityDirector (chef d'orchestre)
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

### Musique adaptative
`music/` génère la musique procédurale avec 5 layers (drums, bass, pad, lead, high) sur des GainNodes séparés.
L'intensité contrôle les layers (fade in/out), le BPM (110→128), et sélectionne la section suivante.
Scheduling section-par-section (pas en bulk) pour permettre le mode adaptatif.
Fills de transition (snare roll, arp rise) 2 beats avant les changements de section.
Accents combo par paliers (×2: 1 note, ×3: 2 notes, ×5+: 3 notes).
Stinger spécial aux paliers ronds (×5, ×10, ×15…) : arpège majeur 7 en square wave filtré.

### EffectDirector
5 presets visuels (calm → climax), lerp progressif chaque frame (speed 0.06).
Effets pilotés : starSpeed, vignetteAlpha/Hue, microShake, deathLine RGB, scoreGlow/Color.

`music-lab/` (?mus) : panel de test avec 3 onglets :
- **Sons** : sections, instruments, stingers isolés + sélecteur piste (prêt multi-pistes)
- **Gameplay** : triggers simulés (destroy, combo, lives, PU) + override intensité 0-4
- **Mix** : toggle layers ON/OFF, effets (muffle)

### Delta-time (mouvement indépendant du framerate)
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

### Constantes centralisées
`config.js` regroupe tout : `scoring.basePoints`, `capsule` (bob/rotation/speed), `drop` (baseRate, sizeMult), ratios mobile. Aucune constante métier dans le code applicatif.

## Dev

Serveur local requis (ES modules) :
```bash
npx serve .              # serveur statique → http://localhost:3000
```

Tests unitaires (Vitest + Chai, co-localisés `js/**/*.spec.js`, 280 tests / 20 fichiers) :
```bash
npm test                          # une passe (vitest run)
npx vitest                        # mode watch
```

Tests e2e (Playwright, dossier `e2e/`) :
```bash
npm run test:e2e                  # lance tous les tests e2e
npx playwright test e2e/smoke.spec.js   # un fichier spécifique
npm run test:all                  # unit + e2e
```
Le serveur statique est lancé automatiquement par Playwright sur le port 3333.

Hook e2e : `window.__GAME__` expose en lecture seule `state`, `lives`, `remaining`, `devPanel`, `musicLab`, et `forceWin()` (tue tous les astéroïdes).

Modes spéciaux : `?dev` (dev panel pré-partie + overlay in-game), `?mus` ou `?music` (music lab).

### Validation visuelle avec Playwright (norme)

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
  // Naviguer vers l'état voulu (Enter pour lancer, click, etc.)
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

Roadmap P2/P3 et idées dans `BACKLOG.md`.
