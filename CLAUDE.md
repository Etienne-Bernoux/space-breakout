# Space Breakout

> **Règle doc** : après tout changement structurel (nouveau fichier, nouveau pattern, nouvelle commande), mettre à jour ce fichier, `README.md` et `BACKLOG.md` si pertinent.
> **Règle bug** : tout bug repéré (par Etienne ou Claude) et non corrigé dans la foulée → ajouté dans `BUG.md`. Dépilé quand opportun.
> **Règle musique** : avant toute modification musicale, lire `MUSIC.md` (guide complet de création musicale : instruments, sections, tracks, wiring).

Casse-briques spatial publié sur GitHub Pages.

## Concept

Un vaisseau de minage envoie un drone détruire les astéroïdes infestés pour sécuriser chaque zone.
Le thème spatial influence le gameplay : récolte de minerais, power-ups, upgrades vaisseau, progression multi-zones.

## Stack

- Vanilla JS (ES modules) + Canvas API
- Web Audio API (sons procéduraux + musique)
- Tests unitaires : Vitest + Chai (specs co-localisées `js/**/*.spec.js`, ~512 tests)
- Tests e2e : Playwright + playwright-bdd (Gherkin, dossier `e2e/`, 20 scénarios)
- Zéro dépendance runtime
- Hébergé sur GitHub Pages : https://etienne-bernoux.github.io/space-breakout/

## Structure (Clean Architecture)

```
BUG.md                  → bugs connus non corrigés (supprimés une fois fixés)
ARCHITECTURE.md         → décisions techniques détaillées
index.html              → point d'entrée
style.css               → styles (responsive, touch-action)
js/
  config.js             → constantes centralisées
  main.js               → bootstrap (import ./main/index.js)
  shared/               → utilitaires transverses
    responsive.js       → gameScale() centralisé (clamp 0.6–1.0)
  main/                 → composition root (wiring, boucle)
    init.js             → canvas, instances, startGame, état partagé (G), wiring DI
    adapters.js         → regroupement imports infra pour injection (loopInfra, inputInfra, collisionEffects)
    loop.js             → boucle principale, state dispatch (switch), slow-motion
    index.js            → point d'entrée, bootstrap
  domain/               → entités pures (config injectée, 0 dépendance)
    ship/ship.js        → vaisseau (raquette)
    drone/drone.js      → drone de minage (balle)
    capsule/capsule.js  → capsule de power-up
    mineral/            → système de minerais
      minerals.js       → 4 minerais (cuivre, argent, or, platine)
      mineral-drop-table.js → matrice matériau×minerai (poids de drop)
      mineral-capsule.js → entité capsule minerai (chute, bob, rotation)
      index.js          → façade re-export
    progression/        → système de progression multi-zones
      zone-catalog.js   → 6 zones (ceinture, lune, station, planète, nébuleuse, noyau alien)
      level-catalog.js  → catalogue niveaux par zone (getLevelsForZone, ALL_LEVELS_FLAT)
      player-progress.js → déverrouillage niveaux + zones, étoiles, persistence
      star-rating.js    → calcul étoiles (temps, vies perdues)
    materials.js        → 8 matériaux (roche, glace, lave, métal, cristal, obsidienne, tentacule, noyau alien)
    power-ups.js        → 12 power-ups déclaratifs (P1 + P2 drone)
    patterns.js         → patterns ASCII de niveaux
    shape/              → formes domain (collision + guide rendu)
      polygon-collision.js → géométrie pure (circle↔polygon, point-in-poly, AABB)
      tentacle-shape.js → forme tentacule effilée dynamique (ondulation)
      core-shape.js     → forme core elliptique (pulsation)
      index.js          → façade re-export
    asteroid/           → génération procédurale d'astéroïdes
      shape.js          → géométrie procédurale (polygones polaires, cratères, veines)
      field-builder.js  → construction + merge glouton (SRP)
      asteroid-field.js → AsteroidField (état, queries, mutations, update collisionPoly)
      index.js          → façade (re-export AsteroidField)
    projectile/           → projectiles alien
      alien-projectile.js → AlienProjectile (balle guidée)
      index.js            → re-export
  ai/                   → IA auto-apprenante (neuroévolution, Clean Architecture interne)
    index.js            → façade re-export
    domain/             → entités pures (0 dépendance externe)
      neural-network.js → réseau feedforward (tanh, Xavier init, encode/decode)
      genome.js         → génome + population (sélection tournoi, crossover, mutation, élitisme)
      ai-fitness.js     → calcul fitness composite (rallies, progression, anti-oscillation)
    use-cases/          → orchestration (observation, simulation, entraînement)
      ai-player.js      → observation jeu (24 inputs) → 2 outputs (position vaisseau, lancer drone)
      ai-trainer.js     → boucle d'entraînement (50 agents/gén, DI schedule/storage)
      simulation.js     → simulation headless d'un agent (partagé browser + CLI)
      gen-stats.js      → stats par génération (calcul + formatage, partagé browser + CLI)
    infra/              → adapters (persistence, setup jeu, CLI)
      population-storage.js → adapters persistence (localStorage, null) injectables dans Population
      headless-game.js  → setup jeu headless complet (entités, collision, tick)
      train-cli.js      → entraînement CLI headless (node js/ai/infra/train-cli.js --help)
    models/best.json    → meilleur modèle commité (chargé par défaut si pas de localStorage)
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
    alien-combat/
      alien-combat-manager.js → tir alien, firePulse decay, projectiles (DI)
    drop/
      drop-system.js    → probabilité de drop
    mineral/
      mineral-drop-system.js → décision drop minerai (proba cumulative)
      mineral-wallet.js → portefeuille persistant (add/spend/canAfford, localStorage)
    upgrade/
      upgrade-catalog.js → catalogue déclaratif (7 upgrades, 4 catégories, coûts par palier)
      upgrade-manager.js → achat/application upgrades (niveaux, effets, persistence)
    simulator/
      run-simulator.js  → applique un résultat simulé (victoire/défaite, étoiles, minerais)
  infra/                → DOM, Canvas, Audio, Input
    orchestrators/
      music-director.js → gère TOUS les sons/musique (reçoit events du GID)
      effect-director.js → effets visuels par intensité (lerp entre presets)
    input/              → interaction utilisateur + viewport
      input-handler/    → handlers clavier/pause (dossier-module, DI groupée)
      pointer.js        → contrôles tactiles + souris unifiés
      resize.js         → canvas responsive
    effects/            → effets visuels et fond
      particles.js      → explosions + traînée
      screenshake.js    → tremblement caméra
      stars.js          → fond étoilé parallaxe (étoiles uniquement)
      celestial-bodies.js → planètes et nébuleuses en fond
    sfx/                → sons procéduraux
      audio.js          → SFX procéduraux (Web Audio)
      sfxr-synth.js     → synthèse SFXR
    renderers/
      hud-render.js     → HUD, combo, pause screen, end screen
      ship-render.js    → rendu vaisseau (sci-fi)
      ship-render-classic.js → rendu vaisseau alternatif (classique)
      drone-render.js   → rendu drone
      field-render.js   → rendu champ d'astéroïdes
      power-up-render.js → rendu capsules + HUD power-ups actifs
      power-up-icons.js → icônes canvas power-ups (12 icônes)
      mineral-render.js → rendu capsules minerais (pépite/cristal) + HUD minerais
      asteroid-render.js → rendu par matériau (6 styles minéraux)
      asteroid-render-helpers.js → helpers partagés (couleurs, cratères, veines, rim)
      projectile-render.js → rendu projectiles alien
      debris-render.js    → rendu débris (animation mort vaisseau)
      alien-creature-render/ → rendu créature alien (dossier-module)
        index.js          → façade (drawAlienCreatures, flood-fill, grouping)
        tentacle-draw.js  → tentacule effilé (ondulation, œil, firePulse)
        core-draw.js      → noyau (métal parasité, mousse, veines, œil central)
        bridge-draw.js    → ponts organiques corps↔tentacules
        utils.js          → isAdjacent, partsBBox
    music/              → musique procédurale (Web Audio)
      audio-core.js     → contexte audio, master gain/filter, layers
      instruments-main.js → instruments piste Space Synth
      instruments-dark.js → instruments piste Dark Orchestral (+ chœur SATB)
      instruments-cantina.js → instruments piste Cantina (funk/jazz)
      sections-main.js  → 7 configs sections Mi mineur
      sections-dark.js  → 7 configs sections Ré mineur (LOTR style)
      sections-cantina.js → configs sections Cantina
      section-engine.js → registre instruments + dispatch data-driven
      scheduler.js      → boucle sections, mode adaptatif, contrôle lecture
      fills.js          → fills de transition (snare roll, arp rise)
      stingers.js       → motifs courts (win, game over, power-up, combo)
      demos.js          → démos instruments (music lab)
      index.js          → façade publique
    lab/                → labs de test (?lab)
      hub/              → hub de sélection des labs
        state.js        → état (active, currentLab)
        build.js        → construction DOM (3 cartes)
        handlers.js     → event delegation DOM
        index.js        → façade publique (init, show/hide)
      dev-panel/        → panel dev pré-partie DOM
        state.js        → config + presets + persistence
        build.js        → construction DOM (sliders, presets, pattern, grille)
        update.js       → sync DOM ← devConfig
        handlers.js     → event delegation DOM
        index.js        → façade publique (init, show/hide)
      music-lab/        → panel test musical DOM
        state.js        → état UI centralisé
        build.js        → construction DOM (tabs, panels, footer)
        update.js       → sync DOM ← state (volumes, sim, transport)
        tab-sons.js     → données pistes/sections/instruments/stingers
        tab-gameplay.js → logique simulation intensité (simApply)
        handlers.js     → event delegation DOM
        index.js        → façade publique (init, show/hide, rAF footer)
      progress-lab/     → side panels + simulateur (swap systemMap/worldMap via CSS)
        state.js        → état UI (simulatorOpen)
        build.js        → builders (zone panel systemMap, wallet/upgrades worldMap, simulator modal)
        update.js       → sync DOM ← state (wallet, upgrades, zones, simulator)
        handlers.js     → event delegation (wallet, upgrades, zone-toggle, simulator)
        index.js        → façade publique (init, show/hide panels + simulator modal)
      ai-lab/           → lab IA auto-apprenante (neuroévolution)
        state.js        → état UI (active, selectedLevel)
        build.js        → construction DOM (sélecteur niveau, boutons, stats, graphe, import/export)
        update.js       → sync DOM ← trainer (stats temps réel, graphe fitness)
        graph-draw.js   → rendu canvas des graphes (fitness, élites, métriques)
        model-storage.js → I/O modèles (fetch, cache, localStorage, download)
        models.js       → coordination UI modèles (browse, import, export, preview)
        handlers.js     → event delegation (start/stop, watch, reset, export, import, level)
        index.js        → façade publique (init, show/hide, lifecycle trainer)
    menu/               → menu principal
      state.js          → état + persistence volumes
      draw-menu.js      → écran menu principal
      draw-settings.js  → écran réglages (sliders)
      draw-credits.js   → écran crédits
      handlers.js       → input menu
      index.js          → façade publique
    persistence/
      progress-storage.js → sauvegarde/chargement progression (localStorage)
    screens/
      stats-screen.js   → écran stats fin de niveau (étoiles, temps, minerais)
      system-map/       → carte du système planétaire (sélection zones)
        index.js        → rendu (étoile centrale, orbites, chemins, instructions)
        draw-nodes.js   → rendu nœuds par type (belt, moon, station, planet, nebula, core)
      world-map/        → carte des niveaux d'une zone
        index.js        → façade (drawWorldMap, getNodePositions)
        draw-nodes.js   → rendu nœuds (étoiles, lock, sélection)
        draw-effects.js → effets visuels (lignes, particules)
        utils.js        → helpers (positions, hitboxes)
      upgrade-screen/   → écran d'upgrade (accessible depuis worldMap)
        state.js        → sélection catégorie/upgrade
        draw.js         → rendu complet (tabs, items, coûts, bouton achat)
        index.js        → façade publique
    dev-overlay/        → overlay in-game (?lab, desktop only)
      index.js          → panel DOM gauche (boutons power-ups, vie +/-, win, ast -1)
      dev-stats.js      → panel DOM droit (timer, intensité, combo)
e2e/                    → tests end-to-end (Playwright + Gherkin)
  features/             → scénarios Gherkin (.feature)
    smoke.feature       → démarrage sans erreur console
    game-flow.feature   → menu → lancer → pause → resume → win
    lab-modes.feature   → ?lab (hub, dev, music, progress)
    desktop-audit.feature → audit visuel desktop (screenshots)
    mobile-audit.feature  → audit visuel mobile iPhone 13 (screenshots)
  steps/                → step definitions + fixtures
    fixtures.js         → custom test (gameHelpers, consoleErrors)
    common.steps.js     → steps partagés (navigation, clavier, assertions)
    smoke.steps.js      → assertion erreurs console
    lab-modes.steps.js  → flags __GAME__, méthodes exposées
    audit.steps.js      → screenshots, diagnostics, interactions tactiles
playwright.config.js    → config Playwright BDD (2 projets : desktop + mobile)
```

## Règles de structure

### Limite de taille : 300 lignes max par fichier
Si un fichier dépasse ~300 lignes, le transformer en **dossier** avec un `index.js` façade.

### Limite de fichiers : 5 fichiers max à plat par dossier (hors tests)
Si un dossier contient plus de 5 fichiers `.js` (hors `.spec.js`), regrouper les fichiers en sous-dossiers thématiques.

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
- Flèches gauche/droite → déplacer le vaisseau / naviguer (systemMap, worldMap, upgrade)
- Espace / Entrée → lancer le drone / confirmer (entrer zone, lancer niveau)
- Échap → pause / retour (playing→paused, worldMap→systemMap, systemMap→menu)
- U → ouvrir l'atelier d'upgrades (depuis worldMap)
- R → retour au menu (depuis pause)

Mobile :
- Glisser le doigt → le vaisseau suit
- Tap → lancer le drone
- Bouton ⏸ → pause
- Boutons tactiles dans les menus

## Architecture

- **Clean Architecture** : Domain (entités pures) → Use Cases (game logic) → Infra (DOM/Canvas/Audio)
- **DI systématique** : config injectée par constructeur, toutes les dépendances via `{ deps }` (pas d'import CONFIG dans les entités)
- GameSession est pur état (~72 lignes), CollisionResolver gère la détection, CollisionHandler orchestre
- États du jeu : menu → systemMap → worldMap → upgrade → playing → paused / gameOver / won → stats → worldMap
  - systemMap : sélection de zone (planètes sur orbites concentriques)
  - worldMap : sélection de niveau dans une zone
  - Échap remonte d'un cran : playing→paused, worldMap→systemMap, systemMap→menu
- Canvas interne 800x600 (paysage) ou 800xN (portrait, hauteur dynamique)
- Fond étoilé parallaxe sur un canvas séparé (bg-canvas, plein écran)
- Touch & keyboard coexistent

Détails des décisions techniques (domain shapes, power-ups déclaratifs, responsive, delta-time, musique, intensité, multi-drone, dev overlay, validation Playwright) → voir `ARCHITECTURE.md`.

## Dev

Serveur local requis (ES modules) :
```bash
pnpm serve .             # serveur statique → http://localhost:3000
```

Tests unitaires (Vitest + Chai, co-localisés `js/**/*.spec.js`, ~512 tests) :
```bash
pnpm test                         # une passe (vitest run)
pnpm vitest                       # mode watch
```

Tests e2e (Playwright + Gherkin via playwright-bdd, dossier `e2e/`) :
```bash
pnpm test:e2e                    # bddgen + playwright test (22 scénarios)
pnpm bddgen                      # génère les specs depuis les .feature
pnpm test:all                    # unit + e2e
pnpm train                       # entraînement IA CLI (voir options ci-dessous)
pnpm train -- --generations 200 --population 80 --level z1-2
```
Le serveur statique est lancé automatiquement par Playwright sur le port 3333.
Les specs sont générées dans `.features-gen/` (gitignored).

Hook e2e : `window.__GAME__` expose en lecture seule `state`, `lives`, `remaining`, `devPanel`, `musicLab`, `progressLab`, `labHub`, `wallet`, `upgrades`, `forceWin()` (tue tous les astéroïdes), et `startLevel(levelId)` (lance un niveau spécifique).

Mode spécial : `?lab` — ouvre le Lab Hub (choix entre Dev Panel, Music Lab, Progress Lab). En jeu, active le dev overlay (desktop only).

Roadmap P2/P3 et idées dans `BACKLOG.md`.
