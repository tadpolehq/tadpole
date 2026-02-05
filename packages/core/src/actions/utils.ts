export const withPrefix = (prefix: string | undefined, key: string) =>
  prefix ? `${prefix}${key}` : `${key}`;

export function clampDelta(
  currentPos: number,
  targetPos: number,
  viewportSize: number,
  contentSize: number,
) {
  const maxScroll = Math.max(0, contentSize - viewportSize);
  const clampedTarget = Math.max(0, Math.min(maxScroll, targetPos));
  return clampedTarget - currentPos;
}
