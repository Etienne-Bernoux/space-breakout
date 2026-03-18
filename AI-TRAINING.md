# Méthodologie d'entraînement IA

Guide de la boucle itérative d'entraînement du modèle IA (neuroévolution).

## Architecture du modèle

- **Topologie** : [20, 14, 8, 2] — 20 inputs, 2 couches cachées (14+8), 2 outputs
- **408 poids** optimisés par algorithme génétique (sélection tournoi, crossover uniforme, mutation gaussienne)
- **Ratio pop/poids** : ~29x avec pop 120 (zone optimale neuroévolution : 20-50x)
- **Parallélisation** : `worker_threads` (9 workers par défaut, ×3-4 speedup)

### Inputs (20)

| # | Input | Count | Description |
|---|-------|-------|-------------|
| 0 | Ship center X | 1 | Position du vaisseau (normalisé -1..1) |
| 1 | Ship width | 1 | Largeur vaisseau (varie avec power-ups shrink/expand) |
| 2-5 | Drone X, Y, dx, dy | 4 | Position + trajectoire du drone |
| 6 | Drone lancé | 1 | Flag binaire (-1/+1) |
| 7-8 | Minerai proche dx/dy | 2 | Capsule minerai la plus proche du ship (dédié). `{0, -2}` si aucune capsule |
| 9-10 | Centroïde astéroïdes | 2 | Direction générale des briques restantes / ship. `{0, -2}` si aucun astéroïde |
| 11-12 | Densité astéroïdes G/D | 2 | Répartition gauche/droite autour du drone |
| 13 | Progression | 1 | 0→1, stratégie change en fin de partie |
| 14-19 | 3 astéroïdes proches | 6 | dx/dy des 3 plus proches du drone (visée) |

### Outputs (2)

| Output | Description |
|--------|-------------|
| Position X | Position cible du vaisseau (tanh → -1..1 → 0..W). Le ship se déplace vers cette cible à sa vitesse max. |
| Lancer | >0 = lancer le drone |

### Choix de conception

- **Position absolue (pas delta)** : le ship a déjà une vitesse max intégrée — pas de téléportation. La sortie delta a été testée (v8) mais perd en réactivité pour les grands déplacements. Les oscillations se combattent par la pénalité fitness, pas par le type de sortie.
- **2 couches cachées** : nécessaire pour la stratégie 3★ (planification court terme : orienter le rebond vers les clusters). Une seule couche = pattern matching réactif uniquement.
- **3 astéroïdes proches (vs 5)** : les 2 plus lointains n'apportent presque rien — le drone touche les proches d'abord. Réduit les inputs bruités.
- **Input minerai séparé** : sans signal dédié, l'IA ne distingue pas minerai/power-up et ignore les minerais. Avec un input dédié + bonus fitness +60, elle apprend à les collecter.
- **Pas d'input power-up** : les power-ups (+20 pts) ne justifient pas un input dédié. L'IA les ramasse par hasard.
- **Ship width conservé** : varie avec shrink/expand, affecte la zone de rebond.

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

### Headless training spécifique

- **Mineral drop rate** : 35% en entraînement (vs 8% en jeu) pour que l'IA voie suffisamment de minerais
- **Wallet factice** : nécessaire pour que le `CollisionHandler` collecte les minerais en headless
- **Capsules collected** : conservées 1 frame avant filtrage pour le tracking AIPlayer

## Boucle itérative d'entraînement

### Principe

```
1. Partir du meilleur modèle (best.json) ou from scratch
2. Lancer un cycle de 150 générations
3. Évaluer (test de généralisation sur z1-1 à z1-6) :
   - Amélioration → sauvegarder, continuer
   - Niveau ≥ 2★ → le retirer du set d'entraînement
   - Plateau (2 cycles sans progrès) → ajuster les paramètres
   - Plateau confirmé → convergence atteinte
4. Répéter jusqu'à convergence (tous niveaux ≥ 2★ ou plateau confirmé)
```

### Commandes

```bash
# Entraînement recommandé (curriculum + multi-eval)
pnpm train -- --generations 150 --population 120 --levels z1-1,z1-2,z1-3,z1-4,z1-5 --curriculum --evals 2

# Continuer depuis un modèle existant
pnpm train -- --generations 150 --population 120 --levels z1-1,z1-2,z1-3,z1-4,z1-5 --curriculum --evals 2 --input js/contexts/ai/models/best.json

# Fine-tuning (mutation réduite, pop augmentée)
pnpm train -- --generations 150 --population 150 --mutation-rate 0.08 --mutation-power 0.2 --evals 2 --input js/contexts/ai/models/best.json

# Entraînement simple mono-level
pnpm train -- --generations 150 --population 120 --level z1-3
```

### Options CLI

| Option | Défaut | Description |
|--------|--------|-------------|
| `--generations N` | 100 | Nombre de générations |
| `--population N` | 50 | Taille de la population |
| `--level ID` | z1-1 | Niveau unique |
| `--levels IDs` | — | Niveaux séparés par virgule (rotation par gen) |
| `--curriculum` | off | Débloque les niveaux progressivement |
| `--evals N` | 1 | Parties par agent (moyenne la fitness, réduit le bruit) |
| `--workers N` | CPUs-1 | Threads parallèles (×3-4 speedup) |
| `--mutation-rate N` | 0.20 | Taux de mutation |
| `--mutation-power N` | 0.4 | Puissance de mutation |
| `--input FILE` | — | Modèle de départ |
| `--output FILE` | best.json | Fichier de sortie (auto-update index.json) |
| `--silent` | off | Pas de sortie par génération |

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
| Niveau ≥ 2★ en généralisation | Retirer du set d'entraînement — focaliser sur les niveaux restants |
| Restart from scratch | Seulement si plateau ET nouvelles features (inputs, fitness, topologie) |

## Stratégies d'entraînement

### Curriculum learning (`--curriculum`)
Débloque les niveaux progressivement : commence par z1-1 (facile), ajoute un niveau tous les N gens. L'IA apprend les bases avant de se confronter aux niveaux durs.

### Rotation par génération + seed par génération
Tous les agents d'une même génération jouent le même niveau (rotation cyclique) **et le même layout** (seed aléatoire unique par gen). Comparaison parfaitement équitable. Le seed change à chaque gen et à chaque run → pas de surapprentissage.

### Multi-évaluation (`--evals N`)
Chaque agent joue N parties et la fitness est moyennée. Réduit le bruit dû aux layouts aléatoires. `--evals 2` est un bon compromis (coût ×2, convergence plus stable).

### Multi-level (`--levels z1-1,z1-2,...`)
Entraîner sur plusieurs niveaux pour généraliser. Sans ça, le modèle se spécialise sur un seul layout.

### Parallélisation (`--workers N`)
Chaque agent est simulé dans un `worker_thread` séparé avec son propre headless game. Par défaut utilise CPUs-1 threads. Speedup typique ×3-4 sur un M1/M2 (10 cœurs).

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
  console.log(level+': won='+won+' '+t.toFixed(1)+'s '+stars+'★ drops='+player.dropCount+' minerals='+player.mineralsCaught);
}
"
```

### Signaux de problème

| Symptôme | Cause probable | Solution |
|---|---|---|
| Best fluctue beaucoup | Évaluation bruitée | `--evals 2`, rotation par gen |
| Avg stagne, best monte plus | Diversité perdue | Augmenter mutation |
| Gagne un seul niveau | Surspécialisation | Multi-level + curriculum |
| 0 minerais collectés | Drop rate trop faible ou bug headless | Vérifier wallet headless, drop rate 35% |
| Jamais 3★ | Bonus 3★ trop faible ou réseau trop simple | Augmenter récompense 3★, 2 couches cachées |
| Drone ne se lance pas | shouldLaunch pas appris | Malus framesBeforeLaunch + fallback 30 frames |
| Vibrations / oscillations | Pénalité anti-oscillation trop basse | Durcir le seuil ou augmenter la pénalité |
| Biais directionnel | Inputs asymétriques / doublons | Vérifier symétrie des inputs |
| Convergence trop lente | Trop de poids vs pop | Ratio pop/poids > 20x |
| Seed = surapprentissage | Seed fixe par n° de gen | Seed *aléatoire* par gen (change à chaque run) |

## Enseignements

1. **Le ratio pop/poids est critique** en neuroévolution. En dessous de 20x, le réseau est sous-échantillonné et converge lentement vers des optima locaux.
2. **Moins d'inputs = mieux**, si les inputs sont pertinents et non-redondants. Un réseau avec 20 inputs ciblés surpasse un réseau avec 30 inputs bruités.
3. **Le seed déterministe (fixé par n° de gen) cause du surapprentissage** — le modèle mémorise les layouts. Solution : seed *aléatoire* par gen (même layout pour tous les agents, mais différent à chaque run).
4. **La profondeur est utile pour la stratégie** — 2 couches cachées permettent de composer des abstractions (ex: "cluster dense + drone monte → anticiper le rebond").
5. **Les objectifs contradictoires se résolvent par des inputs dédiés** — le réseau ne collectera jamais les minerais sans un signal spécifique lui indiquant où ils sont.
6. **La sortie delta ne fonctionne pas pour le breakout** — en théorie réduit les oscillations, en pratique le ship a déjà une vitesse max (pas de téléport), et le delta perd en réactivité pour les grands déplacements. Position absolue + vitesse du ship = le bon combo.
7. **La parallélisation (worker_threads) est le meilleur levier perf** — ×3-4 speedup sans changer la simulation, chaque worker a son propre headless game.

## Historique des améliorations

| Version | Fitness | Changement clé |
|---|---|---|
| v1 [24,16,2] | 2658 | Modèle initial, mono-level z1-3 |
| v2 [24,16,12,2] | 2679 | 2e couche cachée |
| v3 [30,20,12,2] | 2683 | +6 inputs (angle, murs, progression...) |
| v4 fitness | 3385 | 3★=1500, minerais +60, malus -10 |
| v5 multi-level | 3488 | Rotation aléatoire z1-1→z1-5 |
| v6 curriculum | 3640 | Curriculum + bonus vitesse + rotation/gen |
| v7 fix inputs | 3748 | Fix doublons inputs, marges ship, mineral drop 35% |
| v8 delta (abandonné) | 3567 | [20,14,8,2], delta output — perte de réactivité |
| v9 workers | 3623 | Position absolue restaurée, worker_threads ×3-4 speedup |
| v10 seed/gen | 3607 | Seed aléatoire par gen → même layout pour tous les agents |
| v11 signaux | 3614 | Signal {0,-2} pour absence capsule/astéroïde, speed via speedMod |
| **v11b z1-3→6** | **3743** | **Fine-tuning ciblé z1-3,z1-4,z1-5,z1-6** |

> v11b gagne z1-1, z1-3 (1★), z1-6/boss (2★). z1-4/z1-5 survie longue. Collecte minerais.
