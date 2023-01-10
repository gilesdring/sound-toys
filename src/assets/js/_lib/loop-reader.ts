import { rgbaToLuma } from "./util/colour.ts";
import { normalise } from "./util/array.ts";
import { circle } from './util/shape.ts';

export function getImageCoordinates(e: Event) {
  if (!e.target) return;
  const shape = e.target.getBoundingClientRect();
  const xPos = e.clientX || e.touches[0].clientX;
  const yPos = e.clientY || e.touches[0].clientY;
  return {
    x: Math.floor(xPos - shape.left),
    y: Math.floor(yPos - shape.top)
  }
}

interface LoopReaderOptions {
  canvasId: string;
  imgId: string;
  samples: number;
}

export class LoopReader {
  samples: number;
  canvas: HTMLCanvasElement;
  img: HTMLImageElement;

  imageData!: ImageData;
  sampleData!: number[];

  r!: number;
  x!: number;
  y!: number;
  scale!: [number, number];
  sampling: boolean;

  locked: boolean;

  constructor({ canvasId, imgId, samples = 2048 }: LoopReaderOptions) {
    this.samples = samples;
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.img = document.getElementById(imgId) as HTMLImageElement;
    this.sampling = false;
    this.locked = true;

    // Update buffer when image changes
    this.img.addEventListener('load', () => {
      this.setBuffer();
      this.setRadius(this.img.width / 20);
      this.setPosition({ x: this.img.width / 2, y: this.img.height / 2 });
    });
    this.registerHandlers();
  }

  registerHandlers() {
    const positionHandler = (e) => {
      if (!this.r)
        return;
      e.preventDefault();
      const { x, y } = getImageCoordinates(e);
      if (x < this.r || x >= this.img.width - this.r || y < this.r || y >= this.img.height - this.r)
        return;
      this.setPosition({ x, y });
    };
    this.canvas.addEventListener('mousedown', (e) => {
      this.unlock()
      positionHandler(e);
    });
    this.canvas.addEventListener('mousemove', positionHandler);
    this.canvas.addEventListener('mouseup', (e) => {
      this.lock()
      positionHandler(e);
    });
    this.canvas.addEventListener('touchstart', () => this.unlock());
    this.canvas.addEventListener('touchmove', positionHandler);
    this.canvas.addEventListener('touchend', () => this.lock());
  }

  setBuffer() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    const aspect = this.img.naturalWidth / this.img.naturalHeight;
    const maxWidth = Math.sqrt(16777216 * aspect);
    canvas.width = Math.min(this.img.naturalWidth, Math.floor(maxWidth));
    canvas.height = Math.min(this.img.naturalHeight, Math.floor(maxWidth / aspect));
    ctx.drawImage(this.img, 0, 0, canvas.width, canvas.height);
    this.scale = [canvas.width / this.img.width, canvas.height / this.img.height];
    this.imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  private sampleWaveform() {
    if (this.sampling) return
    this.sampling = true;
    const scaledX = this.x * this.scale[0];
    const scaledY = this.y * this.scale[1];
    const scaledR = this.r * this.scale[0];
    const samplePoints = circle(scaledX, scaledY, scaledR, this.samples).map(c => c.map(Math.round));
    
    const getLumaAtCoordinates = ([x, y]: [number, number]) => {
      if (x < 0 || x >= this.imageData.width || y < 0 || y >= this.imageData.height)
      return;
      const i = (x + y * this.imageData.width) * 4;
      return rgbaToLuma(this.imageData.data.slice(i, i + 4));
    };
    
    this.sampleData = normalise(samplePoints.map(getLumaAtCoordinates));
    const waveChanged = new Event('waveChanged');
    dispatchEvent(waveChanged);
    this.sampling = false;
  }

  setRadius(r: number) {
    this.r = r;
  }

  setPosition({ x, y }) {
    if (this.locked && this.x && this.y) return;
    this.x = x;
    this.y = y;
    this.sampleWaveform();
    this.draw();
  }

  lock() {
    this.locked = true;
  }

  unlock() {
    this.locked = false;
  }

  draw() {
    const ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    this.canvas.width = this.img.width;
    this.canvas.height = this.img.height;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const cursorPoints = circle(this.x, this.y, this.r, this.samples);
    ctx.lineWidth = this.canvas.width / 100;
    ctx.strokeStyle = 'rgb(200, 245, 200)';
    ctx.beginPath();
    for (let i = 0; i < cursorPoints.length; i++) {
      if (i === 0)
        ctx.moveTo(...cursorPoints[i]);
      else
        ctx.lineTo(...cursorPoints[i]);
    }
    ctx.closePath();
    ctx.stroke();
  }
}
