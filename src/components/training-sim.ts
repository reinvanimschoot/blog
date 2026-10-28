/**
 * A tiny, visual stand-in for word2vec training, used by TrainingMap.astro.
 *
 * This is NOT real word2vec. It keeps the idea and drops the math:
 * - every word starts at a random spot (two random numbers)
 * - real word pairs pull the two words a little closer together
 * - fake (random) pairs push the two words a little further apart
 * Repeat that many times and words that share neighbors drift together.
 */

export type Pair = [number, number];

export interface SimState {
  x: number[];
  y: number[];
  seen: number; // real pairs seen so far
}

export const TOTAL_STEPS = 6000; // real pairs per full training run
const MIN = 0.1;
const MAX = 0.92;
const PULL = 0.12; // how far a real pair moves toward each other
const PUSH = 0.03; // how far a fake pair moves apart (at least)
const PUSH_NEAR = 0.0027; // extra push when the two words are close
const PUSH_RANGE = 0.7; // fake pairs further apart than this aren't pushed anymore
export const FAKES_PER_REAL = 1; // one fake pair for every real pair, to keep it easy to follow
const MIN_DIST = 0.13; // keeps dots from sitting on top of each other

const clamp = (v: number) => Math.min(MAX, Math.max(MIN, v));

// Small seeded random generator, so the static picture is always the same
export function seeded(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function scatter(n: number, rnd: () => number): SimState {
  const x: number[] = [];
  const y: number[] = [];
  for (let i = 0; i < n; i++) {
    // keep trying until the new dot isn't right on top of another one
    let px = 0;
    let py = 0;
    for (let t = 0; t < 200; t++) {
      px = MIN + rnd() * (MAX - MIN);
      py = MIN + rnd() * (MAX - MIN);
      if (x.every((ox, j) => Math.hypot(ox - px, y[j] - py) > 0.16)) break;
    }
    x.push(px);
    y.push(py);
  }
  return { x, y, seen: 0 };
}

const isReal = (real: Pair[], a: number, b: number) =>
  real.some(([p, q]) => (p === a && q === b) || (p === b && q === a));

// Learning slows down as training goes on, so the picture settles
const rate = (seen: number) => Math.max(0.2, 1 - seen / TOTAL_STEPS);

export interface StepInfo {
  real: Pair;
  fakes: Pair[];
}

/** Pick the next real pair (and its fake pairs, if enabled), without training yet. */
export function pickStep(s: SimState, real: Pair[], fakes: boolean, rnd: () => number): StepInfo {
  const n = s.x.length;
  const pair = real[Math.floor(rnd() * real.length)];
  const picked: Pair[] = [];
  if (fakes) {
    for (let f = 0; f < FAKES_PER_REAL; f++) {
      // pick two random words, and try again if they happen to be a real pair
      for (let t = 0; t < 20; t++) {
        const i = Math.floor(rnd() * n);
        let j = Math.floor(rnd() * (n - 1));
        if (j >= i) j++;
        if (!isReal(real, i, j)) {
          picked.push([i, j]);
          break;
        }
      }
    }
  }
  return { real: [pair[0], pair[1]], fakes: picked };
}

/** Train the real pair of a picked step: nudge both words toward each other. */
export function applyReal(s: SimState, info: StepInfo) {
  const lr = rate(s.seen);
  const [a, b] = info.real;
  const dx = s.x[b] - s.x[a];
  const dy = s.y[b] - s.y[a];
  s.x[a] = clamp(s.x[a] + PULL * lr * dx);
  s.y[a] = clamp(s.y[a] + PULL * lr * dy);
  s.x[b] = clamp(s.x[b] - PULL * lr * dx);
  s.y[b] = clamp(s.y[b] - PULL * lr * dy);
}

/** Train the fake pairs of a picked step: nudge both words apart. */
export function applyFakes(s: SimState, info: StepInfo) {
  const lr = rate(s.seen);
  for (const [i, j] of info.fakes) {
    const ex = s.x[j] - s.x[i];
    const ey = s.y[j] - s.y[i];
    const d2 = ex * ex + ey * ey + 0.004;
    // pushes fade out with distance, so far-apart words don't drift into the corners
    const fade = Math.max(0, 1 - Math.sqrt(d2) / PUSH_RANGE);
    const f2 = lr * Math.min(0.09, PUSH * fade + (PUSH_NEAR / d2) * fade);
    const len = Math.sqrt(d2);
    s.x[i] = clamp(s.x[i] - (f2 * ex) / len);
    s.y[i] = clamp(s.y[i] - (f2 * ey) / len);
    s.x[j] = clamp(s.x[j] + (f2 * ex) / len);
    s.y[j] = clamp(s.y[j] + (f2 * ey) / len);
  }
}

/** Train on a picked step: pull the real pair together, push the fake pairs apart. */
export function applyStep(s: SimState, info: StepInfo) {
  applyReal(s, info);
  applyFakes(s, info);
  s.seen++;
}

/** Pick and train a single real pair (and its fake pairs, if enabled). */
export function trainStep(s: SimState, real: Pair[], fakes: boolean, rnd: () => number): StepInfo {
  const info = pickStep(s, real, fakes, rnd);
  applyStep(s, info);
  return info;
}

/** Process `steps` real pairs (and their fake pairs, if enabled). */
export function train(s: SimState, real: Pair[], steps: number, fakes: boolean, rnd: () => number) {
  for (let k = 0; k < steps; k++) trainStep(s, real, fakes, rnd);
  separate(s);
}

/** Purely visual: gently push apart dots that overlap, so labels stay readable. */
export function separate(s: SimState) {
  const n = s.x.length;
  for (let it = 0; it < 2; it++) {
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = s.x[j] - s.x[i];
        const dy = s.y[j] - s.y[i];
        const d = Math.hypot(dx, dy) || 0.0001;
        if (d < MIN_DIST) {
          const m = (MIN_DIST - d) / 2;
          s.x[i] = clamp(s.x[i] - (m * dx) / d);
          s.y[i] = clamp(s.y[i] - (m * dy) / d);
          s.x[j] = clamp(s.x[j] + (m * dx) / d);
          s.y[j] = clamp(s.y[j] + (m * dy) / d);
        }
      }
    }
  }
}

export type Side = 'right' | 'left' | 'above' | 'below';
export const SIDES: Record<Side, { dx: number; dy: number; anchor: string }> = {
  right: { dx: 11, dy: 5, anchor: 'start' },
  left: { dx: -11, dy: 5, anchor: 'end' },
  above: { dx: 0, dy: -11, anchor: 'middle' },
  below: { dx: 0, dy: 21, anchor: 'middle' },
};

/**
 * Pick a side for every label so labels don't cover dots or each other
 * (as far as possible). Coordinates are in SVG units.
 */
// Plot edges in SVG units (see TrainingMap.astro); labels shouldn't cross the axes
const AXIS_X = 64;
const AXIS_Y = 330;

export function layoutLabels(cx: number[], cy: number[], words: string[], fontSize = 15): Side[] {
  const boxes: number[][] = cx.map((x, i) => [x - 8, cy[i] - 8, x + 8, cy[i] + 8]);
  const hit = (b: number[], skip: number) =>
    boxes.some((o, k) => k !== skip && b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
  const placed: number[][] = [];
  const free = (b: number[], i: number) =>
    b[3] <= AXIS_Y && b[0] >= AXIS_X && !hit(b, i) && !placed.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
  const box = (i: number, side: Side) => {
    const w = words[i].length * 0.56 * fontSize + 2;
    const o = SIDES[side];
    const x = cx[i] + o.dx;
    const base = cy[i] + o.dy;
    const x1 = o.anchor === 'start' ? x : o.anchor === 'end' ? x - w : x - w / 2;
    return [x1, base - fontSize * 0.75, x1 + w, base + fontSize * 0.2];
  };
  const out: Side[] = [];
  // place labels from left to right, which tends to give the nicest result
  const order = cx.map((_, i) => i).sort((a, b) => cx[a] - cx[b]);
  for (const i of order) {
    const pref: Side[] = cx[i] > 300 ? ['left', 'above', 'below', 'right'] : ['right', 'above', 'below', 'left'];
    let pick: Side | null = null;
    for (const side of pref) {
      if (free(box(i, side), i)) {
        pick = side;
        break;
      }
    }
    if (!pick) {
      // no free side: take the one that overlaps the least
      const area = (b: number[]) =>
        [...boxes.filter((_, k) => k !== i), ...placed].reduce((sum, o) => {
          const w = Math.min(b[2], o[2]) - Math.max(b[0], o[0]);
          const h = Math.min(b[3], o[3]) - Math.max(b[1], o[1]);
          return sum + (w > 0 && h > 0 ? w * h : 0);
        }, 0) + (b[3] > AXIS_Y || b[0] < AXIS_X ? 400 : 0);
      pick = pref.reduce((best, side) => (area(box(i, side)) < area(box(i, best)) ? side : best), pref[0]);
    }
    out[i] = pick;
    placed.push(box(i, pick));
  }
  return out;
}
