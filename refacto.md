# Plan de refacto — Space Breakout

## État actuel (27/02/2026)

Architecture DDD en place :
- `domain/` — entités pures (Ship, Drone, Capsule, AsteroidField, patterns, materials) — **zéro code canvas** dans Ship/Drone
- `use-cases/` — un dossier par use-case, classes avec injection de deps
- `main/` — wiring (init.js), boucle de rendu (loop.js), HUD (hud.js), input (input.js) — **classes avec injection**
- `infra/` — couche technique (audio, particles, menu, dev-panel, dev-overlay, resize, touch, stars, renderers/)

191 tests unitaires + 15 tests e2e Playwright.

---

## Tâches complétées

| # | Tâche | Commit |
|---|-------|--------|
| 1 | Couper imports G dans dev-overlay | `f435e7e` |
| 2 | Extraire utils d'init.js (perceptualVolume → audio, suppr getSlowMoFactor) | `19d449e` |
| 3a | Tests HudRenderer (10 tests) | `d1914cc` |
| 4 | domain/ un dossier par entité (ship/, drone/, capsule/) | `66df8e9` |
| 5 | Séparer rendu du domain (Ship.draw, Drone.draw → infra/renderers/) | `c410400` |
| 6 | GameLoop/InputHandler full injection (infra injecté via constructeur) | `7244a3b` |
| 3b | Tests GameLoop (14) + InputHandler (10) | `c32a09a` |

---

## Reste à faire (optionnel)

### A. AsteroidField.draw() → infra/renderers/

**Problème :** `AsteroidField.draw()` et `_tracePath()` sont du code canvas dans une entité domain.
L'AsteroidField importe encore `renderAsteroid` depuis `infra/renderers/asteroid-render.js` (couplage domain → infra).

**Action :** Extraire `draw()` et `_tracePath()` dans `infra/renderers/field-render.js`.
AsteroidField devient un objet pur : état de la grille + logique de fragmentation.

**Impact :** Moyen. Dernier couplage rendering dans domain/.

---

### B. CONFIG global → injection

**Problème :** `CONFIG` est importé dans ~15 fichiers. C'est un singleton global.

**Action :** Injecter `config` dans chaque classe/module via le constructeur.

**Impact :** Élevé (beaucoup de fichiers). Très mécanique, faible ROI.

---

### C. Tests d'intégration

**Action :** Tester le wiring complet init.js → startGame → collision → win.

**Impact :** Moyen. Validerait le wiring end-to-end sans browser.
