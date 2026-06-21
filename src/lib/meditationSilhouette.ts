export interface SilhouetteParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  layer: 'body' | 'outline' | 'wisp';
  driftX: number;
}

/** Stable silhouette — same shape every render */
function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function inEllipse(
  rng: () => number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): { x: number; y: number } {
  const a = rng() * Math.PI * 2;
  const r = Math.sqrt(rng());
  return {
    x: cx + r * rx * Math.cos(a),
    y: cy + r * ry * Math.sin(a),
  };
}

function alongArc(
  rng: () => number,
  cx: number,
  cy: number,
  r: number,
  start: number,
  end: number,
): { x: number; y: number } {
  const t = start + rng() * (end - start);
  const spread = (rng() - 0.5) * 5;
  return {
    x: cx + Math.cos(t) * r + spread,
    y: cy + Math.sin(t) * r + spread,
  };
}

/** Outline ring — brighter edge particles that define the seated shape */
function outlineRing(
  rng: () => number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  count: number,
): Array<{ x: number; y: number }> {
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    const jitter = (rng() - 0.5) * 1.5;
    return {
      x: cx + Math.cos(a) * (rx + jitter),
      y: cy + Math.sin(a) * (ry + jitter),
    };
  });
}

/** Point cloud for seated lotus meditation silhouette — normalized 0–100 coords */
export function buildMeditationSilhouette(): SilhouetteParticle[] {
  const rng = createRng(42);
  const pts: SilhouetteParticle[] = [];
  let id = 0;

  const add = (
    x: number,
    y: number,
    size: number,
    layer: SilhouetteParticle['layer'] = 'body',
    driftX = 0,
  ) => {
    pts.push({
      id: id++,
      x,
      y,
      size,
      delay: rng() * 8,
      layer,
      driftX,
    });
  };

  // —— Head ——
  outlineRing(rng, 50, 14, 11, 13, 36).forEach((p) => add(p.x, p.y, 2.8 + rng() * 1.2, 'outline'));
  for (let i = 0; i < 90; i++) {
    const p = inEllipse(rng, 50, 14, 10, 12);
    add(p.x, p.y, 2 + rng() * 2.2);
  }

  // —— Neck ——
  for (let i = 0; i < 18; i++) {
    const p = inEllipse(rng, 50, 24, 5, 6);
    add(p.x, p.y, 1.8 + rng() * 1.4);
  }

  // —— Shoulders (wide, defining the upper body) ——
  outlineRing(rng, 50, 29, 27, 9, 40).forEach((p) => add(p.x, p.y, 2.5 + rng(), 'outline'));
  for (let i = 0; i < 110; i++) {
    const p = inEllipse(rng, 50, 30, 25, 9);
    add(p.x, p.y, 2 + rng() * 2);
  }

  // —— Torso taper ——
  for (let i = 0; i < 120; i++) {
    const y = 34 + rng() * 24;
    const taper = 1 - (y - 34) / 30;
    const halfW = 16 * taper + 5;
    const x = 50 + (rng() - 0.5) * halfW * 2;
    add(x, y, 1.8 + rng() * 1.8);
  }

  // —— Arms resting on knees ——
  for (let i = 0; i < 65; i++) {
    const t = rng();
    const x = 26 - t * 4 + Math.sin(t * Math.PI) * 5;
    const y = 32 + t * 34;
    add(x, y, 1.6 + rng() * 1.6);
  }
  for (let i = 0; i < 65; i++) {
    const t = rng();
    const x = 74 + t * 4 - Math.sin(t * Math.PI) * 5;
    const y = 32 + t * 34;
    add(x, y, 1.6 + rng() * 1.6);
  }

  // Hands at knees
  for (let i = 0; i < 25; i++) {
    const p = inEllipse(rng, 34, 64, 6, 5);
    add(p.x, p.y, 2 + rng());
  }
  for (let i = 0; i < 25; i++) {
    const p = inEllipse(rng, 66, 64, 6, 5);
    add(p.x, p.y, 2 + rng());
  }

  // —— Crossed legs (lotus) ——
  outlineRing(rng, 38, 70, 19, 12, 32).forEach((p) => add(p.x, p.y, 2.4 + rng(), 'outline'));
  outlineRing(rng, 62, 71, 19, 12, 32).forEach((p) => add(p.x, p.y, 2.4 + rng(), 'outline'));
  for (let i = 0; i < 80; i++) {
    const p = inEllipse(rng, 38, 70, 17, 10);
    add(p.x, p.y, 1.8 + rng() * 1.8);
  }
  for (let i = 0; i < 80; i++) {
    const p = inEllipse(rng, 62, 71, 17, 10);
    add(p.x, p.y, 1.8 + rng() * 1.8);
  }

  // Feet / lower fold
  for (let i = 0; i < 55; i++) {
    const p = inEllipse(rng, 50, 84, 21, 8);
    add(p.x, p.y, 1.6 + rng() * 1.4);
  }

  // —— Shoulder wisps ——
  for (let i = 0; i < 40; i++) {
    const p = alongArc(rng, 20, 30, 10 + rng() * 22, -0.1, Math.PI * 0.52);
    add(p.x, p.y, 1.2 + rng() * 1.5, 'wisp', -1);
  }
  for (let i = 0; i < 40; i++) {
    const p = alongArc(rng, 80, 30, 10 + rng() * 22, Math.PI * 0.48, Math.PI * 0.92);
    add(p.x, p.y, 1.2 + rng() * 1.5, 'wisp', 1);
  }

  // Side mist
  for (let i = 0; i < 30; i++) {
    const y = 38 + rng() * 38;
    add(8 + rng() * 10, y, 1 + rng() * 0.8, 'wisp', -0.6);
    add(92 - rng() * 10, y, 1 + rng() * 0.8, 'wisp', 0.6);
  }

  return pts;
}
