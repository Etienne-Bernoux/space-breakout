# Backlog

Effort : S = quelques heures, M = demi-journée, L = journée+

## Musique adaptative

| Feature | Description | Effort |
|---|---|---|
| ~~Layers dynamiques~~ | ~~Drums/bass/lead/pad sur des gains séparés, intensité pilotée par le gameplay (nb astéroïdes, combo, power-up)~~ | ~~L~~ | ✅ |
| ~~Sections contextuelles~~ | ~~Bridge/breakdown quand il reste peu d'astéroïdes, chorus quand c'est chaud~~ | ~~M~~ | ✅ |
| Variations mélodiques | 2-3 variantes du chorus/verse tirées aléatoirement pour casser la répétition | M |
| ~~Fills de transition~~ | ~~Roulements snare, montée arp entre les sections~~ | ~~S~~ | ✅ |
| ~~Accents combos~~ | ~~Accents musicaux par paliers (×2, ×3, ×5+)~~ | ~~S~~ | ✅ |
| ~~Tempo progressif~~ | ~~BPM 110→128 piloté par l'intensité gameplay~~ | ~~S~~ | ✅ |

## Game feel / Polish

| Feature | Description | Effort |
|---|---|---|
| ~~Slow-motion final~~ | ~~Ralenti 0.5s sur le dernier astéroïde du niveau~~ | ~~S~~ | ✅ |
| ~~Combo counter~~ | ~~Affichage ×2, ×3… avec feedback visuel croissant (taille, couleur)~~ | ~~M~~ | ✅ |
| ~~Effets visuels intensité~~ | ~~Vignette, micro-shake, étoiles rapides, glow score, death line colorée (EffectDirector)~~ | ~~M~~ | ✅ |
| ~~GameIntensityDirector~~ | ~~Chef d'orchestre : centralise intensité, dispatch vers MusicDirector + EffectDirector~~ | ~~M~~ | ✅ |
| ~~MusicDirector centralise les sons~~ | ~~Tous les sons (SFX + musique + stingers) passent par le director, plus d'import direct~~ | ~~S~~ | ✅ |
| ~~Tests e2e Playwright~~ | ~~Smoke, flow, modes ?dev et ?mus~~ | ~~S~~ | ✅ |
| Thème visuel matériau | Teinte du fond étoilé qui shift selon le matériau dominant restant | M |
| Décor parallaxe v2 | Plus de diversité : gazeuses géantes, planètes rocheuses, lunes, comètes, amas d'étoiles | M |

## Astéroïdes habités (nouveau matériau)

Nouveau matériau "alien/organique" — astéroïdes vivants qui se défendent.

| Feature | Description | Effort |
|---|---|---|
| Matériau alien | Nouveau type visuel (texture organique, pulsation, couleur verte/violette) | M |
| Tir périodique | Projectile lent vers le vaisseau toutes les N secondes | M |
| Tir défensif | Tir déclenché quand le drone passe à proximité | S |
| Projectile → vie | Le vaisseau perd une vie s'il est touché par un projectile | S |
| Drops négatifs | La destruction d'un astéroïde habité déclenche un power-up négatif (rétréci, drone rapide…) | M |
| Stratégie d'ordre | Le joueur doit choisir quand attaquer les habités (risque/récompense) | — |

## Progression

| Feature | Description | Effort |
|---|---|---|
| Récolte de matière | Fragments d'astéroïdes récupérables par le vaisseau | M |
| Niveaux multiples | Difficulté progressive, distribution matériaux par niveau | L |
| Upgrades vaisseau | Drone renforcé, achetées avec matériaux récoltés (shop entre niveaux) | L |
| Upgrades power-ups | 2-3 niveaux par power-up (ex: élargi ×1.5 → ×1.8 → ×2.0) | L |
| Déverrouillage | Certains power-ups verrouillés par défaut, débloqués en progression | M |

## Power-ups P2

| Power-up | Description | Effort | Type |
|---|---|---|---|
| ~~Multi-drone~~ | ~~+1 drone supplémentaire (éventail, game over si tous perdus)~~ | ~~L~~ | ~~Bonus~~ | ✅ |
| Filet de sécurité | 1 rebond gratuit en bas de l'écran (ligne visible, disparaît après usage) | M | Bonus |
| Onde de choc | Détruit tous les astéroïdes dans un rayon autour du point d'impact | M | Bonus |
| Missiles | Tap pour tirer 2 missiles verticaux (3 charges) | L | Bonus |
| Drone rapide | Vitesse ×1.8 pendant 10s (dur à contrôler) | S | Malus |
| Warp | Le drone traverse un mur latéral et ressort de l'autre côté, 10s | S | Bonus |

## Power-ups P3

| Power-up | Description | Effort | Type |
|---|---|---|---|
| Traceur | Trajectoire prédictive visible du drone pendant 10s | M | Bonus |
| Laser | Rayon continu vers le haut pendant 5s | L | Bonus |
| Bouclier magnétique | Le drone est attiré vers le vaisseau quand il est proche du bas | M | Bonus |
| Drone autonome | Mini-drone AI qui casse des astéroïdes tout seul pendant 10s | L | Bonus |
| Miroir | 2ème vaisseau fantôme en miroir (côté opposé) | M | Bonus |
| Gravité | Le drone est attiré vers le curseur/doigt pendant 8s | M | Bonus |
