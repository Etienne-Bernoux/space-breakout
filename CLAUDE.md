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
    asteroid.js         → génération procédurale, fragmentation, HP, matériaux, patterns
    asteroid-render.js  → rendu visuel par matériau (styles, dégradés, effets)
    asteroid.spec.js    → specs astéroïdes (placement, tailles, fragmentation, matériaux, patterns)
    patterns.js         → patterns ASCII de niveaux, grilles variables (small/medium/large)
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
- [x] Tests specs (Mocha + Chai, 68 tests)
- [x] Clean Architecture (domain / use-cases / infra, DI)
- [x] Rendu astéroïdes réaliste (Bézier, dégradés, cratères, veines, rim lighting)
- [x] Fragmentation des astéroïdes (large→medium+small, visuel fracturé + lueur)
- [x] 6 matériaux d'astéroïdes (roche, glace, lave, métal, cristal, obsidienne)
- [x] Patterns ASCII de niveaux (9 designs + aléatoire, grilles variables)
- [ ] Récolte de matière (fragments d'astéroïdes)
- [x] Power-ups P1 (7 types, drops, capsules, HUD — 91 tests)
- [ ] Upgrades vaisseau permanentes (drone renforcé pour casser métal/obsidienne, achetées avec matériaux récoltés)
- [ ] Niveaux multiples (difficulté progressive, distribution matériaux par niveau)

## Power-ups (drops temporaires)

Les power-ups tombent quand un astéroïde est détruit (capsule qui descend, le vaisseau la ramasse).
Les upgrades permanentes (shop entre niveaux, payées en matériaux) sont un chantier séparé.

Effort : S = quelques heures, M = demi-journée, L = journée+

### Priorité 1 — Fondations (implémenter en premier)

| Power-up | Description | Effort | Type |
|---|---|---|---|
| Vaisseau élargi | Largeur ×1.5 pendant 20s | S | Bonus | ✅ |
| Vaisseau rétréci | Largeur ×0.6 pendant 10s | S | Malus | ✅ |
| Drone collant | Colle au vaisseau au retour (position conservée), 30s | M | Bonus | ✅ |
| Drone perçant | Traverse les astéroïdes sans rebondir, 15s | S | Bonus | ✅ |
| Vie supplémentaire | +1 vie (instant) | S | Bonus | ✅ |
| Score ×2 | Double les points pendant 20s | S | Bonus | ✅ |
| Fragilisation | Tous les astéroïdes visibles -1 HP (instant) | S | Bonus | ✅ |

### Priorité 2 — Gameplay enrichi

| Power-up | Description | Effort | Type |
|---|---|---|---|
| Multi-drone | +2 drones supplémentaires (perdus = pas de vie perdue, game over si tous perdus) | L | Bonus |
| Filet de sécurité | 1 rebond gratuit en bas de l'écran (ligne visible, disparaît après usage) | M | Bonus |
| Onde de choc | Détruit tous les astéroïdes dans un rayon autour du point d'impact | M | Bonus |
| Missiles | Tap pour tirer 2 missiles verticaux (3 charges) | L | Bonus |
| Drone rapide | Vitesse ×1.8 pendant 10s (dur à contrôler) | S | Malus |
| Warp | Le drone traverse un mur latéral et ressort de l'autre côté, 10s | S | Bonus |

### Priorité 3 — Originalité / polish

| Power-up | Description | Effort | Type |
|---|---|---|---|
| Traceur | Trajectoire prédictive visible du drone pendant 10s | M | Bonus |
| Laser | Rayon continu vers le haut pendant 5s (nouveau système de tir + collision ligne) | L | Bonus |
| Bouclier magnétique | Le drone est attiré vers le vaisseau quand il est proche du bas | M | Bonus |
| Drone autonome | Mini-drone AI qui casse des astéroïdes tout seul pendant 10s | L | Bonus |
| Astéroïdes hostiles | Certains astéroïdes tirent vers le vaisseau (malus ambiant, pas un drop) | L | Malus |
| Miroir | Un 2ème vaisseau fantôme se déplace en miroir (côté opposé) | M | Bonus |
| Gravité | Le drone est légèrement attiré vers le curseur/doigt pendant 8s | M | Bonus |

### Idées : Upgrades de power-ups (achetées avec matériaux)

Chaque power-up pourrait avoir 2-3 niveaux d'upgrade achetables entre les niveaux :

- **Élargi** : niv1 ×1.5, niv2 ×1.8, niv3 ×2.0 + durée allongée
- **Rétréci** : niv1 réduit la durée du malus, niv2 immunité temporaire aux malus
- **Collant** : niv1 30s, niv2 45s, niv3 choisir l'angle de relance (viseur)
- **Perçant** : niv1 traverse 1 astéroïde, niv2 traverse tout, niv3 détruit en traversant (pas juste -1 HP)
- **Score** : niv1 ×2, niv2 ×3, niv3 combo streak (multiplicateur croissant)
- **Fragilisation** : niv1 -1HP, niv2 -2HP, niv3 tous les petits astéroïdes détruits
- **Multi-drone** : niv1 +1 drone, niv2 +2 drones, niv3 drones magnétiques
- **Filet** : niv1 1 rebond, niv2 3 rebonds, niv3 filet permanent (temps limité)
- **Déverrouillage** : certains power-ups verrouillés par défaut, débloqués en progression
