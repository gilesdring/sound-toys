import { Visualiser, VisualiserOptions } from "./visualiser.ts";

export class Spectroscope extends Visualiser{
  constructor(opts: VisualiserOptions) {
    super({ ...opts, fftSize: opts.fftSize || 256 });
  }
  protected draw() {
    this.analyser.getByteFrequencyData(this.dataArray);
    
    this.canvasContext.clearRect(0, 0, this.width, this.height);

    const bufferLength = this.analyser.frequencyBinCount;
    const barWidth = (this.width / bufferLength) * 2.5;
    
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = this.dataArray[i];

      this.canvasContext.fillStyle = "rgb(" + (barHeight + 100) + ",50,50)";
      this.canvasContext.fillRect(x, this.height - barHeight / 2, barWidth, barHeight / 2);

      x += barWidth + 1;
    }
}
}
