# Plan de refacto — Space Breakout

## État final (27/02/2026)

Architecture DDD complète :
- `domain/` — entités pures : Ship, Drone, Capsule, AsteroidField, patterns, materials — **zéro code canvas, zéro import infra**
- `use-cases/` — un dossier par use-case, classes avec injection de deps
- `main/` — wiring (init.js), boucle (loop.js), HUD (hud.js), input (input.js) — **classes avec full injection**
- `infra/` — couche technique (audio, particles, menu, dev-panel, dev-overlay, resize, touch, stars, renderers/)

**200 tests unitaires + 15 tests e2e Playwright.**

---

## Tâches complétées

| # | Tâche | Commit |
|---|-------|--------|
| 1 | Couper imports G dans dev-overlay | `f435e7e` |
| 2 | Extraire utils d'init.js | `19d449e` |
| 3a | Tests HudRenderer (10) | `d1914cc` |
| 4 | domain/ un dossier par entité | `66df8e9` |
| 5 | Séparer rendu du domain (Ship, Drone) | `c410400` |
| 6 | GameLoop/InputHandler full injection | `7244a3b` |
| 3b | Tests GameLoop (14) + InputHandler (10) | `c32a09a` |
| A | AsteroidField.draw() → infra/renderers/ | `05c249a` |
| C | Tests d'intégration (9) | `f92909d` |

---

## Décisions architecturales

**CONFIG global non injecté** — Les modules infra/ (touch, menu, dev-panel, music-lab, resize) sont procéduraux et lisent CONFIG au runtime via import direct. Les convertir en classes pour de la DI serait un gros chantier à faible ROI. Les classes main/ et use-cases/ reçoivent déjà les sous-objets CONFIG nécessaires via injection.

---

## Reste optionnel

- **Convertir les modules infra/ procéduraux en classes** si on veut pousser la DI jusqu'au bout
- **Extraire les tests domain/asteroid.spec.js** vers `domain/asteroid/asteroid-field.spec.js`
