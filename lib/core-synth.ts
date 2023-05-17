export class CoreSynth {
  protected context: AudioContext;
  protected bus: GainNode;
  protected master: GainNode;
  constructor() {
    this.context = new AudioContext();

    this.bus = this.context.createGain();

    this.master = this.context.createGain();
    this.master.gain.setValueAtTime(-0.3, this.context.currentTime);

    const limiter = this.context.createDynamicsCompressor();
    limiter.threshold.setValueAtTime(-0.5, this.context.currentTime);
    limiter.knee.setValueAtTime(0.0, this.context.currentTime);
    limiter.attack.setValueAtTime(0.001, this.context.currentTime);
    limiter.ratio.setValueAtTime(20.0, this.context.currentTime);
    limiter.release.setValueAtTime(0.1, this.context.currentTime);

    this.bus.connect(limiter);
    limiter.connect(this.master);
    this.master.connect(this.context.destination);
  }
}