# Space Breakout

Casse-briques spatial inspiré d'Adibou, publié sur GitHub Pages.

## Concept

Un vaisseau de nettoyage spatial envoie un drone de minage détruire des astéroïdes.
Le thème spatial influence le gameplay (prévu : récolte de matière, power-ups, upgrades vaisseau).

## Stack

- Vanilla JS (ES modules) + Canvas API
- Web Audio API (sons procéduraux + musique)
- Tests : Mocha + Chai (specs co-localisées avec le code)
- Zéro dépendance runtime
- Hébergé sur GitHub Pages : https://etienne-bernoux.github.io/space-breakout/

## Structure (Clean Architecture)

```
index.html              → point d'entrée
style.css               → styles (responsive, touch-action)
js/
  config.js             → constantes centralisées
  main.js               → bootstrap (import ./main/index.js)
  main/                 → composition root (game loop, HUD, collisions, input)
    init.js             → canvas, instances, startGame, état partagé (G)
    input.js            → handlers tactiles/clavier, pause
    collisions.js       → détection collisions, dispatch effets
    hud.js              → HUD, combo, pause screen, end screen
    loop.js             → boucle principale, slow-motion
    index.js            → point d'entrée, wiring
  domain/               → entités pures (config injectée, 0 dépendance)
    ship.js             → vaisseau (raquette)
    drone.js            → drone de minage (balle)
    capsule.js          → capsule de power-up
    materials.js        → 6 matériaux (roche, glace, lave, métal, cristal, obsidienne)
    power-ups.js        → 7 power-ups déclaratifs
    patterns.js         → patterns ASCII de niveaux
    asteroid-render.js  → rendu visuel par matériau
    asteroid/           → génération procédurale d'astéroïdes
      shape.js          → géométrie procédurale (polygones, cratères, veines)
      asteroid-field.js → AsteroidField (grille, collision, fragmentation)
      index.js          → façade (re-export AsteroidField)
  use-cases/            → logique métier (0 DOM, 0 audio)
    game-logic.js       → GameSession : état, score, vies
    power-up-manager.js → application/revert des power-ups
    music-director.js   → musique adaptative (intensité 0-4)
    drop-system.js      → probabilité de drop
  infra/                → DOM, Canvas, Audio, Input
    stars.js            → fond étoilé parallaxe
    resize.js           → canvas responsive
    touch.js            → contrôles tactiles + souris
    particles.js        → explosions + traînée
    audio.js            → sons procéduraux (SFX)
    screenshake.js      → tremblement caméra
    power-up-render.js  → rendu capsules + HUD
    power-up-icons.js   → icônes canvas power-ups
    music/              → musique procédurale (Web Audio)
      audio-core.js     → contexte audio, master gain/filter, layers
      instruments-main.js → instruments piste Space Synth
      instruments-dark.js → instruments piste Dark Orchestral (+ chœur SATB)
      sections-main.js  → 7 configs sections Mi mineur
      sections-dark.js  → 7 configs sections Ré mineur (LOTR style)
      section-engine.js → registre instruments + dispatch data-driven
      scheduler.js      → boucle sections, mode adaptatif, contrôle lecture
      stingers.js       → motifs courts (win, game over, power-up)
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
    dev-panel/          → panel dev (?dev=1)
      state.js          → config + presets + persistence
      draw.js           → rendu panel
      handlers.js       → input panel
      index.js          → façade publique
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
- Config injectée par constructeur (pas d'import CONFIG dans les entités)
- GameSession retourne des events, main.js les dispatch vers l'infra (sons, particules)
- États du jeu : menu → playing → paused / gameOver / won → menu
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
`PowerUpManager` lit `def.effect` pour appliquer/revert — aucune valeur hardcodée dans le manager.

### Responsive Canvas (pas de rem)
Canvas API ne supporte que des px pour les fonts/tailles. Tout le scaling est manuel.

**Formule commune** (menu + in-game) :
```js
const scale = Math.min(1.0, Math.max(0.6, canvasWidth / 500));
```
- `menu.js` → `layout()` retourne scale, positions, tailles de fonts
- `main.js` → `gameScale()` pour HUD, pause, overlays

**Mobile vs desktop** : `isMobile = 'ontouchstart' in window`
- Passé aux constructeurs (`Ship`, `Drone`) pour activer les ratios proportionnels
- Ship mobile : `width = canvasWidth * 0.28` (config `mobileWidthRatio`)
- Drone mobile : `radius = canvasWidth * 0.02` (config `mobileRadiusRatio`)
- Desktop : valeurs fixes depuis config

**Boutons/textes responsive** :
- Boutons menu/pause : 80% de la largeur canvas (`halfW = w * 0.4`)
- Sliders : 60% de la largeur
- Score positionné relativement au bouton pause (pas de position absolue)

### Musique adaptative
`music/` génère la musique procédurale avec 5 layers (drums, bass, pad, lead, high) sur des GainNodes séparés.
`music-director.js` (use-case) calcule un niveau d'intensité 0-4 basé sur :
- Ratio astéroïdes restants (>80%→0, 50-80%→1, 30-50%→2, <30%→3, <10%→4)
- Combo boost (+1 à ≥3, +2 à ≥6)
- Power-up actif → min 2
- Dernière vie → min 3

L'intensité contrôle les layers (fade in/out) et sélectionne la section suivante.
Scheduling section-par-section (pas en bulk) pour permettre le mode adaptatif.

`music-lab/` (?mus) : panel de test avec 3 onglets :
- **Sons** : sections, instruments, stingers isolés + sélecteur piste (prêt multi-pistes)
- **Gameplay** : triggers simulés (destroy, combo, lives, PU) + override intensité 0-4
- **Mix** : toggle layers ON/OFF, effets (muffle)

### Constantes centralisées
`config.js` regroupe tout : `scoring.basePoints`, `capsule` (bob/rotation/speed), `drop` (baseRate, sizeMult), ratios mobile. Aucune constante métier dans le code applicatif.

## Dev

Serveur local requis (ES modules) :
```bash
npx serve .
```

Tests :
```bash
npm test
```
Les specs sont co-localisées avec le code (`js/**/*.spec.js`).
Mocha + Chai, ES modules natifs.

## Power-ups

7 power-ups P1 implémentés (voir `power-ups.js` pour les définitions).
Roadmap, backlog P2/P3 et idées d'upgrades dans `BACKLOG.md`.
