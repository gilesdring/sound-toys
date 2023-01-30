import { getImageCoordinates } from "./image-readers/helpers.ts";
import { circle } from "./util/shape.ts";

interface OrbitCursorConfig {
  x: number;
  y: number;
  r: number;
  canvas: HTMLCanvasElement;
  samples?: number;
}

export class OrbitCursor {
  x: number;
  y: number;
  r: number;
  samples: number;
  canvas: HTMLCanvasElement;
  private active: boolean;
  private locked: boolean;

  constructor(config: OrbitCursorConfig) {
    const { x, y, r, canvas, samples = 64 } = config;
    this.x = x;
    this.y = y;
    this.r = r;
    this.samples = samples;
    this.canvas = canvas;
    this.active = false;
    this.locked = true;
    this.registerHandlers();
    this.refresh();
  }
  activate() {
    this.active = true;
  }
  deactivate() {
    this.active = false;
  }
  setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.refresh();
  }
  refresh() {
    dispatchEvent(new CustomEvent('cursorMoved', { detail: { cursor: this, x: this.x, y: this.y, r: this.r } }));
  }
  registerHandlers() {
    const positionHandler = (e) => {
      if (this.locked || !this.active || !this.r) return;
      e.preventDefault();
      const coordinates = getImageCoordinates(e);
      if (coordinates === undefined) return;
      const { x, y } = coordinates;
      const r = this.r * this.canvas.width;
      if (x < r || x >= this.canvas.width - r || y < r || y >= this.canvas.height - r) return;
      this.setPosition(x / this.canvas.width, y / this.canvas.height);
    };
    this.canvas.addEventListener('mousedown', (e) => {
      this.locked = false;
      positionHandler(e);      
    });
    this.canvas.addEventListener('mousemove', positionHandler);
    this.canvas.addEventListener('mouseup', (e) => {
      this.locked = true;
      positionHandler(e);
    });
    this.canvas.addEventListener('touchstart', () => this.locked = false);
    this.canvas.addEventListener('touchmove', positionHandler);
    this.canvas.addEventListener('touchend', () => this.locked = true);
  }
  draw() {
    const ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
    const cursorPoints = circle(this.x * this.canvas.width, this.y * this.canvas.height, this.r * this.canvas.width, this.samples);
    ctx.lineWidth = Math.max(2, this.canvas.width / 100);
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
