export function circle(
  x: number,
  y: number,
  r: number,
  samples = 8192,
): [number, number][] {
  const angles = Array.from(new Array(samples)).map((_v, i) =>
    2 * Math.PI * i / samples
  );
  return angles.map((a) => [x + r * Math.sin(a), y - r * Math.cos(a)]);
}
