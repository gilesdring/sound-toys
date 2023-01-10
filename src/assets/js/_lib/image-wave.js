import { WaveSynth } from './wave-synth.js';
import { resume, pause } from './audio-subsystem.js';
import { DisplayWaveform } from './visualisers/waveform.ts';
import { LoopReader } from "./loop-reader.ts";

function init({
  initialImage,
}) {
  const loopReader = new LoopReader({
    canvasId: 'source',
    imgId: 'image',
    samples: 2048,
  });
  
  pause();
  const image = document.getElementById('image');
  image.src = initialImage;

  // Scale canvas
  const canvas = document.getElementById("waveform");
  canvas.width = loopReader.samples;
  canvas.height = loopReader.samples / 10;

  const synth = new WaveSynth();

  const waveformDisplay = new DisplayWaveform({
    id: "waveform",
    data: synth.getBuffer(),
    cycles: 3,
    lineWidth: 4,
  });

  synth.play();

  addEventListener('waveChanged', () => {
    synth.setWavetable(loopReader.sampleData);
    synth.setPitch(220);
  });

  addEventListener('bufferUpdated', () => {
    waveformDisplay.updateBuffer(synth.getBuffer());
  });

  document.getElementById('myFile').onchange = function (evt) {
    const tgt = evt.target || window.event.srcElement,
      files = tgt.files;

    // FileReader support
    if (FileReader && files && files.length) {
      const fr = new FileReader();
      fr.onload = () => image.src = fr.result;
      fr.readAsDataURL(files[0]);
    }
  }
}

export const ImageWave = { init, resume, pause };