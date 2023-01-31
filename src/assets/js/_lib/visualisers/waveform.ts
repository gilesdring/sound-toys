interface DisplayWaveformOptions {
  buffer?: AudioBuffer;
  id: string;
  cycles?: number;
  lineWidth?: number;
}

export class DisplayWaveform {
  buffer!: AudioBuffer;
  canvas: HTMLCanvasElement;
  canvasCtx: CanvasRenderingContext2D;
  cycles: number;
  lineWidth: number;

  constructor({
    buffer,
    id,
    cycles = 4,
    lineWidth = 2,
  }: DisplayWaveformOptions) {
    const canvas = document.getElementById(id) as HTMLCanvasElement;
    if (!canvas) throw new Error(`Cannot find canvas with id ${id}`);
    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) throw new Error("Failed to load canvas context");

    this.canvas = canvas;
    this.canvasCtx = canvasCtx;
    this.cycles = cycles;
    this.lineWidth = lineWidth;
    if (buffer) this.updateBuffer(buffer);
  }

  updateBuffer(buffer: AudioBuffer) {
    if (!buffer) return;
    this.buffer = buffer;
    this.draw();
  }

  private draw() {
    const data = this.buffer.getChannelData(0);
    const WIDTH = this.canvas.width;
    const HEIGHT = this.canvas.height;
    const sliceWidth = WIDTH / this.cycles / data.length;

    this.canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    this.canvasCtx.lineWidth = this.lineWidth;
    this.canvasCtx.strokeStyle = "rgb(200, 245, 200)";
    this.canvasCtx.beginPath();

    for (let i = 0; i < data.length * this.cycles; i++) {
      const y = (1 - (data[i % data.length] * 0.9)) * HEIGHT / 2;
      const x = i * sliceWidth;

      if (i === 0) {
        this.canvasCtx.moveTo(x, y);
      } else {
        this.canvasCtx.lineTo(x, y);
      }
      if (x > WIDTH) break;
    }
    this.canvasCtx.stroke();
  }
}
