# Méthodologie d'entraînement IA

Guide de la boucle itérative d'entraînement du modèle IA (neuroévolution).

## Architecture du modèle

- **Topologie** : [30, 20, 12, 2] — 30 inputs, 2 couches cachées (20+12), 2 outputs
- **876 poids** optimisés par algorithme génétique (sélection tournoi, crossover uniforme, mutation gaussienne)
- **Inputs** (30) : position/largeur ship, position/vitesse/angle drone, flag lancé, distance murs, position relative drone→ship, distance Y urgence, capsule proche, centroïde astéroïdes, densité G/D, progression, 5 astéroïdes proches
- **Outputs** (2) : position cible vaisseau (tanh → -1..1), lancer le drone (>0 = oui)

## Fitness

La fitness est composite (~3500 pts max typique) :

| Composante | Points | Description |
|---|---|---|
| Victoire | +1000 | Objectif majeur |
| 3 étoiles | +1500 | <60s + 0 drops (très incitatif) |
| 2 étoiles | +500 | 0 drops |
| 1 étoile | +200 | Victoire avec drops |
| Minerais | +60/capsule | Capsules minerai collectées |
| Power-up bonus | +20/capsule | |
| Power-up malus | -10/capsule | |
| Progression | 0–400 | Quadratique (progress² × 400) |
| Efficacité | 0–300 | progress/temps — récompense la vitesse même sans victoire |
| Rattrapages | +15/catch | Signal bootstrap |
| Rallies | variable | Destructions entre rattrapages (log décroissant) |
| Drops | -200/drop | Perte de vie |
| Lancement lent | -2/frame >5 | Force le lancement rapide du drone |
| Anti-oscillation | pénalité si >50% | Mouvements smooth |

## Boucle itérative d'entraînement

### Principe

```
1. Partir du meilleur modèle (best.json) ou from scratch
2. Lancer un cycle de 150 générations
3. Évaluer :
   - Amélioration → sauvegarder, continuer
   - Plateau (2 cycles sans progrès) → ajuster les paramètres
   - Plateau confirmé → convergence atteinte
4. Répéter jusqu'à convergence
```

### Commandes

```bash
# Entraînement de base
pnpm train -- --generations 150 --population 120 --levels z1-1,z1-2,z1-3,z1-4,z1-5

# Avec curriculum learning (recommandé pour multi-level)
pnpm train -- --generations 150 --population 120 --levels z1-1,z1-2,z1-3,z1-4,z1-5 --curriculum

# Continuer depuis un modèle existant
pnpm train -- --generations 150 --population 120 --levels z1-1,z1-2,z1-3,z1-4,z1-5 --curriculum --input js/contexts/ai/models/best.json

# Fine-tuning (mutation réduite, pop augmentée)
pnpm train -- --generations 150 --population 150 --mutation-rate 0.08 --mutation-power 0.2 --input js/contexts/ai/models/best.json
```

### Phases de la boucle

**Phase 1 — Exploration** (mutation forte, from scratch ou nouveau modèle)
- `--mutation-rate 0.20 --mutation-power 0.4 --population 120`
- 2-4 cycles de 150 gens
- Objectif : trouver un bon bassin d'attraction

**Phase 2 — Exploitation** (mutation réduite)
- `--mutation-rate 0.15 --mutation-power 0.3 --population 150`
- 1-2 cycles
- Objectif : affiner les poids dans le bassin trouvé

**Phase 3 — Fine-tuning** (micro-optimisation)
- `--mutation-rate 0.08 --mutation-power 0.2 --population 150`
- 1-2 cycles
- Si pas d'amélioration → convergence confirmée

### Décisions à chaque checkpoint (150 gens)

| Situation | Action |
|---|---|
| Grosse amélioration (>+100) | Continuer mêmes params |
| Amélioration faible (<+50) | Passer en phase suivante |
| Pas d'amélioration (2 cycles) | Convergence ou restart |
| Restart from scratch | Seulement si plateau ET nouvelles features (inputs, fitness, topologie) |

## Stratégies d'entraînement

### Curriculum learning (`--curriculum`)
Débloque les niveaux progressivement : commence par z1-1 (facile), ajoute un niveau tous les N gens. L'IA apprend les bases avant de se confronter aux niveaux durs.

### Rotation par génération
Tous les agents d'une même génération jouent le même niveau (rotation cyclique). Plus équitable que l'évaluation aléatoire par agent.

### Multi-level (`--levels z1-1,z1-2,...`)
Entraîner sur plusieurs niveaux pour généraliser. Sans ça, le modèle se spécialise sur un seul layout.

## Diagnostic

### Tester la généralisation
```bash
node -e "
import { createHeadlessGame } from './js/contexts/ai/infra/headless-game.js';
import { Population } from './js/contexts/ai/domain/genome.js';
import { TOPOLOGY, AIPlayer } from './js/contexts/ai/use-cases/ai-player.js';
import { readFileSync } from 'fs';
const { startGame, tick, gameState } = createHeadlessGame();
const pop = new Population(1, TOPOLOGY);
pop.loadModel(JSON.parse(readFileSync('js/contexts/ai/models/best.json', 'utf-8')));
for (const level of ['z1-1','z1-2','z1-3','z1-4','z1-5']) {
  const player = new AIPlayer(pop.bestGenome, gameState);
  startGame(level);
  for (let f=0;f<10800;f++) {
    const s=gameState.session.state;
    if (s==='won'||s==='gameOver') break;
    if (s!=='playing') continue;
    const d=player.decide();
    const dr=gameState.entities.drones[0];
    if (dr&&!dr.launched&&(d.shouldLaunch||f>10)) dr.launch(gameState.entities.ship);
    tick(d.pointerX);
  }
  const won=gameState.session.state==='won';
  const t=player.framesSurvived/60;
  const stars=!won?0:player.dropCount>0?1:t<=60?3:2;
  console.log(level+': won='+won+' time='+t.toFixed(1)+'s stars='+stars+'★ drops='+player.dropCount);
}
"
```

### Signaux de problème

| Symptôme | Cause probable | Solution |
|---|---|---|
| Best fluctue beaucoup | Évaluation bruitée | Augmenter pop, rotation par gen |
| Avg stagne, best monte plus | Diversité perdue | Augmenter mutation |
| Gagne un seul niveau | Surspécialisation | Multi-level + curriculum |
| 0 minerais collectés | Drop rate trop faible ou bug headless | Vérifier wallet headless |
| Jamais 3★ | Bonus 3★ trop faible | Augmenter récompense 3★ |
| Drone ne se lance pas | shouldLaunch pas appris | Malus framesBeforeLaunch |

## Historique des améliorations

| Version | Fitness | Changement clé |
|---|---|---|
| v1 [24,16,2] | 2658 | Modèle initial, mono-level z1-3 |
| v2 [24,16,12,2] | 2679 | 2e couche cachée |
| v3 [30,20,12,2] | 2683 | +6 inputs (angle, murs, progression...) |
| v4 fitness | 3385 | 3★=1500, minerais +60, malus -10 |
| v5 multi-level | 3488 | Rotation aléatoire z1-1→z1-5 |
| **v6 curriculum** | **3640** | Curriculum + bonus vitesse + rotation/gen |
