import { Visualiser, VisualiserOptions } from "./visualiser.ts";

export class Oscilliscope extends Visualiser{
  constructor(opts: VisualiserOptions) {
    super({ ...opts, fftSize: opts.fftSize || 4096 });
  }
  protected draw() {
    this.analyser.getByteTimeDomainData(this.dataArray);
    
    this.canvasContext.clearRect(0, 0, this.width, this.height);
    this.canvasContext.lineWidth = 2;
    this.canvasContext.strokeStyle = "rgb(0, 255, 0)";
    this.canvasContext.beginPath();

    const bufferLength = this.analyser.frequencyBinCount;
    const sliceWidth = this.width * 3 / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = this.dataArray[i] / 128.0;
      const y = v * this.height / 2;

      if (i === 0) {
        this.canvasContext.moveTo(x, y);
      } else {
        this.canvasContext.lineTo(x, y);
      }

      x += sliceWidth;
      if (x > this.width) break;
    }

    this.canvasContext.stroke();
  }
}
