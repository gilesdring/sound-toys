import { normalise } from "./array.ts";

interface bufferFactoryOptions {
  samples: number[];
  sampleRate?: number;
  numberOfChannels?: number;
  audioContext?: AudioContext;
}

function* samplesGenerator(samples: number[]): Generator<number, never> {
  let step = 0;
  while (true) {
    yield samples[step % samples.length];
    step ++;
  }
}

export function bufferFactory(options: bufferFactoryOptions): AudioBuffer {
  const samples = normalise(options.samples);
  if (!Array.isArray(samples)) throw new TypeError('Invalid sample array passed');
  const audioContext = options.audioContext || new window.AudioContext()
  const sampleRate = options.sampleRate || audioContext.sampleRate;
  const channelCount = options.numberOfChannels || 1;

  const buffer = new AudioBuffer({
    numberOfChannels: channelCount,
    length: samples.length,
    sampleRate,
  })

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    // This gives us the actual array that contains the data
    const currentChannel = buffer.getChannelData(channel);
    const wave = samplesGenerator(samples);
    for (let i = 0; i < buffer.length; i++) {
      currentChannel[i] = wave.next().value;
    }
  }

  return buffer;
}