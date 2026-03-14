// --- Stats par génération (partagé browser + CLI) ---

const HEADER = ['Gen', 'Best', 'Avg', 'Catch', 'Destr', 'Rally', 'Drops', 'Caps', 'Stars', 'Wins', 'Div'];
const WIDTHS = [5,     7,      7,     6,       6,       6,       6,       5,      5,       5,      5];

export function genStatsHeader() {
  return HEADER.map((h, i) => h.padStart(WIDTHS[i])).join(' ');
}

export function genStatsSeparator() {
  return '-'.repeat(WIDTHS.reduce((s, w) => s + w + 1, -1));
}

/**
 * Calcule les stats d'une génération à partir de la population.
 * @param {object[]} genomes - population.genomes (avec _details)
 * @param {number} generation - numéro de génération
 * @param {object} [population] - instance Population (pour diversité + élites)
 */
export function computeGenStats(genomes, generation, population) {
  const total = genomes.reduce((s, g) => s + g.fitness, 0);
  const sorted = [...genomes].sort((a, b) => b.fitness - a.fitness);
  const best = sorted[0];
  const d = best._details || {};

  // Fitness des élites (top 10%)
  const eliteCount = population?._elites?.length || Math.max(3, Math.ceil(genomes.length * 0.10));
  const eliteFitnesses = sorted.slice(0, eliteCount).map(g => Math.round(g.fitness));

  return {
    gen: generation,
    bestFitness: Math.round(best.fitness),
    avg: Math.round(total / genomes.length),
    catches: d.catches || 0,
    destroys: d.destroys || 0,
    rallyScore: d.rallyScore || 0,
    drops: d.drops || 0,
    capsules: d.capsules || 0,
    stars: d.stars || 0,
    winCount: genomes.filter(g => g._details?.won).length,
    diversity: Math.round(population?._eliteDiversity || 0),
    eliteFitnesses,
  };
}

/**
 * Formate une ligne de stats (identique CLI et browser).
 * @param {object} s - résultat de computeGenStats
 */
export function formatGenStats(s) {
  return [
    String(s.gen).padStart(WIDTHS[0]),
    String(s.bestFitness).padStart(WIDTHS[1]),
    String(s.avg).padStart(WIDTHS[2]),
    String(s.catches).padStart(WIDTHS[3]),
    String(s.destroys).padStart(WIDTHS[4]),
    String(s.rallyScore).padStart(WIDTHS[5]),
    String(s.drops).padStart(WIDTHS[6]),
    String(s.capsules).padStart(WIDTHS[7]),
    String(s.stars + '★').padStart(WIDTHS[8]),
    String(s.winCount).padStart(WIDTHS[9]),
    String(s.diversity || 0).padStart(WIDTHS[10]),
  ].join(' ');
}
