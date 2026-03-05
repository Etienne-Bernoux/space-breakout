# Space Breakout

Un casse-briques spatial. Pilote un vaisseau de minage et envoie ton drone détruire les astéroïdes infestés pour sécuriser chaque zone du système planétaire !

**[Jouer maintenant](https://etienne-bernoux.github.io/space-breakout/)**

## Comment jouer

**Sur mobile (recommandé) :**
glisse ton doigt pour déplacer le vaisseau, tape l'écran pour lancer le drone.

**Sur desktop :**
flèches gauche/droite pour bouger, espace pour lancer le drone, échap pour mettre en pause.

## Fonctionnalités

- Carte du système planétaire : 6 zones (ceinture d'astéroïdes, lune glacée, station abandonnée, planète de lave, nébuleuse toxique, noyau alien)
- Progression multi-zones avec déverrouillage linéaire, niveaux par zone, étoiles
- Vaisseau détaillé avec réacteurs animés et lumières clignotantes
- 8 matériaux d'astéroïdes (roche, glace, lave, métal, cristal, obsidienne, tentacule alien, noyau alien)
- Astéroïdes générés procéduralement (3 tailles, patterns ASCII ou layout aléatoire)
- Musique et sons procéduraux (Web Audio, zéro fichier audio, 3 pistes : Space Synth, Dark Orchestral, Cantina)
- Effets de particules (explosions, traînée du drone)
- Fond étoilé parallaxe à 3 couches avec corps célestes
- Responsive : s'adapte à toutes les tailles d'écran (portrait et paysage)
- Menu, réglages audio (volume musique/sons), pause, crédits
- Souris, clavier et tactile supportés
- Musique adaptative pilotée par l'intensité gameplay (5 layers, tempo progressif, fills)
- Effets visuels dynamiques (vignette, micro-shake, glow) liés à l'intensité
- 12 power-ups : élargi, rétréci, collant, perçant, vie+, score ×2, affaiblir, multi-drone, large, mini, rapide, warp
- Multi-drone : drone supplémentaire, game over quand tous perdus
- Système de minerais (cuivre, argent, or, platine) + atelier d'upgrades (7 upgrades, 4 catégories)
- Clean Architecture DDD : entités pures, use-cases isolés, infra séparée, DI systématique
- 434 tests (417 unit + 17 e2e) — zéro dépendance runtime, 100% vanilla JS + Canvas

## Développement

```bash
git clone https://github.com/etienne-bernoux/space-breakout.git
cd space-breakout
npm install                        # installe les devDependencies
npx serve .                        # serveur local → http://localhost:3000
npm test                           # tests unitaires — 417 tests (Vitest + Chai)
npm run test:e2e                   # tests e2e — 17 tests (Playwright + Chromium)
npm run test:all                   # unit + e2e
```

Mode spécial : `?lab` — ouvre le Lab Hub (Dev Panel, Music Lab, Progress Lab). En jeu, active le dev overlay (desktop only).

## Crédits

Développé par [Etienne Bernoux](https://github.com/etienne-bernoux).
Construit avec Canvas API.
