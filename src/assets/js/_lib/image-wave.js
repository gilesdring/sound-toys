import { WaveSynth } from './wave-synth.js';
import { resume, pause } from './audio-subsystem.js';
import { DisplayWaveform } from './visualisers/waveform.ts';
import { rgbaToLuma } from "./util/colour.ts";
import { normalise } from "./util/array.ts";

function ImageCanvas({
  initialImage
}) {
  const samples = 2048;

  const canvas = document.getElementById("waveform");
  canvas.width = samples;
  canvas.height = samples / 10;

  const img = document.getElementById('image');
  let x;
  let y;
  let r;
  let scale;

  // let getWaveform; 
  let sampleData;

  function loadImage(fileReader) {
    img.onload = imageLoadedHandler;
    img.src = fileReader.result;
  }

  const drawSelector = () => {
    const canvas = document.getElementById('source');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cursorPoints = circle(x, y, r, samples);
    ctx.lineWidth = canvas.width / 100;
    ctx.strokeStyle = 'rgb(200, 245, 200)';
    ctx.beginPath();
    for (let i = 0; i < cursorPoints.length; i++) {
      if (i === 0) ctx.moveTo(...cursorPoints[i]);
      else ctx.lineTo(...cursorPoints[i]);
    }
    ctx.closePath();
    ctx.stroke();
    return canvas;
  }

  function imageLoadedHandler() {
    x = img.width / 2;
    y = img.height / 2;
    r = img.width / 20;
    const selector = drawSelector();

    const getWaveform = prepareBuffer();
    const readWave = () => {
      const scaledX = x * scale[0];
      const scaledY = y * scale[1];
      const scaledR = r * scale[0];
      sampleData = getWaveform(scaledX, scaledY, scaledR, samples);
      const waveChanged = new Event('waveChanged');
      dispatchEvent(waveChanged);
    }
    readWave();

    const positionHandler = (e) => {
      e.preventDefault();
      ({ x, y } = getImageCoordinates(e));
      if (x < r || x >= img.width - r || y < r || y >= img.height - r) return;
      drawSelector();
      readWave();
    }

    selector.onmousemove = positionHandler;
    selector.ontouchmove = positionHandler;
  }

  function getImageCoordinates(e) {
    const shape = e.target.getBoundingClientRect();
    const xPos = e.clientX || e.touches[0].clientX;
    const yPos = e.clientY || e.touches[0].clientY;
    return {
      x: Math.floor(xPos - shape.left),
      y: Math.floor(yPos - shape.top)
    }
  }

  /**
   * Load the image into the buffer for later reading of the waveform
   */
  function prepareBuffer() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const aspect = img.naturalWidth / img.naturalHeight;
    const maxWidth = Math.sqrt(16777216 * aspect);
    canvas.width = Math.min(img.naturalWidth, Math.floor(maxWidth));
    canvas.height = Math.min(img.naturalHeight, Math.floor(maxWidth / aspect));
    scale = [canvas.width / img.width, canvas.height / image.height];
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // delete canvas, ctx;

    const getLumaAtCoordinates = ([x, y]) => {
      if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height) return;
      const i = (x + y * imageData.width) * 4;
      return rgbaToLuma(imageData.data.slice(i, i + 4));
    }

    return function sampleWaveform(x, y, r, samples) {
      const samplePoints = circle(x, y, r, samples).map(c => c.map(Math.round));
      return normalise(samplePoints.map(getLumaAtCoordinates));
    }
  }

  function circle(x, y, r, samples = 8192) {
    const angles = Array.from(new Array(samples)).map((_v, i) => 2 * Math.PI * i / samples);
    return angles.map(a => [x + r * Math.sin(a), y - r * Math.cos(a)]);
  }

  function getWave() {
    return sampleData;
  }

  img.onload = imageLoadedHandler;
  img.src = initialImage;

  return { loadImage, getWave };
}

function init({
  initialImage,
}) {
  pause();
  const { loadImage, getWave } = ImageCanvas({
    initialImage
  });

  const synth = new WaveSynth();

  const waveformDisplay = new DisplayWaveform({
    id: "waveform",
    data: synth.getBuffer(),
    cycles: 3,
    lineWidth: 4,
  });

  synth.play();

  addEventListener('waveChanged', () => {
    synth.setWavetable(getWave());
    synth.setPitch(220);
  });


  addEventListener('bufferUpdated', (e) => {
    console.log(e);
    waveformDisplay.updateBuffer(synth.getBuffer());
  });

  document.getElementById('myFile').onchange = function (evt) {
    const tgt = evt.target || window.event.srcElement,
      files = tgt.files;

    // FileReader support
    if (FileReader && files && files.length) {
      const fr = new FileReader();
      fr.onload = () => loadImage(fr);
      fr.readAsDataURL(files[0]);
    }
  }
}

export const ImageWave = { init, resume, pause };