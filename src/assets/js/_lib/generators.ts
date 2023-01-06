import { audioContext } from "./audio-subsystem.js";

/**
 * Sine wave generator function
 */
export function* sineGen(sampleRate = undefined) {
  const r = sampleRate || audioContext.sampleRate;
  let step = 0;
  const segment = 2 * Math.PI / r;
  do {
    yield Math.sin(step * segment);
    step++;
  } while (true)
}

/**
 * Square wave generator
 */
export function* squareGen(sampleRate = undefined) {
  const r = sampleRate || audioContext.sampleRate;
  let step = 0;
  do {
    yield (step % r) / r < 0.5 ? 1 : -1;
    step++;
  } while (true)
}