# Space Breakout

> **Règle doc** : après tout changement structurel (nouveau fichier, nouveau pattern, nouvelle commande), mettre à jour ce fichier, `README.md` et `BACKLOG.md` si pertinent.
> **Règle bug** : tout bug repéré (par Etienne ou Claude) et non corrigé dans la foulée → ajouté dans `BUG.md`. Dépilé quand opportun.

Casse-briques spatial inspiré d'Adibou, publié sur GitHub Pages.

## Concept

Un vaisseau de nettoyage spatial envoie un drone de minage détruire des astéroïdes.
Le thème spatial influence le gameplay (prévu : récolte de matière, power-ups, upgrades vaisseau).

## Stack

- Vanilla JS (ES modules) + Canvas API
- Web Audio API (sons procéduraux + musique)
- Tests unitaires : Vitest + Chai (specs co-localisées `js/**/*.spec.js`, ~370 tests)
- Tests e2e : Playwright (dossier `e2e/`, 16 tests)
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
    loop.js             → boucle principale, state dispatch map, slow-motion
    index.js            → point d'entrée, bootstrap
  domain/               → entités pures (config injectée, 0 dépendance)
    ship/ship.js        → vaisseau (raquette)
    drone/drone.js      → drone de minage (balle)
    capsule/capsule.js  → capsule de power-up
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
      asteroid-render.js → rendu par matériau (6 styles minéraux)
      asteroid-render-helpers.js → helpers partagés (couleurs, cratères, veines, rim)
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

Détails des décisions techniques (domain shapes, power-ups déclaratifs, responsive, delta-time, musique, intensité, multi-drone, dev overlay, validation Playwright) → voir `ARCHITECTURE.md`.

## Dev

Serveur local requis (ES modules) :
```bash
npx serve .              # serveur statique → http://localhost:3000
```

Tests unitaires (Vitest + Chai, co-localisés `js/**/*.spec.js`, ~370 tests) :
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

Roadmap P2/P3 et idées dans `BACKLOG.md`.
