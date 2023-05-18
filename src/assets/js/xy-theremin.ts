import { visualize } from "./_lib/visualisers/signal.ts";
import { SimpleSynth } from "/lib/simple-synth.ts";
let synth: SimpleSynth | undefined;

/**
 * Factory which returns an octave scaler - converts a number from 0->1 to
 * a multipler from 1 to 2^octaveRange
 */
const octaveScaler = (octaveRange: number, minOctave = 0) => (value: number) =>
  2 ** ((value * octaveRange) + minOctave);

const pitchRange = octaveScaler(3);

const setPitchAndVolume = (e: MouseEvent & TouchEvent) => {
  if (!synth) return;
  if (!e.target) return;
  const target = e.target as HTMLCanvasElement;
  const shape = target.getBoundingClientRect();
  const xPos = e.pageX || e.touches[0].clientX;
  const yPos = e.pageY || e.touches[0].clientX;
  const pos = {
    x: xPos - shape.left,
    y: yPos - shape.top,
  };

  synth.freq = pitchRange(pos.x / shape.width) * 110;
  synth.gain = 1 - (pos.y / shape.height);
};

const controlSurface = document.querySelector("#control-surface");
if (!controlSurface) throw new Error("No control surface defined");

const startSynth = () => {
  synth = new SimpleSynth();
  visualize({
    id: "oscilloscope",
    analyser: synth.analyser,
    displayType: "waveform",
  });
};

controlSurface.addEventListener("click", (e) => {
  e.preventDefault();
  if (!synth) startSynth();
  if (synth?.active) synth.stop();
  else synth?.start();
  setPitchAndVolume(e as MouseEvent & TouchEvent);
});
controlSurface.addEventListener("mousemove", (e) => {
  e.preventDefault();
  setPitchAndVolume(e as MouseEvent & TouchEvent);
});
controlSurface.addEventListener("touchstart", (e) => {
  e.preventDefault();
  if (!synth) startSynth();
  synth?.start();
  setPitchAndVolume(e as MouseEvent & TouchEvent);
});
controlSurface.addEventListener("touchmove", (e) => {
  e.preventDefault();
  setPitchAndVolume(e as MouseEvent & TouchEvent);
});
controlSurface.addEventListener("touchend", (e) => {
  e.preventDefault();
  if (!synth) return;
  synth.stop();
});
