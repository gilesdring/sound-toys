import { getImageCoordinates } from "./image-readers/helpers.ts";
import { PositionCursor } from "./position-cursor.ts";
import { circle } from "./util/shape.ts";

interface OrbitCursorConfig {
  x: number;
  y: number;
  r: number;
  canvas: HTMLCanvasElement;
  samples?: number;
}

export class OrbitCursor extends PositionCursor {
  r: number;
  samples: number;
  canvas: HTMLCanvasElement;

  constructor(config: OrbitCursorConfig) {
    const { x, y, r, canvas, samples = 64 } = config;
    super({
      field: canvas,
    });
    this.r = r;
    this.samples = samples;
    this.canvas = canvas;
    this.registerHandlers();
    this.setPosition(x, y);
  }
  positionHandler(e: Event) {
    if (!this.enabled || !this.active || !this.r) return;
    e.preventDefault();
    const coordinates = getImageCoordinates(e);
    if (coordinates === undefined) return;
    const { scaledX: x, scaledY: y } = coordinates;
    if (
      x < this.r || x >= 1 - this.r || y < this.r ||
      y >= 1 - this.r
    ) return;
    this.setPosition(x, y);
  }
  // TODO refactor to a separate class / function
  draw() {
    const ctx = this.canvas.getContext("2d") as CanvasRenderingContext2D;
    const cursorPoints = circle(
      this.x * this.canvas.width,
      this.y * this.canvas.height,
      this.r * this.canvas.width,
      this.samples,
    );
    ctx.lineWidth = Math.max(2, this.canvas.width / 100);
    ctx.strokeStyle = "rgb(200, 245, 200)";
    ctx.beginPath();
    for (let i = 0; i < cursorPoints.length; i++) {
      if (i === 0) {
        ctx.moveTo(...cursorPoints[i]);
      } else {
        ctx.lineTo(...cursorPoints[i]);
      }
    }
    ctx.closePath();
    ctx.stroke();
  }
}
