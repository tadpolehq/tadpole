import type { DOM } from './types/index.js';

export function getQuadCenter(quad: DOM.Quad): [number, number] {
  const x = (quad[0] + quad[2] + quad[4] + quad[6]) / 4;
  const y = (quad[1] + quad[3] + quad[5] + quad[7]) / 4;
  return [Math.round(x), Math.round(y)];
}

export const withPrefix = (prefix: string | undefined, key: string) =>
  prefix ? `${prefix}${key}` : `${key}`;
