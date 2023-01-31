/**
 * Factory which returns an octave scaler - converts a number from 0->1 to
 * a multipler from 1 to 2^octaveRange
 */
export const octaveScaler = (
  config: { octaveRange: number; minOctave: number; referenceTone: number },
) => {
  const { octaveRange, minOctave = 0, referenceTone = 440 } = config;
  return (value: number) =>
    2 ** ((value * octaveRange) + minOctave) * referenceTone;
};
