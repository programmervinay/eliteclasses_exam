/**
 * Generates a deterministic 32-bit unsigned integer hash from a string seed (FNV-1a).
 */
const hashSeed = (seed: string): number => {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/**
 * Mulberry32 deterministic PRNG seeded by an unsigned 32-bit integer.
 */
const createSeededRandom = (seed: number): (() => number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Returns a new array shuffled using Fisher-Yates with a deterministic string seed.
 * Different seeds (e.g. different attempt IDs) produce distinct jumbled orders,
 * while the same attempt ID preserves order across page refreshes.
 */
export const seededShuffle = <T>(items: readonly T[], seed: string): T[] => {
  const result = [...items];
  if (result.length <= 1) return result;

  const rng = createSeededRandom(hashSeed(seed));
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }
  return result;
};
