import { OrbitCursor } from "./_lib/orbit-cursor.ts";
import { PositionCursor } from "./_lib/position-cursor.ts";
import { TerrainSampler } from "./_lib/terrain-sampler.ts";
import { octaveScaler } from "./_lib/util/sound.ts";
import { visualize } from "./_lib/visualisers/signal.ts";
import { DisplayWaveform } from "./_lib/visualisers/waveform.ts";
import { WaveSynth } from "./_lib/wave-synth.js";

interface LidarThereminConfig {
  image: string;
  imageId: string;
}

export class LidarTheremin {
  image: string;
  imageEl: HTMLImageElement;
  overlay: HTMLCanvasElement;
  playHead: PositionCursor;
  terrainWalker: OrbitCursor;
  sampler: TerrainSampler;
  synth: WaveSynth;
  stickyMode: boolean;

  constructor(config: LidarThereminConfig) {
    const { image, imageId } = config;
    this.image = image;

    this.synth = new WaveSynth();
    this.stickyMode = false;

    const imageRoot = document.getElementById(imageId);
    if (imageRoot === null) throw new Error("Cannot find image root");

    this.imageEl = document.createElement("img");
    this.overlay = document.createElement("canvas");
    this.overlay.classList.add("overlay");
    imageRoot.append(this.imageEl, this.overlay);

    this.playHead = new PositionCursor({
      field: this.overlay,
    });

    this.terrainWalker = new OrbitCursor({
      x: 0.5,
      y: 0.5,
      r: 0.05,
      canvas: this.overlay,
    });

    this.sampler = new TerrainSampler({
      image: this.imageEl,
    });

    // Reset overlay and trigger cursor sample if new image loaded
    this.imageEl.addEventListener("load", () => {
      this.resetOverlay();
      this.terrainWalker.refresh();
    });
    // Reset overlay if window changes size
    addEventListener("resize", () => {
      this.resetOverlay();
    });

    const pitchScaler = octaveScaler({
      octaveRange: 3,
      minOctave: -2,
      referenceTone: 440,
    });
    const gainScaler = (y: number) => (1 - y) ** 3;

    // Sample terrain and draw overlay when cursor has moved
    addEventListener("cursorMoved", (e) => {
      const { cursor } = (<CustomEvent> e).detail;
      if (cursor === this.terrainWalker) {
        this.sampler.sampleWaveform(this.terrainWalker);
        this.drawOverlay();
      }
      if (cursor === this.playHead) {
        this.synth.setPitch(pitchScaler(this.playHead.x));
        this.synth.setGain(gainScaler(this.playHead.y));
        this.drawOverlay();
      }
    });

    addEventListener("cursorActivated", (e) => {
      const { cursor } = (<CustomEvent> e).detail;
      if (cursor === this.playHead) {
        this.synth.play();
      }
    });
    addEventListener("cursorDeactivated", (e) => {
      const { cursor } = (<CustomEvent> e).detail;
      if (cursor === this.playHead && !this.stickyMode) {
        this.synth.stop();
      }
    });

    // Set wavetable if wave has changed
    addEventListener("waveChanged", (e) => {
      if ((<CustomEvent> e).detail.sampler !== this.sampler) return;
      this.synth.setWavetable(this.sampler.sampleData);
    });
    this.setImage();
    this.setPlayMode();
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
    const ctx = this.overlay.getContext("2d") as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, this.overlay.width, this.overlay.height);
    this.terrainWalker.draw();
  }
  setSamplingMode() {
    if (!this.stickyMode) this.synth.stop();
    this.playHead.disable();
    this.terrainWalker.enable();
  }
  setPlayMode() {
    this.terrainWalker.disable();
    this.playHead.enable();
  }
  setStickyModeOn() {
    this.stickyMode = true;
  }
  setStickyModeOff() {
    this.stickyMode = false;
    this.synth.fadeOut();
  }
}

export function setupVisualisers(config: {
  wave: string;
  scope: string;
  analyser: AnalyserNode;
}) {
  const { wave, scope, analyser } = config;
  const waveformDisplay = new DisplayWaveform({
    id: wave,
    cycles: 3,
    lineWidth: 2,
  });

  visualize({
    id: scope,
    analyser,
    displayType: "spectrum",
  });

  addEventListener("bufferUpdated", (e) => {
    waveformDisplay.updateBuffer((<CustomEvent> e).detail.buffer);
  });
}
