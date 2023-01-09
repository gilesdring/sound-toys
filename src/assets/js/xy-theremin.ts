import { audioContext as audioCtx } from './_lib/audio-subsystem.js';
import { DisplayWaveform } from './_lib/visualisers/waveform.ts';
import { visualize } from './_lib/visualisers/signal.ts';

const sampleRate = audioCtx.sampleRate;

const arrayBuffer = audioCtx.createBuffer(2, sampleRate, sampleRate);
const gainNode = audioCtx.createGain();
gainNode.connect(audioCtx.destination);
const playbackRateAdjustment = 440;

/**
 * Create wave from a wavetable
 * It's a small step from here to...
 */
function* waveTableGen(): Generator<number> {
  const size = audioCtx.sampleRate;

  // Create and fill buffer with wave
  const buffer = new Float32Array(size);
  const wtf = (i: number) => { // Wave Table Function
    const theta = Math.PI * i / size;
    return 0.5 * Math.sin(2 * theta) +
      0.45 * Math.sin(4 * theta) +
      0.3 * Math.sin(6 * theta);
  }
  for (let i = 0; i < size; i++) buffer[i] = wtf(i);

  // Loop round the buffer
  let step = 0;
  while (true) {
    yield buffer[step % size];
    step++;
  }
}

for (let channel = 0; channel < arrayBuffer.numberOfChannels; channel++) {
  /**
   * Create fundamental reference wave - set to A440
   */
  const wave = waveTableGen();
  // This gives us the actual array that contains the data
  const nowBuffering = arrayBuffer.getChannelData(channel);
  for (let i = 0; i < arrayBuffer.length; i++) {
    nowBuffering[i] = wave.next().value;
  }
}

/**
 * Factory which returns an octave scaler - converts a number from 0->1 to
 * a multipler from 1 to 2^octaveRange
 */
const octaveScaler = (octaveRange: number, minOctave = 0) => (value: number) => 2 ** ((value * octaveRange) + minOctave);

let source: AudioBufferSourceNode;
const play = () => {
  if (source) source.stop();
  source = audioCtx.createBufferSource();
  source.loop = true;
  source.buffer = arrayBuffer;
  source.connect(gainNode);
  source.start();
}
const stop = () => source.stop();

const pitchRange = octaveScaler(3, -2);

const setPitchAndVolume = (e: Event) => {
  e.preventDefault();
  if (!source) return;
  if (!e.target) return;
  const shape = e.target.getBoundingClientRect();
  const xPos = e.pageX || e.touches[0].clientX;
  const yPos = e.pageY || e.touches[0].clientX;
  const pos = {
    x: xPos - shape.left,
    y: yPos - shape.top,
  }
  const pitch = pitchRange(pos.x / shape.width);

  const gain = 1 - (pos.y / shape.height);
  source.playbackRate.value = pitch * playbackRateAdjustment;
  gainNode.gain.value = gain;
}
let playing = false;
const toggle = () => {
  if (!playing) {
    playing = true;
    play();
  } else {
    playing = false;
    stop();
  }
}

const controlSurface = document.querySelector('#control-surface');
if (!controlSurface) throw new Error('No control surface defined')

controlSurface.addEventListener("click", (e) => { toggle(); setPitchAndVolume(e); });
controlSurface.addEventListener("mousemove", (e) => setPitchAndVolume(e));
controlSurface.addEventListener("touchstart", (e) => { play(); setPitchAndVolume(e); });
controlSurface.addEventListener("touchmove", (e) => { setPitchAndVolume(e); });
controlSurface.addEventListener("touchend", () => { stop(); });

const analyser = audioCtx.createAnalyser();

gainNode.connect(analyser);

visualize({
  id: "oscilloscope",
  analyser,
  displayType: "waveform"
});

new DisplayWaveform({
  buffer: arrayBuffer,
  id: "waveform",
});