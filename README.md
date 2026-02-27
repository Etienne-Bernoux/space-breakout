# Space Breakout

Un casse-briques spatial inspiré du jeu Adibou. Pilote un vaisseau de nettoyage et envoie ton drone de minage détruire les astéroïdes qui bloquent la zone !

**[Jouer maintenant](https://etienne-bernoux.github.io/space-breakout/)**

## Comment jouer

**Sur mobile (recommandé) :**
glisse ton doigt pour déplacer le vaisseau, tape l'écran pour lancer le drone.

**Sur desktop :**
flèches gauche/droite pour bouger, espace pour lancer le drone, échap pour mettre en pause.

## Fonctionnalités

- Vaisseau détaillé avec réacteurs animés et lumières clignotantes
- 6 matériaux d'astéroïdes (roche, glace, lave, métal, cristal, obsidienne) avec fragmentation
- Astéroïdes générés procéduralement (3 tailles, patterns ASCII ou layout aléatoire)
- Musique et sons procéduraux (Web Audio, zéro fichier audio)
- Effets de particules (explosions, traînée du drone)
- Fond étoilé parallaxe à 3 couches
- Responsive : s'adapte à toutes les tailles d'écran (portrait et paysage)
- Menu, réglages audio (volume musique/sons), pause, crédits
- Souris, clavier et tactile supportés
- Musique adaptative pilotée par l'intensité gameplay (5 layers, tempo progressif, fills)
- Effets visuels dynamiques (vignette, micro-shake, glow) liés à l'intensité
- 12 power-ups : élargi, rétréci, collant, perçant, vie+, score ×2, affaiblir, multi-drone, large, mini, rapide, warp
- Multi-drone : drone supplémentaire, game over quand tous perdus
- Clean Architecture DDD : entités pures, use-cases isolés, infra séparée, DI systématique
- 295 tests (280 unit + 15 e2e) — zéro dépendance runtime, 100% vanilla JS + Canvas

## Développement

```bash
git clone https://github.com/etienne-bernoux/space-breakout.git
cd space-breakout
npm install                        # installe les devDependencies
npx serve .                        # serveur local → http://localhost:3000
npm test                           # tests unitaires — 280 tests (Vitest + Chai)
npm run test:e2e                   # tests e2e — 15 tests (Playwright + Chromium)
npm run test:all                   # unit + e2e
```

Modes spéciaux : `?dev` (dev panel + overlay in-game), `?mus` (music lab).

## Crédits

Développé par [Etienne Bernoux](https://github.com/etienne-bernoux).
Inspiré du casse-briques d'Adibou. Construit avec Canvas API.
