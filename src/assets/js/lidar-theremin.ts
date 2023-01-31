import { OrbitCursor } from "./_lib/orbit-cursor.ts";
import { TerrainSampler } from "./_lib/terrain-sampler.ts";
import { visualize } from './_lib/visualisers/signal.ts';
import { DisplayWaveform } from "./_lib/visualisers/waveform.ts";
import { WaveSynth } from "./_lib/wave-synth.js";

interface LidarThereminConfig {
  image: string;
  imageId: string;
}

export class LidarTheremin {
  image: URL;
  imageEl: HTMLImageElement;
  overlay: HTMLCanvasElement;
  cursor: OrbitCursor;
  sampler: TerrainSampler;
  synth: WaveSynth;

  constructor(config: LidarThereminConfig) {
    const { image, imageId } = config;
    this.image = new URL(window.location.toString());
    this.image.pathname = image;

    this.synth = new WaveSynth();

    const imageRoot = document.getElementById(imageId);
    if (imageRoot === null) throw new Error("Cannot find image root");

    this.imageEl = document.createElement('img');
    this.overlay = document.createElement('canvas');
    this.overlay.classList.add('overlay');
    imageRoot.append(this.imageEl, this.overlay);

    this.cursor = new OrbitCursor({
      x: 0.5,
      y: 0.5,
      r: 0.05,
      canvas: this.overlay,
    });

    this.sampler = new TerrainSampler({
      image: this.imageEl,
    });

    // Reset overlay and trigger cursor sample if new image loaded
    this.imageEl.addEventListener('load', () => {
      this.resetOverlay();
      this.cursor.refresh();
    });
    // Reset overlay if window changes size 
    addEventListener('resize', () => {
      this.resetOverlay();
    })
    // Sample terrain and draw overlay when cursor has moved
    addEventListener('cursorMoved', (e) => {
      if ((<CustomEvent>e).detail.cursor !== this.cursor) return;
      this.sampler.sampleWaveform(this.cursor);
      this.drawOverlay();
    });
    // Set wavetable if wave has changed
    addEventListener('waveChanged', (e) => {
      if ((<CustomEvent>e).detail.sampler !== this.sampler) return;
      this.synth.setWavetable(this.sampler.sampleData);
      this.synth.setPitch(220);
    });
    this.setImage();
  }
  private setImage() {
    this.imageEl.src = this.image.toString();
  }
  private resetOverlay() {
    this.overlay.width = this.imageEl.width;
    this.overlay.height = this.imageEl.height;
    this.drawOverlay();
  }
  private drawOverlay() {
    const ctx = this.overlay.getContext('2d') as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
    this.cursor.draw();
  }
  setSamplingMode() {
    this.cursor.activate();
  }
  setPlayMode() {
    this.cursor.deactivate();
  }
}

export function setupVisualisers(config: {
  wave: string,
}) {
  const { wave } = config;
  const waveformDisplay = new DisplayWaveform({
    id: wave,
    cycles: 3,
  });

  addEventListener('bufferUpdated', (e) => {
    waveformDisplay.updateBuffer((<CustomEvent>e).detail.buffer);
  });
}