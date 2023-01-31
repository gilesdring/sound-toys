/**
 * Normalise an array to between -1 and 1
 */
export const normalise = (a: number[]) => {
  const min = Math.min(...a);
  const amp = 2 / (Math.max(...a) - min);
  return a.map((v) => amp * (v - min) - 1);
};
