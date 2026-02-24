# Space Breakout

Casse-briques spatial inspiré d'Adibou, publié sur GitHub Pages.

## Concept

Un vaisseau de nettoyage spatial envoie un drone de minage détruire des astéroïdes.
Le thème spatial influence le gameplay (prévu : récolte de matière, power-ups, upgrades vaisseau).

## Stack

- Vanilla JS (ES modules) + Canvas API
- Zéro dépendance
- Hébergé sur GitHub Pages : https://etienne-bernoux.github.io/space-breakout/

## Structure

```
index.html          → point d'entrée
style.css           → styles (responsive, touch-action)
js/
  config.js         → constantes (tailles, vitesses, couleurs)
  main.js           → game loop, collisions, score, vies, HUD, pause
  ship.js           → vaisseau (raquette)
  drone.js          → drone de minage (balle)
  asteroid.js       → grille d'astéroïdes (briques)
  stars.js          → fond étoilé parallaxe (canvas plein écran)
  menu.js           → menu principal, crédits
  resize.js         → canvas responsive (portrait/paysage)
  touch.js          → contrôles tactiles (mobile)
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

- États du jeu : menu → playing → paused / gameOver / won → menu
- Canvas interne 800x600 (paysage) ou 800xN (portrait, hauteur dynamique)
- Fond étoilé parallaxe sur un canvas séparé (bg-canvas, plein écran)
- Touch & keyboard coexistent

## Dev

Serveur local requis (ES modules) :
```bash
npx serve .
```

## Roadmap

- [ ] Récolte de matière (fragments d'astéroïdes)
- [ ] Power-ups
- [ ] Upgrades vaisseau
- [ ] Niveaux multiples
- [ ] Sons et effets visuels
