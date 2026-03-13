// --- Réseau de neurones feedforward ---
// Architecture simple : couches denses, activation tanh (hidden) + sigmoid/tanh (output).
// Pas de backpropagation — les poids sont optimisés par algorithme génétique.

export class NeuralNetwork {
  /**
   * @param {number[]} topology - ex: [16, 12, 2] = 16 inputs, 12 hidden, 2 outputs
   */
  constructor(topology) {
    this.topology = topology;
    this.weights = [];
    this.biases = [];
    for (let i = 1; i < topology.length; i++) {
      const rows = topology[i];
      const cols = topology[i - 1];
      this.weights.push(NeuralNetwork.randomMatrix(rows, cols));
      this.biases.push(new Float32Array(rows));
    }
  }

  /** Forward pass — retourne les activations de la dernière couche. */
  forward(inputs) {
    let a = inputs;
    for (let l = 0; l < this.weights.length; l++) {
      const w = this.weights[l];
      const b = this.biases[l];
      const rows = this.topology[l + 1];
      const cols = this.topology[l];
      const next = new Float32Array(rows);
      for (let i = 0; i < rows; i++) {
        let sum = b[i];
        const offset = i * cols;
        for (let j = 0; j < cols; j++) sum += w[offset + j] * a[j];
        // Dernière couche → tanh (sortie [-1, 1]), sinon tanh aussi
        next[i] = Math.tanh(sum);
      }
      a = next;
    }
    return a;
  }

  /** Nombre total de poids + biais dans le réseau. */
  paramCount() {
    let n = 0;
    for (let i = 1; i < this.topology.length; i++) {
      n += this.topology[i] * this.topology[i - 1]; // weights
      n += this.topology[i]; // biases
    }
    return n;
  }

  /** Exporte tous les poids/biais en un seul Float32Array. */
  encode() {
    const arr = new Float32Array(this.paramCount());
    let idx = 0;
    for (let l = 0; l < this.weights.length; l++) {
      for (let v = 0; v < this.weights[l].length; v++) arr[idx++] = this.weights[l][v];
      for (let v = 0; v < this.biases[l].length; v++) arr[idx++] = this.biases[l][v];
    }
    return arr;
  }

  /** Charge les poids depuis un Float32Array. */
  decode(arr) {
    let idx = 0;
    for (let l = 0; l < this.weights.length; l++) {
      for (let v = 0; v < this.weights[l].length; v++) this.weights[l][v] = arr[idx++];
      for (let v = 0; v < this.biases[l].length; v++) this.biases[l][v] = arr[idx++];
    }
  }

  /** Matrice aléatoire (Xavier init) stockée à plat en Float32Array. */
  static randomMatrix(rows, cols) {
    const arr = new Float32Array(rows * cols);
    const scale = Math.sqrt(2 / (rows + cols));
    for (let i = 0; i < arr.length; i++) arr[i] = (Math.random() * 2 - 1) * scale;
    return arr;
  }
}
