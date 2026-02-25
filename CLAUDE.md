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
  config.js             → constantes (grille 10×6, tailles, vitesses, couleurs)
  main.js               → composition root (game loop, dispatch events → infra)
  domain/               → entités pures (config injectée, 0 dépendance)
    ship.js             → vaisseau (raquette)
    drone.js            → drone de minage (balle) + rebonds + clamp
    drone.spec.js       → specs drone (rebonds, clamp, angle min)
    materials.js        → définitions des 6 matériaux (roche, glace, lave, métal, cristal, obsidienne)
    asteroid.js         → génération procédurale, fragmentation, HP, matériaux
    asteroid-render.js  → rendu visuel par matériau (styles, dégradés, effets)
    asteroid.spec.js    → specs astéroïdes (placement, tailles, fragmentation, matériaux)
  use-cases/            → logique métier (0 DOM, 0 audio)
    game-logic.js       → GameSession : état, collisions, score, vies
    game-logic.spec.js  → specs game logic (état, collisions, win/lose)
  infra/                → DOM, Canvas, Audio, Input
    stars.js            → fond étoilé parallaxe (canvas plein écran)
    menu.js             → menu principal, réglages (sliders volume), crédits
    resize.js           → canvas responsive (portrait/paysage)
    touch.js            → contrôles tactiles + souris + drag sliders
    particles.js        → explosions + traînée drone
    audio.js            → sons procéduraux (Web Audio) + volume SFX
    music.js            → musique procédurale 110 BPM, 6 sections, ~52s
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

## Roadmap

- [x] Sons procéduraux et musique
- [x] Effets visuels (particules, dégradés, parallaxe)
- [x] Contrôles souris
- [x] Menu réglages (volume musique/SFX, localStorage)
- [x] Génération procédurale des astéroïdes (3 tailles, densité variable)
- [x] Tests specs (Mocha + Chai, 61 tests)
- [x] Clean Architecture (domain / use-cases / infra, DI)
- [x] Rendu astéroïdes réaliste (Bézier, dégradés, cratères, veines, rim lighting)
- [x] Fragmentation des astéroïdes (large→medium+small, visuel fracturé + lueur)
- [x] 6 matériaux d'astéroïdes (roche, glace, lave, métal, cristal, obsidienne)
- [ ] Récolte de matière (fragments d'astéroïdes)
- [ ] Power-ups
- [ ] Upgrades vaisseau (drone renforcé pour casser métal/obsidienne)
- [ ] Niveaux multiples (difficulté progressive, distribution matériaux par niveau)
