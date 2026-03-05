# Guide de création musicale — Space Breakout

Musique 100% procédurale via Web Audio API. Zéro fichier audio, zéro sample.

## Architecture

```
js/infra/music/
  audio-core.js        → contexte Web Audio, layers, BPM, master gain/filter
  instruments-main.js  → instruments Space Synth (kick, snare, hihat, bass, lead, pad, arp…)
  instruments-dark.js  → instruments Dark Orchestral (timpani, cello, brass, strings, choir…)
  instruments-cantina.js → instruments Jazz Cantina (jazzKick, brushSnare, sax, trumpet, piano…)
  sections-main.js     → 7 sections Mi mineur (intro → outro)
  sections-dark.js     → 7 sections Ré mineur LOTR style
  sections-cantina.js  → 7 sections Bb majeur jazz swing
  section-engine.js    → registre instruments + dispatch data-driven
  scheduler.js         → boucle de sections, mode adaptatif, contrôle lecture
  fills.js             → fills de transition (snare roll, arp rise)
  stingers.js          → motifs ponctuels (win, game over, power-up, combo)
  demos.js             → démos instruments (music lab)
  index.js             → façade publique (re-exports)
```

## Chaîne audio

```
Instrument → layers.{drums|bass|pad|lead|high} → masterGain (0.3) → masterFilter (LP) → destination
```

5 layers avec volumes indépendants : `drums`, `bass`, `pad`, `lead`, `high`. Le MusicDirector contrôle les volumes par layer selon l'intensité de jeu.

## Concepts clés

**BEAT** : durée d'un beat en secondes = `60 / BPM`. Les sections font 16 beats. Tout timing dans les sections est exprimé en beats (converti en secondes par `t * getBeat()`).

**Track** : une palette sonore complète (instruments + sections). Actuellement 3 : `main`, `dark`, `cantina`.

**Section** : une boucle de 16 beats. 7 sections par track : `intro`, `verse`, `chorus`, `bridge`, `breakdown`, `climax`, `outro`.

**Layer** : couche de mixage. Chaque instrument se connecte à une layer. Le MusicDirector peut monter/baisser chaque layer indépendamment.

## Ajouter un nouveau track — étape par étape

### Étape 1 : Créer les instruments

Fichier : `js/infra/music/instruments-{nom}.js`

Chaque instrument est une fonction qui crée des nœuds Web Audio et les connecte à un layer.

Signature selon le type :

```js
// Percussions (drums) — temps + volume optionnel
function myKick(time, vol = 0.3) { ... gain.connect(layers.drums); }

// Notes (bass, lead, high) — temps + note MIDI + durée en secondes + volume optionnel
function myBass(time, note, dur, vol) { ... gain.connect(layers.bass); }

// Accords (pad) — temps + tableau de notes MIDI + durée en secondes
function myChord(time, notes, dur) { ... gain.connect(layers.pad); }
```

Import obligatoire : `import { getCtx, freq, layers } from './audio-core.js';`

`freq(note)` convertit une note MIDI en Hz : `440 * 2^((note-69)/12)`.

Techniques courantes :
- **Oscillateurs** (`createOscillator`) : `sine`, `sawtooth`, `square`, `triangle`
- **Bruit** (`createBuffer` rempli de random) : percussions, textures
- **Filtres** (`createBiquadFilter`) : `lowpass`, `highpass`, `bandpass` — timbre
- **LFO vibrato** : oscillateur basse fréquence connecté à `.frequency` d'un autre osc
- **Désaccordage** : 2 oscillateurs avec ratio ~1.004–1.008 pour l'épaisseur
- **Enveloppes** : `gain.setValueAtTime()` → `linearRampToValueAtTime()` / `exponentialRampToValueAtTime()`

Ne jamais oublier `osc.stop(time + dur)` pour libérer les ressources.

### Étape 2 : Créer les sections

Fichier : `js/infra/music/sections-{nom}.js`

Format data-driven — chaque section est un objet avec 5 arrays (un par layer) :

```js
const MA_SECTION = {
  drums: [ ... ],   // → layer drums
  bass:  [ ... ],   // → layer bass
  pad:   [ ... ],   // → layer pad
  lead:  [ ... ],   // → layer lead
  high:  [ ... ],   // → layer high
};
```

Chaque event est un objet dispatché par le section-engine selon sa forme :

```js
// Percussion : fn + t + vol optionnel
{ fn: 'myKick', t: 0, vol: 0.3 }

// Note : fn + t + note MIDI + dur (en beats) + vol optionnel
{ fn: 'myBass', t: 0, note: 46, dur: 2, vol: 0.2 }

// Accord : fn + t + notes (array MIDI) + dur (en beats) + vol optionnel
{ fn: 'myChord', t: 0, notes: [58, 62, 65], dur: 4 }
```

`t` est en beats (0–15 pour une section de 16 beats). `dur` est en beats aussi. Le section-engine convertit automatiquement en secondes via `getBeat()`.

`fn` est le nom de la fonction instrument tel qu'enregistré dans le registre (étape 3).

Notes MIDI utiles :

```
C2=36  D2=38  E2=40  F2=41  G2=43  A2=45  B2=47
C3=48  D3=50  E3=52  F3=53  G3=55  A3=57  B3=59
C4=60  D4=62  E4=64  F4=65  G4=67  A4=69  B4=71
C5=72  D5=74  E5=76  F5=77  G5=79  A5=81  B5=83
Bémols : Eb=E-1, Bb=B-1, Ab=A-1, Db=D-1, Gb=G-1
```

Exporter les 7 sections : `{NOM}_INTRO`, `{NOM}_VERSE`, `{NOM}_CHORUS`, `{NOM}_BRIDGE`, `{NOM}_BREAKDOWN`, `{NOM}_CLIMAX`, `{NOM}_OUTRO`.

### Étape 3 : Enregistrer dans le section-engine

Fichier : `js/infra/music/section-engine.js`

1. Importer les instruments :
```js
import { myKick, myBass, myChord, ... } from './instruments-{nom}.js';
```

2. Importer les sections :
```js
import { NOM_INTRO, NOM_VERSE, ... } from './sections-{nom}.js';
```

3. Ajouter au registre `INSTRUMENTS` :
```js
const INSTRUMENTS = {
  // ... existants
  myKick, myBass, myChord, ...
};
```

4. Ajouter à `SECTIONS` :
```js
const SECTIONS = {
  // ... existants
  nom: {
    intro: NOM_INTRO, verse: NOM_VERSE, chorus: NOM_CHORUS,
    bridge: NOM_BRIDGE, breakdown: NOM_BREAKDOWN,
    climax: NOM_CLIMAX, outro: NOM_OUTRO,
  },
};
```

### Étape 4 : Enregistrer le track dans le scheduler

Fichier : `js/infra/music/scheduler.js`

Ajouter le nom à `TRACK_NAMES` :
```js
const TRACK_NAMES = ['main', 'dark', 'cantina', 'nom'];
```

### Étape 5 : Ajouter les démos au music lab

Fichier : `js/infra/music/demos.js`

Importer les instruments et ajouter un objet `demosNom` :
```js
const demosNom = {
  myKick: () => myKick(t),
  myBass: () => { [46, 50, 53].forEach((n, i) => myBass(t + i * BEAT, n, BEAT)); },
  myChord: () => myChord(t, [58, 62, 65], BEAT * 4),
};
```

Ajouter au dispatch :
```js
const demos = track === 'nom' ? demosNom : track === '...' ? ... : demosMain;
```

### Étape 6 : Ajouter les métadonnées au music lab

Fichier : `js/infra/lab/music-lab/tab-sons.js`

1. Ajouter le track à `TRACKS` :
```js
{ id: 'nom', label: 'MON TRACK' },
```

2. Ajouter la liste d'instruments :
```js
export const INSTRUMENTS_NOM = [
  { id: 'myKick', label: 'KICK', color: '#ff6644' },
  ...
];
```

3. Mettre à jour `getInstruments()` :
```js
if (t === 'nom') return INSTRUMENTS_NOM;
```

### Étape 7 : Câbler le lifecycle (si le track est lié à un écran)

Si le track doit jouer automatiquement sur un écran (comme cantina dans l'atelier) :

1. **GameIntensityDirector** (`js/use-cases/intensity/game-intensity-director.js`) — ajouter les méthodes `onEnterX()` / `onLeaveX()` qui dispatch vers `this.music`
2. **MusicDirector** (`js/infra/orchestrators/music-director.js`) — implémenter `onEnterX()` : `setTrack('nom') + enableAdaptiveMode() + startMusic()` et `onLeaveX()` : `stopMusic()`
3. **init.js** (`js/main/init.js`) — appeler le GID aux points de transition d'état

## Ajouter un SFX ponctuel

Les SFX (sons courts non musicaux) vont dans `js/infra/sfx/audio.js`.

Pattern :
```js
export function playMonSon() {
  const ctx = getCtx();
  const now = ctx.currentTime;
  // Créer oscillateurs, buffers, filtres...
  // Connecter à sfxGain (pas layers — les SFX ont leur propre bus)
  gain.connect(sfxGain);
}
```

Pour le câbler dans le jeu : SFX → `MusicDirector.onX()` → `GameIntensityDirector.onX()` → appelé depuis le code gameplay.

Pour le tester dans le music lab : l'ajouter dans `STINGER_GROUPS` de `tab-sons.js` avec sa référence de fonction.

## Ajouter un stinger musical

Les stingers (motifs courts mélodiques) vont dans `js/infra/music/stingers.js`.

Ils se connectent directement à `ctx.destination` (pas de layer) car ils jouent par-dessus la musique.

Exporter depuis `js/infra/music/index.js` et importer dans le MusicDirector.

## Tips

- Volumes typiques : percussions 0.05–0.15, bass 0.15–0.25, accords 0.03–0.06, lead 0.06–0.12, SFX 0.1–0.3
- Toujours tester dans le music lab avant de câbler : `?lab` → Music Lab → sélectionner le track → cliquer les instruments et sections
- Les sections de 16 beats à 110 BPM ≈ 8.7 secondes. À 128 BPM ≈ 7.5 secondes
- Le mode adaptatif permet au MusicDirector de demander une section spécifique à la prochaine transition (gameplay dynamique)
- `exponentialRampToValueAtTime` ne peut pas aller vers 0 — utiliser 0.001 comme plancher
