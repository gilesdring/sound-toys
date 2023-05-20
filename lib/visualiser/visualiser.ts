export interface VisualiserOptions {
  canvas: HTMLCanvasElement;
  analyser: AnalyserNode;
  fftSize?: number;
}

export abstract class Visualiser {
  protected canvasContext: CanvasRenderingContext2D;
  protected analyser: AnalyserNode;
  protected width: number;
  protected height: number;
  protected dataArray: Uint8Array;

  constructor({
    canvas,
    analyser,
    fftSize = 1024,
  }: VisualiserOptions) {
    if (!canvas) throw new Error("No canvas property passed to Oscilliscope");
    this.width = canvas.width;
    this.height = canvas.height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("Could not get Oscilliscope context");
    this.canvasContext = context;

    this.analyser = analyser;
    this.analyser.fftSize = fftSize;
    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.start();
  }
  protected abstract draw(): void
  start() {
    this.draw();
    requestAnimationFrame(() => this.start())
  }
}