import { bufferFactory } from "../../../lib/util/buffer-factory.ts";

import { WaveOscillatorNode } from "../../../lib/node/wave-oscillator-node.ts";
import { CrossFader } from "../../../lib/node/cross-fader.ts";

const noise = Array.from(new Array(1024)).map(() => Math.random() * 256);
const sine = Array.from(new Array(1024))
  .map((_, i) => 2 * Math.PI * i / 1024)
  .map(Math.sin);

const buffer = {
  sine: bufferFactory({ samples: sine }),
  noise: bufferFactory({ samples: noise }),
}

const audioContext = new AudioContext()

const wave = new WaveOscillatorNode(audioContext);
// wave.buffer = buffer.sine;
wave.frequency = 440;

const master = audioContext.createGain();
master.gain.setValueAtTime(0.3, audioContext.currentTime);
wave.connect(master)
master.connect(audioContext.destination);

const crossFader = new CrossFader(audioContext, { time: 0.1 });
crossFader.connect(master);

const fadeSources: Record<string, () => OscillatorNode> = {};

fadeSources.triangle = () => {
  const source = audioContext.createOscillator();
  source.type = 'triangle';
  source.frequency.value = 440;
  return source;
}

fadeSources.square = () => {
  const source = audioContext.createOscillator();
  source.type = 'square';
  source.frequency.value = 440;
  return source;
}

addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-action="start"]').forEach(x => {
    x.addEventListener('click', () => {
      audioContext.resume();
    })
  })
  document.querySelectorAll('[data-action="stop"]').forEach(x => {
    x.addEventListener('click', () => {
      audioContext.suspend();
    })
  })
  document.querySelectorAll('[data-frequency]').forEach(x => {
    x.addEventListener('click', function () {
      wave.start();
      wave.frequency = this.dataset.frequency
    })
  })
  document.querySelectorAll('[data-wave]').forEach(x => {
    x.addEventListener('click', function () {
      wave.buffer = buffer[this.dataset.wave as string];
      wave.frequency = 440;
      wave.start();
      audioContext.resume();
    })
  })

  document.querySelectorAll('[data-fade]').forEach(x => {
    x.addEventListener('click', function () {
      audioContext.resume();
      crossFader.source = fadeSources[this.dataset.fade]();
    })
  })
})

