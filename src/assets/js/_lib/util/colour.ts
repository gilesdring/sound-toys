/**
 * Convert an RGBA array to a luma value
 */
export const rgbaToLuma = (v: [number, number, number, number]) => {
  const [r, g, b, _a] = v;
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma;
};
