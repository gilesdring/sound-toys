import { WaveSynth } from "./_lib/wave-synth.js";
import { pause, resume } from "./_lib/audio-subsystem.js";
import { DisplayWaveform } from "./_lib/visualisers/waveform.ts";
import { LoopReader } from "./_lib/loop-reader.ts";

interface ImageWaveOptions {
  initialImage: string;
}

function init({
  initialImage,
}: ImageWaveOptions) {
  const loopReader = new LoopReader({
    canvasId: "source",
    imgId: "image",
    samples: 2048,
  });

  pause();
  const image = document.getElementById("image") as HTMLImageElement;
  image.src = initialImage;

  // Scale canvas
  const canvas = document.getElementById("waveform") as HTMLCanvasElement;
  canvas.width = loopReader.samples;
  canvas.height = loopReader.samples / 10;

  const synth = new WaveSynth();

  const waveformDisplay = new DisplayWaveform({
    buffer: synth.getBuffer(),
    id: "waveform",
    cycles: 3,
    lineWidth: 4,
  });

  synth.play();

  addEventListener("waveChanged", () => {
    synth.setWavetable(loopReader.sampleData);
    synth.setPitch(220);
  });

  addEventListener("bufferUpdated", () => {
    waveformDisplay.updateBuffer(synth.getBuffer() as AudioBuffer);
  });

  document.getElementById("myFile").onchange = function (evt) {
    const tgt = evt.target || window.event.srcElement,
      files = tgt.files;

    // FileReader support
    if (FileReader && files && files.length) {
      const fr = new FileReader();
      fr.onload = () => image.src = fr.result;
      fr.readAsDataURL(files[0]);
    }
  };
}

export const ImageWave = { init, resume, pause };
