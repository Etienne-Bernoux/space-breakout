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
style.css           → styles
js/
  config.js         → constantes (tailles, vitesses, couleurs)
  main.js           → game loop, collisions, score, vies, HUD
  ship.js           → vaisseau (raquette)
  drone.js          → drone de minage (balle)
  asteroid.js       → grille d'astéroïdes (briques)
  stars.js          → fond étoilé parallaxe (canvas plein écran)
```

## Contrôles

- Flèches gauche/droite → déplacer le vaisseau
- Espace → lancer le drone
- R → rejouer après game over ou victoire

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
