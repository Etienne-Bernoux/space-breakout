# Plan de refacto — Space Breakout

## État actuel (27/02/2026)

Architecture DDD en place :
- `domain/` — entités pures (Ship, Drone, Capsule, AsteroidField, patterns, materials)
- `use-cases/` — un dossier par use-case, classes avec injection de deps
- `main/` — wiring (init.js), boucle de rendu (loop.js), HUD (hud.js), input (input.js)
- `infra/` — couche technique (audio, particles, menu, dev-panel, dev-overlay, resize, touch, stars)

157 tests unitaires + 15 tests e2e Playwright.

---

## 1. Couper les derniers imports de G dans infra/

**Fichiers concernés :**
- `infra/dev-overlay/index.js` → importe `G` directement
- `infra/dev-overlay/dev-stats.js` → importe `G` directement

**Action :** Injecter les dépendances nécessaires via `init.js` au lieu d'importer G.
Le dev-overlay a besoin de `entities.field`, `systems.powerUp`, `session`, `gs`.
Le dev-stats a besoin de `systems.intensity`.

**Impact :** Faible (2 fichiers). Supprime les dernières dépendances infra → main.

---

## 2. Extraire les utilitaires d'init.js

**Fonctions à déplacer :**
- `gameScale()` → util ou fichier dédié (utilisé par HudRenderer, InputHandler)
- `pauseBtnLayout()` → idem
- `perceptualVolume()` → infra/audio.js (c'est de l'audio)
- `getSlowMoFactor()` → use-cases ou supprimé (plus utilisé ?)

**Action :** Créer `js/main/utils.js` ou injecter ces fonctions. init.js ne devrait contenir que du wiring.

**Impact :** Moyen (init.js + consommateurs à mettre à jour).

---

## 3. Transformer GameLoop et InputHandler en vrais injectés

**Problème actuel :** GameLoop et InputHandler sont des classes avec injection, mais elles importent encore des modules infra directement (stars, particles, menu, dev-panel, music-lab, touch, screenshake, power-up-render, dev-overlay).

**Action :** Injecter ces dépendances infra via le constructeur. Gros chantier — à découper :
- GameLoop : injecter `{ stars, particles, screenshake, menu, devPanel, musicLab, devOverlay, powerUpRender }`
- InputHandler : injecter `{ touch, menu, devPanel, musicLab }`

**Impact :** Élevé mais rend GameLoop et InputHandler testables unitairement.

---

## 4. domain/ — un dossier par entité

**État actuel :** `domain/` a un mélange de fichiers plats et du dossier `asteroid/`.

**Structure cible :**
```
domain/
  ship/ship.js + ship.spec.js (à créer)
  drone/drone.js + drone.spec.js
  capsule/capsule.js + capsule.spec.js
  asteroid/  (déjà structuré)
  power-ups/power-ups.js
  patterns/patterns.js
  materials/materials.js
```

**Impact :** Faible (renommage + imports). Cohérent avec use-cases/.

---

## 5. Séparer le rendu du domain

**Problème :** `asteroid-render.js` est dans `domain/` mais c'est de l'infra (canvas rendering).
`Ship.draw()` et `Drone.draw()` contiennent du code canvas directement dans les entités domain.

**Action :**
- Déplacer `asteroid-render.js` → `infra/renderers/asteroid-render.js`
- Extraire `Ship.draw()` → `infra/renderers/ship-render.js`
- Extraire `Drone.draw()` → `infra/renderers/drone-render.js`
- Les entités domain deviennent des objets purs (état + logique, zéro canvas)

**Impact :** Élevé. C'est le changement le plus "DDD pur" — les entités ne connaissent plus le rendering.

---

## 6. Tests manquants

**Classes sans tests unitaires :**
- `HudRenderer` — mockable maintenant, tester les appels ctx
- `GameLoop` — tester les transitions d'état (menu/playing/paused/gameOver/won)
- `InputHandler` — tester les dispatches clavier/touch

**Tests d'intégration :**
- Tester le wiring complet init.js → startGame → collision → win

**Impact :** Moyen. Augmenterait significativement la couverture.

---

## 7. CONFIG global → injection

**Problème :** `CONFIG` est importé dans ~15 fichiers. C'est un singleton global comme l'était G.

**Action :** Injecter `config` dans chaque classe/module qui en a besoin, via le constructeur.

**Impact :** Élevé (beaucoup de fichiers). À faire en dernier — c'est le plus mécanique.

---

## Ordre recommandé

| Priorité | Tâche | Effort | ROI |
|----------|-------|--------|-----|
| 1 | Couper imports G dans dev-overlay | Faible | Élevé — plus aucun import circulaire |
| 2 | Extraire utils d'init.js | Faible | Moyen — init.js pur wiring |
| 3 | Tests manquants (HudRenderer, GameLoop) | Moyen | Élevé — couverture |
| 4 | domain/ un dossier par entité | Faible | Moyen — cohérence |
| 5 | Séparer rendu du domain | Élevé | Élevé — DDD pur |
| 6 | GameLoop/InputHandler full injection | Élevé | Moyen — testabilité |
| 7 | CONFIG → injection | Élevé | Faible — mécanique |
