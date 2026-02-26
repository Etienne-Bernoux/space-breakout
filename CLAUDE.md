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
  config.js             → constantes centralisées (grille, tailles, vitesses, couleurs, ratios mobile, scoring, drops)
  main.js               → composition root (game loop, dispatch events → infra, HUD, overlays)
  domain/               → entités pures (config injectée, 0 dépendance)
    ship.js             → vaisseau (raquette), taille proportionnelle en mobile
    drone.js            → drone de minage (balle) + rebonds + clamp, radius scalé en mobile
    drone.spec.js       → specs drone (rebonds, clamp, angle min)
    materials.js        → définitions des 6 matériaux (roche, glace, lave, métal, cristal, obsidienne)
    asteroid.js         → génération procédurale, fragmentation, HP, matériaux, patterns
    asteroid-render.js  → rendu visuel par matériau (styles, dégradés, effets)
    asteroid.spec.js    → specs astéroïdes (placement, tailles, fragmentation, matériaux, patterns)
    patterns.js         → patterns ASCII de niveaux, grilles variables (small/medium/large)
    capsule.js          → capsule de power-up (descend, bob, rotation), config injectable
    power-ups.js        → définitions déclaratives des 7 power-ups (id, label, durée, effect)
  use-cases/            → logique métier (0 DOM, 0 audio)
    game-logic.js       → GameSession : état, collisions, score, vies (scoring depuis config)
    game-logic.spec.js  → specs game logic (état, collisions, win/lose)
    power-up-manager.js → application/revert des power-ups, lit def.effect (pas de valeurs hardcodées)
    music-director.js   → pilote musique adaptative (intensité 0-4 selon remaining%, combo, PU, last-life)
    music-director.spec.js → 19 tests intensité
    drop-system.js      → probabilité de drop, sizeMult depuis config
  infra/                → DOM, Canvas, Audio, Input
    stars.js            → fond étoilé parallaxe (canvas plein écran)
    menu.js             → menu principal responsive, réglages (sliders volume), crédits
    resize.js           → canvas responsive (portrait/paysage)
    touch.js            → contrôles tactiles + souris + drag sliders
    particles.js        → explosions + traînée drone
    audio.js            → sons procéduraux (Web Audio) + volume SFX
    music.js            → musique procédurale 110 BPM, 7 sections, 12-section loop, layers adaptatifs
    music-lab.js        → panel de test musical (?mus), 3 onglets (Sons/Gameplay/Mix)
    power-up-render.js  → rendu capsules + HUD power-ups actifs, tailles scalées
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
`music.js` génère la musique procédurale avec 4 layers (drums, bass, pad, lead) sur des GainNodes séparés.
`music-director.js` (use-case) calcule un niveau d'intensité 0-4 basé sur :
- Ratio astéroïdes restants (>80%→0, 50-80%→1, 30-50%→2, <30%→3, <10%→4)
- Combo boost (+1 à ≥3, +2 à ≥6)
- Power-up actif → min 2
- Dernière vie → min 3

L'intensité contrôle les layers (fade in/out) et sélectionne la section suivante.
Scheduling section-par-section (pas en bulk) pour permettre le mode adaptatif.

`music-lab.js` (?mus) : panel de test avec 3 onglets :
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
