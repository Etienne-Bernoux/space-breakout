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
- Astéroïdes générés procéduralement (3 tailles, layout aléatoire à chaque partie)
- Musique et sons procéduraux (Web Audio, zéro fichier audio)
- Effets de particules (explosions, traînée du drone)
- Fond étoilé parallaxe à 3 couches
- Responsive : s'adapte à toutes les tailles d'écran (portrait et paysage)
- Menu, réglages audio (volume musique/sons), pause, crédits
- Souris, clavier et tactile supportés
- Musique adaptative pilotée par l'intensité gameplay (5 layers, tempo progressif, fills)
- Effets visuels dynamiques (vignette, micro-shake, glow) liés à l'intensité
- 8 power-ups (élargi, collant, perçant, vie+, affaiblir, vitesse, slow-mo, multi-drone)
- Multi-drone : drone supplémentaire, lancement en éventail, game over quand tous perdus
- Clean Architecture : entités pures, logique métier isolée, infra séparée
- Zéro dépendance runtime, 100% vanilla JS + Canvas

## Développement

```bash
git clone https://github.com/etienne-bernoux/space-breakout.git
cd space-breakout
npm install                        # installe les devDependencies
npx serve .                        # serveur local → http://localhost:3000
npx vitest run --globals --exclude 'e2e/**'  # tests unitaires (Vitest + Chai)
npx playwright test                # tests e2e (Playwright + Chromium)
```

Modes spéciaux : `?dev` (dev panel + overlay in-game), `?mus` (music lab).

## Crédits

Développé par [Etienne Bernoux](https://github.com/etienne-bernoux).
Inspiré du casse-briques d'Adibou. Construit avec Canvas API.
